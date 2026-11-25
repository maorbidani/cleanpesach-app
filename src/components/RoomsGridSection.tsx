import { useState } from 'react';
import { LayoutGrid, Map } from 'lucide-react';
import { CleaningTask, Room, RoomFilter, RoomViewMode } from '../types';
import { calculateRoomProgress } from '../data/mockData';
import { RoomCard } from './RoomCard';
import { InteractiveFloorPlan } from './InteractiveFloorPlan';

interface RoomsGridSectionProps {
  rooms: Room[];
  tasks: CleaningTask[];
  onToggleLock: (roomId: string) => void;
  onSelectRoom: (roomId: string) => void;
}

export function RoomsGridSection({
  rooms,
  tasks,
  onToggleLock,
  onSelectRoom,
}: RoomsGridSectionProps) {
  const [filter, setFilter] = useState<RoomFilter>('all');
  const [viewMode, setViewMode] = useState<RoomViewMode>('cards');

  const lockedCount = rooms.filter((r) => r.isLocked).length;
  const inProgressCount = rooms.length - lockedCount;

  const filteredRooms = rooms.filter((room) => {
    if (filter === 'locked') return room.isLocked;
    if (filter === 'in_progress') return !room.isLocked;
    return true;
  });

  return (
    <section
      id="rooms-map"
      aria-labelledby="rooms-map-heading"
      className="scroll-mt-20"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
        <div>
          <h2
            id="rooms-map-heading"
            className="font-display text-2xl sm:text-3xl font-bold text-[#2D312E] dark:text-[#FAF8F5]"
          >
            מפת החדרים
          </h2>
          <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] mt-1">
            לחצו על חדר לצפייה בכל המשימות שלו, או נעלו חדר שהוכשר לפסח
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* View Mode Switcher: Cards vs Interactive Floor Plan */}
          <div
            className="inline-flex flex-wrap max-w-full items-center gap-1 p-1 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10"
            role="group"
            aria-label="תצוגת חדרים"
          >
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              aria-pressed={viewMode === 'cards'}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'cards'
                  ? 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] shadow-xs'
                  : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>רשימת כרטיסיות</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('floorplan')}
              aria-pressed={viewMode === 'floorplan'}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                viewMode === 'floorplan'
                  ? 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] shadow-xs'
                  : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5]'
              }`}
            >
              <Map className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>מפת בית מאוירת</span>
            </button>
          </div>

          {/* Interactive Filter Tabs */}
          <div
            className="inline-flex flex-wrap max-w-full items-center gap-1 p-1 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10"
            role="tablist"
            aria-label="סינון חדרים"
          >
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'all'}
              onClick={() => setFilter('all')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                filter === 'all'
                  ? 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] shadow-xs'
                  : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5]'
              }`}
            >
              הכל ({rooms.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'in_progress'}
              onClick={() => setFilter('in_progress')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                filter === 'in_progress'
                  ? 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] shadow-xs'
                  : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5]'
              }`}
            >
              בתהליך ({inProgressCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={filter === 'locked'}
              onClick={() => setFilter('locked')}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                filter === 'locked'
                  ? 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] shadow-xs'
                  : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5]'
              }`}
            >
              נעולים מחמץ ({lockedCount})
            </button>
          </div>
        </div>
      </div>

      {filteredRooms.length > 0 ? (
        viewMode === 'floorplan' ? (
          <InteractiveFloorPlan
            rooms={filteredRooms}
            tasks={tasks}
            onSelectRoom={onSelectRoom}
            onToggleLock={onToggleLock}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRooms.map((room) => {
              const stats = calculateRoomProgress(room, tasks);
              return (
                <RoomCard
                  key={room.id}
                  room={room}
                  completedCount={stats.completedCount}
                  totalCount={stats.totalCount}
                  percentage={stats.percentage}
                  onToggleLock={onToggleLock}
                  onSelectRoom={onSelectRoom}
                />
              );
            })}
          </div>
        )
      ) : (
        <div className="rounded-3xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-10 text-center">
          <p className="text-base font-medium text-[#2D312E] dark:text-[#FAF8F5] mb-2">
            {filter === 'locked'
              ? 'עדיין לא ננעלו חדרים כנקיים מחמץ'
              : 'כל החדרים כבר נעולים כנקיים מחמץ'}
          </p>
          <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] mb-5">
            {filter === 'locked'
              ? 'לאחר סיום הניקיון בכל חדר, לחצו על "נעל חדר כנקי מחמץ".'
              : 'כל הכבוד! הבית כולו מוכן ומסודר לחג הפסח.'}
          </p>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold transition-colors cursor-pointer"
          >
            הצג את כל החדרים
          </button>
        </div>
      )}
    </section>
  );
}
