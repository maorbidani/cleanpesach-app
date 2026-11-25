import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Bot,
  Camera,
  Loader2,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { ChatMessage, CleaningTask, Room } from '../types';
import { compressImageFile } from '../utils/imageScanner';
import {
  matchVoiceCommand,
  speakHebrew,
  startHebrewListening,
  stopSpeaking,
} from '../utils/voiceAssistant';
import { stopAmbientSoundscape } from '../utils/soundEngine';

interface PesachAssistantChatProps {
  tasks: CleaningTask[];
  rooms: Room[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onVoiceCompleteTask?: (taskId: string) => void;
  onVoiceLockRoom?: (roomId: string) => void;
  externalVoicePrompt?: { id: number; text: string } | null;
}

const QUICK_PROMPTS = [
  'איך מכשירים תנור ומיקרוגל?',
  'בנה לי רשימת קניות של חומרי ניקוי לפי המשימות שנשארו לי',
  'יש לי חצי שעה פנויה עכשיו, מה כדאי לי לנקות?',
];

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: 'welcome-msg',
  role: 'model',
  text: 'שלום! אני עוזר הפסח של קליןפסח. אפשר לשאול אותי בהקלדה או בקול 🎙️ על הכשרת מטבח, לבקש לסמן משימה שבוצעה ("סיימתי לנקות את התנור"), או לצלם מוצר במצלמה 📷 לבדיקת חמץ.',
};

export function PesachAssistantChat({
  tasks,
  rooms,
  isOpen,
  onOpenChange,
  onVoiceCompleteTask,
  onVoiceLockRoom,
  externalVoicePrompt,
}: PesachAssistantChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [autoSpeakReplies, setAutoSpeakReplies] = useState(true);
  const [isListeningInChat, setIsListeningInChat] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const stopListeningRef = useRef<(() => void) | null>(null);
  const lastExternalIdRef = useRef<number | null>(null);
  const requestAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      requestAbortRef.current?.abort();
      stopListeningRef.current?.();
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  useEffect(() => {
    if (!isOpen) {
      stopListeningRef.current?.();
      stopListeningRef.current = null;
      setIsListeningInChat(false);
      return;
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onOpenChange]);

  const sendMessage = async (textToSend: string, speakResponse = false) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isLoading) return;

    setErrorMessage('');

    // Check if the user gave a direct task/room completion voice command
    const matchedCommand = matchVoiceCommand(trimmed, tasks, rooms);
    if (matchedCommand) {
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmed,
      };

      let replyText = '';
      if (matchedCommand.type === 'complete_task') {
        onVoiceCompleteTask?.(matchedCommand.task.id);
        replyText = `כל הכבוד! המשימה "${matchedCommand.task.title}" בחדר ${matchedCommand.roomName} סומנה כבוצעה.`;
      } else {
        onVoiceLockRoom?.(matchedCommand.room.id);
        replyText = `כל הכבוד! ${matchedCommand.room.name} ננעל כנקי מחמץ.`;
      }

      setMessages((prev) => [
        ...prev,
        userMsg,
        {
          id: `model-${Date.now() + 1}`,
          role: 'model',
          text: replyText,
        },
      ]);
      setInputValue('');
      if (autoSpeakReplies || speakResponse) {
        speakHebrew(replyText);
      }
      return;
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: trimmed,
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const openTasksPayload = tasks
        .filter((task) => {
          const room = rooms.find((r) => r.id === task.roomId);
          return !task.completed && !(room?.isLocked ?? false);
        })
        .map((task) => ({
          title: task.title,
          roomName: rooms.find((r) => r.id === task.roomId)?.name ?? 'בית',
          category: task.category,
          estimatedMinutes: task.estimatedMinutes,
          recommendedSupplies: task.recommendedSupplies,
        }));

      const historyPayload = nextMessages
        .filter((m) => m.id !== INITIAL_ASSISTANT_MESSAGE.id)
        .slice(0, -1)
        .map((m) => ({ role: m.role, text: m.text }));

      requestAbortRef.current?.abort();
      const controller = new AbortController();
      requestAbortRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), 25000);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            message: trimmed,
            history: historyPayload,
            openTasks: openTasksPayload,
          }),
        });

        let data: { reply?: string; error?: string } = {};
        try {
          data = (await response.json()) as {
            reply?: string;
            error?: string;
          };
        } catch {
          data = {};
        }

        if (!response.ok || !data.reply) {
          throw new Error(
            data.error || 'לא הצלחתי לקבל תשובה מעוזר הפסח. נסו שוב.'
          );
        }

        const reply = data.reply;
        setMessages((prev) => [
          ...prev,
          {
            id: `model-${Date.now()}`,
            role: 'model',
            text: reply,
          },
        ]);

        if (autoSpeakReplies || speakResponse) {
          speakHebrew(reply);
        }
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMessage('הבקשה ארכה יותר מדי זמן. בדקו את החיבור ונסו שוב.');
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'אירעה שגיאה בחיבור לעוזר הפסח.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;

  useEffect(() => {
    if (
      externalVoicePrompt &&
      externalVoicePrompt.id !== lastExternalIdRef.current
    ) {
      lastExternalIdRef.current = externalVoicePrompt.id;
      void sendMessageRef.current(externalVoicePrompt.text, true);
    }
  }, [externalVoicePrompt]);

  const handleToggleChatMic = () => {
    if (isListeningInChat) {
      stopListeningRef.current?.();
      stopListeningRef.current = null;
      setIsListeningInChat(false);
      setInterimTranscript('');
      return;
    }

    stopSpeaking();
    stopAmbientSoundscape(true, true);
    setErrorMessage('');
    setInterimTranscript('');
    setIsListeningInChat(true);

    stopListeningRef.current = startHebrewListening({
      onInterim: (text) => setInterimTranscript(text),
      onResult: (transcript) => {
        setInterimTranscript('');
        setIsListeningInChat(false);
        void sendMessage(transcript, true);
      },
      onError: (msg) => {
        setErrorMessage(msg);
        setInterimTranscript('');
        setIsListeningInChat(false);
      },
      onEnd: () => {
        setIsListeningInChat(false);
      },
    });
  };

  const handleImageUploadInChat = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || isLoading) return;

    setErrorMessage('');
    setIsLoading(true);

    try {
      const compressed = await compressImageFile(file);
      const note = inputValue.trim();
      setInputValue('');

      const userImageMsg: ChatMessage = {
        id: `user-img-${Date.now()}`,
        role: 'user',
        text: note || '📷 סריקת מוצר/כלי: האם זה חמץ או כשר לפסח?',
        imageUrl: compressed.dataUrl,
      };

      setMessages((prev) => [...prev, userImageMsg]);

      requestAbortRef.current?.abort();
      const controller = new AbortController();
      requestAbortRef.current = controller;
      const timeoutId = window.setTimeout(() => controller.abort(), 25000);

      try {
        const response = await fetch('/api/scan-item', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            imageBase64: compressed.base64,
            mimeType: compressed.mimeType,
            note,
          }),
        });

        let data: { analysis?: string; error?: string } = {};
        try {
          data = (await response.json()) as {
            analysis?: string;
            error?: string;
          };
        } catch {
          data = {};
        }

        if (!response.ok || !data.analysis) {
          throw new Error(
            data.error || 'לא הצלחתי לזהות את הפריט בתמונה. נסו לצלם שוב.'
          );
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `model-img-${Date.now()}`,
            role: 'model',
            text: data.analysis ?? '',
          },
        ]);
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        setErrorMessage('סריקת התמונה ארכה יותר מדי זמן. בדקו את החיבור ונסו שוב.');
      } else {
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'אירעה שגיאה בסריקת התמונה.'
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(inputValue, false);
  };

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => void handleImageUploadInChat(e)}
        className="hidden"
      />

      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-end sm:items-end justify-start p-0 sm:p-5 sm:pb-24 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pesach-assistant-title"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange(false)}
              className="fixed inset-0 bg-[#2D312E]/35 dark:bg-black/55 backdrop-blur-xs pointer-events-auto"
            />

            <motion.div
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.97 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 pointer-events-auto w-full sm:w-[440px] h-[86vh] sm:h-[610px] max-h-[88vh] rounded-t-3xl sm:rounded-[20px] bg-[#FAF8F5] dark:bg-[#1E2B26] border border-[#2D312E]/12 dark:border-white/12 shadow-2xl flex flex-col overflow-hidden text-[#2D312E] dark:text-[#FAF8F5]"
            >
              {/* Header */}
              <div className="px-5 py-4 bg-[#EFECE6] dark:bg-[#273630] border-b border-[#2D312E]/8 dark:border-white/10 flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#5E8C7D] text-white flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <h2
                      id="pesach-assistant-title"
                      className="font-display text-lg font-bold text-[#2D312E] dark:text-[#FAF8F5] truncate"
                    >
                      עוזר הפסח החכם
                    </h2>
                    <p className="text-xs text-[#5A605C] dark:text-[#C2CEC8] truncate">
                      הקראה קולית, שליטה בדיבור וסורק חמץ
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (autoSpeakReplies) stopSpeaking();
                      setAutoSpeakReplies((prev) => !prev);
                    }}
                    aria-pressed={autoSpeakReplies}
                    title={
                      autoSpeakReplies
                        ? 'הקראה קולית פעילה (לחץ להשתקה)'
                        : 'הפעל הקראה קולית לתשובות'
                    }
                    aria-label={
                      autoSpeakReplies
                        ? 'השתק הקראה קולית'
                        : 'הפעל הקראה קולית'
                    }
                    className={`min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                      autoSpeakReplies
                        ? 'bg-[#E1ECE8] dark:bg-[#2F4A41] text-[#456B5E] dark:text-[#E5C17A]'
                        : 'text-[#5A605C] dark:text-[#C2CEC8] hover:bg-[#FAF8F5] dark:hover:bg-[#1E2B26]'
                    }`}
                  >
                    {autoSpeakReplies ? (
                      <Volume2 className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <VolumeX className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    aria-label="סגור חלונית צ'אט"
                    className="min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-[#5A605C] dark:text-[#C2CEC8] hover:text-[#2D312E] dark:hover:text-white hover:bg-[#FAF8F5] dark:hover:bg-[#1E2B26] transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
                {messages.map((msg) => {
                  const isUser = msg.role === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isUser ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap space-y-2 ${
                          isUser
                            ? 'bg-[#5E8C7D] text-white rounded-tr-sm'
                            : 'bg-[#EFECE6] dark:bg-[#273630] text-[#2D312E] dark:text-[#FAF8F5] border border-[#2D312E]/6 dark:border-white/10 rounded-tl-sm'
                        }`}
                      >
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="תמונת מוצר או כלי לסריקה"
                            className="w-full max-h-44 object-cover rounded-xl border border-white/20"
                          />
                        )}
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  );
                })}

                {isListeningInChat && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-[#F6EBCD] dark:bg-[#3A3320] text-[#9B4D1E] dark:text-[#E5C17A] px-4 py-2.5 text-xs sm:text-sm font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#D49A3A] animate-ping" />
                      <span>
                        {interimTranscript
                          ? `מקשיב: "${interimTranscript}"`
                          : 'מקשיב בעברית... דברו כעת'}
                      </span>
                    </div>
                  </div>
                )}

                {isLoading && (
                  <div className="flex justify-end">
                    <div className="inline-flex items-center gap-2 rounded-2xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/6 dark:border-white/10 px-4 py-3 text-sm text-[#5A605C] dark:text-[#C2CEC8]">
                      <Loader2
                        className="w-4 h-4 animate-spin text-[#5E8C7D] dark:text-[#E5C17A]"
                        aria-hidden="true"
                      />
                      <span>עוזר הפסח בודק...</span>
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-2xl bg-[#F5E1D3] dark:bg-[#492D21] text-[#9B4D1E] dark:text-[#F4B68C] px-4 py-3 text-xs sm:text-sm">
                    {errorMessage}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Prompts Bar */}
              <div className="px-4 pt-3 pb-2 border-t border-[#2D312E]/8 dark:border-white/10 bg-[#FAF8F5] dark:bg-[#1E2B26]">
                <p className="text-[11px] font-semibold text-[#5A605C] dark:text-[#C2CEC8] mb-2">
                  שאלות מהירות:
                </p>
                <div className="flex flex-col gap-1.5">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      disabled={isLoading}
                      onClick={() => void sendMessage(prompt, false)}
                      className="text-right px-3 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] hover:bg-[#E5E0D8] dark:hover:bg-[#2F413A] border border-[#2D312E]/8 dark:border-white/10 text-xs font-medium text-[#2D312E] dark:text-[#FAF8F5] transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Bar with Voice Mic + Camera Scanner */}
              <form
                onSubmit={handleSubmit}
                className="p-3 sm:p-4 border-t border-[#2D312E]/8 dark:border-white/10 bg-[#FAF8F5] dark:bg-[#1E2B26] flex items-center gap-2"
              >
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={handleToggleChatMic}
                  aria-pressed={isListeningInChat}
                  title="דבר בעברית אל עוזר הפסח"
                  aria-label="דבר בעברית אל עוזר הפסח"
                  className={`min-w-[44px] min-h-[44px] rounded-xl flex items-center justify-center transition-colors shrink-0 cursor-pointer ${
                    isListeningInChat
                      ? 'bg-[#D49A3A] text-white animate-pulse'
                      : 'bg-[#E1ECE8] dark:bg-[#2F4A41] hover:bg-[#CEE0DA] text-[#3D6357] dark:text-[#E5C17A]'
                  }`}
                >
                  {isListeningInChat ? (
                    <MicOff className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Mic className="w-5 h-5" aria-hidden="true" />
                  )}
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => fileInputRef.current?.click()}
                  title="סרוק מוצר או כלי במצלמה"
                  aria-label="סרוק מוצר או כלי במצלמה"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-[#DFECF2] dark:bg-[#1F3A44] hover:bg-[#CEE2EB] dark:hover:bg-[#284B58] disabled:opacity-45 text-[#2B5D73] dark:text-[#9AC9DB] flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <Camera className="w-5 h-5" aria-hidden="true" />
                </button>

                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="שאלו, דברו או צלמו מוצר..."
                  disabled={isLoading}
                  className="flex-1 min-h-[44px] px-3.5 py-2 rounded-xl bg-[#EFECE6] dark:bg-[#273630] border border-[#2D312E]/10 dark:border-white/12 text-sm text-[#2D312E] dark:text-[#FAF8F5] placeholder:text-[#5A605C]/70 dark:placeholder:text-[#C2CEC8]/60 focus:outline-none focus:ring-2 focus:ring-[#5E8C7D] disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  aria-label="שלח הודעה"
                  className="min-w-[44px] min-h-[44px] rounded-xl bg-[#5E8C7D] hover:bg-[#4E796B] disabled:opacity-45 text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <Send className="w-4 h-4" aria-hidden="true" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
