"use client";

import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LeadFormModalProps {
  open: boolean;
  onClose: () => void;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  open,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    isletmeAdi: "",
    yetkiliAdSoyad: "",
    telefon: "",
    email: "",
    sehir: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API route'a POST isteği
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          restaurant_name: formData.isletmeAdi,
          contact_name: formData.yetkiliAdSoyad,
          phone: formData.telefon,
          email: formData.email,
          city: formData.sehir,
          source: "marketing",
        }),
      });

      const data = await response.json();

      if (response.ok && data.success !== false) {
        console.log("Lead form submitted:", formData);
        alert("Talebiniz alındı! En kısa sürede size dönüş yapacağız.");
        // Form'u sıfırla ve kapat
        setFormData({
          isletmeAdi: "",
          yetkiliAdSoyad: "",
          telefon: "",
          email: "",
          sehir: "",
        });
        setIsSubmitting(false);
        onClose();
      } else {
        throw new Error(data.error || "Form gönderilemedi");
      }
    } catch (error) {
      console.error("Form submission error:", error);
      alert(error instanceof Error ? error.message : "Bir hata oluştu. Lütfen tekrar deneyin.");
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-[300]"
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="fixed inset-0 z-[301] flex items-center justify-center p-4"
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 pb-4 z-10">
                <h2 className="text-2xl font-bold text-gray-900">
                  Kendi Menünü 24 Saatte Kur
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Restoranına özel demo iste
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor="isletmeAdi"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    İşletme Adı <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="isletmeAdi"
                    name="isletmeAdi"
                    required
                    value={formData.isletmeAdi}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent"
                    placeholder="Örn: Burger House"
                  />
                </div>

                <div>
                  <label
                    htmlFor="yetkiliAdSoyad"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Yetkili Ad Soyad <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="yetkiliAdSoyad"
                    name="yetkiliAdSoyad"
                    required
                    value={formData.yetkiliAdSoyad}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent"
                    placeholder="Adınız Soyadınız"
                  />
                </div>

                <div>
                  <label
                    htmlFor="telefon"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Telefon <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    id="telefon"
                    name="telefon"
                    required
                    value={formData.telefon}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent"
                    placeholder="05XX XXX XX XX"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    E-posta <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent"
                    placeholder="ornek@email.com"
                  />
                </div>

                <div>
                  <label
                    htmlFor="sehir"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Şehir <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="sehir"
                    name="sehir"
                    required
                    value={formData.sehir}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00B4D8] focus:border-transparent"
                    placeholder="İstanbul"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 text-base font-semibold bg-[#0F172A] text-white rounded-lg hover:bg-[#1e293b] transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {isSubmitting ? "Gönderiliyor..." : "Gönder"}
                </button>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

