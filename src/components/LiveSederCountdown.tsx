import { useEffect, useState } from 'react';
import { Flame, Pencil } from 'lucide-react';

interface LiveSederCountdownProps {
  targetDateISO: string;
  onOpenSettings: () => void;
  onOpenSederMode: () => void;
}

interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  hasArrived: boolean;
}

function computeCountdown(targetDateISO: string): CountdownParts {
  const safeDate = targetDateISO || '2027-04-21';
  const target = new Date(`${safeDate}T19:00:00`);
  if (Number.isNaN(target.getTime())) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, hasArrived: false };
  }

  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, hasArrived: true };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, hasArrived: false };
}

function formatHebrewTargetDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return '21 באפריל 2027';
  return d.toLocaleDateString('he-IL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function LiveSederCountdown({
  targetDateISO,
  onOpenSettings,
  onOpenSederMode,
}: LiveSederCountdownProps) {
  const [countdown, setCountdown] = useState<CountdownParts>(() =>
    computeCountdown(targetDateISO)
  );

  useEffect(() => {
    const syncNow = () => setCountdown(computeCountdown(targetDateISO));
    syncNow();
    const id = window.setInterval(syncNow, 1000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        syncNow();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [targetDateISO]);

  const blocks = [
    {
      label: 'ימים',
      value: countdown.days,
      boxClass:
        'bg-[#FDECE2] dark:bg-[#3B2920] border-[#F09A6A]/35 text-[#9E4116] dark:text-[#FFB38A]',
      labelClass: 'text-[#874324] dark:text-[#E5B89E]',
    },
    {
      label: 'שעות',
      value: countdown.hours,
      boxClass:
        'bg-[#E0F4F6] dark:bg-[#1B353B] border-[#3CB0BE]/35 text-[#0F6976] dark:text-[#7CE4F0]',
      labelClass: 'text-[#1D5E69] dark:text-[#9FD3DA]',
    },
    {
      label: 'דקות',
      value: countdown.minutes,
      boxClass:
        'bg-[#E3F4E7] dark:bg-[#1C3826] border-[#4EB873]/35 text-[#1F6B3B] dark:text-[#8BE8A7]',
      labelClass: 'text-[#285E3B] dark:text-[#A3D4B3]',
    },
    {
      label: 'שניות',
      value: countdown.seconds,
      boxClass:
        'bg-[#FFF5D6] dark:bg-[#3B321A] border-[#E7B63B]/45 text-[#915A04] dark:text-[#FFD86B]',
      labelClass: 'text-[#7C520C] dark:text-[#EAD085]',
    },
  ];

  return (
    <div className="rounded-2xl bg-[#FAF8F5]/95 dark:bg-[#1E2B26]/95 border border-[#D49A3A]/30 dark:border-[#E5C17A]/25 p-4 space-y-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#9C5B14] dark:text-[#E5C17A]">
          <Flame className="w-4 h-4 text-[#E07A38] dark:text-[#E5C17A] shrink-0" aria-hidden="true" />
          <span>
            {countdown.hasArrived
              ? 'חג פסח שמח! ליל הסדר כבר כאן'
              : `ספירה לאחור לליל הסדר (${formatHebrewTargetDate(targetDateISO)})`}
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenSettings}
          title="שנה תאריך יעד בהגדרות"
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white cursor-pointer"
        >
          <Pencil className="w-3 h-3" aria-hidden="true" />
          <span>שינוי תאריך</span>
        </button>
      </div>

      <div
        dir="ltr"
        className="grid grid-cols-4 gap-2"
        aria-label="שעון ספירה לאחור חי לליל הסדר"
      >
        {blocks.map((block) => (
          <div
            key={block.label}
            className={`rounded-xl border py-2.5 px-1 text-center transition-transform hover:-translate-y-0.5 ${block.boxClass}`}
          >
            <div className="font-display text-xl sm:text-2xl font-bold tabular-nums leading-none">
              {String(block.value).padStart(2, '0')}
            </div>
            <div className={`text-[11px] font-bold mt-1 ${block.labelClass}`}>
              {block.label}
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onOpenSederMode}
        className="w-full min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-l from-[#F7E3AC] via-[#FAEDC4] to-[#F3D898] hover:from-[#F2D997] hover:to-[#EECD7E] dark:from-[#4C3F21] dark:via-[#544624] dark:to-[#45381C] dark:hover:from-[#5D4D28] dark:hover:to-[#534422] border border-[#D49A3A]/45 dark:border-[#E5C17A]/40 text-[#664104] dark:text-[#FCE39E] text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer"
      >
        <span>🕯️ מצב ערב פסח וליל הסדר</span>
      </button>
    </div>
  );
}
