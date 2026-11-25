import { CalendarCheck2, Home, MessageSquare, Mic, MicOff, Users } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import { BottomDockTab } from '../types';

interface BottomDockProps {
  activeTab: BottomDockTab;
  isChatOpen: boolean;
  isListening: boolean;
  onSelectTab: (tab: BottomDockTab) => void;
  onToggleVoice: () => void;
}

export function BottomDock({
  activeTab,
  isChatOpen,
  isListening,
  onSelectTab,
  onToggleVoice,
}: BottomDockProps) {
  const prefersReducedMotion = useReducedMotion();

  const renderTabButton = (
    id: BottomDockTab,
    label: string,
    Icon: typeof Home
  ) => {
    const isActive =
      id === 'assistant' ? isChatOpen : !isChatOpen && activeTab === id;

    return (
      <button
        key={id}
        type="button"
        onClick={() => onSelectTab(id)}
        aria-current={isActive ? 'page' : undefined}
        className={`min-h-[52px] px-1 py-1.5 rounded-[18px] flex flex-col items-center justify-center gap-1 transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] dark:focus-visible:ring-[#E5C17A] ${
          isActive
            ? 'bg-[#5E8C7D] dark:bg-[#E5C17A] text-white dark:text-[#1E2B26] shadow-sm'
            : 'text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:bg-[#EFECE6]/70 dark:hover:bg-white/8'
        }`}
      >
        <Icon className="w-[18px] h-[18px] shrink-0" aria-hidden="true" />
        <span className="text-[10px] sm:text-[11px] font-semibold leading-none whitespace-nowrap truncate max-w-full">
          {label}
        </span>
      </button>
    );
  };

  return (
    <nav
      aria-label="ניווט תחתון ראשי"
      className="fixed bottom-3 sm:bottom-4 inset-x-2.5 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 sm:w-full sm:max-w-xl"
    >
      <div className="rounded-[26px] bg-[#FAF8F5]/92 dark:bg-[#273630]/94 backdrop-blur-xl border border-[#2D312E]/10 dark:border-white/12 shadow-[0_12px_32px_-8px_rgba(45,49,46,0.22)] dark:shadow-[0_14px_36px_-8px_rgba(0,0,0,0.5)] p-1.5 grid grid-cols-[1fr_1fr_auto_1fr_1fr] items-center gap-1">
        {renderTabButton('home', 'הבית שלי', Home)}
        {renderTabButton('planning', 'התארגנות לחג', CalendarCheck2)}

        {/* Elevated Breathing Hands-Free Voice Assistant Mic Button */}
        <div className="px-1 flex items-center justify-center">
          <motion.button
            type="button"
            onClick={onToggleVoice}
            aria-pressed={isListening}
            aria-label={
              isListening
                ? 'עצור האזנה קולית'
                : 'שליטה קולית — דברו עם קליןפסח'
            }
            title="שליטה קולית ללא מגע ידיים"
            animate={
              prefersReducedMotion
                ? undefined
                : isListening
                ? { scale: [1, 1.09, 1] }
                : { scale: [1, 1.03, 1] }
            }
            transition={{
              duration: isListening ? 1.05 : 3.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`relative w-12 h-12 sm:w-[54px] sm:h-[54px] rounded-2xl flex items-center justify-center shadow-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] dark:focus-visible:ring-[#E5C17A] ${
              isListening
                ? 'bg-[#D49A3A] text-white ring-4 ring-[#D49A3A]/30'
                : 'bg-[#5E8C7D] hover:bg-[#4E796B] text-white dark:bg-[#E5C17A] dark:text-[#1E2B26] dark:hover:bg-[#EED091]'
            }`}
          >
            {isListening ? (
              <MicOff className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Mic className="w-5 h-5" aria-hidden="true" />
            )}
          </motion.button>
        </div>

        {renderTabButton('family', 'המשפחה', Users)}
        {renderTabButton('assistant', 'עוזר פסח AI', MessageSquare)}
      </div>
    </nav>
  );
}
