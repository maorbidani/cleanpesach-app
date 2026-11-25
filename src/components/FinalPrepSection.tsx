import { Check, Flame } from 'lucide-react';
import { motion } from 'motion/react';
import { FinalPrepItem } from '../types';

interface FinalPrepSectionProps {
  items: FinalPrepItem[];
  onToggleItem: (itemId: string) => void;
}

export function FinalPrepSection({
  items,
  onToggleItem,
}: FinalPrepSectionProps) {
  const completedCount = items.filter((item) => item.completed).length;

  return (
    <section
      id="final-prep"
      aria-labelledby="final-prep-heading"
      className="scroll-mt-20"
    >
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#F5E1D3] dark:bg-[#492D21] text-[#9B4D1E] dark:text-[#F4B68C] flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4" aria-hidden="true" />
          </div>
          <div>
            <h2
              id="final-prep-heading"
              className="font-display text-2xl sm:text-3xl font-bold text-[#2D312E] dark:text-[#FAF8F5]"
            >
              הכנות אחרונות לחג
            </h2>
            <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#C2CEC8] mt-0.5">
              מדריך ליל הבדיקה וביעור חמץ — רגע לפני שנכנס החג
            </p>
          </div>
        </div>

        <span className="text-sm font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
          {completedCount} מתוך {items.length} הושלמו
        </span>
      </div>

      <div className="rounded-[20px] bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 shadow-[0_6px_22px_-6px_rgba(45,49,46,0.08)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.4)] divide-y divide-[#2D312E]/8 dark:divide-white/10 overflow-hidden">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout="position"
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            onClick={() => onToggleItem(item.id)}
            role="checkbox"
            aria-checked={item.completed}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onToggleItem(item.id);
              }
            }}
            className={`group flex items-start sm:items-center gap-3.5 px-4 sm:px-6 py-4 transition-colors cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#5E8C7D] ${
              item.completed
                ? 'bg-[#DFE9E4]/65 dark:bg-[#243D33] hover:bg-[#D8E4DF] dark:hover:bg-[#29473B]'
                : 'hover:bg-[#E8E4DC] dark:hover:bg-[#2D3E37]'
            }`}
          >
            <div className="min-w-[44px] min-h-[44px] -my-2 -mr-2 flex items-center justify-center shrink-0">
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all duration-150 ${
                  item.completed
                    ? 'bg-[#5E8C7D] border-[#5E8C7D] text-white'
                    : 'bg-[#FAF8F5] dark:bg-[#1E2B26] border-[#2D312E]/25 dark:border-white/25 group-hover:border-[#5E8C7D] dark:group-hover:border-[#E5C17A]'
                }`}
              >
                {item.completed && (
                  <Check className="w-4 h-4 stroke-[2.5]" aria-hidden="true" />
                )}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <p
                className={`text-base font-bold leading-snug transition-colors ${
                  item.completed
                    ? 'line-through text-[#5A605C] dark:text-[#C2CEC8]'
                    : 'text-[#2D312E] dark:text-[#FAF8F5]'
                }`}
              >
                {item.title}
              </p>
              <p className="text-xs sm:text-sm text-[#5A605C] dark:text-[#C2CEC8] mt-1 leading-relaxed">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
