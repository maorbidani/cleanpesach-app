import 'dotenv/config';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

const SYSTEM_INSTRUCTION = `אתה "עוזר הפסח" של אפליקציית קליןפסח (CleanPesach).
אתה מומחה ידידותי, מרגיע ומעודד לניקיונות אביב, סדר וארגון הבית, והלכות הכשרת מטבח וכלים לקראת חג הפסח (תנורים, מיקרוגלים, מקררים, כיריים, שיש, כיורים, קולטי אדים וכלי מטבח).

הנחיות לתשובות שלך:
1. ענה תמיד בעברית ברורה, חמה, נעימה ומעודדת.
2. סדר את התשובה בצורה קריאה עם סעיפים קצרים וברורים (צעדים פרקטיים).
3. הימנע מהגזמות מיותרות או הפחדות; הסבר בצורה מאוזנת ונגישה, ובמקרים הלכתיים מורכבים ציין בעדינות שכדאי לשאול רב או פוסק לפי המנהג האישי.
4. כאשר המשתמש מבקש רשימת קניות של חומרי ניקוי או המלצה מה לנקות בזמן הפנוי, התבסס ישירות על רשימת המשימות הפתוחות שצורפה לבקשה (כולל שמות החדרים, הזמנים המוערכים וחומרי הניקוי).
5. שמור על תשובות תמציתיות וממוקדות (בערך 120-250 מילים) שמתאימות לקריאה נוחה בחלונית צ'אט בנייד ובדסקטופ.`;

interface ChatHistoryMessage {
  role: 'user' | 'model';
  text: string;
}

interface OpenTaskSummary {
  title: string;
  roomName: string;
  category: string;
  estimatedMinutes: number;
  recommendedSupplies: string[];
}

const VISION_SYSTEM_INSTRUCTION = `אתה מומחה הכשרת מטבח, כשרות לפסח וניקיון אביב באפליקציית קליןפסח (CleanPesach).
המשתמש צילם מוצר מזון, תבלין, קוסמטיקה, חומר ניקוי או כלי מטבח ושואל: "האם זה חמץ או כשר לפסח?".

נתח את התמונה וענה בעברית ברורה, רגועה ומסודרת לפי המבנה הבא:
1. **זיהוי הפריט**: מה מופיע בתמונה (כולל רכיבים רלוונטיים אם נראים על התווית).
2. **סטטוס חמץ / כשרות לפסח**: ציין בבירור האם הפריט מכיל חמץ, חשש חמץ, קטניות (אם רלוונטי), או שהוא כשר לפסח / מותר בשימוש. אם מדובר בחומר ניקוי או מוצר לא למאכל, ציין אם יש בו חשש חמץ או שהוא מותר בשימוש.
3. **המלצה מעשית**:
   - אם זה מזון עם חמץ: האם לזרוק/לבער או לשמור בארון סגור ולמכור במכירת חמץ.
   - אם זה כלי מטבח או מכשיר (תנור, מיקרוגל, סיר, קרש חיתוך, שיש וכו'): הסבר בקצרה איך מנקים ומכשירים אותו לפסח (למשל הגעלה, ליבון קל, עירוי רותחים או שצריך להחליף לפסח).
   - אם זה מוצר ארוז: הזכר בחן לוודא על האריזה חותמת "כשר לפסח" מתאימה למנהג המשפחה.

שמור על תשובה תמציתית, מדויקת ומעודדת (עד כ-180 מילים).`;

const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '6mb' }));

  app.post('/api/scan-item', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            'מפתח ה-Gemini API אינו מוגדר בשרת. בדוק את הגדרות המפתח ב-Settings > Secrets.',
        });
        return;
      }

      const rawBase64 = req.body?.imageBase64;
      const rawMimeType = req.body?.mimeType;
      const rawNote = req.body?.note;

      if (
        typeof rawBase64 !== 'string' ||
        rawBase64.trim().length === 0 ||
        rawBase64.length > 5_500_000
      ) {
        res.status(400).json({ error: 'יש להעלות תמונה תקינה לסריקה.' });
        return;
      }

      if (
        typeof rawMimeType !== 'string' ||
        !ALLOWED_IMAGE_MIME_TYPES.has(rawMimeType)
      ) {
        res.status(400).json({
          error: 'פורמט תמונה לא נתמך. יש להעלות JPG, PNG או WebP.',
        });
        return;
      }

      const cleanBase64 = rawBase64.replace(/^data:image\/[a-zA-Z+]+;base64,/, '');
      const userNote =
        typeof rawNote === 'string' && rawNote.trim()
          ? `\nהערת המשתמש: ${rawNote.trim().slice(0, 400)}`
          : '';

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: rawMimeType,
                data: cleanBase64,
              },
            },
            {
              text: `אנא זהה את הפריט בתמונה והסבר האם הוא מכיל חמץ, חשש חמץ או כשר לפסח/מותר לשימוש, ומה ההמלצה המעשית לגביו.${userNote}`,
            },
          ],
        },
        config: {
          systemInstruction: VISION_SYSTEM_INSTRUCTION,
        },
      });

      const analysis = (response.text ?? '').trim();
      if (!analysis) {
        res.status(502).json({
          error: 'לא התקבל ניתוח מהמערכת. נסה לצלם תמונה ברורה יותר.',
        });
        return;
      }

      res.json({ analysis });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'שגיאה בסריקת התמונה.';
      console.error('Gemini vision scan error:', errMessage);

      if (
        errMessage.includes('PERMISSION_DENIED') ||
        errMessage.includes('API_KEY_INVALID') ||
        errMessage.includes('403')
      ) {
        res.status(403).json({
          error:
            'בעיה באימות מפתח ה-Gemini API. אנא בדוק את המפתח בהגדרות Secrets.',
        });
        return;
      }

      if (
        errMessage.includes('RESOURCE_EXHAUSTED') ||
        errMessage.includes('429')
      ) {
        res.status(429).json({
          error: 'הגעת למגבלת הפניות הזמנית. נסה שוב בעוד מספר שניות.',
        });
        return;
      }

      res.status(500).json({
        error: 'לא הצלחתי לנתח את התמונה כרגע. נסה שוב בעוד רגע.',
      });
    }
  });

  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            'מפתח ה-Gemini API אינו מוגדר בשרת. בדוק את הגדרות המפתח ב-Settings > Secrets.',
        });
        return;
      }

      const rawMessage = req.body?.message;
      if (typeof rawMessage !== 'string' || !rawMessage.trim()) {
        res.status(400).json({ error: 'יש להזין הודעה תקינה.' });
        return;
      }

      const userMessage = rawMessage.trim().slice(0, 2000);

      const rawHistory = Array.isArray(req.body?.history) ? req.body.history : [];
      const sanitizedHistory: ChatHistoryMessage[] = rawHistory
        .filter(
          (item: unknown): item is ChatHistoryMessage =>
            typeof item === 'object' &&
            item !== null &&
            ((item as ChatHistoryMessage).role === 'user' ||
              (item as ChatHistoryMessage).role === 'model') &&
            typeof (item as ChatHistoryMessage).text === 'string' &&
            (item as ChatHistoryMessage).text.trim().length > 0
        )
        .slice(-16)
        .map((item: ChatHistoryMessage) => ({
          role: item.role,
          text: item.text.slice(0, 3000),
        }));

      const rawOpenTasks = Array.isArray(req.body?.openTasks)
        ? req.body.openTasks
        : [];
      const openTasks: OpenTaskSummary[] = rawOpenTasks
        .filter(
          (t: unknown): t is OpenTaskSummary =>
            typeof t === 'object' &&
            t !== null &&
            typeof (t as OpenTaskSummary).title === 'string' &&
            typeof (t as OpenTaskSummary).roomName === 'string'
        )
        .slice(0, 40);

      let contextualInstruction = SYSTEM_INSTRUCTION;
      if (openTasks.length > 0) {
        const tasksListText = openTasks
          .map(
            (t) =>
              `- [${t.roomName}] ${t.title} (${t.category}, כ-${t.estimatedMinutes} דק׳${
                Array.isArray(t.recommendedSupplies) && t.recommendedSupplies.length > 0
                  ? `, חומרים: ${t.recommendedSupplies.join(', ')}`
                  : ''
              })`
          )
          .join('\n');

        contextualInstruction += `\n\nהקשר נוכחי - המשימות הפתוחות שנותרו למשתמש בבית:\n${tasksListText}`;
      } else {
        contextualInstruction += `\n\nהקשר נוכחי: כל המשימות של המשתמש הושלמו או סומנו! אפשר לברך אותו ולהמליץ על בדיקת חמץ אחרונה או רענון קל.`;
      }

      const chat = ai.chats.create({
        model: 'gemini-4-hydrogen',
        config: {
          systemInstruction: contextualInstruction,
        },
        history: sanitizedHistory.map((msg) => ({
          role: msg.role,
          parts: [{ text: msg.text }],
        })),
      });

      const response = await chat.sendMessage({
        message: userMessage,
      });

      const replyText = (response.text ?? '').trim();
      if (!replyText) {
        res.status(502).json({
          error: 'העוזר החכם החזיר תשובה ריקה. נסו לשאול שוב.',
        });
        return;
      }

      res.json({ reply: replyText });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'שגיאה לא צפויה בחיבור לעוזר.';
      console.error('Gemini chat error:', errMessage);

      if (
        errMessage.includes('PERMISSION_DENIED') ||
        errMessage.includes('API_KEY_INVALID') ||
        errMessage.includes('403')
      ) {
        res.status(403).json({
          error:
            'בעיה באימות מפתח ה-Gemini API. אנא בדוק את המפתח בהגדרות Secrets.',
        });
        return;
      }

      if (errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('429')) {
        res.status(429).json({
          error: 'הגעת למגבלת הפניות הזמנית. נסה שוב בעוד מספר שניות.',
        });
        return;
      }

      res.status(500).json({
        error: 'לא הצלחתי לקבל תשובה כרגע. אנא נסה שוב בעוד רגע.',
      });
    }
  });

  app.post('/api/daily-briefing', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            'מפתח ה-Gemini API אינו מוגדר בשרת. בדוק את הגדרות המפתח ב-Settings > Secrets.',
        });
        return;
      }

      const rawDays = Number(req.body?.daysRemaining);
      const rawPct = Number(req.body?.overallPercentage);
      const rawLocked = Number(req.body?.lockedRoomsCount);
      const rawTotal = Number(req.body?.totalRoomsCount);

      const daysRemaining = Number.isFinite(rawDays) ? Math.max(0, rawDays) : 14;
      const overallPercentage = Number.isFinite(rawPct)
        ? Math.max(0, Math.min(100, rawPct))
        : 0;
      const lockedRoomsCount = Number.isFinite(rawLocked)
        ? Math.max(0, rawLocked)
        : 0;
      const totalRoomsCount = Number.isFinite(rawTotal)
        ? Math.max(0, rawTotal)
        : 0;

      const rawRoomsSummary = Array.isArray(req.body?.roomsSummary)
        ? req.body.roomsSummary
        : [];
      const roomsSummary = rawRoomsSummary.slice(0, 20);

      const rawTopTasks = Array.isArray(req.body?.topOpenTasks)
        ? req.body.topOpenTasks
        : [];
      const topOpenTasks = rawTopTasks.slice(0, 12);

      const prompt = `נתוני מצב הבית לקראת פסח:
- ימים שנותרו עד ליעד: ${daysRemaining}
- התקדמות כללית: ${overallPercentage}%
- חדרים נעולים כנקיים מחמץ: ${lockedRoomsCount} מתוך ${totalRoomsCount}
- מצב החדרים הפתוחים: ${JSON.stringify(roomsSummary)}
- משימות פתוחות בולטות: ${JSON.stringify(topOpenTasks)}

כתוב תדרוך יומי אישי, מעודד ומעשי בעברית (2–3 משפטים קצרים וזורמים בלבד, ללא כותרות או כוכביות מיותרות).
ציין בקצרה איזה חדר קרוב במיוחד לנעילה (אם יש כזה עם מעט משימות פתוחות) ומה המשימה המשתלמת ביותר להתחיל איתה היום כדי לשמור על מומנטום טוב ורגוע.`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction:
            'אתה מאמן בוקר חם, מעודד ופרקטי באפליקציית קליןפסח. ענה בעברית טבעית, חמה וממוקדת ב-2–3 משפטים בלבד בלי רשימות ארוכות ובלי סימני Markdown.',
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
        },
      });

      const briefing = (response.text ?? '').trim();
      if (!briefing) {
        res.status(502).json({ error: 'לא התקבל תדרוך מהשרת.' });
        return;
      }

      res.json({ briefing });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'שגיאה ביצירת התדרוך היומי.';
      console.error('Daily briefing error:', errMessage);

      if (
        errMessage.includes('PERMISSION_DENIED') ||
        errMessage.includes('API_KEY_INVALID') ||
        errMessage.includes('403')
      ) {
        res.status(403).json({
          error:
            'בעיה באימות מפתח ה-Gemini API. אנא בדוק את המפתח בהגדרות Secrets.',
        });
        return;
      }

      if (errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('429')) {
        res.status(429).json({
          error: 'יש עומס זמני בפניות ל-AI. מוצגת תצוגה מהירה.',
        });
        return;
      }

      res.status(500).json({
        error: 'לא הצלחתי ליצור תדרוך כרגע. נסו לרענן בעוד רגע.',
      });
    }
  });

  app.post('/api/recommend-trips', async (req: Request, res: Response) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        res.status(500).json({
          error:
            'מפתח ה-Gemini API אינו מוגדר בשרת. בדוק את הגדרות המפתח ב-Settings > Secrets.',
        });
        return;
      }

      const rawQuery = req.body?.query;
      if (typeof rawQuery !== 'string' || rawQuery.trim().length < 2) {
        res.status(400).json({
          error: 'יש לכתוב תיאור קצר של סוג הטיול או האזור המבוקש.',
        });
        return;
      }

      const userQuery = rawQuery.trim().slice(0, 600);

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `בקשת המשפחה לטיול בחול המועד פסח: "${userQuery}".
הצע בדיוק 3 טיולים או אטרקציות בישראל המתאימים במיוחד לבקשה זו, למשפחות בחול המועד פסח (כולל שיקולי כשרות לפסח/פיקניק וציוד מומלץ).`,
        config: {
          systemInstruction: `אתה מדריך טיולים ישראלי מנוסה וחם באפליקציית קליןפסח (CleanPesach).
המשפחה מחפשת רעיונות לטיול בחול המועד פסח בישראל.
הצע בדיוק 3 הצעות טיול אטרקטיביות, אמיתיות ומגוונות בישראל שמתאימות בדיוק לתיאור שביקשו (אזור, גילאים, מים/צל/מקורה, נגישות).
הקפד על:
1. מקומות אמיתיים ומוכרים בישראל (שמורות טבע, פארקים, נחלים, מרכזי מבקרים, מוזיאונים או מסלולי משפחות).
2. תיאור ברור ומזמין (1–2 משפטים) המסביר למה המקום מתאים למשפחה ולחול המועד.
3. רשימת ציוד מומלץ תמציתית ומדויקת למסלול.
4. רעיון קצר לאוכל כשר לפסח / עצירת פיקניק מותאמת למקום.
5. הצעת יום בחול המועד (למשל "יום א׳ חוה״מ", "יום ב׳ חוה״מ", "יום ג׳ חוה״מ").`,
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    destination: {
                      type: Type.STRING,
                      description: 'שם האתר או האטרקציה והאזור בארץ',
                    },
                    description: {
                      type: Type.STRING,
                      description: 'תיאור קצר של 1-2 משפטים על הטיול והתאמתו למשפחות',
                    },
                    recommendedGear: {
                      type: Type.STRING,
                      description: 'ציוד מומלץ לטיול בצורה תמציתית',
                    },
                    kosherLunchIdea: {
                      type: Type.STRING,
                      description: 'רעיון קצר לארוחה או פיקניק כשר לפסח המתאים לטיול',
                    },
                    suggestedDay: {
                      type: Type.STRING,
                      description: 'הצעה ליום בחול המועד, למשל יום א׳ חוה״מ',
                    },
                  },
                  required: [
                    'destination',
                    'description',
                    'recommendedGear',
                    'kosherLunchIdea',
                    'suggestedDay',
                  ],
                },
              },
            },
            required: ['recommendations'],
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        res.status(502).json({
          error: 'לא התקבלו המלצות מהמערכת. נסו לנסח שוב את הבקשה.',
        });
        return;
      }

      let parsed: { recommendations?: unknown } | null = null;
      try {
        parsed = JSON.parse(rawText) as { recommendations?: unknown };
      } catch {
        res.status(502).json({
          error: 'התקבלה תשובה לא תקינה משרת ההמלצות. נסו שוב בעוד רגע.',
        });
        return;
      }

      const rawList = Array.isArray(parsed?.recommendations)
        ? parsed.recommendations
        : [];

      const recommendations = rawList
        .filter(
          (
            item
          ): item is {
            destination: string;
            description: string;
            recommendedGear?: string;
            kosherLunchIdea?: string;
            suggestedDay?: string;
          } =>
            typeof item === 'object' &&
            item !== null &&
            typeof (item as { destination?: unknown }).destination === 'string' &&
            (item as { destination: string }).destination.trim().length > 0 &&
            typeof (item as { description?: unknown }).description === 'string' &&
            (item as { description: string }).description.trim().length > 0
        )
        .slice(0, 3)
        .map((item, index) => ({
          destination: item.destination.trim(),
          description: item.description.trim(),
          recommendedGear:
            typeof item.recommendedGear === 'string' &&
            item.recommendedGear.trim()
              ? item.recommendedGear.trim()
              : 'מים, כובעים, נעלי הליכה וקרם הגנה',
          kosherLunchIdea:
            typeof item.kosherLunchIdea === 'string' &&
            item.kosherLunchIdea.trim()
              ? item.kosherLunchIdea.trim()
              : 'פיקניק כשר לפסח: לחמניות קמח מצה, ירקות חתוכים ופירות',
          suggestedDay:
            typeof item.suggestedDay === 'string' && item.suggestedDay.trim()
              ? item.suggestedDay.trim()
              : `יום ${['א׳', 'ב׳', 'ג׳'][index] ?? 'ד׳'} חוה״מ`,
        }));

      if (recommendations.length === 0) {
        res.status(502).json({
          error: 'לא נמצאו המלצות מתאימות לתיאור. נסו להוסיף פרטים כמו אזור בארץ או גילאי הילדים.',
        });
        return;
      }

      res.json({ recommendations });
    } catch (error) {
      const errMessage =
        error instanceof Error ? error.message : 'שגיאה בקבלת המלצות טיול.';
      console.error('Trip recommendation error:', errMessage);

      if (
        errMessage.includes('PERMISSION_DENIED') ||
        errMessage.includes('API_KEY_INVALID') ||
        errMessage.includes('403')
      ) {
        res.status(403).json({
          error:
            'בעיה באימות מפתח ה-Gemini API. אנא בדוק את המפתח בהגדרות Secrets.',
        });
        return;
      }

      if (errMessage.includes('RESOURCE_EXHAUSTED') || errMessage.includes('429')) {
        res.status(429).json({
          error: 'הגעת למגבלת הפניות הזמנית. נסה שוב בעוד מספר שניות.',
        });
        return;
      }

      res.status(500).json({
        error: 'לא הצלחתי למצוא המלצות טיול כרגע. נסה שוב בעוד רגע.',
      });
    }
  });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distPath, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CleanPesach server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
