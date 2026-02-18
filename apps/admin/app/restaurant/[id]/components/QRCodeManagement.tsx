"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { QRCodeSVG } from "qrcode.react";
import { createClient } from "@supabase/supabase-js";

interface QRCode {
  id: string;
  qr_slug: string;
  name: string;
  table_no: string;
  branch_id: string | null;
  branch_name: string;
  branch_slug: string;
  is_active: boolean;
  created_at: string;
  scans: number;
  views: number;
  url: string;
}

interface Branch {
  id: string;
  name: string;
  slug: string;
}

interface QRCodeManagementProps {
  restaurantId: string;
  restaurantSlug: string;
}

export default function QRCodeManagement({
  restaurantId,
  restaurantSlug,
}: QRCodeManagementProps) {
  const [qrCodes, setQRCodes] = useState<QRCode[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string>("");
  const [tableNo, setTableNo] = useState<string>("");
  const [qrName, setQrName] = useState<string>("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchQRCodes();
    fetchBranches();
  }, [restaurantId]);

  const fetchBranches = async () => {
    try {
      // Fetch branches from the restaurant API
      const adminClient = createClient(
        "https://kenrjnphvocixvbbvwvy.supabase.co",
        "sb_publishable_XmtDASp8l0cdNY-neWiLhQ_SpCsuTxX"
      );

      const { data: branchesData, error } = await adminClient
        .from("branches")
        .select("id, name, slug")
        .eq("restaurant_id", restaurantId)
        .order("created_at", { ascending: false });

      if (!error && branchesData) {
        setBranches(branchesData);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchQRCodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/restaurants/${restaurantId}/qr-codes`);
      const data = await response.json();

      if (response.ok && data.qr_codes) {
        setQRCodes(data.qr_codes);
      } else {
        toast.error(data.error || "QR kodlar yüklenemedi");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQR = async () => {
    if (!selectedBranch || !tableNo) {
      toast.error("Şube ve masa numarası gereklidir");
      return;
    }

    try {
      setCreating(true);
      const response = await fetch(`/api/restaurants/${restaurantId}/qr-codes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branch_id: selectedBranch,
          table_no: tableNo,
          name: qrName || `Masa ${tableNo}`,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("QR kod oluşturuldu");
        setShowCreateModal(false);
        setTableNo("");
        setQrName("");
        setSelectedBranch("");
        fetchQRCodes();
      } else {
        toast.error(data.error || "QR kod oluşturulamadı");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (qrId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/qr-codes/${qrId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_active: !currentStatus }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          currentStatus ? "QR kod pasif yapıldı" : "QR kod aktif yapıldı"
        );
        fetchQRCodes();
      } else {
        toast.error(data.error || "İşlem başarısız");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    }
  };

  const handleDeleteQR = async (qrId: string) => {
    if (!confirm("Bu QR kodunu silmek istediğinize emin misiniz?")) {
      return;
    }

    try {
      const response = await fetch(
        `/api/restaurants/${restaurantId}/qr-codes/${qrId}`,
        {
          method: "DELETE",
        }
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("QR kod silindi");
        fetchQRCodes();
      } else {
        toast.error(data.error || "QR kod silinemedi");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Bir hata oluştu");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("tr-TR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">QR Kodlar</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
        >
          + Yeni QR Kod Oluştur
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-600">Yükleniyor...</div>
      ) : qrCodes.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <p className="text-gray-600 mb-4">Henüz QR kod oluşturulmamış</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
          >
            İlk QR Kodunu Oluştur
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    QR Kod
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Masa / Ad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Şube
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İstatistikler
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Durum
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Oluşturulma
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    İşlemler
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {qrCodes.map((qr) => (
                  <tr key={qr.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <QRCodeSVG value={qr.url} size={60} level="M" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {qr.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {qr.table_no}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {qr.branch_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex flex-col gap-1">
                        <span>📊 {qr.scans} tarama</span>
                        <span>👁️ {qr.views} görüntüleme</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          qr.is_active
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {qr.is_active ? "Aktif" : "Pasif"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatDate(qr.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleToggleActive(qr.id, qr.is_active)}
                        className={`px-3 py-1 rounded-lg transition-colors text-xs ${
                          qr.is_active
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-green-100 text-green-700 hover:bg-green-200"
                        }`}
                      >
                        {qr.is_active ? "Pasif Yap" : "Aktif Yap"}
                      </button>
                      <button
                        onClick={() => handleDeleteQR(qr.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-xs"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Yeni QR Kod Oluştur
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Şube
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                >
                  <option value="">Şube seçin</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Masa Numarası
                </label>
                <input
                  type="text"
                  value={tableNo}
                  onChange={(e) => setTableNo(e.target.value)}
                  placeholder="Örn: 1, 2, 3..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  QR Kod Adı (Opsiyonel)
                </label>
                <input
                  type="text"
                  value={qrName}
                  onChange={(e) => setQrName(e.target.value)}
                  placeholder="Örn: Masa 1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setTableNo("");
                  setQrName("");
                  setSelectedBranch("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={handleCreateQR}
                disabled={creating}
                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {creating ? "Oluşturuluyor..." : "Oluştur"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
