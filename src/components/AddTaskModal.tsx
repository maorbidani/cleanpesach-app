import { FormEvent, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Plus, X } from 'lucide-react';
import { TaskCategory } from '../types';

interface AddTaskModalProps {
  isOpen: boolean;
  roomName: string;
  onClose: () => void;
  onAddTask: (payload: {
    title: string;
    category: TaskCategory;
    estimatedMinutes: number;
  }) => void;
}

const PRESET_MINUTES = [10, 15, 25, 40];

export function AddTaskModal({
  isOpen,
  roomName,
  onClose,
  onAddTask,
}: AddTaskModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('חובת חמץ');
  const [estimatedMinutes, setEstimatedMinutes] = useState(20);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    setTitle('');
    setCategory('חובת חמץ');
    setEstimatedMinutes(20);
    setError('');

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError('יש להזין שם למשימה');
      return;
    }

    const safeMinutes = Math.max(5, Math.min(240, Number(estimatedMinutes) || 15));
    onAddTask({
      title: trimmed,
      category,
      estimatedMinutes: safeMinutes,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-task-title"
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
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 p-6 sm:p-7 shadow-xl text-[#2D312E] dark:text-[#FAF8F5]"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A]">
                  חדר: {roomName}
                </span>
                <h2
                  id="add-task-title"
                  className="font-display text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5] mt-0.5"
                >
                  הוספת משימה חדשה
                </h2>
              </div>

              <button
                type="button"
                onClick={onClose}
                aria-label="סגור חלונית הוספת משימה"
                className="min-w-[44px] min-h-[44px] -mt-1 -ml-1 rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Task Title */}
              <div>
                <label
                  htmlFor="new-task-name"
                  className="block text-sm font-semibold text-[#2D312E] dark:text-[#FAF8F5] mb-2"
                >
                  שם המשימה
                </label>
                <input
                  id="new-task-name"
                  type="text"
                  autoFocus
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="למשל: ניקוי מגירת הסכו״ם והשריית הכלים"
                  className="w-full min-h-[46px] px-4 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/12 dark:border-white/12 text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-[#5E8C7D] focus:bg-[#FAF8F5] dark:focus:bg-[#273630] transition-colors"
                />
                {error && (
                  <p className="text-xs font-medium text-[#B84A39] dark:text-[#F4B68C] mt-1.5">
                    {error}
                  </p>
                )}
              </div>

              {/* Category Picker */}
              <div>
                <span className="block text-sm font-semibold text-[#2D312E] dark:text-[#FAF8F5] mb-2">
                  קטגוריה
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCategory('חובת חמץ')}
                    className={`min-h-[46px] px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      category === 'חובת חמץ'
                        ? 'bg-[#F5E1D3] dark:bg-[#492D21] border-[#9B4D1E]/40 dark:border-[#F4B68C]/40 text-[#9B4D1E] dark:text-[#F4B68C]'
                        : 'bg-[#EFECE6] dark:bg-[#273630] border-[#2D312E]/8 dark:border-white/10 text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                    }`}
                  >
                    חובת חמץ (חמץ)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCategory('ניקיון אביב')}
                    className={`min-h-[46px] px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      category === 'ניקיון אביב'
                        ? 'bg-[#DFECF2] dark:bg-[#1F3A44] border-[#2B5D73]/40 dark:border-[#9AC9DB]/40 text-[#2B5D73] dark:text-[#9AC9DB]'
                        : 'bg-[#EFECE6] dark:bg-[#273630] border-[#2D312E]/8 dark:border-white/10 text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                    }`}
                  >
                    ניקיון אביב (כללי)
                  </button>
                </div>
              </div>

              {/* Estimated Time */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="new-task-minutes"
                    className="text-sm font-semibold text-[#2D312E] dark:text-[#FAF8F5]"
                  >
                    זמן מוערך (בדקות)
                  </label>
                  <span className="text-xs font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
                    {estimatedMinutes} דקות
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 mb-2.5">
                  {PRESET_MINUTES.map((mins) => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setEstimatedMinutes(mins)}
                      className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors tabular-nums cursor-pointer ${
                        estimatedMinutes === mins
                          ? 'bg-[#5E8C7D] text-white'
                          : 'bg-[#EFECE6] dark:bg-[#273630] text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white'
                      }`}
                    >
                      {mins} דק׳
                    </button>
                  ))}
                  <input
                    id="new-task-minutes"
                    type="number"
                    min={5}
                    max={240}
                    step={5}
                    value={estimatedMinutes}
                    onChange={(e) => {
                      const parsed = parseInt(e.target.value, 10);
                      setEstimatedMinutes(
                        Number.isFinite(parsed)
                          ? Math.max(0, Math.min(240, parsed))
                          : 0
                      );
                    }}
                    className="w-24 min-h-[38px] px-3 py-1.5 rounded-lg bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/12 dark:border-white/12 text-sm font-semibold text-[#2D312E] dark:text-[#FAF8F5] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#5E8C7D]"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold transition-colors cursor-pointer"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>הוסף משימה לחדר</span>
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
