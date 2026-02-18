import { redirect } from "next/navigation";
import { getUserRoleAndDashboard } from "@/lib/auth-utils";

export default async function UnauthorizedPage() {
  // Check if user is authenticated and has a role
  const { dashboardUrl, isAdmin, isRestaurantOwner } = await getUserRoleAndDashboard();

  // If user has a role, redirect to their appropriate dashboard
  if (dashboardUrl) {
    redirect(dashboardUrl);
  }

  // If user is not authenticated or has no role, show the error page
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Erişim Reddedildi
        </h1>
        <p className="text-gray-600 mb-6">
          Bu sayfaya erişim yetkiniz bulunmamaktadır.
        </p>
        <a
          href="/login"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors inline-block"
        >
          Giriş Sayfasına Dön
        </a>
      </div>
    </div>
  );
}
