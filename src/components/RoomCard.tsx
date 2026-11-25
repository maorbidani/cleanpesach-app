import { ChevronLeft, Lock, LockOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { Room } from '../types';
import { ROOM_VISUAL_THEMES } from '../data/visualThemes';
import { ResilientImage } from './ResilientImage';
import { RoomIcon } from './RoomIcon';

interface RoomCardProps {
  room: Room;
  completedCount: number;
  totalCount: number;
  percentage: number;
  onToggleLock: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
}

export function RoomCard({
  room,
  completedCount,
  totalCount,
  percentage,
  onToggleLock,
  onSelectRoom,
}: RoomCardProps) {
  const theme = ROOM_VISUAL_THEMES[room.icon] ?? ROOM_VISUAL_THEMES.custom;

  return (
    <motion.article
      layout="position"
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={() => onSelectRoom(room.id)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelectRoom(room.id);
        }
      }}
      aria-label={`חדר ${room.name}, התקדמות ${percentage} אחוזים${
        room.isLocked ? ', נעול כנקי מחמץ' : ''
      }`}
      className={`group flex flex-col justify-between rounded-[22px] overflow-hidden border shadow-[0_8px_24px_-8px_rgba(45,49,46,0.1)] dark:shadow-[0_12px_28px_-8px_rgba(0,0,0,0.42)] hover:shadow-[0_16px_32px_-8px_rgba(45,49,46,0.16)] transition-shadow duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] ${
        room.isLocked
          ? 'bg-gradient-to-b from-[#E3F3EA] to-[#D4EBDD] dark:from-[#213E32] dark:to-[#1B3329] border-[#439A72]/50 dark:border-[#E5C17A]/45'
          : `${theme.cardTintClass} ${theme.borderClass}`
      }`}
    >
      {/* Top Visual Image Banner */}
      <div>
        <div className="relative h-36 sm:h-40 w-full overflow-hidden">
          <ResilientImage
            src={theme.imageSrc}
            alt={theme.imageAlt}
            fallbackGradient={theme.gradientBg}
            fallbackIcon={
              <RoomIcon
                icon={room.icon}
                className="w-12 h-12 text-[#2D312E]/50 dark:text-white/50"
              />
            }
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />

          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"
          />

          {/* Floating Room Icon Badge & Lock Status */}
          <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between gap-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm backdrop-blur-xs border border-white/40 transition-transform duration-200 group-hover:scale-105 ${
                room.isLocked
                  ? 'bg-[#3C8E68] text-white'
                  : `${theme.iconBgClass}`
              }`}
            >
              <RoomIcon icon={room.icon} className="w-5 h-5" />
            </div>

            {room.isLocked ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#3C8E68] text-white text-xs font-bold shadow-sm whitespace-nowrap">
                <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                <span>נקי מחמץ</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-black/45 backdrop-blur-xs text-white text-xs font-semibold tabular-nums whitespace-nowrap">
                <span>{percentage}% הושלם</span>
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 pb-4">
          <div className="flex items-start justify-between gap-2 mb-3.5">
            <div className="min-w-0">
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#2D312E] dark:text-[#FAF8F5] truncate">
                {room.name}
              </h3>
              <p className="text-xs text-[#5A605C] dark:text-[#C8D5CF] truncate mt-0.5">
                {room.subtitle}
              </p>
            </div>

            <ChevronLeft
              className={`w-5 h-5 shrink-0 mt-1 transition-transform group-hover:-translate-x-0.5 ${
                room.isLocked
                  ? 'text-[#3C8E68] dark:text-[#E5C17A]'
                  : theme.accentTextClass
              }`}
              aria-hidden="true"
            />
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="text-[#5A605C] dark:text-[#C8D5CF] font-medium tabular-nums">
                {completedCount} מתוך {totalCount} משימות
              </span>
              <span
                className={`font-bold tabular-nums ${
                  room.isLocked
                    ? 'text-[#2D6E4E] dark:text-[#8BE8A7]'
                    : theme.accentTextClass
                }`}
              >
                {percentage}%
              </span>
            </div>

            <div
              className="w-full h-2.5 rounded-full overflow-hidden bg-white/80 dark:bg-[#16201C]"
              role="progressbar"
              aria-valuenow={percentage}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`התקדמות ב${room.name}`}
            >
              <motion.div
                initial={false}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className={`h-full rounded-full ${
                  room.isLocked
                    ? 'bg-gradient-to-l from-[#3C8E68] to-[#5E8C7D]'
                    : theme.progressBarClass
                }`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lock Action Button */}
      <div className="px-5 pb-5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock(room.id);
          }}
          className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] ${
            room.isLocked
              ? 'bg-white/90 dark:bg-[#1E2B26] hover:bg-white dark:hover:bg-[#24342E] text-[#2D6E4E] dark:text-[#E5C17A] border border-[#3C8E68]/35 dark:border-[#E5C17A]/35'
              : theme.buttonClass
          }`}
        >
          {room.isLocked ? (
            <>
              <LockOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>חדר נעול · בטל נעילה</span>
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>נעל חדר כנקי מחמץ</span>
            </>
          )}
        </button>
      </div>
    </motion.article>
  );
}
