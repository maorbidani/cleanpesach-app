import { motion, useReducedMotion } from 'motion/react';
import {
  Award,
  CheckCircle2,
  Cloud,
  Medal,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trophy,
  Users,
} from 'lucide-react';
import { CleaningTask, FamilyMember } from '../types';
import { calculateFamilyStats } from '../data/mockData';
import { getFamilyMemberVisual } from '../data/visualThemes';
import { ResilientImage } from './ResilientImage';

interface FamilySectionProps {
  members: FamilyMember[];
  tasks: CleaningTask[];
  activeFamilyCode?: string | null;
  onOpenWizard: () => void;
  onOpenCertificate: () => void;
  onOpenCloudSync?: () => void;
}

const RANK_MEDAL_STYLES = [
  {
    label: 'מקום 1 · כוכב הניקיון',
    containerClass:
      'bg-gradient-to-l from-[#FCE494] to-[#F7C948] text-[#664100] border-[#E0A81E]/50',
    iconClass: 'text-[#9A6000]',
  },
  {
    label: 'מקום 2 · אלוף הסדר',
    containerClass:
      'bg-gradient-to-l from-[#E8EDF2] to-[#D2DCE6] text-[#354454] border-[#9EB0C2]/50',
    iconClass: 'text-[#4D6175]',
  },
  {
    label: 'מקום 3 · רוח אביבית',
    containerClass:
      'bg-gradient-to-l from-[#F7DAC5] to-[#EAA97E] text-[#663110] border-[#CF8454]/50',
    iconClass: 'text-[#8C4315]',
  },
];

export function FamilySection({
  members,
  tasks,
  activeFamilyCode,
  onOpenWizard,
  onOpenCertificate,
  onOpenCloudSync,
}: FamilySectionProps) {
  const prefersReducedMotion = useReducedMotion();
  const { memberStats, totalPoints } = calculateFamilyStats(members, tasks);
  const maxPoints = Math.max(40, ...memberStats.map((s) => s.points));

  // Rank members by descending points (only award medals when points > 0)
  const rankedIds = [...memberStats]
    .filter((s) => s.points > 0)
    .sort((a, b) => b.points - a.points)
    .map((s) => s.member.id);

  return (
    <section
      id="family-section"
      aria-labelledby="family-section-heading"
      className="scroll-mt-20 space-y-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2
            id="family-section-heading"
            className="font-display text-2xl sm:text-3xl font-bold text-[#2D312E] dark:text-[#FAF8F5]"
          >
            המשפחה שלנו
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#5A605C] dark:text-[#C2CEC8] mt-1 tabular-nums">
            <span className="inline-flex items-center gap-1.5 font-semibold text-[#8F5800] dark:text-[#FFD86B]">
              <Star
                className="w-4 h-4 text-[#F29F3D] dark:text-[#FFD86B] fill-[#F29F3D] dark:fill-[#FFD86B]"
                aria-hidden="true"
              />
              סה״כ {totalPoints} נקודות משפחתיות
            </span>
            <span aria-hidden="true">·</span>
            <span>משימת חמץ = 20 נק׳ · ניקיון אביב = 10 נק׳</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
          {onOpenCloudSync && (
            <button
              type="button"
              onClick={onOpenCloudSync}
              className={`inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl border text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeFamilyCode
                  ? 'bg-[#E1ECE8] dark:bg-[#243E35] border-[#5E8C7D]/35 text-[#3D6357] dark:text-[#E5C17A]'
                  : 'bg-[#EFECE6] dark:bg-[#273630] border-[#2D312E]/8 dark:border-white/10 text-[#2D312E] dark:text-[#FAF8F5] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A]'
              }`}
            >
              <Cloud
                className="w-4 h-4 text-[#28A8B8] dark:text-[#7CE4F0]"
                aria-hidden="true"
              />
              <span>
                {activeFamilyCode
                  ? `מסונכרן: ${activeFamilyCode}`
                  : 'סנכרון משפחתי בענן'}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenCertificate}
            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-gradient-to-l from-[#FCE494] to-[#F7C948] hover:from-[#FAD86C] hover:to-[#F2BC2B] border border-[#E0A81E]/55 text-[#5C3A00] text-xs sm:text-sm font-bold shadow-xs transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D49A3A]"
          >
            <Trophy className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>הפק תעודת בית נקי לפסח</span>
          </button>

          <button
            type="button"
            onClick={onOpenWizard}
            className="inline-flex items-center justify-center gap-2 min-h-[42px] px-4 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] border border-[#2D312E]/8 dark:border-white/10 text-[#2D312E] dark:text-[#FAF8F5] text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D]"
          >
            <SlidersHorizontal
              className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]"
              aria-hidden="true"
            />
            <span>ערוך בני משפחה</span>
          </button>
        </div>
      </div>

      {/* Colorful Team Contribution Visual Breakdown Chart */}
      {memberStats.length > 0 && (
        <div className="rounded-[20px] bg-gradient-to-br from-[#FFF9EE] via-[#EFECE6] to-[#E9F6F3] dark:from-[#273630] dark:via-[#22302B] dark:to-[#1C2B26] border border-[#E6B87A]/35 dark:border-white/10 p-5 sm:p-6 shadow-[0_6px_22px_-6px_rgba(45,49,46,0.08)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles
                className="w-4 h-4 text-[#D96934] dark:text-[#FFD86B]"
                aria-hidden="true"
              />
              <h3 className="font-display text-base sm:text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                מפת התרומה המשפחתית
              </h3>
            </div>
            <span className="text-xs font-semibold text-[#5A605C] dark:text-[#C2CEC8] tabular-nums">
              {totalPoints > 0
                ? `${totalPoints} נקודות משותפות נצברו`
                : 'השלימו משימות כדי לצבוע את גרף המשפחה'}
            </span>
          </div>

          {/* Stacked Proportional Color Bar */}
          <div
            className="w-full h-4 rounded-full bg-white/80 dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/10 overflow-hidden flex"
            role="img"
            aria-label="התפלגות הנקודות בין בני המשפחה"
          >
            {totalPoints > 0 ? (
              memberStats.map(({ member, points }, index) => {
                if (points <= 0) return null;
                const widthPct = Math.max(4, (points / totalPoints) * 100);
                const visual = getFamilyMemberVisual(member, index);
                return (
                  <div
                    key={member.id}
                    style={{ width: `${widthPct}%` }}
                    title={`${member.name}: ${points} נק׳ (${Math.round((points / totalPoints) * 100)}%)`}
                    className={`h-full ${visual.gradientBarClass} transition-all duration-500 first:rounded-r-full last:rounded-l-full`}
                  />
                );
              })
            ) : (
              <div className="w-full h-full bg-gradient-to-l from-[#EFECE6] via-[#E5E0D8] to-[#EFECE6] dark:from-[#273630] dark:to-[#1E2B26]" />
            )}
          </div>

          {/* Legend Swatches */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
            {memberStats.map(({ member, points }, index) => {
              const visual = getFamilyMemberVisual(member, index);
              const pct =
                totalPoints > 0 ? Math.round((points / totalPoints) * 100) : 0;
              return (
                <div
                  key={member.id}
                  className="inline-flex items-center gap-2 text-[#2D312E] dark:text-[#FAF8F5] tabular-nums"
                >
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${visual.gradientBarClass}`}
                    aria-hidden="true"
                  />
                  <span className="font-bold">{member.name}</span>
                  <span className="text-[#5A605C] dark:text-[#C2CEC8]">
                    {points} נק׳ ({pct}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {memberStats.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {memberStats.map(
            ({ member, completedCount, assignedCount, points }, index) => {
              const barWidth = Math.min(
                100,
                Math.round((points / maxPoints) * 100)
              );
              const visual = getFamilyMemberVisual(member, index);
              const rankIndex = rankedIds.indexOf(member.id);
              const medal =
                rankIndex >= 0 && rankIndex < 3
                  ? RANK_MEDAL_STYLES[rankIndex]
                  : null;

              return (
                <motion.article
                  key={member.id}
                  layout="position"
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`rounded-[20px] ${visual.accentBgClass} border border-[#2D312E]/10 dark:border-white/12 p-5 sm:p-6 shadow-[0_6px_22px_-6px_rgba(45,49,46,0.08)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.4)] hover:shadow-[0_14px_30px_-8px_rgba(45,49,46,0.14)] hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between gap-4`}
                >
                  {medal && (
                    <div
                      className={`inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-xl border text-[11px] font-bold ${medal.containerClass}`}
                    >
                      <Medal
                        className={`w-3.5 h-3.5 ${medal.iconClass}`}
                        aria-hidden="true"
                      />
                      <span>{medal.label}</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-16 h-16 rounded-2xl overflow-hidden ring-2 ${visual.ringClass} shadow-sm shrink-0 bg-white dark:bg-[#1E2B26]`}
                      >
                        <ResilientImage
                          src={visual.avatarSrc}
                          alt={`דמות מאוירת ומחייכת של ${member.name}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5] truncate">
                          {member.name}
                        </h3>
                        <p className="text-xs font-medium text-[#5A605C] dark:text-[#C2CEC8]">
                          {member.role}
                        </p>
                      </div>
                    </div>

                    {/* Points Star Badge with gentle twinkling star */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/90 dark:bg-[#1E2B26] border border-[#F29F3D]/35 dark:border-[#FFD86B]/30 text-sm font-bold text-[#2D312E] dark:text-[#FAF8F5] tabular-nums shrink-0 shadow-2xs">
                      <motion.span
                        animate={
                          prefersReducedMotion
                            ? undefined
                            : { scale: [1, 1.18, 1], rotate: [0, 8, 0] }
                        }
                        transition={{
                          duration: 2.6,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                        className="inline-flex"
                      >
                        <Star
                          className="w-4 h-4 text-[#F29F3D] dark:text-[#FFD86B] fill-[#F29F3D] dark:fill-[#FFD86B]"
                          aria-hidden="true"
                        />
                      </motion.span>
                      <span>{points}</span>
                    </div>
                  </div>

                  {/* Star Meter & Task Count */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-[#5A605C] dark:text-[#C2CEC8] tabular-nums">
                      <span className="inline-flex items-center gap-1.5 font-medium">
                        <CheckCircle2
                          className="w-3.5 h-3.5 text-[#2E8B52] dark:text-[#8BE8A7]"
                          aria-hidden="true"
                        />
                        {completedCount} משימות הושלמו
                      </span>
                      <span>
                        {assignedCount > 0
                          ? `מתוך ${assignedCount} משויכות`
                          : 'ללא משימות משויכות'}
                      </span>
                    </div>

                    <div
                      className="w-full h-3 rounded-full bg-white/85 dark:bg-[#1E2B26] overflow-hidden"
                      role="progressbar"
                      aria-valuenow={points}
                      aria-valuemin={0}
                      aria-valuemax={maxPoints}
                      aria-label={`מד נקודות של ${member.name}`}
                    >
                      <motion.div
                        initial={false}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${visual.gradientBarClass}`}
                      />
                    </div>
                  </div>
                </motion.article>
              );
            }
          )}
        </div>
      ) : (
        <div className="rounded-3xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/8 dark:border-white/10 p-8 text-center">
          <Users
            className="w-10 h-10 text-[#28A8B8] mx-auto mb-3"
            aria-hidden="true"
          />
          <p className="text-base font-semibold text-[#2D312E] dark:text-[#FAF8F5] mb-1">
            עדיין לא הוגדרו בני משפחה
          </p>
          <p className="text-sm text-[#5A605C] dark:text-[#C2CEC8] mb-4">
            הוסיפו בני משפחה באשף ההתאמה האישית כדי לשייך משימות ולצבור נקודות יחד.
          </p>
          <button
            type="button"
            onClick={onOpenWizard}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-gradient-to-l from-[#2E8B52] to-[#28A8B8] hover:opacity-95 text-white text-sm font-semibold inline-flex items-center gap-2 transition-opacity cursor-pointer"
          >
            <Award className="w-4 h-4" aria-hidden="true" />
            <span>פתח התאמה אישית</span>
          </button>
        </div>
      )}
    </section>
  );
}

