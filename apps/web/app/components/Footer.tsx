"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@chaosar/ui";
import { buildWhatsAppUrl } from "@chaosar/config";

export const Footer: React.FC = () => {
  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

  return (
    <footer className="relative bg-[#0F172A] text-white overflow-hidden">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[320px] bg-[#00B4D8]/20 blur-[140px] opacity-35" />
      </div>

      <div className="relative container mx-auto px-4 max-w-7xl py-14">
        {/* Top grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-semibold mb-2">ChaosAR</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Restoranlar için AR menü sistemi. QR ile açılır, satışı artırmak için tasarlanır.
            </p>

            {whatsappNumber && (
              <div className="mt-5">
                <a
                  href={buildWhatsAppUrl(
                    whatsappNumber,
                    "Merhaba, ChaosAR AR menü sistemini web sitenizde inceledim. Restoranım için nasıl uygulanabileceğini ve demo görmek istiyorum."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="secondary" size="lg">
                    WhatsApp’tan İletişime Geç
                  </Button>
                </a>
              </div>
            )}
          </div>

          {/* Kısayollar */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-gray-200 mb-4">
              Kısayollar
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                  Ana Sayfa
                </Link>
              </li>
              <li>
                <Link href="#demo" className="text-gray-400 hover:text-white transition-colors">
                  Demo
                </Link>
              </li>
              <li>
                <Link href="#nasil-calisir" className="text-gray-400 hover:text-white transition-colors">
                  Nasıl Çalışır?
                </Link>
              </li>
              <li>
                <Link href="#fiyat" className="text-gray-400 hover:text-white transition-colors">
                  Fiyatlandırma
                </Link>
              </li>
            </ul>
          </div>

          {/* Yasal */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-gray-200 mb-4">
              Yasal
            </h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/policies/privacy-policy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Gizlilik Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/kvkk"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  KVKK Aydınlatma Metni
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/cookie-policy"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Çerez Politikası
                </Link>
              </li>
              <li>
                <Link
                  href="/policies/terms-of-use"
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  Kullanım Koşulları
                </Link>
              </li>
            </ul>
          </div>

          {/* İletişim */}
          <div>
            <h4 className="text-sm font-semibold tracking-wide text-gray-200 mb-4">
              İletişim
            </h4>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a
                  href="mailto:info@chaosar.com"
                  className="hover:text-white transition-colors"
                >
                  info@cah0sar.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+905050485204"
                  className="hover:text-white transition-colors"
                >
                  +90 505 048 52 04
                </a>
              </li>
              <li className="leading-relaxed">
                İstanbul, Türkiye
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 pt-8 border-t border-gray-800 flex flex-col md:flex-row items-center justify-between gap-3 text-sm text-gray-400">
          <p>© {new Date().getFullYear()} ChaosAR. Tüm hakları saklıdır.</p>
          <div className="flex items-center gap-4">
            <Link href="/policies/privacy-policy" className="hover:text-white transition-colors">
              Gizlilik
            </Link>
            <Link href="/policies/kvkk" className="hover:text-white transition-colors">
              KVKK
            </Link>
            <Link href="/policies/cookie-policy" className="hover:text-white transition-colors">
              Çerezler
            </Link>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="mt-12 flex justify-center">
          <img
            src="/iyzico-trust2.png"
            alt="Iyzico Güven Rozeti"
            className="max-w-[750px] h-auto opacity-90 hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
    </footer>
  );
};