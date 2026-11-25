import { Lock, LockOpen } from 'lucide-react';
import { motion } from 'motion/react';
import { CleaningTask, Room } from '../types';
import { calculateRoomProgress } from '../data/mockData';
import { RoomIcon } from './RoomIcon';

interface InteractiveFloorPlanProps {
  rooms: Room[];
  tasks: CleaningTask[];
  onSelectRoom: (roomId: string) => void;
  onToggleLock: (roomId: string) => void;
}

function getRoomFloorSpan(roomId: string): string {
  switch (roomId) {
    case 'living':
      return 'md:col-span-2 md:row-span-2 min-h-[190px]';
    case 'kitchen':
      return 'md:col-span-2 min-h-[160px]';
    case 'master':
    case 'kids':
      return 'md:col-span-1 min-h-[160px]';
    case 'balcony':
      return 'md:col-span-2 min-h-[140px]';
    default:
      return 'md:col-span-1 min-h-[140px]';
  }
}

export function InteractiveFloorPlan({
  rooms,
  tasks,
  onSelectRoom,
  onToggleLock,
}: InteractiveFloorPlanProps) {
  return (
    <div className="rounded-[24px] bg-[#EFECE6] dark:bg-[#273630] border-2 border-[#2D312E]/12 dark:border-white/12 p-4 sm:p-6 shadow-[0_8px_28px_-8px_rgba(45,49,46,0.1)] dark:shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)]">
      {/* Blueprint Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-4 border-b border-dashed border-[#2D312E]/15 dark:border-white/15">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#456B5E] dark:text-[#E5C17A]">
          <span>תרשים הבית האביבי</span>
          <span aria-hidden="true">·</span>
          <span className="text-[#5A605C] dark:text-[#C2CEC8] font-normal">
            החדרים מתמלאים בצבע מרווה עם ההתקדמות ומקבלים הילת זהב בנעילה
          </span>
        </div>

        <div className="flex items-center gap-3 text-xs text-[#5A605C] dark:text-[#C2CEC8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#5E8C7D]/35 border border-[#5E8C7D]" />
            <span>בתהליך</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-[#DFE9E4] dark:bg-[#243D33] ring-2 ring-[#D49A3A]" />
            <span>נעול מחמץ</span>
          </span>
        </div>
      </div>

      {/* Architectural Connected Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-3.5 bg-[#FAF8F5]/65 dark:bg-[#1E2B26]/70 p-3 sm:p-4 rounded-[20px] border border-[#2D312E]/10 dark:border-white/10">
        {rooms.map((room) => {
          const stats = calculateRoomProgress(room, tasks);
          const fillOpacity = room.isLocked
            ? 0.28
            : Math.max(0.04, (stats.percentage / 100) * 0.28);

          return (
            <motion.div
              key={room.id}
              layout="position"
              onClick={() => onSelectRoom(room.id)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectRoom(room.id);
                }
              }}
              aria-label={`מפת בית - חדר ${room.name}, ${stats.percentage}%`}
              className={`relative overflow-hidden rounded-[18px] p-4 border-2 flex flex-col justify-between transition-all duration-300 cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] ${getRoomFloorSpan(
                room.id
              )} ${
                room.isLocked
                  ? 'border-[#D49A3A] dark:border-[#E5C17A] shadow-[0_0_24px_-4px_rgba(212,154,58,0.42)] bg-[#FAF8F5] dark:bg-[#243D33]'
                  : 'border-[#2D312E]/15 dark:border-white/15 hover:border-[#5E8C7D] dark:hover:border-[#7AA697] bg-[#FAF8F5] dark:bg-[#273630]'
              }`}
            >
              {/* Gradual Fill Layer According to Progress */}
              <div
                aria-hidden="true"
                className="absolute inset-x-0 bottom-0 bg-[#5E8C7D] transition-all duration-500 pointer-events-none"
                style={{
                  height: `${room.isLocked ? 100 : stats.percentage}%`,
                  opacity: fillOpacity,
                }}
              />

              {/* Architectural Doorway Notch Accent */}
              <div
                aria-hidden="true"
                className="absolute top-0 right-6 w-8 h-1 rounded-b-full bg-[#2D312E]/15 dark:bg-white/20"
              />

              {/* Room Header */}
              <div className="relative z-10 flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      room.isLocked
                        ? 'bg-[#5E8C7D] text-white'
                        : 'bg-[#EFECE6] dark:bg-[#1E2B26] text-[#8FB8CA] dark:text-[#E5C17A]'
                    }`}
                  >
                    <RoomIcon icon={room.icon} className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base sm:text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5] truncate">
                      {room.name}
                    </h3>
                    <p className="text-[11px] text-[#5A605C] dark:text-[#C2CEC8] tabular-nums">
                      {stats.completedCount}/{stats.totalCount} משימות
                    </p>
                  </div>
                </div>

                {/* Quick Lock Toggle inside Blueprint */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleLock(room.id);
                  }}
                  title={
                    room.isLocked
                      ? `בטל נעילה ל${room.name}`
                      : `נעל את ${room.name} כנקי מחמץ`
                  }
                  aria-label={
                    room.isLocked
                      ? `בטל נעילה ל${room.name}`
                      : `נעל את ${room.name} כנקי מחמץ`
                  }
                  className={`min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    room.isLocked
                      ? 'bg-[#D49A3A] text-white hover:bg-[#B8832D]'
                      : 'bg-[#EFECE6] dark:bg-[#1E2B26] text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                  }`}
                >
                  {room.isLocked ? (
                    <Lock className="w-4 h-4" aria-hidden="true" />
                  ) : (
                    <LockOpen className="w-4 h-4" aria-hidden="true" />
                  )}
                </button>
              </div>

              {/* Room Footer: Percentage & Mini Progress */}
              <div className="relative z-10 pt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold tabular-nums">
                  <span
                    className={
                      room.isLocked
                        ? 'text-[#9B6816] dark:text-[#E5C17A]'
                        : 'text-[#456B5E] dark:text-[#96C2B3]'
                    }
                  >
                    {room.isLocked ? 'נקי מחמץ ✨' : 'לחץ לפתיחת משימות'}
                  </span>
                  <span className="text-[#2D312E] dark:text-[#FAF8F5]">
                    {stats.percentage}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#2D312E]/10 dark:bg-white/15 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      room.isLocked
                        ? 'bg-[#D49A3A] dark:bg-[#E5C17A]'
                        : 'bg-[#5E8C7D]'
                    }`}
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
