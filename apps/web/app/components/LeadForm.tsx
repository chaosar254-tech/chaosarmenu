"use client";

import { useState, FormEvent, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface LeadFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
  showCloseButton?: boolean;
}

export const LeadForm: React.FC<LeadFormProps> = ({
  onSuccess,
  onClose,
  showCloseButton = false,
}) => {
  const [formData, setFormData] = useState({
    restaurant_name: "",
    contact_name: "",
    email: "",
    phone: "",
    city: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [demoPath, setDemoPath] = useState("");
  const [utm, setUtm] = useState<Record<string, string>>({});

  // Parse UTM parameters and demo path from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const utmParams: Record<string, string> = {};
      
      params.forEach((value, key) => {
        if (key.startsWith("utm_")) {
          utmParams[key] = value;
        }
      });

      setUtm(utmParams);
      setDemoPath(window.location.pathname + window.location.search);
    }
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          demo_path: demoPath,
          utm: Object.keys(utm).length > 0 ? utm : undefined,
          source: "marketing",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Form gönderilemedi");
      }

      // Check for success field (new API format)
      if (data.success === false) {
        throw new Error(data.error || "Form gönderilemedi");
      }

      setSuccess(true);
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (success) {
    return (
      <div className="p-6 text-center">
        <div className="mb-4">
          <div className="w-16 h-16 mx-auto bg-[#D4AF37]/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-[#D4AF37]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h3 className="text-xl font-bold text-[#D4AF37] mb-2">
          Teşekkürler!
        </h3>
        <p className="text-sm text-[rgba(212,175,55,0.85)]">
          Demo linkini birazdan iletiyoruz.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div>
        <label
          htmlFor="restaurant_name"
          className="block text-sm font-medium text-[#D4AF37] mb-2"
        >
          İşletme Adı <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="restaurant_name"
          name="restaurant_name"
          required
          value={formData.restaurant_name}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 bg-[#0B0B0D] border border-[rgba(255,215,0,0.3)] rounded-lg text-[#F5D37A] placeholder:text-[rgba(245,211,122,0.4)] focus:outline-none focus:border-[rgba(255,215,0,0.6)] transition-colors"
          placeholder="Örn: Burger House"
        />
      </div>

      <div>
        <label
          htmlFor="contact_name"
          className="block text-sm font-medium text-[#D4AF37] mb-2"
        >
          Yetkili Ad Soyad <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          id="contact_name"
          name="contact_name"
          required
          value={formData.contact_name}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 bg-[#0B0B0D] border border-[rgba(255,215,0,0.3)] rounded-lg text-[#F5D37A] placeholder:text-[rgba(245,211,122,0.4)] focus:outline-none focus:border-[rgba(255,215,0,0.6)] transition-colors"
          placeholder="Adınız Soyadınız"
        />
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-[#D4AF37] mb-2"
        >
          E-posta <span className="text-red-400">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          value={formData.email}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 bg-[#0B0B0D] border border-[rgba(255,215,0,0.3)] rounded-lg text-[#F5D37A] placeholder:text-[rgba(245,211,122,0.4)] focus:outline-none focus:border-[rgba(255,215,0,0.6)] transition-colors"
          placeholder="ornek@email.com"
        />
      </div>

      <div>
        <label
          htmlFor="phone"
          className="block text-sm font-medium text-[#D4AF37] mb-2"
        >
          Telefon <span className="text-red-400">*</span>
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          required
          value={formData.phone}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 bg-[#0B0B0D] border border-[rgba(255,215,0,0.3)] rounded-lg text-[#F5D37A] placeholder:text-[rgba(245,211,122,0.4)] focus:outline-none focus:border-[rgba(255,215,0,0.6)] transition-colors"
          placeholder="05XX XXX XX XX"
        />
      </div>

      <div>
        <label
          htmlFor="city"
          className="block text-sm font-medium text-[#D4AF37] mb-2"
        >
          Şehir
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleInputChange}
          className="w-full px-4 py-2.5 bg-[#0B0B0D] border border-[rgba(255,215,0,0.3)] rounded-lg text-[#F5D37A] placeholder:text-[rgba(245,211,122,0.4)] focus:outline-none focus:border-[rgba(255,215,0,0.6)] transition-colors"
          placeholder="İstanbul"
        />
      </div>

      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-[#D4AF37] mb-2"
        >
          Mesaj
        </label>
        <textarea
          id="message"
          name="message"
          rows={3}
          value={formData.message}
          onChange={handleInputChange}
          maxLength={500}
          className="w-full px-4 py-2.5 bg-[#0B0B0D] border border-[rgba(255,215,0,0.3)] rounded-lg text-[#F5D37A] placeholder:text-[rgba(245,211,122,0.4)] focus:outline-none focus:border-[rgba(255,215,0,0.6)] transition-colors resize-none"
          placeholder="Eklemek istediğiniz bir şey var mı?"
        />
        <p className="text-xs text-[rgba(212,175,55,0.6)] mt-1">
          {formData.message.length}/500
        </p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full py-3 text-base font-semibold bg-gradient-to-r from-[#F5D37A] to-[#C89B3C] text-[#0B0B0D] rounded-lg hover:from-[#F5D37A]/90 hover:to-[#C89B3C]/90 transition-all duration-200 shadow-[0_4px_12px_rgba(245,211,122,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitting ? "Gönderiliyor..." : "Gönder"}
      </button>
    </form>
  );
};

