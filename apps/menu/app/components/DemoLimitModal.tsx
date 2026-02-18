"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, User, Phone, Building2, Mail } from "lucide-react";

interface DemoLimitModalProps {
  onFormSubmit?: (data: {
    name: string;
    email: string;
    phone: string;
    restaurantName: string;
  }) => void;
}

export function DemoLimitModal({ onFormSubmit }: DemoLimitModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(40);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    restaurantName: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    name?: boolean;
    email?: boolean;
    phone?: boolean;
    restaurantName?: boolean;
  }>({});

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError(null);
    }
    // Clear field error for this specific field
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }
  };

  // Email validation regex
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validation function
  const validateForm = (): boolean => {
    const errors: typeof fieldErrors = {};
    let hasError = false;

    // Check name
    if (!formData.name.trim()) {
      errors.name = true;
      hasError = true;
    }

    // Check email
    if (!formData.email.trim()) {
      errors.email = true;
      hasError = true;
    } else if (!isValidEmail(formData.email.trim())) {
      errors.email = true;
      hasError = true;
    }

    // Check phone
    if (!formData.phone.trim()) {
      errors.phone = true;
      hasError = true;
    }

    // Check restaurant name
    if (!formData.restaurantName.trim()) {
      errors.restaurantName = true;
      hasError = true;
    }

    setFieldErrors(errors);

    if (hasError) {
      setValidationError("Lütfen tüm alanları eksiksiz doldurunuz.");
      return false;
    }

    setValidationError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Strict validation
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit demo request to API
      const response = await fetch('/api/demo-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
          restaurantName: formData.restaurantName.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Demo talebi gönderilemedi');
      }

      console.log("[DemoLimitModal] Demo request submitted successfully:", result);

      // Call the optional callback
      if (onFormSubmit) {
        onFormSubmit(formData);
      }

      // Show thank you message
      setIsSubmitted(true);
      setIsSubmitting(false);
      setIsOpen(false);
    } catch (error: any) {
      console.error("[DemoLimitModal] Submission error:", error);
      setValidationError(error.message || "Demo talebi gönderilemedi. Lütfen tekrar deneyin.");
      setIsSubmitting(false);
    }
  };

  // Don't render anything until timer expires
  if (!isOpen && !isSubmitted) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md"
            style={{
              backdropFilter: "blur(8px)",
            }}
          />

          {/* Modal Content */}
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 pointer-events-auto"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-800">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <Clock className="w-5 h-5 text-red-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">
                    Süreniz Doldu!
                  </h2>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Demoyu İncelemeye Devam Etmek İçin...
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {/* Name Field */}
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>Ad Soyad <span className="text-red-500">*</span></span>
                    </div>
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                      fieldErrors.name ? "border-red-500" : "border-gray-700"
                    }`}
                    placeholder="Adınız ve soyadınız"
                  />
                </div>

                {/* Email Field */}
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>E-posta <span className="text-red-500">*</span></span>
                    </div>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                      fieldErrors.email ? "border-red-500" : "border-gray-700"
                    }`}
                    placeholder="ornek@email.com"
                  />
                </div>

                {/* Phone Field */}
                <div>
                  <label
                    htmlFor="phone"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <span>Telefon <span className="text-red-500">*</span></span>
                    </div>
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                      fieldErrors.phone ? "border-red-500" : "border-gray-700"
                    }`}
                    placeholder="05XX XXX XX XX"
                  />
                </div>

                {/* Restaurant Name Field */}
                <div>
                  <label
                    htmlFor="restaurantName"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      <span>Restoran Adı <span className="text-red-500">*</span></span>
                    </div>
                  </label>
                  <input
                    type="text"
                    id="restaurantName"
                    name="restaurantName"
                    value={formData.restaurantName}
                    onChange={handleInputChange}
                    required
                    className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                      fieldErrors.restaurantName ? "border-red-500" : "border-gray-700"
                    }`}
                    placeholder="Restoranınızın adı"
                  />
                </div>

                {/* Validation Error Message */}
                {validationError && (
                  <div className="mt-2 px-4 py-2 bg-red-500/20 border border-red-500/50 rounded-lg">
                    <p className="text-red-400 text-sm">{validationError}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Gönderiliyor...
                    </span>
                  ) : (
                    "Devam Et / Başvuru Yap"
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        </>
      )}

      {/* Thank You Message */}
      {isSubmitted && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8 max-w-sm text-center"
          >
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Teşekkürler!
            </h3>
            <p className="text-gray-400">
              Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
