"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  owner_user_id: string;
  plan?: string;
  is_active?: boolean;
  can_add_branches?: boolean;
}

export function RestaurantSettings({ restaurant }: { restaurant: Restaurant }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [currentPlan, setCurrentPlan] = useState<string>(restaurant.plan || "starter");
  const [isActive, setIsActive] = useState<boolean>(restaurant.is_active !== false);
  const [canAddBranches, setCanAddBranches] = useState<boolean>(restaurant.can_add_branches || false);
  const [planLoading, setPlanLoading] = useState(false);
  const [activeLoading, setActiveLoading] = useState(false);
  const [branchesPermissionLoading, setBranchesPermissionLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || newPassword.length < 6) {
      toast.error("Şifre en az 6 karakter olmalıdır");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Şifre sıfırlanamadı");
      }

      toast.success("Şifre başarıyla sıfırlandı!");
      setNewPassword("");
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (newPlan: string) => {
    if (newPlan === currentPlan) return;

    setPlanLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ plan: newPlan }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Plan değiştirilemedi");
      }

      setCurrentPlan(newPlan);
      const planNames: { [key: string]: string } = {
        starter: "Başlangıç",
        standard: "Standart",
        premium: "Premium"
      };
      toast.success(`Plan ${planNames[newPlan] || newPlan} olarak güncellendi!`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setPlanLoading(false);
    }
  };

  const handleToggleActive = async () => {
    const newStatus = !isActive;
    setActiveLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Durum değiştirilemedi");
      }

      setIsActive(newStatus);
      toast.success(`Restoran ${newStatus ? "aktif" : "pasif"} yapıldı!`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setActiveLoading(false);
    }
  };

  const handleToggleBranchesPermission = async () => {
    const newStatus = !canAddBranches;
    setBranchesPermissionLoading(true);
    try {
      const response = await fetch(`/api/restaurants/${restaurant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ can_add_branches: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "İzin güncellenemedi");
      }

      setCanAddBranches(newStatus);
      toast.success(`Şube ekleme izni ${newStatus ? "açıldı" : "kapatıldı"}!`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Bir hata oluştu");
    } finally {
      setBranchesPermissionLoading(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Ayarlar
      </h2>

      <div className="space-y-6">
        {/* Plan Change */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Plan Yönetimi
          </h3>
          <div className="flex items-center gap-3">
            <select
              value={currentPlan}
              onChange={(e) => handlePlanChange(e.target.value)}
              disabled={planLoading}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
            >
              <option value="starter">Başlangıç (3 AR)</option>
              <option value="standard">Standart (10 AR)</option>
              <option value="premium">Premium (Sınırsız AR)</option>
            </select>
            {planLoading && (
              <span className="text-sm text-gray-500">Güncelleniyor...</span>
            )}
          </div>
        </div>

        {/* Active/Inactive Toggle */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Restoran Durumu
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleActive}
              disabled={activeLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                isActive ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isActive ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {isActive ? "Aktif" : "Pasif"}
            </span>
            {activeLoading && (
              <span className="text-sm text-gray-500">Güncelleniyor...</span>
            )}
          </div>
        </div>

        {/* Branch Permission Toggle */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Şube Ekleme İzni
          </h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleBranchesPermission}
              disabled={branchesPermissionLoading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 ${
                canAddBranches ? "bg-green-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  canAddBranches ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
            <span className="text-sm font-medium text-gray-700">
              {canAddBranches ? "İzin var" : "İzin yok"}
            </span>
            {branchesPermissionLoading && (
              <span className="text-sm text-gray-500">Güncelleniyor...</span>
            )}
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Bu izin açıkken restoran sahibi kendi panelinden şube ekleyebilir.
          </p>
        </div>

        {/* Password Reset */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            Şifre Sıfırlama
          </h3>
          <form onSubmit={handleResetPassword} className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Yeni şifre (en az 6 karakter)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              minLength={6}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {loading ? "Sıfırlanıyor..." : "Şifreyi Sıfırla"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
