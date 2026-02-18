"use client";

import { useEffect, useState, useCallback } from "react";

interface RestaurantStats {
  menu: {
    categories: number;
    items: number;
    activeItems: number;
    inactiveItems: number;
    arItems: number;
  };
  qrCodes: {
    total: number;
    tableBased: number;
    general: number;
  };
}

interface RestaurantStatsProps {
  restaurantId: string;
}

export function RestaurantStats({ restaurantId }: RestaurantStatsProps) {
  const [stats, setStats] = useState<RestaurantStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      // Don't show loading spinner on refresh, just update silently
      const response = await fetch(`/api/restaurants/${restaurantId}/stats`);
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  // Initial fetch
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Auto-refresh: Poll every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [fetchStats]);

  // Refresh when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchStats]);

  // Refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchStats();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="border-t border-gray-200 pt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          İstatistikler
        </h2>
        <p className="text-gray-500">Yükleniyor...</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="border-t border-gray-200 pt-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        İstatistikler
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Menu Statistics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            Menü İstatistikleri
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Toplam Kategori</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {stats.menu.categories}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Toplam Menü Öğesi</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {stats.menu.items}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Aktif Öğeler</dt>
              <dd className="text-sm font-semibold text-green-600">
                {stats.menu.activeItems}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Pasif Öğeler</dt>
              <dd className="text-sm font-semibold text-red-600">
                {stats.menu.inactiveItems}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">AR Destekli Öğeler</dt>
              <dd className="text-sm font-semibold text-blue-600">
                {stats.menu.arItems}
              </dd>
            </div>
          </dl>
        </div>

        {/* QR Code Statistics */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-3">
            QR Kod İstatistikleri
          </h3>
          <dl className="space-y-2">
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Toplam QR Kod</dt>
              <dd className="text-sm font-semibold text-gray-900">
                {stats.qrCodes.total}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Masa Bazlı</dt>
              <dd className="text-sm font-semibold text-indigo-600">
                {stats.qrCodes.tableBased}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-sm text-gray-600">Genel Menü</dt>
              <dd className="text-sm font-semibold text-purple-600">
                {stats.qrCodes.general}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
