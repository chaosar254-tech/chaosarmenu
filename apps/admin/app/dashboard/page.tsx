"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-client";
import Link from "next/link";
import toast from "react-hot-toast";
import { CreateRestaurantModal } from "../components/CreateRestaurantModal";
import { AnalyticsCharts } from "../components/AnalyticsCharts";
import { NotificationBanner } from "../components/NotificationBanner";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  created_at: string;
  plan?: string;
  owner_email?: string;
  is_active?: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [activeMenu, setActiveMenu] = useState("restaurants");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [filteredRestaurants, setFilteredRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [planFilter, setPlanFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRestaurants, setSelectedRestaurants] = useState<string[]>([]);
  const [showAnalytics, setShowAnalytics] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    checkAuth();
    fetchRestaurants();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      console.log("🔵 [DASHBOARD] Auth check:", {
        hasUser: !!user,
        userId: user?.id,
        error: error?.message
      });

      if (error || !user) {
        console.warn("⚠️ [DASHBOARD] User not authenticated, redirecting to login");
        router.replace("/login");
        return;
      }

      // Check if user is admin
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      console.log("🔍 [DASHBOARD] Profile:", profile, "profileError:", profileError?.message);

      // Profile okunamazsa sayfada kal — unauthorized'a gitme
      if (profileError || profile === undefined) {
        console.warn("⚠️ [DASHBOARD] Could not read profile, staying on page");
        return;
      }

      const isAdmin = profile?.is_admin === true;

      if (!isAdmin) {
        const { data: restaurant } = await supabase
          .from('restaurants')
          .select('id')
          .eq('owner_user_id', user.id)
          .maybeSingle();

        if (restaurant) {
          console.log("⚠️ [DASHBOARD] Redirecting to restaurant dashboard");
          window.location.href = 'https://dashboard.chaosarmenu.com';
          return;
        } else {
          console.warn("⚠️ [DASHBOARD] No role, redirecting to unauthorized");
          router.replace("/unauthorized");
          return;
        }
      }

      console.log("✅ [DASHBOARD] User authenticated and is admin:", user.email);
    } catch (err) {
      console.error("❌ [DASHBOARD] Auth check failed:", err);
      router.replace("/login");
    }
  };

  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/restaurants");
      const data = await response.json();

      if (response.ok && data.restaurants) {
        // Get owner emails for each restaurant
        const restaurantsWithEmails = await Promise.all(
          data.restaurants.map(async (restaurant: Restaurant) => {
            try {
              // Use admin API to get user email
              const emailResponse = await fetch(
                `/api/restaurants/${restaurant.id}/owner-email`
              );
              if (emailResponse.ok) {
                const emailData = await emailResponse.json();
                return { ...restaurant, owner_email: emailData.email || "N/A" };
              }
            } catch (error) {
              console.error("Error fetching email:", error);
            }
            return { ...restaurant, owner_email: "N/A" };
          })
        );
        setRestaurants(restaurantsWithEmails);
        setFilteredRestaurants(restaurantsWithEmails);
      } else {
        // Fallback: Try to fetch directly from Supabase
        const { data: restaurantsData, error } = await supabase
          .from("restaurants")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching restaurants:", error);
          toast.error("Restoranlar yüklenemedi");
        } else {
          setRestaurants(restaurantsData || []);
          setFilteredRestaurants(restaurantsData || []);
        }
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Filter restaurants based on search and filters
  useEffect(() => {
    let filtered = [...restaurants];

    // Search filter (name or email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(query) ||
          r.owner_email?.toLowerCase().includes(query) ||
          r.slug.toLowerCase().includes(query)
      );
    }

    // Plan filter
    if (planFilter !== "all") {
      filtered = filtered.filter((r) => (r.plan || "starter") === planFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((r) => r.is_active !== false);
      } else if (statusFilter === "inactive") {
        filtered = filtered.filter((r) => r.is_active === false);
      }
    }

    setFilteredRestaurants(filtered);
  }, [searchQuery, planFilter, statusFilter, restaurants]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${name} restoranını silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/restaurants/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Restoran silindi");
        fetchRestaurants();
      } else {
        const data = await response.json();
        toast.error(data.error || "Restoran silinemedi");
      }
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleBulkAction = async () => {
    if (selectedRestaurants.length === 0) {
      toast.error("Lütfen en az bir restoran seçin");
      return;
    }

    const action = prompt(
      "Toplu işlem tipi seçin:\n1. plan (starter/standard/premium)\n2. is_active (true/false)\n3. can_add_branches (true/false)"
    );

    if (!action || !["plan", "is_active", "can_add_branches"].includes(action)) {
      toast.error("Geçersiz işlem tipi");
      return;
    }

    let value: any = prompt(`Yeni ${action} değerini girin:`);

    if (action === "plan") {
      if (!["starter", "standard", "premium"].includes(value)) {
        toast.error("Geçersiz plan değeri. starter, standard veya premium olmalıdır.");
        return;
      }
    } else {
      value = value === "true" || value === "1";
    }

    try {
      const response = await fetch("/api/restaurants/bulk", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurantIds: selectedRestaurants,
          action,
          value,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Toplu işlem başarılı");
        setSelectedRestaurants([]);
        fetchRestaurants();
      } else {
        toast.error(data.error || "Toplu işlem başarısız");
      }
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRestaurants(filteredRestaurants.map((r) => r.id));
    } else {
      setSelectedRestaurants([]);
    }
  };

  const handleSelectRestaurant = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedRestaurants([...selectedRestaurants, id]);
    } else {
      setSelectedRestaurants(selectedRestaurants.filter((rid) => rid !== id));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">ChaosAR</h1>
          <p className="text-sm text-gray-600 mt-1">Super Admin</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setActiveMenu("restaurants")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeMenu === "restaurants"
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Restoranlar
          </button>
          <Link
            href="/users"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Kullanıcılar
          </Link>
          <Link
            href="/activity-logs"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Aktivite Logları
          </Link>
          <Link
            href="/subscriptions"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Abonelikler
          </Link>
          <Link
            href="/applications"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            Başvurular
          </Link>
          <Link
            href="/demo-requests"
            className="w-full text-left px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-100 block"
          >
            👁️ Demo Talepleri
          </Link>
          <button
            onClick={() => setActiveMenu("settings")}
            className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
              activeMenu === "settings"
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            Ayarlar
          </button>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Super Admin Dashboard
              </h2>
              <p className="text-gray-600">
                Sistemde kayıtlı tüm restoranları görüntüleyin ve yönetin
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  window.open('/api/restaurants/export?format=csv', '_blank');
                  toast.success('CSV dosyası indiriliyor...');
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                CSV Export
              </button>
              <button
                onClick={() => {
                  window.open('/api/restaurants/export?format=pdf', '_blank');
                  toast.success('PDF dosyası indiriliyor...');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                PDF Export
              </button>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
              >
                {showAnalytics ? "Grafikleri Gizle" : "Grafikleri Göster"}
              </button>
              <CreateRestaurantModal onSuccess={fetchRestaurants} />
            </div>
          </div>

          {/* Notification Banner */}
          <NotificationBanner />

          {/* Analytics Charts */}
          {showAnalytics && (
            <div className="mb-8">
              <AnalyticsCharts />
            </div>
          )}

          {/* Section Header */}
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-2xl font-bold text-gray-900">
              Kayıtlı Restoranlar
            </h3>
            {selectedRestaurants.length > 0 && (
              <div className="flex gap-3">
                <span className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
                  {selectedRestaurants.length} seçili
                </span>
                <button
                  onClick={handleBulkAction}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Toplu İşlem
                </button>
              </div>
            )}
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Arama
                </label>
                <input
                  type="text"
                  placeholder="Restoran adı, email veya slug ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Plan Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plan Filtresi
                </label>
                <select
                  value={planFilter}
                  onChange={(e) => setPlanFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Tüm Planlar</option>
                  <option value="starter">Başlangıç</option>
                  <option value="standard">Standart</option>
                  <option value="premium">Premium</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Durum Filtresi
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="all">Tümü</option>
                  <option value="active">Aktif</option>
                  <option value="inactive">Pasif</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
              {filteredRestaurants.length} restoran gösteriliyor
              {filteredRestaurants.length !== restaurants.length && (
                <span className="ml-2">
                  ({restaurants.length} toplam)
                </span>
              )}
            </div>
          </div>

          {/* Restaurants Table */}
          {loading ? (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
              <p className="text-gray-600">Yükleniyor...</p>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={
                            filteredRestaurants.length > 0 &&
                            selectedRestaurants.length === filteredRestaurants.length
                          }
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşletme Adı
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Plan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kayıt Tarihi
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlem
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRestaurants.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="px-6 py-8 text-center text-gray-500"
                        >
                          {restaurants.length === 0
                            ? "Henüz restoran kaydı bulunmuyor."
                            : "Arama kriterlerinize uygun restoran bulunamadı."}
                        </td>
                      </tr>
                    ) : (
                      filteredRestaurants.map((restaurant) => (
                        <tr key={restaurant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedRestaurants.includes(restaurant.id)}
                              onChange={(e) =>
                                handleSelectRestaurant(restaurant.id, e.target.checked)
                              }
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {restaurant.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              /{restaurant.slug}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {restaurant.owner_email || "N/A"}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                              {restaurant.plan === "starter" ? "Başlangıç" : restaurant.plan === "standard" ? "Standart" : restaurant.plan === "premium" ? "Premium" : "Başlangıç"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                restaurant.is_active !== false
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {restaurant.is_active !== false ? "Aktif" : "Pasif"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {formatDate(restaurant.created_at)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <Link
                              href={`/restaurant/${restaurant.id}`}
                              className="text-indigo-600 hover:text-indigo-900 mr-4"
                            >
                              Yönet
                            </Link>
                            <button
                              onClick={() =>
                                handleDelete(restaurant.id, restaurant.name)
                              }
                              className="text-red-600 hover:text-red-900"
                            >
                              Sil
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Toplam Restoran</div>
              <div className="text-3xl font-bold text-gray-900">
                {restaurants.length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Aktif Restoran</div>
              <div className="text-3xl font-bold text-gray-900">
                {restaurants.filter((r) => r.is_active !== false).length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Başlangıç Plan</div>
              <div className="text-3xl font-bold text-gray-900">
                {restaurants.filter((r) => (r.plan || "starter") === "starter").length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Standart Plan</div>
              <div className="text-3xl font-bold text-gray-900">
                {restaurants.filter((r) => (r.plan || "starter") === "standard").length}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="text-sm text-gray-600 mb-1">Premium Plan</div>
              <div className="text-3xl font-bold text-gray-900">
                {restaurants.filter((r) => (r.plan || "starter") === "premium").length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}