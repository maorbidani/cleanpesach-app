import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Award, Download, Share2, Star, X } from 'lucide-react';
import { CleaningTask, FamilyMember, Room } from '../types';
import {
  calculateFamilyStats,
  calculateOverallProgress,
} from '../data/mockData';
import { downloadCertificateAsPng } from '../utils/certificatePng';

interface FamilyCertificateModalProps {
  isOpen: boolean;
  members: FamilyMember[];
  tasks: CleaningTask[];
  rooms: Room[];
  onClose: () => void;
}

export function FamilyCertificateModal({
  isOpen,
  members,
  tasks,
  rooms,
  onClose,
}: FamilyCertificateModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const { memberStats, totalPoints } = calculateFamilyStats(members, tasks);
  const overall = calculateOverallProgress(rooms, tasks);

  const sortedStats = [...memberStats].sort((a, b) => b.points - a.points);

  const membersSummaryLines = sortedStats
    .map(
      (s) =>
        `• ${s.member.name} (${s.member.role}): ${s.completedCount} משימות · ${s.points} נק׳`
    )
    .join('\n');

  const whatsappSummary = `🏆 תעודת הצטיינות – הבית מוכן לפסח! 🌿\nהתקדמות הבית: ${overall.percentage}% (${overall.lockedRooms} מתוך ${rooms.length} חדרים נקיים מחמץ)\nסה״כ נקודות משפחתיות: ${totalPoints} ⭐\n\nגיבורי הניקיון שלנו:\n${membersSummaryLines}\n\nחג אביב שמח וכשר לכולנו! ✨`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappSummary)}`;

  const handleSaveOrPrint = () => {
    downloadCertificateAsPng({
      memberStats: sortedStats,
      totalPoints,
      overallPercentage: overall.percentage,
      lockedRooms: overall.lockedRooms,
      totalRooms: rooms.length,
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="family-certificate-title"
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#2D312E]/45 dark:bg-black/65 backdrop-blur-xs"
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-[20px] bg-[#FAF8F5] dark:bg-[#1E2B26] border-2 border-[#D49A3A]/60 dark:border-[#E5C17A]/60 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col text-[#2D312E] dark:text-[#FAF8F5]"
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="סגור תעודה"
              className="absolute top-4 left-4 z-20 min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>

            {/* Ceremonial Scrollable Certificate Body */}
            <div className="overflow-y-auto p-6 sm:p-8 flex-1">
              <div className="rounded-[20px] border-2 border-[#5E8C7D]/35 dark:border-[#E5C17A]/35 bg-gradient-to-b from-[#FAF8F5] via-[#FAF8F5] to-[#F4EFE4] dark:from-[#273630] dark:via-[#22322C] dark:to-[#1E2B26] p-6 sm:p-8 text-center space-y-6">
                {/* Gold Emblem */}
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-[#F6EBD2] dark:bg-[#493D22] border border-[#D49A3A]/45 dark:border-[#E5C17A]/45 text-[#9B6816] dark:text-[#E5C17A] flex items-center justify-center shadow-xs">
                    <Award className="w-8 h-8" aria-hidden="true" />
                  </div>

                  <span className="text-xs font-bold tracking-wide text-[#9B6816] dark:text-[#E5C17A] bg-[#F6EBD2] dark:bg-[#493D22] px-3.5 py-1 rounded-full">
                    קליןפסח · CleanPesach
                  </span>

                  <h2
                    id="family-certificate-title"
                    className="font-display text-2xl sm:text-4xl font-extrabold text-[#2D312E] dark:text-[#FAF8F5] text-balance"
                  >
                    תעודת הצטיינות – הבית מוכן לפסח!
                  </h2>

                  <p className="text-sm sm:text-base font-semibold text-[#456B5E] dark:text-[#E5C17A] tabular-nums">
                    התקדמות: {overall.percentage}% · {overall.lockedRooms} מתוך{' '}
                    {rooms.length} חדרים נקיים מחמץ · {totalPoints} נקודות
                  </p>
                </div>

                {/* Family Members Contributions */}
                <div className="space-y-2.5 text-right max-w-lg mx-auto">
                  <h3 className="font-display text-base font-bold text-[#2D312E] dark:text-[#FAF8F5] text-center mb-3">
                    השותפים והתרומה המשפחתית
                  </h3>

                  {sortedStats.map(({ member, completedCount, points }) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-[#EFECE6]/85 dark:bg-[#1E2B26]/85 border border-[#2D312E]/8 dark:border-white/10"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                            member.role === 'מבוגר'
                              ? 'bg-[#5E8C7D] text-white'
                              : 'bg-[#DFECF2] dark:bg-[#1F3A44] text-[#2B5D73] dark:text-[#9AC9DB]'
                          }`}
                        >
                          {member.name.slice(0, 1)}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm sm:text-base font-bold text-[#2D312E] dark:text-[#FAF8F5] truncate">
                            {member.name}
                          </p>
                          <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8]">
                            {member.role}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 text-xs sm:text-sm font-semibold tabular-nums shrink-0">
                        <span className="text-[#5A605C] dark:text-[#C2CEC8]">
                          {completedCount} משימות
                        </span>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FAF8F5] dark:bg-[#273630] text-[#2D312E] dark:text-[#FAF8F5]">
                          <Star
                            className="w-3.5 h-3.5 text-[#D49A3A] dark:text-[#E5C17A] fill-[#D49A3A] dark:fill-[#E5C17A]"
                            aria-hidden="true"
                          />
                          {points} נק׳
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Personal Holiday Blessing */}
                <div className="rounded-2xl bg-[#DFE9E4]/80 dark:bg-[#243D33] border border-[#5E8C7D]/30 dark:border-[#E5C17A]/30 p-5 max-w-lg mx-auto space-y-1.5">
                  <p className="font-display text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                    חג אביב שמח וכשר!
                  </p>
                  <p className="text-sm text-[#3B4640] dark:text-[#C2CEC8] leading-relaxed">
                    יהי רצון שתזכו לשבת אל שולחן ליל הסדר בבית מואר, נקי ומסודר, בלב שקט, בשמחה משפחתית ובחירות אמיתית.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 sm:px-8 border-t border-[#2D312E]/10 dark:border-white/10 bg-[#FAF8F5] dark:bg-[#1E2B26] flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
              >
                <Share2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>שתף בוואטסאפ</span>
              </a>

              <button
                type="button"
                onClick={handleSaveOrPrint}
                className="flex-1 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] border border-[#D49A3A]/45 dark:border-[#E5C17A]/45 text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-[#9B6816] dark:text-[#E5C17A] shrink-0" aria-hidden="true" />
                <span>הדפס / שמור כתמונה</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
