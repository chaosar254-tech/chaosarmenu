import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { z } from "zod";

// Rate limiting: Simple in-memory store (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) {
    return realIP;
  }
  return "unknown";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// Validation schema
const leadSchema = z.object({
  restaurant_name: z.string().min(1, "İşletme adı gereklidir").max(200),
  contact_name: z.string().min(1, "Yetkili ad soyad gereklidir").max(200),
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  phone: z.string().min(10, "Telefon numarası en az 10 karakter olmalıdır").max(20),
  city: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  demo_path: z.string().optional(),
  utm: z.record(z.string(), z.string()).optional(),
  source: z.string().default("marketing"),
  
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = getClientIP(request);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin." },
        { status: 429 }
      );
    }

    // Parse body
    const body = await request.json();

    // Validate
    const validatedData = leadSchema.parse(body);

    // Get metadata
    const userAgent = request.headers.get("user-agent") || "";
    const referrer = request.headers.get("referer") || "";

    // Supabase client (service role)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials missing");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Insert to Supabase
    const { data, error: insertError } = await supabase
      .from("leads")
      .insert({
        ...validatedData,
        meta: {
          ip,
          userAgent,
          referrer,
        },
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { error: "Veritabanı hatası" },
        { status: 500 }
      );
    }

    // Send email via Resend
    const resendApiKey = process.env.RESEND_API_KEY;
    const notifyTo = process.env.LEADS_NOTIFY_TO;
    const notifyFrom = process.env.LEADS_NOTIFY_FROM || "ChaosAR <noreply@chaosar.com>";

    if (resendApiKey && notifyTo) {
      try {
        const resend = new Resend(resendApiKey);

        const emailSubject = `Yeni Demo Lead: ${validatedData.restaurant_name || validatedData.contact_name || validatedData.email}`;
        const emailBody = `
Yeni bir demo talebi alındı:

İşletme Adı: ${validatedData.restaurant_name}
Yetkili: ${validatedData.contact_name}
E-posta: ${validatedData.email}
Telefon: ${validatedData.phone}
Şehir: ${validatedData.city || "Belirtilmemiş"}
Mesaj: ${validatedData.message || "Yok"}
Kaynak: ${validatedData.source}
Demo Path: ${validatedData.demo_path || "N/A"}

UTM Parametreleri:
${JSON.stringify(validatedData.utm || {}, null, 2)}

Meta Bilgiler:
- IP: ${ip}
- User Agent: ${userAgent}
- Referrer: ${referrer}

Tarih: ${new Date().toLocaleString("tr-TR")}
        `;

        await resend.emails.send({
          from: notifyFrom,
          to: notifyTo,
          subject: emailSubject,
          text: emailBody,
        });
      } catch (emailError) {
        // Email hatası kritik değil, log'la ama devam et
        console.error("Resend email error:", emailError);
      }
    }

    return NextResponse.json(
      { success: true, ok: true, id: data.id },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Geçersiz form verisi", details: (error as any).errors },
        { status: 400 }
      );
    }

    console.error("Lead API error:", error);
    return NextResponse.json(
      { error: "Bir hata oluştu" },
      { status: 500 }
    );
  }
}

