"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  monthlyRegistrations: Array<{ month: string; count: number }>;
  planDistribution: {
    starter: number;
    standard: number;
    premium: number;
  };
  activePassiveRatio: {
    active: number;
    passive: number;
  };
  revenue: {
    monthly: number;
    yearly: number;
    byPlan: {
      starter: number;
      standard: number;
      premium: number;
    };
  };
  totalRestaurants: number;
}

const COLORS = {
  primary: "#6366f1",
  secondary: "#8b5cf6",
  success: "#10b981",
  danger: "#ef4444",
  warning: "#f59e0b",
  info: "#3b82f6",
};

const PIE_COLORS = ["#6366f1", "#8b5cf6", "#10b981"];

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/analytics/dashboard");
      const analyticsData = await response.json();

      if (response.ok) {
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-600">Yükleniyor...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-red-600">Veriler yüklenemedi</p>
      </div>
    );
  }

  // Prepare pie chart data
  const planPieData = [
    { name: "Başlangıç", value: data.planDistribution.starter },
    { name: "Standart", value: data.planDistribution.standard },
    { name: "Premium", value: data.planDistribution.premium },
  ];

  const activePassivePieData = [
    { name: "Aktif", value: data.activePassiveRatio.active },
    { name: "Pasif", value: data.activePassiveRatio.passive },
  ];

  // Prepare revenue bar chart data
  const revenueByPlanData = [
    { name: "Başlangıç", Gelir: data.revenue.byPlan.starter },
    { name: "Standart", Gelir: data.revenue.byPlan.standard },
    { name: "Premium", Gelir: data.revenue.byPlan.premium },
  ];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Toplam Restoran</div>
          <div className="text-3xl font-bold text-gray-900">
            {data.totalRestaurants}
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Aylık Gelir</div>
          <div className="text-3xl font-bold text-gray-900">
            {data.revenue.monthly.toLocaleString("tr-TR")} ₺
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Yıllık Gelir</div>
          <div className="text-3xl font-bold text-gray-900">
            {data.revenue.yearly.toLocaleString("tr-TR")} ₺
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Aktif Restoran</div>
          <div className="text-3xl font-bold text-green-600">
            {data.activePassiveRatio.active}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Registrations */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Aylık Yeni Kayıtlar (Son 12 Ay)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.monthlyRegistrations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="count"
                stroke={COLORS.primary}
                strokeWidth={2}
                name="Kayıt Sayısı"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Plan Dağılımı
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={planPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {planPieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Active/Passive Ratio */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Aktif/Pasif Oranı
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={activePassivePieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name}: ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {activePassivePieData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={index === 0 ? COLORS.success : COLORS.danger}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by Plan */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Plan Bazlı Aylık Gelir
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByPlanData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => `${value.toLocaleString("tr-TR")} ₺`} />
              <Legend />
              <Bar dataKey="Gelir" fill={COLORS.primary} name="Gelir (₺)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
