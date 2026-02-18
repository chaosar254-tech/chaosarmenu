"use client";

import React, { useState } from "react";
import Link from "next/link";
import { buildWhatsAppUrl } from "@chaosar/config";
import { LoginModal } from "./LoginModal";

export const Navbar: React.FC = () => {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-[#E5E7EB]">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-xl font-semibold text-[#0F172A]">
              ChaosAR
            </Link>
            <div className="flex items-center gap-3">
              {whatsappNumber && (
                <a
                  href={buildWhatsAppUrl(whatsappNumber, "Merhaba, ChaosAR hakkında bilgi almak istiyorum.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#1F2937] hover:text-[#0F172A]"
                >
                  WhatsApp'tan Sor
                </a>
              )}
              <button
                type="button"
                onClick={() => setLoginModalOpen(true)}
                className="font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-transparent text-[#1F2937] hover:bg-gray-100 focus:ring-gray-300 px-3 py-1.5 text-sm"
              >
                Giriş Yap
              </button>
              <Link
                href="/register"
                className="font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 bg-[#0F172A] text-white hover:bg-[#1e293b] focus:ring-[#0F172A] px-3 py-1.5 text-sm inline-block"
              >
                Başvuru Yap
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
};

