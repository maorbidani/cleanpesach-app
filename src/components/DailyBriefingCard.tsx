import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, RefreshCw, Sparkles } from 'lucide-react';
import { CleaningTask, Room } from '../types';
import { calculateRoomProgress } from '../data/mockData';

interface DailyBriefingCardProps {
  rooms: Room[];
  tasks: CleaningTask[];
  daysRemaining: number;
  overallPercentage: number;
  lockedRoomsCount: number;
  onSelectRoom: (roomId: string) => void;
}

export function DailyBriefingCard({
  rooms,
  tasks,
  daysRemaining,
  overallPercentage,
  lockedRoomsCount,
  onSelectRoom,
}: DailyBriefingCardProps) {
  const [briefing, setBriefing] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const hasAutoFetchedRef = useRef(false);

  const closestRoom = useMemo(() => {
    const openRooms = rooms
      .filter((r) => !r.isLocked)
      .map((r) => {
        const stats = calculateRoomProgress(r, tasks);
        const remaining = stats.totalCount - stats.completedCount;
        return { room: r, remaining, percentage: stats.percentage };
      })
      .filter((item) => item.remaining > 0)
      .sort((a, b) => a.remaining - b.remaining || b.percentage - a.percentage);

    return openRooms[0] ?? null;
  }, [rooms, tasks]);

  const topChametzTask = useMemo(() => {
    const open = tasks.filter((t) => {
      const room = rooms.find((r) => r.id === t.roomId);
      return !t.completed && !(room?.isLocked ?? false);
    });
    return (
      open.find((t) => t.category === 'חובת חמץ') || open[0] || null
    );
  }, [tasks, rooms]);

  const fallbackBriefing = useMemo(() => {
    if (overallPercentage === 100) {
      return 'כל הבית מוכן ונעול לפסח! זה הזמן ליהנות מהאוויר האביבי, לבדוק את ערכת בדיקת החמץ ולהתרגש לקראת ליל הסדר.';
    }
    if (closestRoom) {
      return `אתם כבר ב-${overallPercentage}% התקדמות עם ${lockedRoomsCount} חדרים נעולים! בחדר "${closestRoom.room.name}" נותרו רק ${closestRoom.remaining} משימות לסגירה — התחילו בה וצברו מומנטום מצוין להיום.`;
    }
    if (topChametzTask) {
      return `נותרו ${daysRemaining} ימים ליעד ואתם בקצב נהדר (${overallPercentage}%). משימה משתלמת במיוחד להיום: "${topChametzTask.title}".`;
    }
    return `בוקר טוב ורענן! בחרו משימה קצרה אחת להיום ותתקדמו בנחת לקראת החג.`;
  }, [
    overallPercentage,
    lockedRoomsCount,
    closestRoom,
    topChametzTask,
    daysRemaining,
  ]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchBriefing = useCallback(async () => {
    abortControllerRef.current?.abort();
    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = window.setTimeout(() => controller.abort(), 20000);

    setIsLoading(true);
    setHasError(false);

    try {
      const roomsSummary = rooms.map((r) => {
        const stats = calculateRoomProgress(r, tasks);
        return {
          name: r.name,
          isLocked: r.isLocked,
          remainingTasks: stats.totalCount - stats.completedCount,
          percentage: stats.percentage,
        };
      });

      const topOpenTasks = tasks
        .filter((t) => {
          const room = rooms.find((r) => r.id === t.roomId);
          return !t.completed && !(room?.isLocked ?? false);
        })
        .slice(0, 10)
        .map((t) => ({
          title: t.title,
          category: t.category,
          estimatedMinutes: t.estimatedMinutes,
          roomName: rooms.find((r) => r.id === t.roomId)?.name ?? 'בית',
        }));

      const res = await fetch('/api/daily-briefing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          daysRemaining,
          overallPercentage,
          lockedRoomsCount,
          totalRoomsCount: rooms.length,
          roomsSummary,
          topOpenTasks,
        }),
      });

      let data: { briefing?: string; error?: string } = {};
      try {
        data = (await res.json()) as { briefing?: string; error?: string };
      } catch {
        data = {};
      }

      if (!res.ok || !data.briefing) {
        throw new Error(data.error || 'Failed to generate briefing');
      }

      setBriefing(data.briefing);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setBriefing((prev) => prev || fallbackBriefing);
        return;
      }
      setHasError(true);
      setBriefing((prev) => prev || fallbackBriefing);
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, [
    rooms,
    tasks,
    daysRemaining,
    overallPercentage,
    lockedRoomsCount,
    fallbackBriefing,
  ]);

  useEffect(() => {
    if (!hasAutoFetchedRef.current) {
      hasAutoFetchedRef.current = true;
      void fetchBriefing();
    }
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchBriefing]);

  return (
    <section
      aria-label="התדרוך היומי שלי"
      className="rounded-[20px] bg-gradient-to-l from-[#E8F1EE] via-[#EFECE6] to-[#FAF8F5] dark:from-[#243B33] dark:via-[#273630] dark:to-[#1E2B26] border border-[#5E8C7D]/25 dark:border-[#E5C17A]/25 p-5 sm:p-6 shadow-[0_6px_20px_-6px_rgba(45,49,46,0.08)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#5E8C7D] dark:bg-[#E5C17A] text-white dark:text-[#1E2B26] flex items-center justify-center shrink-0 mt-0.5">
            <Sparkles className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base sm:text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5]">
                ✨ התדרוך היומי שלי
              </h2>
              {hasError && (
                <span className="text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8]">
                  (תצוגה מהירה)
                </span>
              )}
            </div>

            {isLoading && !briefing ? (
              <div className="space-y-2 py-1">
                <div className="h-3.5 w-72 max-w-full rounded-full bg-[#2D312E]/10 dark:bg-white/10 animate-pulse" />
                <div className="h-3.5 w-52 max-w-full rounded-full bg-[#2D312E]/10 dark:bg-white/10 animate-pulse" />
              </div>
            ) : (
              <p className="text-sm sm:text-base text-[#2D312E]/90 dark:text-[#FAF8F5]/90 leading-relaxed">
                {briefing || fallbackBriefing}
              </p>
            )}

            {closestRoom && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => onSelectRoom(closestRoom.room.id)}
                  className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#456B5E] dark:text-[#E5C17A] hover:underline cursor-pointer"
                >
                  <span>
                    עבור לחדר הקרוב לנעילה: {closestRoom.room.name} (נותרו{' '}
                    {closestRoom.remaining})
                  </span>
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => void fetchBriefing()}
          disabled={isLoading}
          aria-label="רענן תדרוך יומי"
          title="רענן תדרוך יומי"
          className="min-w-[40px] min-h-[40px] rounded-xl bg-[#FAF8F5]/80 dark:bg-[#1E2B26]/80 hover:bg-white dark:hover:bg-[#1E2B26] border border-[#2D312E]/10 dark:border-white/12 text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5] flex items-center justify-center transition-colors shrink-0 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
            aria-hidden="true"
          />
        </button>
      </div>
    </section>
  );
}
