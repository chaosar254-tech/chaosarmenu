"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LeadFormModal } from "./LeadFormModal";

interface DemoOverlayProps {
  open: boolean;
  onClose: () => void;
  demoUrl: string;
}

export const DemoOverlay: React.FC<DemoOverlayProps> = ({
  open,
  onClose,
  demoUrl,
}) => {
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [timerStarted, setTimerStarted] = useState(false);

  // 40 saniye timer başlat
  useEffect(() => {
    if (!open || timerStarted) return;

    setTimerStarted(true);
    const timer = setTimeout(() => {
      setLeadFormOpen(true);
    }, 40000); // 40 saniye

    return () => {
      clearTimeout(timer);
      setTimerStarted(false);
    };
  }, [open, timerStarted]);

  // Overlay kapandığında form'u da kapat
  useEffect(() => {
    if (!open) {
      setLeadFormOpen(false);
      setTimerStarted(false);
    }
  }, [open]);

  const handleFormClose = () => {
    // Form kapatılamaz, sadece submit ile kapanır
    // Bu fonksiyon form submit edildiğinde çağrılacak
    setLeadFormOpen(false);
    onClose(); // Overlay'i de kapat
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-[200]"
            />

            {/* Overlay Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[201] flex flex-col"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[202] p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                aria-label="Kapat"
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Iframe */}
              <iframe
                src={`${demoUrl}?table=6`}
                className="w-full h-full border-0"
                allow="camera; microphone; xr-spatial-tracking"
                allowFullScreen
                style={{ width: "100%", height: "100%" }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lead Form Modal */}
      <LeadFormModal open={leadFormOpen} onClose={handleFormClose} />
    </>
  );
};

