"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log("🔵 [LOGIN] submit başladı");
    
    if (!email || !password) {
      setError("Lütfen email ve şifre girin");
      return;
    }

    setLoading(true);
    setError(null);

    // Get Supabase URL for debugging (DO NOT log key)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
    const tokenRequestUrl = `${supabaseUrl.replace(/\/+$/, '')}/auth/v1/token?grant_type=password`;
    console.log("🔵 [LOGIN] Token request URL:", tokenRequestUrl);
    console.log("🔵 [LOGIN] supabase signIn çağrıldı", { email });

    // Create timeout promise (15 seconds - increased for slow connections)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error("❌ [LOGIN] Request timeout (15 saniye)");
        reject(new Error('TIMEOUT'));
      }, 15000);
    });

    try {
      console.log("🔵 [LOGIN] signInWithPassword çağrılıyor...");
      
      // Race between signIn and timeout
      const signInPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("🔵 [LOGIN] Promise.race başlatıldı, response bekleniyor...");

      const result = await Promise.race([
        signInPromise,
        timeoutPromise,
      ]) as { data: any; error: any };

      console.log("🔵 [LOGIN] Promise.race tamamlandı, response alındı");

      const { data, error: authError } = result;

      // Log full response details
      console.log("🔵 [LOGIN] signIn response geldi", { 
        status: authError ? 'ERROR' : 'SUCCESS',
        hasData: !!data, 
        hasError: !!authError,
        hasUser: !!data?.user,
        hasSession: !!data?.session,
        errorMessage: authError?.message,
        errorStatus: authError?.status,
        errorName: authError?.name
      });

      // Check for specific error types
      if (authError) {
        console.error("❌ [LOGIN] Auth error:", {
          message: authError.message,
          status: authError.status,
          name: authError.name,
          statusCode: authError.status || 'unknown'
        });

        // Show user-friendly error messages based on error type
        let errorMessage = authError.message || "Giriş başarısız";
        
        // Handle specific error cases
        if (authError.status === 400 || 
            authError.message?.includes('Invalid login credentials') || 
            authError.message?.includes('invalid_credentials') ||
            authError.message?.toLowerCase().includes('invalid')) {
          errorMessage = "E-posta veya şifre hatalı. Lütfen tekrar deneyin.";
        } else if (authError.status === 422 || 
                   authError.message?.includes('Email not confirmed') ||
                   authError.message?.includes('email_not_confirmed') ||
                   authError.message?.toLowerCase().includes('not confirmed')) {
          errorMessage = "E-posta adresiniz henüz doğrulanmamış. Lütfen e-postanızı kontrol edin ve doğrulama linkine tıklayın.";
        } else if (authError.message?.includes('Too many requests') ||
                   authError.message?.toLowerCase().includes('rate limit')) {
          errorMessage = "Çok fazla deneme yapıldı. Lütfen 1-2 dakika bekleyip tekrar deneyin.";
        } else if (authError.status === 429) {
          errorMessage = "Çok fazla istek yapıldı. Lütfen birkaç dakika sonra tekrar deneyin.";
        }

        setError(errorMessage);
        setLoading(false);
        return;
      }

      // Check if session was created
      if (!data?.session) {
        console.error("❌ [LOGIN] session oluşmadı", data);
        setError("Oturum oluşturulamadı. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      // Check if user exists
      if (!data?.user) {
        console.error("❌ [LOGIN] User data yok", data);
        setError("Kullanıcı bilgisi alınamadı. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      // Login successful - verify session was persisted
      console.log("✅ [LOGIN] Login başarılı!");
      console.log("🔵 [LOGIN] Session bilgileri:", {
        userId: data.user.id,
        email: data.user.email,
        sessionExpiresAt: data.session.expires_at,
        accessToken: data.session.access_token?.substring(0, 20) + '...'
      });

      // CRITICAL: Verify session is actually persisted
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData?.session) {
        console.error("❌ [LOGIN] Session persist edilemedi!", sessionError);
        setError("Oturum kaydedilemedi. Lütfen tekrar deneyin.");
        setLoading(false);
        return;
      }

      console.log("✅ [LOGIN] Session doğrulandı:", {
        hasSession: !!sessionData.session,
        userId: sessionData.session?.user?.id
      });

      // Check if cookies are set (after a brief delay to allow cookie setting)
      setTimeout(() => {
        const cookies = document.cookie.split(';');
        const supabaseCookies = cookies.filter(c => c.trim().startsWith('sb-'));
        
        console.log("🔵 [LOGIN] Cookie kontrolü:", {
          cookieCount: supabaseCookies.length,
          cookies: supabaseCookies.map(c => c.trim().split('=')[0])
        });

        if (supabaseCookies.length === 0) {
          console.warn("⚠️ [LOGIN] Supabase cookie'leri bulunamadı! Cookie storage sorunu olabilir.");
        }
      }, 500);

      // Navigate to dashboard
      // Use hard redirect to ensure cookies are sent with the request
      // This is critical for middleware to read the cookies
      console.log("🔵 [LOGIN] Hard redirect yapılıyor (cookie'lerin middleware tarafından okunması için)...");
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("❌ [LOGIN] Hata:", err);
      
      if (err.message === 'TIMEOUT') {
        setError("Supabase token isteği yanıt vermiyor. Lütfen internet bağlantınızı kontrol edin ve tekrar deneyin.");
      } else {
        setError(err.message || "Beklenmedik bir hata oluştu");
      }
      setLoading(false);
    } finally {
      // Ensure loading is always reset
      console.log("🔵 [LOGIN] finally block çalıştı");
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h2 className="text-2xl font-bold text-center mb-6">Admin Giriş</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            required
            className="w-full p-3 border rounded"
            placeholder="E-posta"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          <input
            type="password"
            required
            placeholder="Şifre"
            className="w-full p-3 border rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
