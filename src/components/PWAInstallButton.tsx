import { useEffect, useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export function PWAInstallButton() {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    if (!showIOSGuide) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowIOSGuide(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showIOSGuide]);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={() => void install()}
        className="inline-flex items-center gap-1.5 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-2 rounded-xl bg-[#DFECF2] dark:bg-[#1F3A44] hover:bg-[#CEE2EB] dark:hover:bg-[#284B58] border border-[#2D312E]/10 dark:border-white/12 text-[#2B5D73] dark:text-[#9AC9DB] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] dark:focus-visible:ring-[#E5C17A]"
      >
        <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
        <span className="hidden sm:inline">התקן כאפליקציה</span>
        <span className="sm:hidden">התקן</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 min-h-[38px] sm:min-h-[40px] px-2.5 sm:px-3 py-2 rounded-xl bg-[#DFECF2] dark:bg-[#1F3A44] hover:bg-[#CEE2EB] dark:hover:bg-[#284B58] border border-[#2D312E]/10 dark:border-white/12 text-[#2B5D73] dark:text-[#9AC9DB] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="hidden sm:inline">התקן באייפון</span>
          <span className="sm:hidden">התקן</span>
        </button>

        {showIOSGuide && (
          <div
            onClick={() => setShowIOSGuide(false)}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ios-install-title"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 p-6 shadow-2xl text-[#2D312E] dark:text-[#FAF8F5]"
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3
                  id="ios-install-title"
                  className="font-display text-lg font-bold"
                >
                  התקנת קליןפסח באייפון / אייפד
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="סגור"
                  className="min-w-[44px] min-h-[44px] -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:bg-[#EFECE6] dark:hover:bg-[#273630] cursor-pointer shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
              <ol className="space-y-2.5 text-sm text-[#5A605C] dark:text-[#C2CEC8] leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#5E8C7D] dark:text-[#E5C17A]">
                    1.
                  </span>
                  <span>
                    לחצו על כפתור השיתוף{' '}
                    <Share
                      className="inline w-4 h-4 text-[#5E8C7D] dark:text-[#8FB8CA] mx-0.5"
                      aria-hidden="true"
                    />{' '}
                    בתפריט הדפדפן (Safari).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold text-[#5E8C7D] dark:text-[#E5C17A]">
                    2.
                  </span>
                  <span>
                    גללו מטה ובחרו <strong>&quot;הוסף למסך הבית&quot;</strong>{' '}
                    (Add to Home Screen).
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full min-h-[44px] rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                הבנתי, תודה!
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
