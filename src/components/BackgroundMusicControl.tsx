import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  CloudRain,
  Music,
  Piano,
  Sparkles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BackgroundMusicTrack } from '../utils/soundEngine';

interface BackgroundMusicControlProps {
  activeTrack: BackgroundMusicTrack;
  volumePercent: number;
  onSelectTrack: (track: BackgroundMusicTrack) => void;
  onChangeVolume: (percent: number) => void;
}

const MUSIC_OPTIONS: Array<{
  id: BackgroundMusicTrack;
  label: string;
  subtitle: string;
  Icon: typeof Sparkles;
}> = [
  {
    id: 'spring',
    label: 'מנגינת אביב קצבית ומעוררת',
    subtitle: 'קצב אביבי שמח ומרים אנרגיה לניקיונות',
    Icon: Sparkles,
  },
  {
    id: 'piano',
    label: 'פסנתר מרגיע',
    subtitle: 'אקורדים חמים ורכים לעבודה שלווה',
    Icon: Piano,
  },
  {
    id: 'rain',
    label: 'צלילי גשם וטבע',
    subtitle: 'גשם אביב עדין לפוקוס וריכוז',
    Icon: CloudRain,
  },
  {
    id: 'none',
    label: 'ללא מוזיקה (השתק)',
    subtitle: 'עצירת נגן מוזיקת הרקע',
    Icon: VolumeX,
  },
];

export function BackgroundMusicControl({
  activeTrack,
  volumePercent,
  onSelectTrack,
  onChangeVolume,
}: BackgroundMusicControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [isOpen]);

  const isPlaying = activeTrack !== 'none';

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="מוזיקת רקע"
        title="בחירת מוזיקת רקע ואווירה"
        className={`relative inline-flex items-center justify-center gap-1.5 min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] px-2 sm:px-3 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] dark:focus-visible:ring-[#E5C17A] ${
          isPlaying
            ? 'bg-[#E1ECE8] dark:bg-[#243E35] border-[#5E8C7D]/40 text-[#3D6357] dark:text-[#E5C17A]'
            : 'bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D7] dark:hover:bg-[#31443D] border-[#2D312E]/10 dark:border-white/12 text-[#2D312E] dark:text-[#FAF8F5]'
        }`}
      >
        <Music
          className={`w-4 h-4 shrink-0 ${
            isPlaying ? 'text-[#5E8C7D] dark:text-[#E5C17A]' : ''
          }`}
          aria-hidden="true"
        />
        <span className="hidden sm:inline text-xs">מוזיקת רקע</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
            role="menu"
            aria-label="בחירת מוזיקת רקע"
            className="fixed sm:absolute top-16 sm:top-auto left-3 right-3 sm:right-auto sm:left-0 sm:mt-2 sm:w-[310px] max-w-[340px] mx-auto sm:mx-0 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/14 shadow-2xl p-3.5 z-50 text-[#2D312E] dark:text-[#FAF8F5]"
          >
            <div className="flex items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-[#2D312E]/8 dark:border-white/10">
              <div className="flex items-center gap-2">
                <Music
                  className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]"
                  aria-hidden="true"
                />
                <span className="font-display text-sm font-bold">
                  נגן מוזיקת רקע ואווירה
                </span>
              </div>
              {isPlaying && (
                <span className="text-[11px] font-semibold text-[#5E8C7D] dark:text-[#E5C17A]">
                  מתנגן
                </span>
              )}
            </div>

            <div className="space-y-1.5" role="radiogroup" aria-label="סגנון מוזיקה">
              {MUSIC_OPTIONS.map(({ id, label, subtitle, Icon }) => {
                const selected = activeTrack === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={selected}
                    onClick={() => onSelectTrack(id)}
                    className={`w-full text-right rounded-xl px-3 py-2.5 flex items-center gap-2.5 transition-colors cursor-pointer ${
                      selected
                        ? 'bg-[#E1ECE8] dark:bg-[#243E35] border border-[#5E8C7D]/45 text-[#2D312E] dark:text-[#FAF8F5]'
                        : 'hover:bg-[#EFECE6] dark:hover:bg-[#273630] border border-transparent text-[#2D312E] dark:text-[#FAF8F5]'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        selected
                          ? 'bg-[#5E8C7D] text-white'
                          : 'bg-[#EFECE6] dark:bg-[#273630] text-[#5A605C] dark:text-[#C2CEC8]'
                      }`}
                    >
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </span>

                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-bold block leading-snug">
                        {label}
                      </span>
                      <span className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8] block leading-tight mt-0.5">
                        {subtitle}
                      </span>
                    </div>

                    {selected && (
                      <Check
                        className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A] shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Volume Slider */}
            <div className="mt-3 pt-3 border-t border-[#2D312E]/8 dark:border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8]">
                <label
                  htmlFor="bg-music-volume"
                  className="inline-flex items-center gap-1.5"
                >
                  <Volume2
                    className="w-3.5 h-3.5 text-[#5E8C7D] dark:text-[#E5C17A]"
                    aria-hidden="true"
                  />
                  <span>עוצמת שמע (Volume)</span>
                </label>
                <span className="tabular-nums font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                  {volumePercent}%
                </span>
              </div>

              <input
                id="bg-music-volume"
                type="range"
                min={0}
                max={100}
                step={1}
                value={volumePercent}
                onChange={(e) => onChangeVolume(Number(e.target.value))}
                dir="ltr"
                className="w-full h-2 rounded-full accent-[#5E8C7D] dark:accent-[#E5C17A] bg-[#EFECE6] dark:bg-[#273630] cursor-pointer"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
