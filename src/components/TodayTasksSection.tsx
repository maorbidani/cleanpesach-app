import { Check, Clock, Flame, Leaf, Share2, Timer, User } from 'lucide-react';
import { motion } from 'motion/react';
import { CleaningTask, FamilyMember, Room } from '../types';
import { buildWhatsAppTaskUrl, getTaskPoints } from '../data/mockData';

interface TodayTasksSectionProps {
  tasks: CleaningTask[];
  rooms: Room[];
  familyMembers: FamilyMember[];
  onToggleTask: (taskId: string) => void;
  onAssignTask: (taskId: string, memberId: string | null) => void;
  onOpenTimer: () => void;
  isTimerRunning: boolean;
  timerFormatted: string;
}

export function TodayTasksSection({
  tasks,
  rooms,
  familyMembers,
  onToggleTask,
  onAssignTask,
  onOpenTimer,
  isTimerRunning,
  timerFormatted,
}: TodayTasksSectionProps) {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalMinutes = tasks.reduce((sum, t) => sum + t.estimatedMinutes, 0);

  const getRoomName = (roomId: string) =>
    rooms.find((r) => r.id === roomId)?.name ?? '';

  return (
    <section
      id="today-tasks"
      aria-labelledby="today-tasks-heading"
      className="scroll-mt-20"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2
            id="today-tasks-heading"
            className="font-display text-2xl sm:text-3xl font-bold text-[#2D312E] dark:text-[#FAF8F5]"
          >
            המשימות להיום
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#5A605C] dark:text-[#C2CEC8] tabular-nums mt-1">
            <span>
              {completedCount} מתוך {tasks.length} הושלמו
            </span>
            <span aria-hidden="true">·</span>
            <span>כ-{totalMinutes} דקות עבודה</span>
            <span aria-hidden="true" className="hidden sm:inline">
              ·
            </span>
            <span className="hidden sm:inline text-xs text-[#456B5E] dark:text-[#E5C17A]">
              החליקו כרטיסייה הצידה לסימון מהיר
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenTimer}
          className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] border border-[#2D312E]/8 dark:border-white/10 text-[#2D312E] dark:text-[#FAF8F5] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D]"
        >
          <Timer className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A] shrink-0" aria-hidden="true" />
          <span>
            {isTimerRunning
              ? `טיימר פוקוס פעיל (${timerFormatted})`
              : "הפעל טיימר פוקוס (25 דק')"}
          </span>
        </button>
      </div>

      {tasks.length > 0 ? (
        <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 shadow-[0_6px_22px_-6px_rgba(45,49,46,0.08)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.4)] divide-y divide-[#2D312E]/8 dark:divide-white/10 overflow-hidden">
          {tasks.map((task) => {
            const roomName = getRoomName(task.roomId);
            const isChametz = task.category === 'חובת חמץ';
            const points = getTaskPoints(task.category);
            const assignedMember = familyMembers.find(
              (m) => m.id === task.assignedToId
            );

            return (
              <div
                key={task.id}
                className="relative overflow-hidden bg-[#5E8C7D]/18 dark:bg-[#5E8C7D]/25"
              >
                {/* Swipe Action Backdrop Hint */}
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-between px-6 text-xs font-bold text-[#3B5F53] dark:text-[#E5C17A] pointer-events-none"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Check className="w-4 h-4" />
                    <span>{task.completed ? 'החזר לפתוח' : 'סיום מהיר ✓'}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span>{task.completed ? 'החזר לפתוח' : 'סיום מהיר ✓'}</span>
                    <Check className="w-4 h-4" />
                  </span>
                </div>

                <motion.div
                  layout="position"
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.22}
                  onDragEnd={(_, info) => {
                    if (Math.abs(info.offset.x) > 75) {
                      onToggleTask(task.id);
                    }
                  }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onToggleTask(task.id)}
                  role="checkbox"
                  aria-checked={task.completed}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      onToggleTask(task.id);
                    }
                  }}
                  className={`relative z-10 group flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5E8C7D] ${
                    task.completed
                      ? 'bg-[#E7E3DB] dark:bg-[#22322C] hover:bg-[#E2DDD4] dark:hover:bg-[#263832]'
                      : 'bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E8E4DC] dark:hover:bg-[#2D3E37]'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* 44x44 touch target checkbox */}
                    <div className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center shrink-0">
                      <span
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-150 ${
                          task.completed
                            ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                            : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/25 dark:border-white/25 group-hover:border-[#5E8C7D] dark:group-hover:border-[#E5C17A]'
                        }`}
                      >
                        {task.completed && (
                          <Check
                            className="w-4 h-4 stroke-[2.5]"
                            aria-hidden="true"
                          />
                        )}
                      </span>
                    </div>

                    {/* Task Title & Metadata */}
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-base font-medium leading-snug transition-colors ${
                          task.completed
                            ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                            : 'text-[#2D312E] dark:text-[#FAF8F5]'
                        }`}
                      >
                        {task.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-[#5A605C] dark:text-[#C2CEC8]">
                        <span>{roomName}</span>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 tabular-nums">
                          <Clock
                            className="w-3.5 h-3.5 text-[#8FB8CA]"
                            aria-hidden="true"
                          />
                          {task.estimatedMinutes} דקות
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums font-semibold text-[#456B5E] dark:text-[#E5C17A]">
                          +{points} נק׳
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Assignee Dropdown, WhatsApp Share & Category Label */}
                  <div
                    className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0 pr-9 sm:pr-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    onPointerDownCapture={(e) => e.stopPropagation()}
                  >
                    {familyMembers.length > 0 && (
                      <label className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/10 dark:border-white/12 text-xs text-[#2D312E] dark:text-[#FAF8F5]">
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
                          roomName,
                          estimatedMinutes: task.estimatedMinutes,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`שלח משימה ל${assignedMember.name} בוואטסאפ`}
                        aria-label={`שתף משימה עם ${assignedMember.name} בוואטסאפ`}
                        className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-xl bg-[#DFE9E4] dark:bg-[#243D33] hover:bg-[#CFE0D7] dark:hover:bg-[#2C4B3E] text-[#3B5F53] dark:text-[#BFE2D4] text-xs font-semibold transition-colors whitespace-nowrap shrink-0"
                      >
                        <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                        <span>וואטסאפ</span>
                      </a>
                    )}

                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap border ${
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
                  </div>
                </motion.div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-8 text-center text-sm text-[#5A605C] dark:text-[#C2CEC8]">
          אין משימות פתוחות להיום. בחרו חדר ממפת החדרים כדי להמשיך.
        </div>
      )}
    </section>
  );
}
