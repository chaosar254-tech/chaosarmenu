"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import toast from "react-hot-toast";

interface User {
  id: string;
  email: string;
  email_confirmed: boolean;
  email_confirmed_at: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  banned_until: string | null;
  is_admin: boolean;
  profile: any;
  restaurants: Array<{
    id: string;
    name: string;
    slug: string;
    plan: string;
    is_active: boolean;
    created_at: string;
  }>;
  activity_logs: Array<{
    id: string;
    action: string;
    details: any;
    created_at: string;
  }>;
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      if (response.ok && data.user) {
        setUser(data.user);
      } else {
        toast.error(data.error || "Kullanıcı yüklenemedi");
        router.push("/users");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
      router.push("/users");
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = async () => {
    if (!confirm("Bu kullanıcıyı yasaklamak istediğinize emin misiniz?")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "ban" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Kullanıcı yasaklandı");
        fetchUserDetails();
      } else {
        toast.error(data.error || "Kullanıcı yasaklanamadı");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    if (!confirm("Bu kullanıcının yasağını kaldırmak istediğinize emin misiniz?")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "unban" }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Kullanıcı yasağı kaldırıldı");
        fetchUserDetails();
      } else {
        toast.error(data.error || "Kullanıcı yasağı kaldırılamadı");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!user) return;

    if (!confirm("Bu kullanıcıya şifre sıfırlama e-postası göndermek istediğinize emin misiniz?")) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(`/api/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "reset_password",
          email: user.email 
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Şifre sıfırlama e-postası gönderildi");
      } else {
        toast.error(data.error || "E-posta gönderilemedi");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Bilinmiyor";
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-gray-600">Yükleniyor...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-gray-600">Kullanıcı bulunamadı</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <Link
                href="/users"
                className="text-sm text-gray-600 hover:text-gray-900 mb-2 inline-block"
              >
                ← Kullanıcı Listesine Dön
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">{user.email}</h1>
              <p className="text-sm text-gray-600 mt-1">Kullanıcı Detayları</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Information */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Kullanıcı Bilgileri
              </h2>
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-sm font-medium text-gray-500">E-posta</dt>
                  <dd className="mt-1 text-sm text-gray-900">{user.email}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Kullanıcı ID</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono text-xs">
                    {user.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    E-posta Durumu
                  </dt>
                  <dd className="mt-1">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        user.email_confirmed
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {user.email_confirmed ? "Onaylı" : "Onaysız"}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hesap Durumu</dt>
                  <dd className="mt-1">
                    {user.banned_until ? (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Yasaklı
                      </span>
                    ) : (
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Aktif
                      </span>
                    )}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Kayıt Tarihi
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(user.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Son Giriş Tarihi
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {formatDate(user.last_sign_in_at)}
                  </dd>
                </div>
                {user.is_admin && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Rol</dt>
                    <dd className="mt-1">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                        Admin
                      </span>
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* User's Restaurants */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Restoranlar ({user.restaurants.length})
              </h2>
              {user.restaurants.length === 0 ? (
                <p className="text-sm text-gray-600">Bu kullanıcının restoranı yok</p>
              ) : (
                <div className="space-y-3">
                  {user.restaurants.map((restaurant) => (
                    <Link
                      key={restaurant.id}
                      href={`/restaurant/${restaurant.id}`}
                      className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {restaurant.name}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Slug: /{restaurant.slug}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              restaurant.plan === "premium"
                                ? "bg-purple-100 text-purple-800"
                                : restaurant.plan === "standard"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {restaurant.plan === "premium"
                              ? "Premium"
                              : restaurant.plan === "standard"
                              ? "Standart"
                              : "Başlangıç"}
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              restaurant.is_active
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {restaurant.is_active ? "Aktif" : "Pasif"}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Activity Logs */}
            {user.activity_logs.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Son Aktiviteler
                </h2>
                <div className="space-y-2">
                  {user.activity_logs.slice(0, 10).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 border border-gray-200 rounded-lg text-sm"
                    >
                      <div className="font-medium text-gray-900">{log.action}</div>
                      <div className="text-gray-600 mt-1">
                        {formatDate(log.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Actions Sidebar */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                İşlemler
              </h2>
              <div className="space-y-3">
                {user.banned_until ? (
                  <button
                    onClick={handleUnbanUser}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? "İşleniyor..." : "Yasağı Kaldır"}
                  </button>
                ) : (
                  <button
                    onClick={handleBanUser}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? "İşleniyor..." : "Kullanıcıyı Yasakla"}
                  </button>
                )}
                <button
                  onClick={handleResetPassword}
                  disabled={actionLoading}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? "İşleniyor..." : "Şifre Sıfırlama E-postası Gönder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
