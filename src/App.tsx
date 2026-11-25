/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Camera,
  CheckCircle2,
  Cloud,
  Mic,
  Moon,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Sun,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  INITIAL_FAMILY_MEMBERS,
  INITIAL_FINAL_PREP_ITEMS,
  INITIAL_ROOMS,
  INITIAL_TASKS,
  calculateDaysRemaining,
  calculateFamilyStats,
  calculateOverallProgress,
  generateHomeFromOnboarding,
  getDefaultTargetDateISO,
  getTaskPoints,
} from './data/mockData';
import { INITIAL_HOLIDAY_PLANNING } from './data/holidayPrepData';
import {
  BottomDockTab,
  CleaningLevel,
  CleaningTask,
  FamilyMember,
  FinalPrepItem,
  HolidayPlanningState,
  Room,
  TaskCategory,
  TimerMode,
} from './types';
import {
  FamilySyncPayload,
  FamilyWorkspaceDoc,
  createOrReplaceOwnFamilyWorkspace,
  fetchUserActiveFamilyCode,
  joinExistingFamilyWorkspace,
  saveUserActiveFamilyCode,
  signInWithGooglePopup,
  signOutFromCloud,
  subscribeToAuthState,
  subscribeToFamilyWorkspace,
  syncFamilyWorkspaceState,
} from './firebase';
import {
  BackgroundMusicTrack,
  playRoomLockFanfare,
  playTaskCompleteChime,
  setAmbientVolume,
  setSoundMuted,
  startAmbientSoundscape,
  stopAmbientSoundscape,
  subscribeToSoundscapeChange,
} from './utils/soundEngine';
import {
  matchVoiceCommand,
  speakHebrew,
  startHebrewListening,
  stopSpeaking,
} from './utils/voiceAssistant';
import { SplashScreen } from './components/SplashScreen';
import { TodayTasksSection } from './components/TodayTasksSection';
import { RoomsGridSection } from './components/RoomsGridSection';
import { RoomDetailsView } from './components/RoomDetailsView';
import { FamilySection } from './components/FamilySection';
import { FinalPrepSection } from './components/FinalPrepSection';
import { HolidayPlanningView } from './components/HolidayPlanningView';
import { BackgroundMusicControl } from './components/BackgroundMusicControl';
import { BottomDock } from './components/BottomDock';
import { LiveSederCountdown } from './components/LiveSederCountdown';
import { SederNightModal } from './components/SederNightModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { DailyBriefingCard } from './components/DailyBriefingCard';
import { PWAInstallButton } from './components/PWAInstallButton';
import { OfflineIndicator } from './components/OfflineIndicator';
import { ResetConfirmModal } from './components/ResetConfirmModal';
import { AddTaskModal } from './components/AddTaskModal';
import { OnboardingWizard } from './components/OnboardingWizard';
import { PesachAssistantChat } from './components/PesachAssistantChat';
import { CelebrationOverlay } from './components/CelebrationOverlay';
import { QuickWinModal } from './components/QuickWinModal';
import { ItemScannerModal } from './components/ItemScannerModal';
import { FamilyCertificateModal } from './components/FamilyCertificateModal';
import { ResilientImage } from './components/ResilientImage';
import { HERO_SPRING_HOME_IMAGE } from './data/visualThemes';
import {
  BREAK_DURATION_SECONDS,
  FOCUS_DURATION_SECONDS,
  FocusTimerModal,
  formatTimerSeconds,
} from './components/FocusTimerModal';

const STORAGE_KEY = 'cleanpesach_state_v3';

interface PersistedState {
  rooms: Room[];
  tasks: CleaningTask[];
  familyMembers: FamilyMember[];
  finalPrepItems: FinalPrepItem[];
  sederSimanimChecked: string[];
  targetDate: string;
  cleaningLevel: CleaningLevel;
  hasCompletedOnboarding: boolean;
  isEveningMode: boolean;
  isSoundMuted: boolean;
  musicVolumePercent?: number;
  holidayPlanning: HolidayPlanningState;
}

interface PointsToast {
  id: number;
  points: number;
  assigneeName?: string;
}

function hydrateHolidayPlanning(
  raw?: Partial<HolidayPlanningState>
): HolidayPlanningState {
  if (!raw || typeof raw !== 'object') {
    return INITIAL_HOLIDAY_PLANNING;
  }

  return {
    guests: Array.isArray(raw.guests)
      ? raw.guests
      : INITIAL_HOLIDAY_PLANNING.guests,
    dishes: Array.isArray(raw.dishes)
      ? raw.dishes
      : INITIAL_HOLIDAY_PLANNING.dishes,
    sederChecklist: Array.isArray(raw.sederChecklist)
      ? raw.sederChecklist
      : INITIAL_HOLIDAY_PLANNING.sederChecklist,
    hagalaUtensils: Array.isArray(raw.hagalaUtensils)
      ? raw.hagalaUtensils
      : INITIAL_HOLIDAY_PLANNING.hagalaUtensils,
    pesachWare: Array.isArray(raw.pesachWare)
      ? raw.pesachWare
      : INITIAL_HOLIDAY_PLANNING.pesachWare,
    shoppingItems: Array.isArray(raw.shoppingItems)
      ? raw.shoppingItems
      : INITIAL_HOLIDAY_PLANNING.shoppingItems,
    outfitsByMember:
      raw.outfitsByMember &&
      typeof raw.outfitsByMember === 'object' &&
      !Array.isArray(raw.outfitsByMember)
        ? raw.outfitsByMember
        : INITIAL_HOLIDAY_PLANNING.outfitsByMember,
    gifts: Array.isArray(raw.gifts)
      ? raw.gifts
      : INITIAL_HOLIDAY_PLANNING.gifts,
    trips: Array.isArray(raw.trips)
      ? raw.trips
      : INITIAL_HOLIDAY_PLANNING.trips,
  };
}

function loadInitialState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<PersistedState>;
      if (
        Array.isArray(parsed.rooms) &&
        Array.isArray(parsed.tasks) &&
        parsed.rooms.length > 0
      ) {
        const safeRooms = parsed.rooms.filter(
          (r): r is Room =>
            Boolean(r && typeof r.id === 'string' && typeof r.name === 'string')
        );
        const safeTasks = parsed.tasks
          .filter(
            (t): t is CleaningTask =>
              Boolean(t && typeof t.id === 'string' && typeof t.roomId === 'string')
          )
          .map((t) => ({
            ...t,
            estimatedMinutes:
              typeof t.estimatedMinutes === 'number' &&
              Number.isFinite(t.estimatedMinutes)
                ? Math.max(1, Math.round(t.estimatedMinutes))
                : 15,
          }));
        const safeTargetDate =
          typeof parsed.targetDate === 'string' &&
          /^\d{4}-\d{2}-\d{2}$/.test(parsed.targetDate)
            ? parsed.targetDate
            : getDefaultTargetDateISO();

        if (safeRooms.length > 0) {
          return {
            rooms: safeRooms,
            tasks: safeTasks,
            familyMembers: Array.isArray(parsed.familyMembers)
              ? parsed.familyMembers
              : INITIAL_FAMILY_MEMBERS,
            finalPrepItems:
              Array.isArray(parsed.finalPrepItems) &&
              parsed.finalPrepItems.length > 0
                ? parsed.finalPrepItems
                : INITIAL_FINAL_PREP_ITEMS,
            sederSimanimChecked: Array.isArray(parsed.sederSimanimChecked)
              ? parsed.sederSimanimChecked
              : [],
            targetDate: safeTargetDate,
            cleaningLevel: parsed.cleaningLevel || 'מאוזן',
            hasCompletedOnboarding: Boolean(parsed.hasCompletedOnboarding),
            isEveningMode: Boolean(parsed.isEveningMode),
            isSoundMuted: Boolean(parsed.isSoundMuted),
            musicVolumePercent:
              typeof parsed.musicVolumePercent === 'number' &&
              Number.isFinite(parsed.musicVolumePercent)
                ? Math.max(0, Math.min(100, Math.round(parsed.musicVolumePercent)))
                : 55,
            holidayPlanning: hydrateHolidayPlanning(parsed.holidayPlanning),
          };
        }
      }
    }
  } catch {
    // Ignore storage read errors and fall back to default mock data
  }

  return {
    rooms: INITIAL_ROOMS,
    tasks: INITIAL_TASKS,
    familyMembers: INITIAL_FAMILY_MEMBERS,
    finalPrepItems: INITIAL_FINAL_PREP_ITEMS,
    sederSimanimChecked: [],
    targetDate: getDefaultTargetDateISO(),
    cleaningLevel: 'מאוזן',
    hasCompletedOnboarding: false,
    isEveningMode: false,
    isSoundMuted: false,
    musicVolumePercent: 55,
    holidayPlanning: INITIAL_HOLIDAY_PLANNING,
  };
}

function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'בוקר טוב';
  if (hour >= 12 && hour < 17) return 'צהריים טובים';
  if (hour >= 17 && hour < 21) return 'ערב טוב';
  return 'לילה טוב';
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [initialState] = useState<PersistedState>(() => loadInitialState());

  const [rooms, setRooms] = useState<Room[]>(initialState.rooms);
  const [tasks, setTasks] = useState<CleaningTask[]>(initialState.tasks);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    initialState.familyMembers
  );
  const [finalPrepItems, setFinalPrepItems] = useState<FinalPrepItem[]>(
    initialState.finalPrepItems
  );
  const [sederSimanimChecked, setSederSimanimChecked] = useState<string[]>(
    initialState.sederSimanimChecked
  );
  const [targetDate, setTargetDate] = useState<string>(initialState.targetDate);
  const [cleaningLevel, setCleaningLevel] = useState<CleaningLevel>(
    initialState.cleaningLevel
  );
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(
    initialState.hasCompletedOnboarding
  );
  const [isEveningMode, setIsEveningMode] = useState<boolean>(
    initialState.isEveningMode
  );
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(
    initialState.isSoundMuted
  );
  const [musicVolumePercent, setMusicVolumePercent] = useState<number>(
    initialState.musicVolumePercent ?? 55
  );
  const [activeMusicTrack, setActiveMusicTrack] =
    useState<BackgroundMusicTrack>('none');
  const [holidayPlanning, setHolidayPlanning] = useState<HolidayPlanningState>(
    initialState.holidayPlanning
  );
  const [activeDockTab, setActiveDockTab] = useState<BottomDockTab>('home');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  // Seder Night & Cloud Sync Modals
  const [isSederModalOpen, setIsSederModalOpen] = useState(false);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // Firebase Auth & Real-Time Family Sync state
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeFamilyCode, setActiveFamilyCode] = useState<string | null>(null);
  const [cloudMemberCount, setCloudMemberCount] = useState(1);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [syncError, setSyncError] = useState('');
  const isApplyingRemoteRef = useRef(false);
  const hasLoadedRemoteSnapshotRef = useRef(false);
  const cloudSyncTimeoutRef = useRef<number | null>(null);
  const remoteApplyTimeoutRef = useRef<number | null>(null);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Hands-free Voice Assistant state
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [voiceBanner, setVoiceBanner] = useState<{
    text: string;
    isError?: boolean;
  } | null>(null);
  const [externalVoicePrompt, setExternalVoicePrompt] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const voiceStopRef = useRef<(() => void) | null>(null);
  const voiceBannerTimeoutRef = useRef<number | null>(null);

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);
  const [pointsToast, setPointsToast] = useState<PointsToast | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  // Room Lock Celebration (3 seconds)
  const [celebratingRoomName, setCelebratingRoomName] = useState<string | null>(
    null
  );
  const celebrationTimeoutRef = useRef<number | null>(null);

  // Quick Win (15 min) Modal
  const [isQuickWinOpen, setIsQuickWinOpen] = useState(false);
  const [quickWinTaskId, setQuickWinTaskId] = useState<string | null>(null);

  // Vision Item Scanner & Family Certificate Modals
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isCertificateModalOpen, setIsCertificateModalOpen] = useState(false);

  // Pomodoro Focus Timer state
  const [isTimerModalOpen, setIsTimerModalOpen] = useState(false);
  const [timerMode, setTimerMode] = useState<TimerMode>('focus');
  const [timerSecondsLeft, setTimerSecondsLeft] = useState(
    FOCUS_DURATION_SECONDS
  );
  const [customFocusDurationSeconds, setCustomFocusDurationSeconds] = useState<
    number | null
  >(null);
  const [timerTaskTitle, setTimerTaskTitle] = useState<string | undefined>(
    undefined
  );
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isEveningMode);
  }, [isEveningMode]);

  useEffect(() => {
    setSoundMuted(isSoundMuted);
    if (isSoundMuted) {
      setActiveMusicTrack('none');
    }
  }, [isSoundMuted]);

  useEffect(() => {
    setAmbientVolume(musicVolumePercent / 100);
  }, [musicVolumePercent]);

  useEffect(() => {
    return subscribeToSoundscapeChange((type) => {
      if (type === null) {
        setActiveMusicTrack('none');
      } else if (type === 'spring' || type === 'piano' || type === 'rain') {
        setActiveMusicTrack(type);
      }
    });
  }, []);

  useEffect(() => {
    try {
      const stateToSave: PersistedState = {
        rooms,
        tasks,
        familyMembers,
        finalPrepItems,
        sederSimanimChecked,
        targetDate,
        cleaningLevel,
        hasCompletedOnboarding,
        isEveningMode,
        isSoundMuted,
        musicVolumePercent,
        holidayPlanning,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    } catch {
      // Ignore storage write errors
    }
  }, [
    rooms,
    tasks,
    familyMembers,
    finalPrepItems,
    sederSimanimChecked,
    targetDate,
    cleaningLevel,
    hasCompletedOnboarding,
    isEveningMode,
    isSoundMuted,
    musicVolumePercent,
    holidayPlanning,
  ]);

  const applyRemoteWorkspace = useCallback((workspace: FamilyWorkspaceDoc) => {
    isApplyingRemoteRef.current = true;
    if (Array.isArray(workspace.rooms) && workspace.rooms.length > 0) {
      setRooms(workspace.rooms);
    }
    if (Array.isArray(workspace.tasks)) {
      setTasks(workspace.tasks);
    }
    if (
      Array.isArray(workspace.familyMembers) &&
      workspace.familyMembers.length > 0
    ) {
      setFamilyMembers(workspace.familyMembers);
    }
    if (Array.isArray(workspace.finalPrepItems)) {
      setFinalPrepItems(workspace.finalPrepItems);
    }
    if (Array.isArray(workspace.sederSimanimChecked)) {
      setSederSimanimChecked(workspace.sederSimanimChecked);
    }
    if (workspace.targetDate) {
      setTargetDate(workspace.targetDate);
    }
    if (workspace.cleaningLevel) {
      setCleaningLevel(workspace.cleaningLevel);
    }
    if (workspace.holidayPlanning) {
      setHolidayPlanning(hydrateHolidayPlanning(workspace.holidayPlanning));
    }
    setCloudMemberCount(
      Array.isArray(workspace.memberUids) ? workspace.memberUids.length : 1
    );
    hasLoadedRemoteSnapshotRef.current = true;

    if (remoteApplyTimeoutRef.current) {
      window.clearTimeout(remoteApplyTimeoutRef.current);
    }
    remoteApplyTimeoutRef.current = window.setTimeout(() => {
      remoteApplyTimeoutRef.current = null;
      isApplyingRemoteRef.current = false;
    }, 60);
  }, []);

  // Subscribe to Firebase Auth state
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCloudUser(user);
      setIsAuthReady(true);

      if (!user) {
        setActiveFamilyCode(null);
        hasLoadedRemoteSnapshotRef.current = false;
        return;
      }

      void fetchUserActiveFamilyCode(user.uid)
        .then((code) => {
          setActiveFamilyCode(code);
        })
        .catch(() => {
          // Ignore initial lookup failure
        });
    });

    return () => unsubscribe();
  }, []);

  // Attach real-time Firestore listener ONLY when authenticated and joined to a family code
  useEffect(() => {
    if (!isAuthReady || !cloudUser || !activeFamilyCode) {
      hasLoadedRemoteSnapshotRef.current = false;
      return;
    }

    setSyncError('');
    const unsubscribe = subscribeToFamilyWorkspace(
      activeFamilyCode,
      (workspace) => {
        applyRemoteWorkspace(workspace);
      },
      (err) => {
        setSyncError('אבד הקשר לסנכרון הענן. בדקו חיבור או קוד משפחה.');
        console.error(err);
      }
    );

    return () => unsubscribe();
  }, [isAuthReady, cloudUser, activeFamilyCode, applyRemoteWorkspace]);

  // Push local changes to Firestore in real time when synced
  useEffect(() => {
    if (
      !isAuthReady ||
      !cloudUser ||
      !activeFamilyCode ||
      !hasLoadedRemoteSnapshotRef.current ||
      isApplyingRemoteRef.current
    ) {
      return;
    }

    if (cloudSyncTimeoutRef.current) {
      window.clearTimeout(cloudSyncTimeoutRef.current);
    }

    const payload: FamilySyncPayload = {
      rooms,
      tasks,
      familyMembers,
      finalPrepItems,
      sederSimanimChecked,
      targetDate,
      cleaningLevel,
      holidayPlanning,
    };

    cloudSyncTimeoutRef.current = window.setTimeout(() => {
      setIsSyncingCloud(true);
      void syncFamilyWorkspaceState(activeFamilyCode, cloudUser.uid, payload)
        .then(() => {
          setSyncError('');
        })
        .catch(() => {
          setSyncError('שמירת העדכון לענן נכשלה. הנתונים שמורים מקומית.');
        })
        .finally(() => {
          setIsSyncingCloud(false);
        });
    }, 450);

    return () => {
      if (cloudSyncTimeoutRef.current) {
        window.clearTimeout(cloudSyncTimeoutRef.current);
      }
    };
  }, [
    isAuthReady,
    cloudUser,
    activeFamilyCode,
    rooms,
    tasks,
    familyMembers,
    finalPrepItems,
    sederSimanimChecked,
    targetDate,
    cleaningLevel,
    holidayPlanning,
  ]);

  // Countdown tick effect
  useEffect(() => {
    if (!isTimerRunning) return;

    const intervalId = window.setInterval(() => {
      setTimerSecondsLeft((prev) => {
        if (prev <= 1) {
          setIsTimerRunning(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isTimerRunning]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      if (celebrationTimeoutRef.current) {
        window.clearTimeout(celebrationTimeoutRef.current);
      }
      if (voiceBannerTimeoutRef.current) {
        window.clearTimeout(voiceBannerTimeoutRef.current);
      }
      if (remoteApplyTimeoutRef.current) {
        window.clearTimeout(remoteApplyTimeoutRef.current);
      }
      if (cloudSyncTimeoutRef.current) {
        window.clearTimeout(cloudSyncTimeoutRef.current);
      }
      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }
      voiceStopRef.current?.();
      stopSpeaking();
      stopAmbientSoundscape();
    };
  }, []);

  const showVoiceBanner = useCallback((text: string, isError = false) => {
    if (voiceBannerTimeoutRef.current) {
      window.clearTimeout(voiceBannerTimeoutRef.current);
    }
    setVoiceBanner({ text, isError });
    voiceBannerTimeoutRef.current = window.setTimeout(() => {
      setVoiceBanner(null);
    }, 4500);
  }, []);

  const showPointsFeedback = useCallback(
    (points: number, assigneeName?: string) => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      setPointsToast({
        id: Date.now(),
        points,
        assigneeName,
      });
      toastTimeoutRef.current = window.setTimeout(() => {
        setPointsToast(null);
      }, 2600);
    },
    []
  );

  const triggerRoomCelebration = useCallback((roomName: string) => {
    if (celebrationTimeoutRef.current) {
      window.clearTimeout(celebrationTimeoutRef.current);
    }
    setCelebratingRoomName(roomName);
    celebrationTimeoutRef.current = window.setTimeout(() => {
      setCelebratingRoomName(null);
    }, 3000);
  }, []);

  const handleCompleteSplash = useCallback(() => {
    setShowSplash(false);
    if (!hasCompletedOnboarding) {
      setIsWizardOpen(true);
    }
  }, [hasCompletedOnboarding]);

  const handleToggleTask = useCallback(
    (taskId: string) => {
      const targetTask = tasks.find((t) => t.id === taskId);
      if (targetTask && !targetTask.completed) {
        const pts = getTaskPoints(targetTask.category);
        const memberName = familyMembers.find(
          (m) => m.id === targetTask.assignedToId
        )?.name;
        showPointsFeedback(pts, memberName);
        playTaskCompleteChime();
      }

      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, completed: !task.completed } : task
        )
      );
    },
    [tasks, familyMembers, showPointsFeedback]
  );

  const handleAssignTask = useCallback(
    (taskId: string, memberId: string | null) => {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, assignedToId: memberId } : task
        )
      );
    },
    []
  );

  const handleToggleRoomLock = useCallback(
    (roomId: string) => {
      const targetRoom = rooms.find((r) => r.id === roomId);
      if (targetRoom && !targetRoom.isLocked) {
        triggerRoomCelebration(targetRoom.name);
        playRoomLockFanfare();
      }

      setRooms((prev) =>
        prev.map((room) =>
          room.id === roomId ? { ...room, isLocked: !room.isLocked } : room
        )
      );
    },
    [rooms, triggerRoomCelebration]
  );

  const handleSelectRoom = useCallback((roomId: string) => {
    setActiveDockTab('home');
    setSelectedRoomId(roomId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBackToRooms = useCallback(() => {
    setActiveDockTab('home');
    setSelectedRoomId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectDockTab = useCallback((tab: BottomDockTab) => {
    if (tab === 'assistant') {
      setIsAssistantOpen((prev) => !prev);
      return;
    }

    setIsAssistantOpen(false);
    setActiveDockTab(tab);
    setSelectedRoomId(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleJumpToDashboardSection = useCallback(
    (sectionId: string) => {
      const needsViewSwitch =
        activeDockTab !== 'home' || selectedRoomId !== null;
      setIsAssistantOpen(false);
      setActiveDockTab('home');
      setSelectedRoomId(null);

      if (scrollTimeoutRef.current) {
        window.clearTimeout(scrollTimeoutRef.current);
      }

      const scrollTarget = () => {
        document
          .getElementById(sectionId)
          ?.scrollIntoView({ behavior: 'smooth' });
      };

      if (needsViewSwitch) {
        scrollTimeoutRef.current = window.setTimeout(scrollTarget, 240);
      } else {
        scrollTarget();
      }
    },
    [activeDockTab, selectedRoomId]
  );

  const handleAddTask = useCallback(
    ({
      title,
      category,
      estimatedMinutes,
    }: {
      title: string;
      category: TaskCategory;
      estimatedMinutes: number;
    }) => {
      if (!selectedRoomId) return;

      const defaultTip =
        category === 'חובת חמץ'
          ? 'רוקנו ונקו היטב פינות, חריצים ומסילות משאריות ופירורים. סיימו בניגוב עם מטלית לחה נקייה.'
          : 'אווררו את האזור היטב, הסירו אבק מלמעלה למטה עם מטלית מיקרופייבר והשלימו בניגוב יבש.';

      const defaultSupplies =
        category === 'חובת חמץ'
          ? ['שואב אבק ידני', 'מטלית לחה', 'מברשת קטנה לפינות']
          : ['מטלית מיקרופייבר', 'נוזל ניקוי כללי', 'מטלית יבשה להברקה'];

      const newTask: CleaningTask = {
        id: `t-custom-${Date.now()}`,
        roomId: selectedRoomId,
        title,
        estimatedMinutes,
        category,
        completed: false,
        cleaningTip: defaultTip,
        recommendedSupplies: defaultSupplies,
        isCustom: true,
        assignedToId: familyMembers[0]?.id ?? null,
      };

      setTasks((prev) => [newTask, ...prev]);

      setRooms((prev) =>
        prev.map((room) =>
          room.id === selectedRoomId && room.isLocked
            ? { ...room, isLocked: false }
            : room
        )
      );
    },
    [selectedRoomId, familyMembers]
  );

  const handleToggleFinalPrepItem = useCallback((itemId: string) => {
    setFinalPrepItems((prev) =>
      prev.map((item) =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  }, []);

  const shortOpenTasks = useMemo(() => {
    return tasks.filter((task) => {
      const room = rooms.find((r) => r.id === task.roomId);
      return (
        !task.completed &&
        !(room?.isLocked ?? false) &&
        task.estimatedMinutes <= 20
      );
    });
  }, [tasks, rooms]);

  const pickRandomShortTask = useCallback(
    (excludeId?: string | null) => {
      const pool =
        shortOpenTasks.length > 1 && excludeId
          ? shortOpenTasks.filter((t) => t.id !== excludeId)
          : shortOpenTasks;

      if (pool.length === 0) {
        setQuickWinTaskId(null);
        return;
      }

      const randomIndex = Math.floor(Math.random() * pool.length);
      setQuickWinTaskId(pool[randomIndex].id);
    },
    [shortOpenTasks]
  );

  const handleOpenQuickWin = useCallback(() => {
    pickRandomShortTask(null);
    setIsQuickWinOpen(true);
  }, [pickRandomShortTask]);

  const handleStartTimerForTask = useCallback((task: CleaningTask) => {
    const durationSecs = task.estimatedMinutes * 60;
    setTimerMode('focus');
    setCustomFocusDurationSeconds(durationSecs);
    setTimerSecondsLeft(durationSecs);
    setTimerTaskTitle(task.title);
    setIsTimerRunning(true);
    setIsQuickWinOpen(false);
    setIsTimerModalOpen(true);
  }, []);

  const handleOpenDefaultTimer = useCallback(() => {
    if (!isTimerRunning) {
      setCustomFocusDurationSeconds(null);
      setTimerTaskTitle(undefined);
      if (timerMode === 'focus' && timerSecondsLeft === 0) {
        setTimerSecondsLeft(FOCUS_DURATION_SECONDS);
      }
    }
    setIsTimerModalOpen(true);
  }, [isTimerRunning, timerMode, timerSecondsLeft]);

  const handleFinishWizard = useCallback(
    (result: {
      selectedStandardRoomIds: string[];
      customRooms: Room[];
      familyMembers: FamilyMember[];
      targetDate: string;
      cleaningLevel: CleaningLevel;
    }) => {
      const generated = generateHomeFromOnboarding({
        selectedStandardRoomIds: result.selectedStandardRoomIds,
        customRooms: result.customRooms,
        cleaningLevel: result.cleaningLevel,
        familyMembers: result.familyMembers,
      });

      setRooms(generated.rooms);
      setTasks(generated.tasks);
      setFamilyMembers(result.familyMembers);
      setTargetDate(result.targetDate);
      setCleaningLevel(result.cleaningLevel);
      setHasCompletedOnboarding(true);
      setSelectedRoomId(null);
      setIsWizardOpen(false);
    },
    []
  );

  const handleSkipWizardToDefaults = useCallback(() => {
    setHasCompletedOnboarding(true);
    setIsWizardOpen(false);
  }, []);

  const handleConfirmReset = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('cleanpesach_seder_city_v1');
    } catch {
      // Ignore storage removal errors
    }

    setRooms(INITIAL_ROOMS.map((room) => ({ ...room, isLocked: false })));
    setTasks(
      INITIAL_TASKS.map((task) => ({
        ...task,
        completed: false,
        assignedToId: null,
      }))
    );
    setFamilyMembers(INITIAL_FAMILY_MEMBERS);
    setFinalPrepItems(
      INITIAL_FINAL_PREP_ITEMS.map((item) => ({ ...item, completed: false }))
    );
    setSederSimanimChecked([]);
    setTargetDate(getDefaultTargetDateISO());
    setCleaningLevel('מאוזן');
    setHasCompletedOnboarding(true);
    setHolidayPlanning({
      guests: INITIAL_HOLIDAY_PLANNING.guests.map((g) => ({
        ...g,
        confirmed: false,
      })),
      dishes: INITIAL_HOLIDAY_PLANNING.dishes.map((d) => ({
        ...d,
        ready: false,
      })),
      sederChecklist: INITIAL_HOLIDAY_PLANNING.sederChecklist.map((c) => ({
        ...c,
        checked: false,
      })),
      hagalaUtensils: INITIAL_HOLIDAY_PLANNING.hagalaUtensils.map((u) => ({
        ...u,
        completed: false,
      })),
      pesachWare: INITIAL_HOLIDAY_PLANNING.pesachWare.map((w) => ({
        ...w,
        unpacked: false,
        missing: false,
      })),
      shoppingItems: INITIAL_HOLIDAY_PLANNING.shoppingItems.map((s) => ({
        ...s,
        bought: false,
      })),
      outfitsByMember: {},
      gifts: INITIAL_HOLIDAY_PLANNING.gifts.map((g) => ({
        ...g,
        purchased: false,
      })),
      trips: INITIAL_HOLIDAY_PLANNING.trips.map((t) => ({
        ...t,
        ready: false,
      })),
    });

    setIsTimerRunning(false);
    setTimerMode('focus');
    setCustomFocusDurationSeconds(null);
    setTimerSecondsLeft(FOCUS_DURATION_SECONDS);
    setTimerTaskTitle(undefined);
    setIsTimerModalOpen(false);
    stopAmbientSoundscape(true, true);
    setActiveMusicTrack('none');

    voiceStopRef.current?.();
    voiceStopRef.current = null;
    setIsVoiceListening(false);
    setVoiceBanner(null);
    stopSpeaking();

    setActiveDockTab('home');
    setIsAssistantOpen(false);
    setSelectedRoomId(null);
    setIsAddTaskModalOpen(false);
    setIsQuickWinOpen(false);
    setIsScannerModalOpen(false);
    setIsCertificateModalOpen(false);
    setIsSederModalOpen(false);
    setIsResetModalOpen(false);
    setPointsToast(null);
    setCelebratingRoomName(null);
  }, []);

  const handleToggleSiman = useCallback((simanId: string) => {
    setSederSimanimChecked((prev) =>
      prev.includes(simanId)
        ? prev.filter((id) => id !== simanId)
        : [...prev, simanId]
    );
  }, []);

  const handleResetSimanim = useCallback(() => {
    setSederSimanimChecked([]);
  }, []);

  const handleSignInGoogle = useCallback(async () => {
    await signInWithGooglePopup();
  }, []);

  const handleSignOutCloud = useCallback(async () => {
    if (cloudSyncTimeoutRef.current) {
      window.clearTimeout(cloudSyncTimeoutRef.current);
      cloudSyncTimeoutRef.current = null;
    }
    await signOutFromCloud();
    setActiveFamilyCode(null);
    setSyncError('');
  }, []);

  const handleCreateCloudFamily = useCallback(
    async (code: string) => {
      if (!cloudUser) return;
      const currentPayload: FamilySyncPayload = {
        rooms,
        tasks,
        familyMembers,
        finalPrepItems,
        sederSimanimChecked,
        targetDate,
        cleaningLevel,
        holidayPlanning,
      };
      await createOrReplaceOwnFamilyWorkspace(
        code,
        cloudUser.uid,
        currentPayload
      );
      await saveUserActiveFamilyCode(
        cloudUser.uid,
        cloudUser.displayName || 'בן משפחה',
        code
      );
      hasLoadedRemoteSnapshotRef.current = true;
      setActiveFamilyCode(code);
    },
    [
      cloudUser,
      rooms,
      tasks,
      familyMembers,
      finalPrepItems,
      sederSimanimChecked,
      targetDate,
      cleaningLevel,
      holidayPlanning,
    ]
  );

  const handleJoinCloudFamily = useCallback(
    async (code: string) => {
      if (!cloudUser) return;
      const workspace = await joinExistingFamilyWorkspace(code, cloudUser.uid);
      applyRemoteWorkspace(workspace);
      await saveUserActiveFamilyCode(
        cloudUser.uid,
        cloudUser.displayName || 'בן משפחה',
        code
      );
      setActiveFamilyCode(code);
    },
    [cloudUser, applyRemoteWorkspace]
  );

  const handleLeaveCloudFamily = useCallback(async () => {
    if (!cloudUser) return;
    if (cloudSyncTimeoutRef.current) {
      window.clearTimeout(cloudSyncTimeoutRef.current);
      cloudSyncTimeoutRef.current = null;
    }
    await saveUserActiveFamilyCode(
      cloudUser.uid,
      cloudUser.displayName || 'בן משפחה',
      ''
    );
    setActiveFamilyCode(null);
    setSyncError('');
  }, [cloudUser]);

  const handleToggleDockVoice = useCallback(() => {
    if (isVoiceListening) {
      voiceStopRef.current?.();
      voiceStopRef.current = null;
      setIsVoiceListening(false);
      setVoiceBanner(null);
      return;
    }

    stopSpeaking();
    stopAmbientSoundscape(true, true);
    setActiveMusicTrack('none');
    setIsVoiceListening(true);
    setVoiceBanner({ text: 'מקשיב בעברית... אמרו משימה שבוצעה או שאלו שאלה' });

    voiceStopRef.current = startHebrewListening({
      onInterim: (interim) => {
        setVoiceBanner({ text: `שומע: "${interim}"` });
      },
      onResult: (transcript) => {
        setIsVoiceListening(false);
        const matched = matchVoiceCommand(transcript, tasks, rooms);

        if (matched?.type === 'complete_task') {
          handleToggleTask(matched.task.id);
          const reply = `כל הכבוד! המשימה "${matched.task.title}" סומנה כבוצעה.`;
          showVoiceBanner(reply);
          speakHebrew(reply);
          return;
        }

        if (matched?.type === 'lock_room') {
          handleToggleRoomLock(matched.room.id);
          const reply = `כל הכבוד! ${matched.room.name} ננעל כנקי מחמץ.`;
          showVoiceBanner(reply);
          speakHebrew(reply);
          return;
        }

        // Open Gemini Pesach Assistant for general questions & read aloud
        showVoiceBanner(`מעביר לעוזר הפסח: "${transcript}"`);
        setIsAssistantOpen(true);
        setExternalVoicePrompt({ id: Date.now(), text: transcript });
      },
      onError: (msg) => {
        setIsVoiceListening(false);
        showVoiceBanner(msg, true);
      },
      onEnd: () => {
        setIsVoiceListening(false);
      },
    });
  }, [
    isVoiceListening,
    tasks,
    rooms,
    handleToggleTask,
    handleToggleRoomLock,
    showVoiceBanner,
  ]);

  const handleToggleTimerRunning = useCallback(() => {
    const activeFocusSecs =
      customFocusDurationSeconds ?? FOCUS_DURATION_SECONDS;

    setIsTimerRunning((prev) => {
      if (!prev && timerSecondsLeft === 0) {
        setTimerSecondsLeft(
          timerMode === 'focus' ? activeFocusSecs : BREAK_DURATION_SECONDS
        );
      }
      return !prev;
    });
  }, [timerMode, timerSecondsLeft, customFocusDurationSeconds]);

  const handleResetTimer = useCallback(() => {
    const activeFocusSecs =
      customFocusDurationSeconds ?? FOCUS_DURATION_SECONDS;
    setIsTimerRunning(false);
    setTimerSecondsLeft(
      timerMode === 'focus' ? activeFocusSecs : BREAK_DURATION_SECONDS
    );
  }, [timerMode, customFocusDurationSeconds]);

  const handleSwitchTimerMode = useCallback(
    (mode: TimerMode) => {
      const activeFocusSecs =
        customFocusDurationSeconds ?? FOCUS_DURATION_SECONDS;
      setIsTimerRunning(false);
      setTimerMode(mode);
      setTimerSecondsLeft(
        mode === 'focus' ? activeFocusSecs : BREAK_DURATION_SECONDS
      );
    },
    [customFocusDurationSeconds]
  );

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.isToday).slice(0, 3),
    [tasks]
  );

  const overallStats = useMemo(
    () => calculateOverallProgress(rooms, tasks),
    [rooms, tasks]
  );

  // Auto-pop Family Certificate once when overall progress transitions to 100%
  const prevPercentageRef = useRef<number>(overallStats.percentage);
  useEffect(() => {
    if (
      prevPercentageRef.current < 100 &&
      overallStats.percentage === 100 &&
      rooms.length > 0
    ) {
      setIsCertificateModalOpen(true);
    }
    prevPercentageRef.current = overallStats.percentage;
  }, [overallStats.percentage, rooms.length]);

  const familyStats = useMemo(
    () => calculateFamilyStats(familyMembers, tasks),
    [familyMembers, tasks]
  );

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId]
  );

  const quickWinTask = useMemo(
    () => tasks.find((t) => t.id === quickWinTaskId) ?? null,
    [tasks, quickWinTaskId]
  );

  const quickWinRoom = useMemo(
    () =>
      quickWinTask
        ? rooms.find((r) => r.id === quickWinTask.roomId) ?? null
        : null,
    [quickWinTask, rooms]
  );

  const daysRemaining = useMemo(
    () => calculateDaysRemaining(targetDate),
    [targetDate]
  );

  const greeting = getTimeGreeting();
  const timerFormatted = formatTimerSeconds(timerSecondsLeft);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#FAF8F5] dark:bg-[#1E2B26] text-[#2D312E] dark:text-[#FAF8F5] flex flex-col transition-colors duration-300"
    >
      <AnimatePresence mode="wait">
        {showSplash && (
          <SplashScreen key="splash" onComplete={handleCompleteSplash} />
        )}
      </AnimatePresence>

      {/* Celebratory 3-Second Room Lock Overlay */}
      <CelebrationOverlay roomName={celebratingRoomName} />

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/90 dark:bg-[#1E2B26]/90 backdrop-blur-md border-b border-[#2D312E]/8 dark:border-white/10 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-2.5 sm:px-6 h-16 flex items-center justify-between gap-1.5 sm:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <button
            type="button"
            onClick={handleBackToRooms}
            className="font-display text-lg sm:text-2xl font-bold text-[#2D312E] dark:text-[#FAF8F5] tracking-tight whitespace-nowrap shrink-0 cursor-pointer"
          >
            קליןפסח
          </button>

          {/* Zone 2: Concise Single-Line Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#5A605C] dark:text-[#C2CEC8]"
            aria-label="ניווט ראשי"
          >
            <button
              type="button"
              onClick={handleBackToRooms}
              className="hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:underline underline-offset-8 decoration-[#5E8C7D] dark:decoration-[#E5C17A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              סקירה כללית
            </button>
            <button
              type="button"
              onClick={() => handleJumpToDashboardSection('today-tasks')}
              className="hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:underline underline-offset-8 decoration-[#5E8C7D] dark:decoration-[#E5C17A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              המשימות להיום
            </button>
            <button
              type="button"
              onClick={() => handleJumpToDashboardSection('rooms-map')}
              className="hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:underline underline-offset-8 decoration-[#5E8C7D] dark:decoration-[#E5C17A] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              מפת החדרים
            </button>
            <button
              type="button"
              onClick={() => handleSelectDockTab('planning')}
              className={`hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:underline underline-offset-8 decoration-[#5E8C7D] dark:decoration-[#E5C17A] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeDockTab === 'planning'
                  ? 'text-[#5E8C7D] dark:text-[#E5C17A] font-semibold'
                  : ''
              }`}
            >
              התארגנות לחג
            </button>
            <button
              type="button"
              onClick={() => handleSelectDockTab('family')}
              className={`hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:underline underline-offset-8 decoration-[#5E8C7D] dark:decoration-[#E5C17A] transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeDockTab === 'family'
                  ? 'text-[#5E8C7D] dark:text-[#E5C17A] font-semibold'
                  : ''
              }`}
            >
              המשפחה שלנו
            </button>
          </nav>

          {/* Zone 3: PWA Install, Sound Mute, Cloud Sync, Theme Toggle & Home Customization */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <PWAInstallButton />

            <button
              type="button"
              onClick={() => setIsSoundMuted((prev) => !prev)}
              aria-pressed={isSoundMuted}
              aria-label={isSoundMuted ? 'הפעל צלילי אפליקציה' : 'השתק צלילי אפליקציה'}
              title={isSoundMuted ? 'צלילים מושתקים' : 'צלילי משימות פעילים'}
              className="inline-flex items-center justify-center min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D7] dark:hover:bg-[#31443D] border border-[#2D312E]/10 dark:border-white/12 text-[#2D312E] dark:text-[#FAF8F5] transition-colors shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] dark:focus-visible:ring-[#E5C17A]"
            >
              {isSoundMuted ? (
                <VolumeX className="w-4 h-4 text-[#5A605C] dark:text-[#C2CEC8]" aria-hidden="true" />
              ) : (
                <Volume2 className="w-4 h-4 text-[#5E8C7D] dark:text-[#E5C17A]" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsCloudSyncModalOpen(true)}
              aria-label="סנכרון משפחתי בענן"
              title={
                activeFamilyCode
                  ? `מחובר למשפחה: ${activeFamilyCode}`
                  : 'התחבר לסנכרון משפחתי בענן'
              }
              className={`relative inline-flex items-center justify-center gap-1.5 min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] px-2 sm:px-3 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] dark:focus-visible:ring-[#E5C17A] ${
                activeFamilyCode
                  ? 'bg-[#E1ECE8] dark:bg-[#243E35] border-[#5E8C7D]/35 text-[#3D6357] dark:text-[#E5C17A]'
                  : 'bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D7] dark:hover:bg-[#31443D] border-[#2D312E]/10 dark:border-white/12 text-[#2D312E] dark:text-[#FAF8F5]'
              }`}
            >
              <Cloud className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden md:inline">
                {activeFamilyCode ? 'מסונכרן' : 'סנכרון ענן'}
              </span>
              {activeFamilyCode && (
                <span className="w-2 h-2 rounded-full bg-[#5E8C7D] dark:bg-[#E5C17A]" />
              )}
            </button>

            <BackgroundMusicControl
              activeTrack={activeMusicTrack}
              volumePercent={musicVolumePercent}
              onSelectTrack={(track) => {
                if (track === 'none') {
                  stopAmbientSoundscape();
                  setActiveMusicTrack('none');
                  return;
                }
                if (isSoundMuted) {
                  setIsSoundMuted(false);
                  setSoundMuted(false);
                }
                setAmbientVolume(musicVolumePercent / 100);
                startAmbientSoundscape(track);
                setActiveMusicTrack(track);
              }}
              onChangeVolume={(percent) => {
                setMusicVolumePercent(percent);
                setAmbientVolume(percent / 100);
              }}
            />

            <button
              type="button"
              onClick={() => setIsEveningMode((prev) => !prev)}
              aria-pressed={isEveningMode}
              aria-label={
                isEveningMode ? 'מעבר למצב יום בהיר' : 'מעבר למצב ערב רגוע'
              }
              className="inline-flex items-center justify-center gap-1.5 min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] px-2 sm:px-3 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D7] dark:hover:bg-[#31443D] border border-[#2D312E]/10 dark:border-white/12 text-[#2D312E] dark:text-[#E5C17A] text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] dark:focus-visible:ring-[#E5C17A]"
            >
              {isEveningMode ? (
                <>
                  <Sun className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden md:inline">מצב יום</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span className="hidden md:inline">מצב ערב</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsWizardOpen(true)}
              aria-label="התאמה אישית לבית"
              className="inline-flex items-center justify-center gap-1.5 min-w-[38px] min-h-[38px] sm:min-w-[40px] sm:min-h-[40px] px-2.5 sm:px-3.5 py-2 rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] text-white text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5E8C7D] dark:focus-visible:ring-[#E5C17A]"
            >
              <SlidersHorizontal className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">התאמה אישית</span>
            </button>
          </div>
        </div>
      </header>

      <OfflineIndicator />

      {/* Main Content Area: Dashboard, Room Details, Holiday Planning, or Family */}
      <main
        id="overview"
        className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-7 sm:py-10 pb-28"
      >
        <AnimatePresence mode="wait">
          {activeDockTab === 'planning' ? (
            <HolidayPlanningView
              key="holiday-planning"
              planning={holidayPlanning}
              familyMembers={familyMembers}
              onUpdatePlanning={setHolidayPlanning}
            />
          ) : activeDockTab === 'family' ? (
            <motion.div
              key="family-tab"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handleBackToRooms}
                  className="inline-flex items-center gap-2 min-h-[42px] px-3.5 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D7] dark:hover:bg-[#31443D] text-[#2D312E] dark:text-[#FAF8F5] text-sm font-semibold transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>חזרה לבית שלי</span>
                </button>
                <span className="text-xs sm:text-sm font-semibold text-[#5E8C7D] dark:text-[#E5C17A] tabular-nums">
                  {overallStats.percentage}% התקדמות כללית בבית
                </span>
              </div>

              <FamilySection
                members={familyMembers}
                tasks={tasks}
                activeFamilyCode={activeFamilyCode}
                onOpenWizard={() => setIsWizardOpen(true)}
                onOpenCertificate={() => setIsCertificateModalOpen(true)}
                onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
              />
            </motion.div>
          ) : selectedRoom ? (
            <RoomDetailsView
              key={selectedRoom.id}
              room={selectedRoom}
              tasks={tasks}
              familyMembers={familyMembers}
              onBack={handleBackToRooms}
              onToggleTask={handleToggleTask}
              onAssignTask={handleAssignTask}
              onToggleLock={handleToggleRoomLock}
              onOpenAddTask={() => setIsAddTaskModalOpen(true)}
              onOpenTimer={handleOpenDefaultTimer}
              isTimerRunning={isTimerRunning}
              timerFormatted={timerFormatted}
            />
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-10 sm:space-y-12"
            >
              {/* Top Hero Summary: Greeting, Spring Banner, Countdown, Quick Win CTA, Overall Progress */}
              <section
                aria-label="מצב התקדמות כללי"
                className="rounded-[24px] bg-gradient-to-br from-[#FFF9F0] via-[#EFECE6] to-[#E6F4EE] dark:from-[#273630] dark:via-[#22302B] dark:to-[#1C2A24] border border-[#E6B87A]/35 dark:border-white/12 p-6 sm:p-8 shadow-[0_10px_30px_-8px_rgba(45,49,46,0.1)] dark:shadow-[0_14px_32px_-10px_rgba(0,0,0,0.45)] transition-colors duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-10">
                  {/* Greeting, Hero Spring Visual Banner & Quick Win Buttons */}
                  <div className="flex-1 min-w-0 space-y-4">
                    <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-[#3C6E5B] dark:text-[#7CE4F0]">
                      <span className="inline-flex items-center gap-2">
                        <Calendar
                          className="w-4 h-4 text-[#28A8B8] dark:text-[#7CE4F0]"
                          aria-hidden="true"
                        />
                        <span className="tabular-nums">
                          נותרו {daysRemaining} ימים לבדיקת חמץ
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="text-[#5A605C] dark:text-[#9AA8A2]"
                      >
                        ·
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#2D312E] dark:text-[#FAF8F5] tabular-nums">
                        <Star
                          className="w-4 h-4 text-[#F29F3D] dark:text-[#FFD86B] fill-[#F29F3D] dark:fill-[#FFD86B]"
                          aria-hidden="true"
                        />
                        {familyStats.totalPoints} נקודות משפחתיות
                      </span>
                    </div>

                    <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#2D312E] dark:text-[#FAF8F5] leading-tight text-balance">
                      {greeting}, מתכוננים לפסח בנחת
                    </h1>

                    <p className="text-sm sm:text-base text-[#5A605C] dark:text-[#C2CEC8] max-w-xl leading-relaxed">
                      תוכנית הבית ברמת ניקיון &quot;{cleaningLevel}&quot; — כל משימה שמסומנת מעדכנת מיד את החדר, ההתקדמות הכללית והנקודות המשפחתיות.
                    </p>

                    {/* Wide Vibrant Spring Hero Visual Banner */}
                    <div className="relative h-44 sm:h-56 rounded-[20px] overflow-hidden border border-[#E6B87A]/40 dark:border-white/15 shadow-[0_12px_28px_-10px_rgba(45,49,46,0.22)] group">
                      <ResilientImage
                        src={HERO_SPRING_HOME_IMAGE}
                        alt="בית ישראלי מואר, שולחן חג חגיגי ופרחי אביב לקראת פסח"
                        fallbackGradient="from-[#FFE5B8] via-[#FCE6D8] to-[#C8E8DC]"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-l from-[#1A2B23]/80 via-[#254437]/42 to-[#D97A3C]/20"
                        aria-hidden="true"
                      />
                      <div className="relative z-10 h-full flex flex-col justify-end p-4 sm:p-6">
                        <div className="max-w-md space-y-1.5">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FFE39A] tracking-wide">
                            <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>אביב הגיע, פסח בא</span>
                          </span>
                          <p className="font-display text-lg sm:text-2xl font-bold text-white leading-snug drop-shadow-xs">
                            מכניסים אור, פריחה ושמחה לכל פינה בבית
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Quick Win & AI Scanner Buttons */}
                    <div className="pt-1 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleOpenQuickWin}
                        className="inline-flex items-center gap-2 min-h-[46px] px-5 py-2.5 rounded-xl bg-gradient-to-l from-[#28A8B8] to-[#3B9BD4] hover:from-[#2195A4] hover:to-[#2F87BF] text-white text-sm sm:text-base font-bold shadow-[0_6px_18px_-4px_rgba(40,168,184,0.45)] hover:-translate-y-0.5 transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D312E] dark:focus-visible:ring-[#E5C17A]"
                      >
                        <Zap className="w-4 h-4 shrink-0" aria-hidden="true" />
                        <span>⚡ יש לי 15 דקות פנויות</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsScannerModalOpen(true)}
                        className="inline-flex items-center gap-2 min-h-[46px] px-5 py-2.5 rounded-xl bg-[#FFFDF9] dark:bg-[#1E2B26] hover:bg-white dark:hover:bg-[#24352F] border border-[#E69A54]/40 dark:border-[#E5C17A]/30 text-[#2D312E] dark:text-[#FAF8F5] text-sm sm:text-base font-bold shadow-[0_6px_16px_-6px_rgba(230,154,84,0.22)] hover:-translate-y-0.5 transition-all duration-150 cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D96934] dark:focus-visible:ring-[#E5C17A]"
                      >
                        <Camera
                          className="w-4 h-4 text-[#D96934] dark:text-[#FFB38A] shrink-0"
                          aria-hidden="true"
                        />
                        <span>📷 סרוק מוצר או כלי</span>
                      </button>
                    </div>
                  </div>

                  {/* Overall Progress Meter & Live Seder Countdown */}
                  <div className="w-full lg:w-[370px] shrink-0 pt-5 border-t border-[#2D312E]/10 dark:border-white/10 lg:pt-0 lg:border-t-0 lg:border-r lg:pr-10 space-y-5">
                    <div>
                      <div className="flex items-baseline justify-between gap-4 mb-3">
                        <span className="text-sm font-semibold text-[#5A605C] dark:text-[#C2CEC8]">
                          התקדמות כללית בבית
                        </span>
                        <span className="text-3xl sm:text-4xl font-bold text-[#2C7B5C] dark:text-[#FFD86B] tabular-nums">
                          {overallStats.percentage}%
                        </span>
                      </div>

                      <div
                        className="w-full h-3.5 rounded-full bg-white/80 dark:bg-[#1E2B26] border border-[#2D312E]/8 dark:border-white/10 overflow-hidden mb-3"
                        role="progressbar"
                        aria-valuenow={overallStats.percentage}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label="מד התקדמות כללי בניקיונות פסח"
                      >
                        <motion.div
                          initial={false}
                          animate={{ width: `${overallStats.percentage}%` }}
                          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                          className="h-full rounded-full bg-gradient-to-l from-[#3C8E68] via-[#28B7C5] to-[#F28444] dark:from-[#E5C17A] dark:via-[#7CE4F0] dark:to-[#4CC374]"
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#5A605C] dark:text-[#C2CEC8] tabular-nums">
                        <span className="inline-flex items-center gap-1.5">
                          <CheckCircle2
                            className="w-3.5 h-3.5 text-[#2E8B52] dark:text-[#7CE4F0]"
                            aria-hidden="true"
                          />
                          {overallStats.completedTasks} מתוך{' '}
                          {overallStats.totalTasks} משימות
                        </span>
                        <span>
                          {overallStats.lockedRooms} מתוך {rooms.length} חדרים
                          נעולים
                        </span>
                      </div>
                    </div>

                    <LiveSederCountdown
                      targetDateISO={targetDate}
                      onOpenSettings={() => setIsWizardOpen(true)}
                      onOpenSederMode={() => setIsSederModalOpen(true)}
                    />
                  </div>
                </div>
              </section>

              {/* AI Daily Briefing Card */}
              <DailyBriefingCard
                rooms={rooms}
                tasks={tasks}
                daysRemaining={daysRemaining}
                overallPercentage={overallStats.percentage}
                lockedRoomsCount={overallStats.lockedRooms}
                onSelectRoom={handleSelectRoom}
              />

              {/* Section 1: Today's Tasks */}
              <TodayTasksSection
                tasks={todayTasks}
                rooms={rooms}
                familyMembers={familyMembers}
                onToggleTask={handleToggleTask}
                onAssignTask={handleAssignTask}
                onOpenTimer={handleOpenDefaultTimer}
                isTimerRunning={isTimerRunning}
                timerFormatted={timerFormatted}
              />

              {/* Section 2: Rooms Map */}
              <RoomsGridSection
                rooms={rooms}
                tasks={tasks}
                onToggleLock={handleToggleRoomLock}
                onSelectRoom={handleSelectRoom}
              />

              {/* Section 3: Family & Gamification */}
              <FamilySection
                members={familyMembers}
                tasks={tasks}
                activeFamilyCode={activeFamilyCode}
                onOpenWizard={() => setIsWizardOpen(true)}
                onOpenCertificate={() => setIsCertificateModalOpen(true)}
                onOpenCloudSync={() => setIsCloudSyncModalOpen(true)}
              />

              {/* Section 4: Final Holiday Prep Guide */}
              <FinalPrepSection
                items={finalPrepItems}
                onToggleItem={handleToggleFinalPrepItem}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Clean Footer */}
      <footer className="border-t border-[#2D312E]/8 dark:border-white/10 bg-[#FAF8F5] dark:bg-[#1E2B26] transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 sm:pb-32 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-[#5A605C] dark:text-[#C2CEC8]">
          <p>קליןפסח (CleanPesach) · ניהול ניקיונות אביב והכשרת הבית לפסח</p>
          <button
            type="button"
            onClick={() => setIsResetModalOpen(true)}
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-[#FAF8F5] hover:bg-[#EFECE6] dark:hover:bg-[#273630] transition-colors font-medium cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            <span>איפוס נתונים</span>
          </button>
        </div>
      </footer>

      {/* Floating Points Feedback Toast */}
      <AnimatePresence>
        {pointsToast && (
          <motion.div
            key={pointsToast.id}
            initial={{ opacity: 0, y: 16, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.94 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            role="status"
            aria-live="polite"
            className="fixed bottom-[96px] sm:bottom-28 right-4 sm:right-5 z-40 max-w-[90vw] rounded-2xl bg-[#2D312E] dark:bg-[#273630] border border-white/10 text-[#FAF8F5] px-4 py-3 shadow-lg flex items-center gap-2.5 text-sm font-semibold"
          >
            <Star
              className="w-4 h-4 text-[#F3B94E] dark:text-[#E5C17A] fill-[#F3B94E] dark:fill-[#E5C17A] shrink-0"
              aria-hidden="true"
            />
            <span className="tabular-nums">
              כל הכבוד! +{pointsToast.points} נקודות
              {pointsToast.assigneeName ? ` ל${pointsToast.assigneeName}` : ''}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Voice Assistant Status Toast */}
      <AnimatePresence>
        {voiceBanner && (
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            role="status"
            aria-live="polite"
            className={`fixed bottom-[96px] sm:bottom-28 left-1/2 -translate-x-1/2 z-40 max-w-[92vw] sm:max-w-md rounded-2xl px-4 py-3 shadow-xl flex items-center gap-2.5 text-xs sm:text-sm font-semibold border ${
              voiceBanner.isError
                ? 'bg-[#9B4D1E] text-white border-white/15'
                : 'bg-[#2D312E] dark:bg-[#273630] text-[#FAF8F5] border-white/15'
            }`}
          >
            <Mic
              className={`w-4 h-4 shrink-0 ${
                isVoiceListening
                  ? 'text-[#E5C17A] animate-pulse'
                  : 'text-[#8FB8CA]'
              }`}
              aria-hidden="true"
            />
            <span>{voiceBanner.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controlled Gemini Pesach Assistant */}
      <PesachAssistantChat
        tasks={tasks}
        rooms={rooms}
        isOpen={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
        onVoiceCompleteTask={(taskId) => {
          const t = tasks.find((item) => item.id === taskId);
          if (t && !t.completed) handleToggleTask(taskId);
        }}
        onVoiceLockRoom={(roomId) => {
          const r = rooms.find((item) => item.id === roomId);
          if (r && !r.isLocked) handleToggleRoomLock(roomId);
        }}
        externalVoicePrompt={externalVoicePrompt}
      />

      {/* Floating Frosted-Glass Bottom Navigation Dock */}
      <BottomDock
        activeTab={activeDockTab}
        isChatOpen={isAssistantOpen}
        isListening={isVoiceListening}
        onSelectTab={handleSelectDockTab}
        onToggleVoice={handleToggleDockVoice}
      />

      {/* Erev Pesach & Seder Night Interactive Modal */}
      <SederNightModal
        isOpen={isSederModalOpen}
        checkedSimanim={sederSimanimChecked}
        onToggleSiman={handleToggleSiman}
        onResetSimanim={handleResetSimanim}
        onClose={() => setIsSederModalOpen(false)}
      />

      {/* Cloud Firestore Family Sync Modal */}
      <CloudSyncModal
        isOpen={isCloudSyncModalOpen}
        user={cloudUser}
        isAuthReady={isAuthReady}
        activeFamilyCode={activeFamilyCode}
        memberCount={cloudMemberCount}
        isSyncing={isSyncingCloud}
        syncError={syncError}
        onClose={() => setIsCloudSyncModalOpen(false)}
        onSignInGoogle={handleSignInGoogle}
        onSignOut={handleSignOutCloud}
        onCreateFamily={handleCreateCloudFamily}
        onJoinFamily={handleJoinCloudFamily}
        onLeaveFamily={handleLeaveCloudFamily}
      />

      {/* AI Vision Item Scanner Modal */}
      <ItemScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
      />

      {/* Family Excellence Certificate Modal */}
      <FamilyCertificateModal
        isOpen={isCertificateModalOpen}
        members={familyMembers}
        tasks={tasks}
        rooms={rooms}
        onClose={() => setIsCertificateModalOpen(false)}
      />

      {/* Quick Win (15 min) Modal */}
      <QuickWinModal
        isOpen={isQuickWinOpen}
        task={quickWinTask}
        room={quickWinRoom}
        hasMoreShortTasks={shortOpenTasks.length > 1}
        onClose={() => setIsQuickWinOpen(false)}
        onPickAnother={() => pickRandomShortTask(quickWinTaskId)}
        onStartTimerForTask={handleStartTimerForTask}
        onCompleteTask={handleToggleTask}
      />

      {/* 3-Step Onboarding Wizard */}
      <OnboardingWizard
        isOpen={isWizardOpen}
        isFirstTime={!hasCompletedOnboarding}
        initialRooms={rooms}
        initialFamilyMembers={familyMembers}
        initialTargetDate={targetDate}
        initialCleaningLevel={cleaningLevel}
        onClose={() => setIsWizardOpen(false)}
        onSkipToDefaults={handleSkipWizardToDefaults}
        onFinish={handleFinishWizard}
      />

      {/* Add Custom Task Modal */}
      <AddTaskModal
        isOpen={isAddTaskModalOpen}
        roomName={selectedRoom?.name ?? ''}
        onClose={() => setIsAddTaskModalOpen(false)}
        onAddTask={handleAddTask}
      />

      {/* Pomodoro Focus Timer Modal */}
      <FocusTimerModal
        isOpen={isTimerModalOpen}
        roomName={selectedRoom?.name}
        taskTitle={timerTaskTitle}
        mode={timerMode}
        secondsLeft={timerSecondsLeft}
        customFocusDurationSeconds={customFocusDurationSeconds}
        isRunning={isTimerRunning}
        onClose={() => setIsTimerModalOpen(false)}
        onToggleRunning={handleToggleTimerRunning}
        onReset={handleResetTimer}
        onSwitchMode={handleSwitchTimerMode}
      />

      {/* Reset Confirmation Modal */}
      <ResetConfirmModal
        isOpen={isResetModalOpen}
        onCancel={() => setIsResetModalOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  );
}
