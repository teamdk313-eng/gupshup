import 'dotenv/config';
import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === 'production';

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'gupshup' });
  });

  app.post('/api/ai/analyze', async (req, res) => {
    try {
      const { contactName, contactHandle, messages, question } = req.body as {
        contactName?: string;
        contactHandle?: string;
        messages?: Array<{ sender: string; timestamp: string; content: string }>;
        question?: string;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        res.status(400).json({ error: 'Conversation messages are required for analysis.' });
        return;
      }

      const ai = getAiClient();
      const transcript = messages
        .slice(-30)
        .map((m) => `[${m.timestamp}] ${m.sender}: ${m.content}`)
        .join('\n');

      const promptParts = [
        `Conversation with ${contactName ?? 'Contact'} (@${contactHandle ?? 'user'}):`,
        transcript,
      ];

      if (question && question.trim()) {
        promptParts.push(`\nUser's specific question: ${question.trim()}`);
      } else {
        promptParts.push(
          '\nProvide a crisp summary, key action items or decisions, and 3 natural reply drafts Ali could send next.'
        );
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-carbon',
        contents: promptParts.join('\n'),
        config: {
          systemInstruction:
            'You are an insightful conversation analyst inside a 1-to-1 messaging app called Gupshup. ' +
            'Analyze the conversation carefully, answer any complex question accurately based strictly on the transcript, ' +
            'and propose concise, natural, human-sounding reply options. Keep the summary under 3 sentences and keyPoints to 2-4 concise bullets.',
          thinkingConfig: {
            thinkingLevel: ThinkingLevel.HIGH,
          },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: {
                type: Type.STRING,
                description: 'Concise 1-3 sentence summary of the conversation.',
              },
              answerToQuery: {
                type: Type.STRING,
                description: 'Direct, thorough answer if the user asked a specific question; otherwise an empty string.',
              },
              keyPoints: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '2-4 concise takeaways, open questions, or action items.',
              },
              suggestedReplies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 natural, concise reply messages the user can send next.',
              },
            },
            required: ['summary', 'keyPoints', 'suggestedReplies'],
          },
        },
      });

      const rawText = (response.text ?? '{}').trim();
      const parsed = JSON.parse(rawText);
      res.json(parsed);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Unable to analyze conversation right now.';
      const status =
        typeof err === 'object' && err !== null && 'status' in err && typeof (err as { status: unknown }).status === 'number'
          ? (err as { status: number }).status
          : 500;
      res.status(status >= 400 && status < 600 ? status : 500).json({ error: message });
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
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Gupshup server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
