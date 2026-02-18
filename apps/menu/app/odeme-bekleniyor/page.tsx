import { Suspense } from "react";
import OdemeBekleniyorContent from "./OdemeBekleniyorContent";

export const dynamic = "force-dynamic";

function OdemeBekleniyorFallback() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center animate-pulse">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-amber-100" />
        <div className="h-7 bg-gray-200 rounded w-3/4 mx-auto mb-2" />
        <div className="h-4 bg-gray-100 rounded w-full mb-4" />
        <div className="h-4 bg-gray-100 rounded w-full" />
      </div>
    </main>
  );
}

export default function OdemeBekleniyorPage() {
  return (
    <Suspense fallback={<OdemeBekleniyorFallback />}>
      <OdemeBekleniyorContent />
    </Suspense>
  );
}
