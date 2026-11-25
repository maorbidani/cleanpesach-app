import { CleaningTask, Room } from '../types';

interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
}

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getSpeechRecognitionCtor() !== null;
}

export function startHebrewListening(callbacks: {
  onInterim?: (text: string) => void;
  onResult: (transcript: string) => void;
  onError: (message: string) => void;
  onEnd: () => void;
}): () => void {
  const Ctor = getSpeechRecognitionCtor();
  if (!Ctor) {
    callbacks.onError(
      'הדפדפן הנוכחי אינו תומך בזיהוי קולי. מומלץ להשתמש בכרום או ספארי עדכניים.'
    );
    callbacks.onEnd();
    return () => {};
  }

  const recognition = new Ctor();
  recognition.lang = 'he-IL';
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.continuous = false;

  let hasEmittedFinal = false;

  recognition.onresult = (event) => {
    const lastIdx = event.results.length - 1;
    if (lastIdx < 0) return;
    const result = event.results[lastIdx];
    const transcript = (result[0]?.transcript || '').trim();
    if (!transcript) return;

    if (result.isFinal) {
      hasEmittedFinal = true;
      callbacks.onResult(transcript);
    } else {
      callbacks.onInterim?.(transcript);
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
      callbacks.onError(
        'יש לאשר גישה למיקרופון בהגדרות הדפדפן כדי להשתמש בשליטה הקולית.'
      );
    } else if (event.error === 'audio-capture') {
      callbacks.onError(
        'לא זוהה מיקרופון פעיל במכשיר. בדקו את חיבור השמע או הרשאות הדפדפן.'
      );
    } else if (event.error === 'network') {
      callbacks.onError('נדרש חיבור פעיל לאינטרנט כדי להשתמש בזיהוי הקולי.');
    } else if (event.error === 'no-speech') {
      callbacks.onError('לא זוהה דיבור. נסו ללחוץ שוב ולדבר קרוב למיקרופון.');
    } else if (event.error !== 'aborted') {
      callbacks.onError('לא הצלחתי לקלוט את הבקשה הקולית. נסו שוב.');
    }
  };

  recognition.onend = () => {
    if (!hasEmittedFinal) {
      callbacks.onEnd();
      return;
    }
    callbacks.onEnd();
  };

  try {
    recognition.start();
  } catch {
    callbacks.onError('לא ניתן להפעיל את המיקרופון כרגע.');
    callbacks.onEnd();
  }

  return () => {
    try {
      recognition.abort();
    } catch {
      // Ignore abort errors
    }
  };
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // Ignore speechSynthesis cancel errors
  }
}

export function speakHebrew(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd?.();
    return;
  }

  stopSpeaking();

  const cleanText = text
    .replace(/[*_`#•]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanText) {
    onEnd?.();
    return;
  }

  const utterance = new SpeechSynthesisUtterance(cleanText);
  utterance.lang = 'he-IL';
  utterance.rate = 1.02;
  utterance.pitch = 1.0;

  const voices = window.speechSynthesis.getVoices();
  const hebrewVoice =
    voices.find((v) => v.lang.toLowerCase().startsWith('he')) || null;
  if (hebrewVoice) {
    utterance.voice = hebrewVoice;
  }

  utterance.onend = () => onEnd?.();
  utterance.onerror = () => onEnd?.();

  try {
    window.speechSynthesis.speak(utterance);
  } catch {
    onEnd?.();
  }
}

function normalizeHebrewWord(word: string): string {
  return word
    .replace(/[^\u0590-\u05FFa-zA-Z0-9]/g, '')
    .replace(/^(וה|ה|ו|ב|ל|כ|מ|ש)/, '')
    .trim();
}

function extractTokens(text: string): string[] {
  return text
    .split(/\s+/)
    .map(normalizeHebrewWord)
    .filter((w) => w.length >= 2);
}

const COMPLETION_TRIGGERS = [
  'סיימתי',
  'סיימנו',
  'תסמן',
  'סמן',
  'תסמני',
  'סמני',
  'בוצע',
  'בוצעה',
  'ניקיתי',
  'ניקינו',
  'גמרתי',
  'הושלם',
  'הושלמה',
  'נקי',
];

const ROOM_LOCK_TRIGGERS = ['תנעל', 'נעל', 'תנעלי', 'נעול'];

export type VoiceCommandMatch =
  | { type: 'complete_task'; task: CleaningTask; roomName: string }
  | { type: 'lock_room'; room: Room }
  | null;

export function matchVoiceCommand(
  transcript: string,
  tasks: CleaningTask[],
  rooms: Room[]
): VoiceCommandMatch {
  const cleaned = transcript.trim();
  if (!cleaned) return null;

  const hasLockTrigger = ROOM_LOCK_TRIGGERS.some((kw) => cleaned.includes(kw));
  if (hasLockTrigger) {
    for (const room of rooms) {
      if (room.isLocked) continue;
      const roomTokens = extractTokens(room.name);
      if (
        cleaned.includes(room.name) ||
        roomTokens.some((token) => cleaned.includes(token))
      ) {
        return { type: 'lock_room', room };
      }
    }
  }

  const hasCompleteTrigger = COMPLETION_TRIGGERS.some((kw) =>
    cleaned.includes(kw)
  );
  if (!hasCompleteTrigger) return null;

  const spokenTokens = extractTokens(cleaned).filter(
    (t) =>
      !COMPLETION_TRIGGERS.some(
        (trig) => trig.includes(t) || t.includes(normalizeHebrewWord(trig))
      ) &&
      t !== 'את' &&
      t !== 'משימה' &&
      t !== 'משימת'
  );

  if (spokenTokens.length === 0) return null;

  const openTasks = tasks.filter((t) => {
    const room = rooms.find((r) => r.id === t.roomId);
    return !t.completed && !(room?.isLocked ?? false);
  });

  let bestTask: CleaningTask | null = null;
  let bestScore = 0;

  for (const task of openTasks) {
    const room = rooms.find((r) => r.id === task.roomId);
    const taskTokens = extractTokens(task.title);
    const roomTokens = room ? extractTokens(room.name) : [];

    let score = 0;
    for (const token of spokenTokens) {
      if (
        taskTokens.some(
          (tt) => tt === token || tt.includes(token) || token.includes(tt)
        )
      ) {
        score += 3;
      }
      if (
        roomTokens.some(
          (rt) => rt === token || rt.includes(token) || token.includes(rt)
        )
      ) {
        score += 2;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestTask = task;
    }
  }

  if (bestTask && bestScore >= 2) {
    const roomName =
      rooms.find((r) => r.id === bestTask?.roomId)?.name ?? 'הבית';
    return { type: 'complete_task', task: bestTask, roomName };
  }

  return null;
}
