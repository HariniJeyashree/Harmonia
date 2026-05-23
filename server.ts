import express from "express";
import path from "path";
import fs from "fs";
import os from "os";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Initialize Gemini AI client
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || "MOCK_KEY", // fallback to prevent startup crash, fails nicely at runtime
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // Server-side route to generate personalized questions
  app.post("/api/generate-question", async (req, res) => {
    try {
      const { category, categoryLabel, partnerAName, partnerBName, excludedTexts } = req.body;
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on the server. Please add it via Settings > Secrets." 
        });
      }

      const prompt = `Generate a single creative, cute, multiple choice quiz question for the couple.
Category: ${category || "favorites"} (${categoryLabel || "favorites"})
Partner A's name: ${partnerAName || "Partner A"}
Partner B's name: ${partnerBName || "Partner B"}
Excluded questions or themes to avoid: ${JSON.stringify(excludedTexts || [])}

Make the question heartwarming, lighthearted, and tailored directly to their couple relationship! Ensure the category and categoryLabel in the response match exactly.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are a whimsical, lovable Couples Quizmaster AI. 
Generate a cute, lighthearted, and heartwarming multiple-choice question for a couples compatibility game.
Use the partner's names (${partnerAName || "Partner A"} and ${partnerBName || "Partner B"}) to make the question feel cozy, funny, and deeply personalized.
The options should be distinct, fun, engaging, and appropriate for couples.
The category field MUST be the exact category provided: ${category}.
The categoryLabel field MUST be: ${categoryLabel}.
Create unique, cute emojis for each of the 4 options.`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              categoryLabel: { type: Type.STRING },
              text: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    emoji: { type: Type.STRING }
                  },
                  required: ["id", "text", "emoji"]
                }
              },
              quizmasterComment: {
                type: Type.OBJECT,
                properties: {
                  partnerA: { type: Type.STRING },
                  partnerBCorrect: { type: Type.STRING },
                  partnerBIncorrect: { type: Type.STRING }
                },
                required: ["partnerA", "partnerBCorrect", "partnerBIncorrect"]
              }
            },
            required: ["category", "categoryLabel", "text", "options", "quizmasterComment"]
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response received from Gemini API");
      }

      const parsed = JSON.parse(text);
      // Assign a unique dynamic ID
      parsed.id = `ai-${category || "gen"}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      
      res.json(parsed);
    } catch (err: any) {
      console.error("AI generation failed:", err);
      res.status(500).json({ error: err?.message || "Failed to generate AI question" });
    }
  });

  // Server-side route to generate an entire personalized quiz of 10 questions
  app.post("/api/generate-quiz", async (req, res) => {
    try {
      const { partnerAName, partnerBName, promptTheme } = req.body;
      
      if (!apiKey) {
        return res.status(500).json({ 
          error: "GEMINI_API_KEY is not configured on the server. Please add it via Settings > Secrets." 
        });
      }

      const prompt = `Generate a fully customized, romantic connection quiz comprising exactly 10 cute, lighthearted, and creative multiple-choice questions for the couple.
Partner A name: ${partnerAName || "Partner A"}
Partner B name: ${partnerBName || "Partner B"}
Special Relationship Theme or Vibe: ${promptTheme || "general cute couple facts, memories, and cozy habits"}

Requirements for each question:
1. Formulate a heartwarming, sweet, or playful connection question.
2. Provide exactly 4 distinct, charming, and relatable multiple-choice options with cute emojis.
3. Include whimsical "quizmasterComment" commentary lines for Partner A answering, Partner B guess is correct, and Partner B guess is incorrect.
4. Ensure the topic fits the relationship theme: "${promptTheme}".`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: `You are a whimsical, lovable Couples Quizmaster AI.
Generate a JSON array of exactly 10 multiple-choice couples trivia questions.
For each question, use the partner's names (${partnerAName || "Partner A"} and ${partnerBName || "Partner B"}) to make the questions feel cozy, funny, and deeply personalized.
Ensure each question has an "id", "category", "categoryLabel", "text", "options" array (with 4 items, each having "id", "text", "emoji"), and a "quizmasterComment" object (with "partnerA", "partnerBCorrect", "partnerBIncorrect").`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                category: { type: Type.STRING },
                categoryLabel: { type: Type.STRING },
                text: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      id: { type: Type.STRING },
                      text: { type: Type.STRING },
                      emoji: { type: Type.STRING }
                    },
                    required: ["id", "text", "emoji"]
                  }
                },
                quizmasterComment: {
                  type: Type.OBJECT,
                  properties: {
                    partnerA: { type: Type.STRING },
                    partnerBCorrect: { type: Type.STRING },
                    partnerBIncorrect: { type: Type.STRING }
                  },
                  required: ["partnerA", "partnerBCorrect", "partnerBIncorrect"]
                }
              },
              required: ["id", "category", "categoryLabel", "text", "options", "quizmasterComment"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("Empty response received from Gemini API");
      }

      const questions = JSON.parse(text);
      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error("Invalid array structure returned from Gemini AI");
      }

      // Ensure each question has a valid unique ID and matching category
      const finalizedQuestions = questions.map((q, idx) => {
        return {
          ...q,
          id: `ai-quiz-${idx}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          category: q.category || "custom",
          categoryLabel: q.categoryLabel || "🔮 Personal AI Quiz"
        };
      });

      res.json(finalizedQuestions);
    } catch (err: any) {
      console.error("AI quiz generation failed:", err);
      res.status(500).json({ error: err?.message || "Failed to generate AI quiz" });
    }
  });

  // Local file database for bulletproof state persistence (survives cold starts and restarts)
  // Saved in standard OS temp directory to completely isolate from Vite's local workspace file-watcher
  const SESSIONS_FILE = path.join(os.tmpdir(), "couples-quiz-sessions.json");
  let activeSessions: Record<string, {
    sessionId: string;
    partnerAName: string;
    partnerBName: string;
    partnerAAnswers: Record<string, string>;
    currentQuestionIndex: number;
    partnerBGuesses: Record<string, string>;
    phase: string;
    lastActive: number;
    isCompleted: boolean;
    secretNote?: string;
    customQuestions?: any[];
    questionIds?: string[];
  }> = {};

  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      activeSessions = JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8") || "{}");
      console.log(`Loaded ${Object.keys(activeSessions).length} sessions from disk persistence!`);
    }
  } catch (err) {
    console.error("Failed to load persistent sessions from sessions.json:", err);
  }

  function persistSessions() {
    try {
      fs.writeFileSync(SESSIONS_FILE, JSON.stringify(activeSessions, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save sessions to sessions.json:", err);
    }
  }

  // Clean up stale sessions every 10 minutes (to avoid memory/file bloat)
  setInterval(() => {
    const now = Date.now();
    let changed = false;
    for (const id in activeSessions) {
      if (now - activeSessions[id].lastActive > 3600 * 24 * 1000) { // Keep sessions for up to 24 hours now
        delete activeSessions[id];
        changed = true;
      }
    }
    if (changed) {
      persistSessions();
    }
  }, 10 * 60 * 1000);

  // Initialize a live sync session
  app.post("/api/session/init", (req, res) => {
    const { sessionId, partnerAName, partnerBName, partnerAAnswers, secretNote, customQuestions, questionIds } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "sessionId is required" });
    }

    const existing = activeSessions[sessionId];
    if (existing) {
      // Preserve existing Partner B progress, just update questions/names if necessary
      existing.partnerAName = partnerAName || existing.partnerAName;
      existing.partnerBName = partnerBName || existing.partnerBName;
      existing.partnerAAnswers = partnerAAnswers || existing.partnerAAnswers;
      if (secretNote) existing.secretNote = secretNote;
      if (customQuestions) existing.customQuestions = customQuestions;
      if (questionIds) existing.questionIds = questionIds;
      existing.lastActive = Date.now();
      persistSessions();
      return res.json({ success: true, sessionId, status: "updated" });
    }

    activeSessions[sessionId] = {
      sessionId,
      partnerAName: partnerAName || "Cutie A",
      partnerBName: partnerBName || "Cutie B",
      partnerAAnswers: partnerAAnswers || {},
      currentQuestionIndex: 0,
      partnerBGuesses: {},
      phase: "partnerB_welcome",
      lastActive: Date.now(),
      isCompleted: false,
      secretNote: secretNote || "",
      customQuestions: customQuestions || [],
      questionIds: questionIds || []
    };
    persistSessions();
    res.json({ success: true, sessionId, status: "created" });
  });

  // Get live progress of a session
  app.get("/api/session/:id", (req, res) => {
    const session = activeSessions[req.params.id];
    if (!session) {
      return res.status(404).json({ error: "Session not found" });
    }
    // Update active status
    const isOnline = Date.now() - session.lastActive < 10000; // if active within last 10 seconds
    res.json({
      ...session,
      isOnline
    });
  });

  // Partner B reports progress of a session
  app.post("/api/session/:id/progress", (req, res) => {
    const { currentQuestionIndex, partnerBGuesses, phase, partnerAName, partnerBName, partnerAAnswers, secretNote, customQuestions, questionIds } = req.body;
    let session = activeSessions[req.params.id];
    
    if (!session) {
      // Restore dynamic sync session on server reboot/cold-start gracefully
      activeSessions[req.params.id] = {
        sessionId: req.params.id,
        partnerAName: partnerAName || "Cutie A",
        partnerBName: partnerBName || "Cutie B",
        partnerAAnswers: partnerAAnswers || {},
        currentQuestionIndex: currentQuestionIndex || 0,
        partnerBGuesses: partnerBGuesses || {},
        phase: phase || "partnerB_quiz",
        lastActive: Date.now(),
        isCompleted: phase === "results",
        secretNote: secretNote || "",
        customQuestions: customQuestions || [],
        questionIds: questionIds || []
      };
      persistSessions();
      return res.json({ success: true, restored: true });
    }

    session.currentQuestionIndex = typeof currentQuestionIndex === "number" ? currentQuestionIndex : session.currentQuestionIndex;
    session.partnerBGuesses = partnerBGuesses || session.partnerBGuesses;
    session.phase = phase || session.phase;
    session.lastActive = Date.now();
    session.isCompleted = phase === "results" || session.isCompleted;
    if (secretNote) session.secretNote = secretNote;
    if (customQuestions && Array.isArray(customQuestions) && customQuestions.length > 0) {
      session.customQuestions = customQuestions;
    }
    if (questionIds && Array.isArray(questionIds) && questionIds.length > 0) {
      session.questionIds = questionIds;
    }

    persistSessions();
    res.json({ success: true });
  });

  // Live heart-beat ping from Partner B to keep showing they are actively connected
  app.post("/api/session/:id/ping", (req, res) => {
    const session = activeSessions[req.params.id];
    if (session) {
      session.lastActive = Date.now();
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Session not found" });
    }
  });

  // Serve static assets in production, otherwise mount client Vite dev middlware
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server starting on port ${PORT}`);
  });
}

startServer();
