import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { RotateCcw, X } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ResetConfirmModal({
  isOpen,
  onCancel,
  onConfirm,
}: ResetConfirmModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reset-modal-title"
        >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            className="fixed inset-0 bg-[#2D312E]/40 dark:bg-black/60 backdrop-blur-xs"
          />

          {/* Modal Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-md rounded-3xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 p-6 sm:p-7 shadow-xl text-[#2D312E] dark:text-[#FAF8F5]"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-[#F5E1D3] dark:bg-[#492D21] text-[#9B4D1E] dark:text-[#F4B68C] flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" aria-hidden="true" />
              </div>

              <button
                type="button"
                onClick={onCancel}
                aria-label="סגור חלונית"
                className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <h2
              id="reset-modal-title"
              className="font-display text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5] mb-2"
            >
              איפוס כל נתוני הניקיון?
            </h2>

            <p className="text-sm sm:text-base text-[#5A605C] dark:text-[#C2CEC8] leading-relaxed mb-6">
              אישור הפעולה יאפס את כל סימוני המשימות, החדרים ורשימות ההתארגנות לחג חזרה למצב ההתחלתי.
            </p>

            <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D]"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#B84A39] hover:bg-[#A03E2F] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B84A39]"
              >
                כן, אפס את כל הסימונים
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
