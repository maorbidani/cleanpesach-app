import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clock,
  Flame,
  Info,
  Leaf,
  Lightbulb,
  Lock,
  LockOpen,
  Plus,
  Share2,
  Timer,
  User,
} from 'lucide-react';
import {
  CleaningTask,
  FamilyMember,
  Room,
  TaskCategoryFilter,
} from '../types';
import {
  buildWhatsAppTaskUrl,
  calculateRoomProgress,
  getTaskPoints,
} from '../data/mockData';
import { ROOM_VISUAL_THEMES } from '../data/visualThemes';
import { ResilientImage } from './ResilientImage';
import { RoomIcon } from './RoomIcon';

interface RoomDetailsViewProps {
  room: Room;
  tasks: CleaningTask[];
  familyMembers: FamilyMember[];
  onBack: () => void;
  onToggleTask: (taskId: string) => void;
  onAssignTask: (taskId: string, memberId: string | null) => void;
  onToggleLock: (roomId: string) => void;
  onOpenAddTask: () => void;
  onOpenTimer: () => void;
  isTimerRunning: boolean;
  timerFormatted: string;
}

export function RoomDetailsView({
  room,
  tasks,
  familyMembers,
  onBack,
  onToggleTask,
  onAssignTask,
  onToggleLock,
  onOpenAddTask,
  onOpenTimer,
  isTimerRunning,
  timerFormatted,
}: RoomDetailsViewProps) {
  const [categoryFilter, setCategoryFilter] =
    useState<TaskCategoryFilter>('all');
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);

  const roomTasks = tasks.filter((t) => t.roomId === room.id);
  const stats = calculateRoomProgress(room, tasks);

  const chametzCount = roomTasks.filter(
    (t) => t.category === 'חובת חמץ'
  ).length;
  const springCount = roomTasks.filter(
    (t) => t.category === 'ניקיון אביב'
  ).length;

  const filteredTasks = roomTasks.filter((task) => {
    if (categoryFilter === 'all') return true;
    return task.category === categoryFilter;
  });

  const handleToggleTip = (taskId: string) => {
    setExpandedTipId((prev) => (prev === taskId ? null : taskId));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="space-y-6 sm:space-y-8"
    >
      {/* Back navigation bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D]"
        >
          <ArrowRight className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]" aria-hidden="true" />
          <span>חזרה למפת החדרים</span>
        </button>

        {/* Focus Timer CTA */}
        <button
          type="button"
          onClick={onOpenTimer}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D]"
        >
          <Timer className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>
            {isTimerRunning
              ? `טיימר פוקוס פעיל (${timerFormatted})`
              : "הפעל טיימר פוקוס (25 דק')"}
          </span>
        </button>
      </div>

      {/* Room Header Card with Visual Banner */}
      {(() => {
        const theme = ROOM_VISUAL_THEMES[room.icon] ?? ROOM_VISUAL_THEMES.custom;
        return (
          <section
            aria-label={`פרטי חדר ${room.name}`}
            className={`rounded-[22px] overflow-hidden border shadow-[0_8px_26px_-6px_rgba(45,49,46,0.1)] dark:shadow-[0_12px_30px_-8px_rgba(0,0,0,0.44)] transition-colors ${
              room.isLocked
                ? 'bg-gradient-to-b from-[#E3F3EA] to-[#D4EBDD] dark:from-[#213E32] dark:to-[#1B3329] border-[#3C8E68]/45 dark:border-[#E5C17A]/45'
                : `${theme.cardTintClass} ${theme.borderClass}`
            }`}
          >
            <div className="relative h-36 sm:h-48 w-full overflow-hidden">
              <ResilientImage
                src={theme.imageSrc}
                alt={theme.imageAlt}
                fallbackGradient={theme.gradientBg}
                fallbackIcon={
                  <RoomIcon
                    icon={room.icon}
                    className="w-14 h-14 text-[#2D312E]/45 dark:text-white/45"
                  />
                }
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent"
              />
              <div className="absolute bottom-4 right-5 left-5 flex items-center justify-between gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md border border-white/40 ${
                    room.isLocked ? 'bg-[#3C8E68] text-white' : theme.iconBgClass
                  }`}
                >
                  <RoomIcon icon={room.icon} className="w-6 h-6" />
                </div>
                {room.isLocked && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#3C8E68] text-white text-xs font-bold shadow-md">
                    <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>נקי מחמץ</span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Room Identity & Progress */}
              <div className="flex-1 min-w-0 space-y-4">
                <div className="min-w-0">
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                    {room.name}
                  </h1>
                  <p className="text-sm sm:text-base text-[#5A605C] dark:text-[#C8D5CF] mt-1">
                    {room.subtitle}
                  </p>
                </div>

                {/* Room Progress Bar */}
                <div className="max-w-xl">
                  <div className="flex items-center justify-between text-xs sm:text-sm mb-2">
                    <span className="text-[#5A605C] dark:text-[#C8D5CF] tabular-nums font-medium">
                      {stats.completedCount} מתוך {stats.totalCount} משימות הושלמו
                    </span>
                    <span
                      className={`font-bold tabular-nums ${
                        room.isLocked
                          ? 'text-[#2D6E4E] dark:text-[#8BE8A7]'
                          : theme.accentTextClass
                      }`}
                    >
                      {stats.percentage}%
                    </span>
                  </div>

                  <div
                    className="w-full h-3 rounded-full overflow-hidden bg-white/85 dark:bg-[#16201C]"
                    role="progressbar"
                    aria-valuenow={stats.percentage}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`התקדמות בחדר ${room.name}`}
                  >
                    <motion.div
                      initial={false}
                      animate={{ width: `${stats.percentage}%` }}
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

              {/* Lock / Unlock Room Button */}
              <div className="shrink-0 flex flex-col items-stretch sm:items-end gap-2">
                <button
                  type="button"
                  onClick={() => onToggleLock(room.id)}
                  className={`min-h-[46px] px-6 py-3 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] ${
                    room.isLocked
                      ? 'bg-white dark:bg-[#1E2B26] hover:bg-[#FAF8F5] dark:hover:bg-[#22322C] text-[#2D6E4E] dark:text-[#E5C17A] border border-[#3C8E68]/35 dark:border-[#E5C17A]/40'
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
            </div>
          </section>
        );
      })()}

      {/* Locked Banner Notice */}
      {room.isLocked && (
        <div className="rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#5E8C7D]/30 dark:border-[#E5C17A]/35 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-[#2D312E] dark:text-[#FAF8F5]">
          <span>
            חדר זה מסומן כנעול ונקי מחמץ (100%). לסימון או שינוי משימות פרטניות, ניתן לבטל את הנעילה בכל עת.
          </span>
          <button
            type="button"
            onClick={() => onToggleLock(room.id)}
            className="text-[#456B5E] dark:text-[#E5C17A] font-semibold hover:underline underline-offset-4 self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer"
          >
            בטל נעילה לעריכה
          </button>
        </div>
      )}

      {/* Filter Tabs + Add Task Toolbar */}
      <section aria-label="רשימת משימות החדר" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Quick Filter Tabs */}
          <div
            className="inline-flex flex-wrap max-w-full items-center gap-1 p-1 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 self-start"
            role="tablist"
            aria-label="סינון משימות לפי קטגוריה"
          >
            {(
              [
                { id: 'all', label: 'הכל', count: roomTasks.length },
                { id: 'חובת חמץ', label: 'חובת חמץ', count: chametzCount },
                { id: 'ניקיון אביב', label: 'ניקיון אביב', count: springCount },
              ] as { id: TaskCategoryFilter; label: string; count: number }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={categoryFilter === tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer tabular-nums ${
                  categoryFilter === tab.id
                    ? 'bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] shadow-xs'
                    : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5]'
                }`}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {/* Add New Task Button */}
          <button
            type="button"
            onClick={onOpenAddTask}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#273630] hover:bg-[#EFECE6] dark:hover:bg-[#2F413A] border border-[#5E8C7D]/45 dark:border-[#E5C17A]/40 text-[#456B5E] dark:text-[#E5C17A] text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D]"
          >
            <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>הוסף משימה חדשה</span>
          </button>
        </div>

        {/* Tasks List */}
        {filteredTasks.length > 0 ? (
          <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 shadow-[0_6px_22px_-6px_rgba(45,49,46,0.08)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.4)] divide-y divide-[#2D312E]/8 dark:divide-white/10 overflow-hidden">
            {filteredTasks.map((task) => {
              const isChametz = task.category === 'חובת חמץ';
              const isDone = room.isLocked || task.completed;
              const isExpanded = expandedTipId === task.id;
              const points = getTaskPoints(task.category);
              const assignedMember = familyMembers.find(
                (m) => m.id === task.assignedToId
              );

              return (
                <div
                  key={task.id}
                  className="relative overflow-hidden bg-[#5E8C7D]/18 dark:bg-[#5E8C7D]/25"
                >
                  {!room.isLocked && (
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 flex items-center justify-between px-6 text-xs font-bold text-[#3B5F53] dark:text-[#E5C17A] pointer-events-none"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <Check className="w-4 h-4" />
                        <span>{isDone ? 'החזר לפתוח' : 'סיום מהיר ✓'}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span>{isDone ? 'החזר לפתוח' : 'סיום מהיר ✓'}</span>
                        <Check className="w-4 h-4" />
                      </span>
                    </div>
                  )}

                  <motion.div
                    drag={room.isLocked ? false : 'x'}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.22}
                    onDragEnd={(_, info) => {
                      if (!room.isLocked && Math.abs(info.offset.x) > 75) {
                        onToggleTask(task.id);
                      }
                    }}
                    className={`relative z-10 transition-colors ${
                      isDone
                        ? 'bg-[#E7E3DB] dark:bg-[#22322C]'
                        : 'bg-[#EFECE6] dark:bg-[#273630]'
                    }`}
                  >
                    {/* Main Task Row */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 px-4 sm:px-6 py-4">
                      <div
                        onClick={() => !room.isLocked && onToggleTask(task.id)}
                        role="checkbox"
                        aria-checked={isDone}
                        aria-disabled={room.isLocked}
                        tabIndex={room.isLocked ? -1 : 0}
                        onKeyDown={(e) => {
                          if (
                            !room.isLocked &&
                            (e.key === ' ' || e.key === 'Enter')
                          ) {
                            e.preventDefault();
                            onToggleTask(task.id);
                          }
                        }}
                        className={`flex items-start sm:items-center gap-3.5 flex-1 min-w-0 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] rounded-xl ${
                          room.isLocked ? 'cursor-default' : 'cursor-pointer group'
                        }`}
                      >
                        {/* 44x44 touch target checkbox */}
                        <div className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center shrink-0">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-150 ${
                              isDone
                                ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                                : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/25 dark:border-white/25 group-hover:border-[#5E8C7D] dark:group-hover:border-[#E5C17A]'
                            }`}
                          >
                            {isDone && (
                              <Check
                                className="w-4 h-4 stroke-[2.5]"
                                aria-hidden="true"
                              />
                            )}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <p
                            className={`text-base font-medium leading-snug transition-colors ${
                              isDone
                                ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                                : 'text-[#2D312E] dark:text-[#FAF8F5]'
                            }`}
                          >
                            {task.title}
                          </p>

                          <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold whitespace-nowrap border ${
                                isChametz
                                  ? 'bg-[#FDE4D3] dark:bg-[#4B2B1E] text-[#AD4415] dark:text-[#FFBA94] border-[#EA8A58]/35'
                                  : 'bg-[#DDF2EA] dark:bg-[#1B3D32] text-[#1D6A4E] dark:text-[#86E0BE] border-[#4CAF82]/35'
                              }`}
                            >
                              {isChametz ? (
                                <Flame className="w-3 h-3 shrink-0" aria-hidden="true" />
                              ) : (
                                <Leaf className="w-3 h-3 shrink-0" aria-hidden="true" />
                              )}
                              <span>{task.category}</span>
                            </span>

                            <span className="inline-flex items-center gap-1 text-xs text-[#5A605C] dark:text-[#C2CEC8] tabular-nums">
                              <Clock
                                className="w-3.5 h-3.5 text-[#8FB8CA]"
                                aria-hidden="true"
                              />
                              {task.estimatedMinutes} דקות
                            </span>

                            <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
                              · +{points} נק׳
                            </span>

                            {task.isCustom && (
                              <span className="text-xs text-[#5A605C] dark:text-[#C2CEC8]">
                                · משימה אישית
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Assignee Picker, WhatsApp Share & How to Clean Toggle */}
                      <div
                        className="flex flex-wrap items-center justify-end gap-2 shrink-0 pr-9 lg:pr-0"
                        onClick={(e) => e.stopPropagation()}
                        onPointerDownCapture={(e) => e.stopPropagation()}
                      >
                        {familyMembers.length > 0 && (
                          <label className="inline-flex items-center gap-1.5 min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/12 text-xs text-[#2D312E] dark:text-[#FAF8F5]">
                            <User
                              className="w-3.5 h-3.5 text-[#8FB8CA] shrink-0"
                              aria-hidden="true"
                            />
                            <select
                              aria-label={`שיוך משימה ${task.title} לבן משפחה`}
                              value={task.assignedToId ?? ''}
                              onChange={(e) =>
                                onAssignTask(task.id, e.target.value || null)
                              }
                              className="bg-transparent text-xs font-medium text-[#2D312E] dark:text-[#FAF8F5] dark:[&>option]:bg-[#1E2B26] dark:[&>option]:text-[#FAF8F5] focus:outline-none cursor-pointer"
                            >
                              <option value="">ללא שיוך</option>
                              {familyMembers.map((member) => (
                                <option key={member.id} value={member.id}>
                                  {member.name}
                                </option>
                              ))}
                            </select>
                          </label>
                        )}

                        {assignedMember && (
                          <a
                            href={buildWhatsAppTaskUrl({
                              memberName: assignedMember.name,
                              taskTitle: task.title,
                              roomName: room.name,
                              estimatedMinutes: task.estimatedMinutes,
                            })}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={`שלח משימה ל${assignedMember.name} בוואטסאפ`}
                            aria-label={`שתף משימה עם ${assignedMember.name} בוואטסאפ`}
                            className="inline-flex items-center gap-1 min-h-[40px] px-2.5 py-1.5 rounded-xl bg-[#DFE9E4] dark:bg-[#243D33] hover:bg-[#CFE0D7] dark:hover:bg-[#2C4B3E] text-[#3B5F53] dark:text-[#BFE2D4] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                          >
                            <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                            <span>וואטסאפ</span>
                          </a>
                        )}

                        <button
                          type="button"
                          onClick={() => handleToggleTip(task.id)}
                          aria-expanded={isExpanded}
                          className={`inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1.5 rounded-xl text-xs sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] ${
                            isExpanded
                              ? 'bg-[#5E8C7D] text-white'
                              : 'bg-[#FAF8F5] dark:bg-[#1E2B26] hover:bg-[#FAF8F5]/80 dark:hover:bg-[#22322C] text-[#456B5E] dark:text-[#E5C17A] border border-[#2D312E]/8 dark:border-white/12'
                          }`}
                        >
                          <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
                          <span>איך מנקים?</span>
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform duration-200 ${
                              isExpanded ? 'rotate-180' : ''
                            }`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>

                    {/* Accordion: Cleaning Tip & Recommended Supplies */}
                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="mx-4 sm:mx-6 mb-4 p-4 sm:p-5 rounded-2xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/10 space-y-3">
                            <div>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#456B5E] dark:text-[#E5C17A] mb-1">
                                <Lightbulb
                                  className="w-3.5 h-3.5 text-[#8FB8CA]"
                                  aria-hidden="true"
                                />
                                <span>טיפ מקצועי לביצוע</span>
                              </div>
                              <p className="text-sm text-[#2D312E] dark:text-[#FAF8F5] leading-relaxed">
                                {task.cleaningTip}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-[#2D312E]/8 dark:border-white/10">
                              <p className="text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8] mb-1.5">
                                חומרי ניקוי מומלצים:
                              </p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-[#2D312E] dark:text-[#FAF8F5]">
                                {task.recommendedSupplies.map((supply, index) => (
                                  <span
                                    key={supply}
                                    className="inline-flex items-center gap-1.5"
                                  >
                                    {index > 0 && (
                                      <span
                                        className="text-[#5A605C] dark:text-[#C2CEC8]"
                                        aria-hidden="true"
                                      >
                                        ·
                                      </span>
                                    )}
                                    <span>{supply}</span>
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-8 sm:p-10 text-center">
            <p className="text-base font-semibold text-[#2D312E] dark:text-[#FAF8F5] mb-1.5">
              אין משימות בקטגוריה &quot;{categoryFilter}&quot; בחדר זה
            </p>
            <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] mb-5">
              אפשר לעבור לתצוגת כל המשימות או להוסיף משימה מותאמת אישית.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] hover:bg-[#E5E0D8] dark:hover:bg-[#22322C] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold transition-colors cursor-pointer"
              >
                הצג הכל
              </button>
              <button
                type="button"
                onClick={onOpenAddTask}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                + הוסף משימה חדשה
              </button>
            </div>
          </div>
        )}
      </section>
    </motion.div>
  );
}
