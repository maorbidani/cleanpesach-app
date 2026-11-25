import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowLeft, Home } from 'lucide-react';
import splashLogoImg from '../assets/images/cleanpesach_home_logo_1795600038980.jpg';
import { ResilientImage } from './ResilientImage';

const SPLASH_DURATION_MS = 7000;

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const startTime = performance.now();
    let frameId = 0;
    let completed = false;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const nextProgress = Math.min(100, (elapsed / SPLASH_DURATION_MS) * 100);
      setProgress(nextProgress);

      if (elapsed >= SPLASH_DURATION_MS) {
        if (!completed) {
          completed = true;
          onComplete();
        }
        return;
      }

      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
    };
  }, [onComplete]);

  const remainingSeconds = Math.max(
    0,
    Math.ceil(((100 - progress) / 100) * (SPLASH_DURATION_MS / 1000))
  );

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: prefersReducedMotion ? 0.1 : 0.45, ease: [0.16, 1, 0.3, 1] },
      }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-[#FAF8F5] dark:bg-[#1E2B26] px-6 py-8 text-[#2D312E] dark:text-[#FAF8F5]"
      role="region"
      aria-label="מסך פתיחה קליןפסח"
    >
      {/* Top developer skip action */}
      <div className="w-full max-w-4xl flex items-center justify-end">
        <button
          type="button"
          onClick={onComplete}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] whitespace-nowrap shrink-0 cursor-pointer"
        >
          <span>דלג למסך הבית</span>
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Center hero illustration & inspiring copy */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center text-center max-w-xl mx-auto my-auto py-4"
      >
        <div className="relative w-52 h-52 sm:w-64 sm:h-64 rounded-3xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/12 overflow-hidden mb-8 shadow-sm">
          <ResilientImage
            src={splashLogoImg}
            alt="איור של בית נקי ומואר מוקף ענפי אביב"
            fallbackGradient="from-[#EFECE6] via-[#FAF8F5] to-[#DFECF2]"
            fallbackIcon={
              <Home
                className="w-20 h-20 stroke-[1.5] text-[#5E8C7D] dark:text-[#E5C17A]"
                aria-hidden="true"
              />
            }
            className="w-full h-full object-cover"
          />
        </div>

        <h1 className="font-display text-3xl sm:text-5xl font-bold tracking-tight text-[#2D312E] dark:text-[#FAF8F5] mb-4 text-balance">
          קליןפסח - CleanPesach
        </h1>

        <p className="text-base sm:text-lg text-[#5A605C] dark:text-[#C2CEC8] leading-relaxed max-w-md text-balance">
          מתחדשים באהבה לקראת האביב — בית נקי, נשימה עמוקה ושמחת חג אמיתית, חדר אחר חדר בקצב רגוע.
        </p>
      </motion.div>

      {/* Bottom 7-second gentle progress bar */}
      <div className="w-full max-w-sm mx-auto flex flex-col items-center gap-2.5 pb-2">
        <div className="w-full flex items-center justify-between text-xs text-[#5A605C] dark:text-[#C2CEC8] tabular-nums">
          <span>מכינים את רשימות הבית...</span>
          <span>{remainingSeconds} שנ׳</span>
        </div>
        <div
          className="w-full h-2 rounded-full bg-[#EFECE6] dark:bg-[#273630] overflow-hidden border border-[#2D312E]/5 dark:border-white/10"
          role="progressbar"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="התקדמות טעינת מסך הפתיחה"
        >
          <div
            className="h-full bg-[#5E8C7D] rounded-full transition-none"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}
