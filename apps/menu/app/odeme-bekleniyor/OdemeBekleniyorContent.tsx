"use client";

import { useSearchParams } from "next/navigation";

export default function OdemeBekleniyorContent() {
  const searchParams = useSearchParams();
  const from = searchParams?.get("from") ?? null;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100 flex items-center justify-center">
          <span className="text-3xl" aria-hidden>⏳</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ödeme Bekleniyor
        </h1>
        <p className="text-gray-600 mb-6">
          Bu menüye erişim şu an kısıtlıdır. Restoran abonelik ödemesini
          tamamladığında menü tekrar açılacaktır.
        </p>
        {from ? (
          <p className="text-sm text-gray-500 mb-4">
            Erişmeye çalıştığınız sayfa: <code className="bg-gray-100 px-1 rounded">{from}</code>
          </p>
        ) : null}
        <p className="text-sm text-gray-500">
          Restoran yöneticisi iseniz, panelden &quot;Ödeme Yöntemleri&quot;
          bölümünden ödemenizi yapabilirsiniz.
        </p>
      </div>
    </main>
  );
}
