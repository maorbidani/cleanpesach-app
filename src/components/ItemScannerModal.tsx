import { ChangeEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Camera,
  ImagePlus,
  Loader2,
  RefreshCw,
  ScanSearch,
  X,
} from 'lucide-react';
import { compressImageFile } from '../utils/imageScanner';

interface ItemScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ItemScannerModal({ isOpen, onClose }: ItemScannerModalProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) {
      abortControllerRef.current?.abort();
      return;
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      abortControllerRef.current?.abort();
    };
  }, [isOpen, onClose]);

  const handleResetScan = () => {
    abortControllerRef.current?.abort();
    setPreviewUrl(null);
    setAnalysisResult(null);
    setErrorMessage('');
    setUserNote('');
    setIsScanning(false);
  };

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 25000);

    setErrorMessage('');
    setAnalysisResult(null);
    setIsScanning(true);

    try {
      const compressed = await compressImageFile(file);
      setPreviewUrl(compressed.dataUrl);

      const response = await fetch('/api/scan-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: compressed.base64,
          mimeType: compressed.mimeType,
          note: userNote.trim(),
        }),
      });

      let data: { analysis?: string; error?: string } = {};
      try {
        data = (await response.json()) as {
          analysis?: string;
          error?: string;
        };
      } catch {
        data = {};
      }

      if (!response.ok || !data.analysis) {
        throw new Error(
          data.error || 'לא הצלחתי לנתח את התמונה. נסו לצלם שוב באור ברור.'
        );
      }

      setAnalysisResult(data.analysis);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMessage('הסריקה ארכה יותר מדי זמן. בדקו את החיבור ונסו שוב.');
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'אירעה שגיאה בסריקת המוצר או הכלי.'
        );
      }
    } finally {
      window.clearTimeout(timeoutId);
      setIsScanning(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="item-scanner-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2D312E]/40 dark:bg-black/60 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-[20px] bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col text-[#2D312E] dark:text-[#FAF8F5]"
          >
            {/* Header */}
            <div className="p-6 pb-4 border-b border-[#2D312E]/8 dark:border-white/10 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#DFECF2] dark:bg-[#1F3A44] text-[#2B5D73] dark:text-[#9AC9DB] flex items-center justify-center shrink-0">
                  <ScanSearch className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A]">
                    סורק מצלמה חכם (AI Vision)
                  </span>
                  <h2
                    id="item-scanner-title"
                    className="font-display text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5]"
                  >
                    חמץ או כשר לפסח?
                  </h2>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="סגור סורק"
                className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Hidden File Inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => void handleFileChange(e)}
              className="hidden"
            />

            {/* Body */}
            <div className="overflow-y-auto p-6 space-y-5 flex-1">
              {!previewUrl ? (
                <>
                  <p className="text-sm sm:text-base text-[#5A605C] dark:text-[#C2CEC8] leading-relaxed">
                    צלמו או העלו תמונה של מוצר מזון מהמזווה, תבלין, קוסמטיקה, חומר ניקוי או כלי מטבח — והעוזר יזהה אם יש חשש חמץ וימליץ איך לפעול.
                  </p>

                  <div>
                    <label
                      htmlFor="scanner-note-input"
                      className="block text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8] mb-1.5"
                    >
                      הערה אופציונלית (למשל: &quot;קנינו לפני חודשיים&quot; / &quot;כלי משימוש חם&quot;)
                    </label>
                    <input
                      id="scanner-note-input"
                      type="text"
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      placeholder="הוסף הקשר קצר לפני הצילום..."
                      className="w-full min-h-[42px] px-4 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/10 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60 focus:outline-none focus:ring-2 focus:ring-[#5E8C7D]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="min-h-[52px] px-5 py-3 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Camera className="w-5 h-5 shrink-0" aria-hidden="true" />
                      <span>צלם במצלמה</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="min-h-[52px] px-5 py-3 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] border border-[#2D312E]/10 dark:border-white/12 text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <ImagePlus className="w-5 h-5 text-[#5E8C7D] dark:text-[#E5C17A] shrink-0" aria-hidden="true" />
                      <span>בחר מהגלריה</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 overflow-hidden max-h-56 flex items-center justify-center">
                    <img
                      src={previewUrl}
                      alt="הפריט שצולם לסריקת חמץ"
                      className="w-full max-h-56 object-contain"
                    />
                  </div>

                  {isScanning && (
                    <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 flex items-center justify-center gap-3 text-sm font-semibold text-[#456B5E] dark:text-[#E5C17A]">
                      <Loader2 className="w-5 h-5 animate-spin shrink-0" aria-hidden="true" />
                      <span>מזהה את הפריט ובודק חשש חמץ...</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="rounded-[20px] bg-[#F5E1D3] dark:bg-[#492D21] text-[#9B4D1E] dark:text-[#F4B68C] p-4 text-sm">
                      {errorMessage}
                    </div>
                  )}

                  {analysisResult && (
                    <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-5 text-sm leading-relaxed text-[#2D312E] dark:text-[#FAF8F5] whitespace-pre-wrap">
                      {analysisResult}
                    </div>
                  )}

                  {!isScanning && (
                    <button
                      type="button"
                      onClick={handleResetScan}
                      className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]" aria-hidden="true" />
                      <span>סרוק מוצר או כלי נוסף</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
