/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, FormEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Sparkles, 
  ArrowRight, 
  User, 
  CheckCircle2, 
  XCircle, 
  MessageCircle, 
  RotateCcw, 
  Info, 
  ChevronRight, 
  Gift, 
  Smile, 
  Compass, 
  BookOpen, 
  Lock,
  RefreshCw,
  Wand2
} from 'lucide-react';

import { QuizState, QuestionOption } from './types';
import { QUESTIONS } from './questions';
import SparkyCupid from './components/SparkyCupid';
import FloatingHearts from './components/FloatingHearts';
import SparkyGiftBoxReveal from './components/SparkyGiftBoxReveal';

const LOCAL_STORAGE_KEY = 'couples_connection_quiz_state_v1';

// Robust MDN-Standard URL-Safe Base64 helper utilities for online sharing mode
function serializeSession(sessionData: any): string {
  try {
    const json = JSON.stringify(sessionData);
    const bytes = new TextEncoder().encode(json);
    const binString = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
    const base64 = btoa(binString);
    // Convert to URL-safe base64 style (replace +, / and strip padding =)
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  } catch (e) {
    console.error("Failed to serialize session data:", e);
    return "";
  }
}

function deserializeSession(base64Str: string): any {
  try {
    if (!base64Str) return null;
    
    // Normalize URL-safe characters back to standard base64 characters
    let restored = base64Str
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    // Reconstruct base64 padding correctly
    while (restored.length % 4) {
      restored += '=';
    }

    const binString = atob(restored);
    const bytes = Uint8Array.from(binString, (char) => char.charCodeAt(0));
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json);
  } catch (e) {
    console.error("Standard deserialize failed, trying legacy URI percent fallback:", e);
    // Legacy percent-encoding fallback
    try {
      let restored = base64Str
        .replace(/-/g, '+')
        .replace(/_/g, '/');
      while (restored.length % 4) {
        restored += '=';
      }
      const utf8Str = atob(restored);
      const json = decodeURIComponent(Array.prototype.map.call(utf8Str, (c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(json);
    } catch (innerErr) {
      console.error("All fallback deserialize methods failed:", innerErr);
      return null;
    }
  }
}

const DEFAULT_STATE: QuizState = {
  partnerAName: '',
  partnerBName: '',
  partnerAAnswers: {},
  partnerBGuesses: {},
  currentQuestionIndex: 0,
  phase: 'welcome',
  secretNote: ''
};

export default function App() {
  const [loadErrorMsg, setLoadErrorMsg] = useState<string | null>(null);

  const [isLoadingRemote, setIsLoadingRemote] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let sId = params.get('sess') || params.get('session');
      if (!sId && window.location.hash) {
        const hashSessMatch = window.location.hash.match(/[#&?]sess(ion)?=([^&]+)/);
        if (hashSessMatch) {
          sId = hashSessMatch[2];
        }
      }
      return !!sId;
    }
    return false;
  });

  const [state, setState] = useState<QuizState>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let quizData = params.get('data') || params.get('quiz');
      let ses = params.get('sess') || params.get('session');
      let role = params.get('role');
      const storageKey = (role === 'b' || role === 'B') ? `${LOCAL_STORAGE_KEY}_b` : LOCAL_STORAGE_KEY;
      
      let customQuestionsParam = params.get('custom');
      let urlPartnerAName = params.get('a') || params.get('partnerAName');
      let urlPartnerBName = params.get('b') || params.get('partnerBName');
      let urlSecretNote = params.get('note') || params.get('secretNote');

      // Resilient fallback: parse from URL hash in case proxies stripped query params
      if (!quizData && window.location.hash) {
        const hashMatch = window.location.hash.match(/[#&?](data|quiz)=([^&]+)/);
        if (hashMatch) {
          quizData = hashMatch[2];
        }
      }

      if (!ses && window.location.hash) {
        const hashSessMatch = window.location.hash.match(/[#&?]sess(ion)?=([^&]+)/);
        if (hashSessMatch) {
          ses = hashSessMatch[2];
        }
      }

      if (quizData) {
        try {
          const cleanData = quizData.trim();

          // Calculate incoming session ID to see if we can restore from localStorage
          let incomingSessionId = "";
          let isSequence = false;
          let parsedPayload: any = null;

          // Highly robust sequence match: matches normal numbers like 0:2-12:3 and custom prefix c0:2-c1:3
          if (/^(c?\d+):[1-4](-(c?\d+):[1-4])*$/.test(cleanData)) {
            isSequence = true;
            incomingSessionId = ses || `seq-session-${cleanData.substring(0, 30)}`;
          } else if (/^[1-4](-[1-4])+$/.test(cleanData)) {
            incomingSessionId = ses || `numeric-session-${cleanData}`;
          } else {
            parsedPayload = deserializeSession(cleanData);
            if (parsedPayload) {
              incomingSessionId = parsedPayload.sessId || parsedPayload.sessionId;
            }
          }

          // Let's first check if there's already an active, saved state in localStorage
          // that matches this URL session so we can restore progress gracefully if they reload!
          if (incomingSessionId) {
            try {
              const savedStr = localStorage.getItem(storageKey);
              if (savedStr) {
                const savedState = JSON.parse(savedStr);
                if (savedState && savedState.sessionId === incomingSessionId) {
                  console.log("Restoring active session from localStorage:", incomingSessionId);
                  return savedState;
                }
              }
            } catch (err) {
              console.error("Failed to restore session from localStorage:", err);
            }
          }

          // If no saved state matches, parse fresh URL parameter
          
          // Support high-reliability sequence mapping schema: ?data=0:2-12:3... or with custom prefix c0:2...
          if (isSequence) {
            const pairs = cleanData.split('-');
            const partnerAAnswers: Record<string, string> = {};
            const finalQIds: string[] = [];
            const customQuestionsList: any[] = [];

            if (customQuestionsParam) {
              const decodedCustom = deserializeSession(customQuestionsParam);
              if (Array.isArray(decodedCustom)) {
                customQuestionsList.push(...decodedCustom);
              }
            }

            pairs.forEach(pair => {
              const [qIdxStr, optNumStr] = pair.split(':');
              const optNum = parseInt(optNumStr);
              let question: any = null;

              if (qIdxStr.startsWith('c')) {
                const cIdx = parseInt(qIdxStr.substring(1));
                if (cIdx >= 0 && cIdx < customQuestionsList.length) {
                  question = customQuestionsList[cIdx];
                }
              } else {
                const qIdx = parseInt(qIdxStr);
                if (qIdx >= 0 && qIdx < QUESTIONS.length) {
                  question = QUESTIONS[qIdx];
                }
              }

              if (question) {
                finalQIds.push(question.id);
                const optIdx = optNum - 1;
                if (optIdx >= 0 && optIdx < question.options.length) {
                  partnerAAnswers[question.id] = question.options[optIdx].id;
                }
              }
            });

            return {
              partnerAName: urlPartnerAName || 'Honey Bunny 🧸',
              partnerBName: urlPartnerBName || 'Cutie Pie 🍯',
              partnerAAnswers,
              partnerBGuesses: {},
              currentQuestionIndex: 0,
              phase: 'partnerB_welcome',
              secretNote: urlSecretNote || 'I love you so much! Let’s celebrate our beautiful compatibility! 💖',
              questionIds: finalQIds,
              customQuestions: customQuestionsList,
              isRemoteSession: true, // Enable live calculations support!
              sessionId: incomingSessionId
            } as QuizState;
          }

          // Support direct simple numbers sequence format: ?data=1-3-2-4-1-2-3-4-2-1
          if (/^[1-4](-[1-4])+$/.test(cleanData)) {
            const indices = cleanData.split('-').map(x => parseInt(x) - 1);
            const finalQSubset = QUESTIONS.slice(0, 10);
            const finalQIds = finalQSubset.map(q => q.id);
            const partnerAAnswers: Record<string, string> = {};
            
            finalQSubset.forEach((q, i) => {
              const optionIndex = (indices[i] !== undefined && indices[i] >= 0 && indices[i] < q.options.length) ? indices[i] : 0;
              partnerAAnswers[q.id] = q.options[optionIndex].id;
            });

            return {
              partnerAName: urlPartnerAName || 'Honey Bunny 🧸',
              partnerBName: urlPartnerBName || 'Cutie Pie 🍯',
              partnerAAnswers,
              partnerBGuesses: {},
              currentQuestionIndex: 0,
              phase: 'partnerB_welcome',
              secretNote: urlSecretNote || 'I love you so much! Let’s celebrate our beautiful compatibility! 💖',
              questionIds: finalQIds,
              customQuestions: [],
              isRemoteSession: true,
              sessionId: incomingSessionId
            } as QuizState;
          }

          if (parsedPayload && (parsedPayload.qIds || parsedPayload.questionIds)) {
            const finalQIds = parsedPayload.qIds || parsedPayload.questionIds || [];
            return {
              partnerAName: parsedPayload.aName || parsedPayload.partnerAName || urlPartnerAName || 'Honey Bunny 🧸',
              partnerBName: parsedPayload.bName || parsedPayload.partnerBName || urlPartnerBName || 'Cutie Pie 🍯',
              partnerAAnswers: parsedPayload.aAns || parsedPayload.partnerAAnswers || {},
              partnerBGuesses: {},
              currentQuestionIndex: 0,
              phase: 'partnerB_welcome',
              secretNote: parsedPayload.note || parsedPayload.secretNote || urlSecretNote || 'I love you so much! Let’s celebrate our beautiful compatibility! 💖',
              questionIds: finalQIds,
              customQuestions: parsedPayload.custom || parsedPayload.customQuestions || [],
              isRemoteSession: true,
              sessionId: incomingSessionId
            } as QuizState;
          } else {
            console.warn("Parsed payload template is valid but missing question IDs.", parsedPayload);
          }
        } catch (e: any) {
          console.error("Failed to parse remote session param:", e);
        }
      } else if (ses) {
        // Synchronously prepare a skeleton state with this sessionId so we jump straight to Partner B welcome view!
        // The mounting useEffect will fetch the full details in <50ms from server database.
        try {
          const savedStr = localStorage.getItem(storageKey);
          if (savedStr) {
            const savedState = JSON.parse(savedStr);
            if (savedState && savedState.sessionId === ses) {
              console.log("Restoring active session from localStorage:", ses);
              return savedState;
            }
          }
        } catch (_) {}

        let customQuestionsList: any[] = [];
        let finalQIds: string[] = [];
        if (customQuestionsParam) {
          try {
            const decodedCustom = deserializeSession(customQuestionsParam);
            if (Array.isArray(decodedCustom)) {
              customQuestionsList = decodedCustom;
              finalQIds = decodedCustom.map(q => q.id);
            }
          } catch (e) {
            console.error("Failed to decode custom questions for session on startup:", e);
          }
        }

        return {
          partnerAName: urlPartnerAName || 'Honey Bunny 🧸',
          partnerBName: urlPartnerBName || 'Cutie Pie 🍯',
          partnerAAnswers: {},
          partnerBGuesses: {},
          currentQuestionIndex: 0,
          phase: 'partnerB_welcome',
          secretNote: urlSecretNote || 'I love you so much! Let’s celebrate our beautiful compatibility! 💖',
          questionIds: finalQIds,
          customQuestions: customQuestionsList,
          isRemoteSession: true,
          sessionId: ses
        };
      }
    }

    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const role = params?.get('role');
      const storageKey = (role === 'b' || role === 'B') ? `${LOCAL_STORAGE_KEY}_b` : LOCAL_STORAGE_KEY;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load state from localStorage:", e);
    }
    return DEFAULT_STATE;
  });

  const [partnerANameInput, setPartnerANameInput] = useState(state.partnerAName || 'Cutie A');
  const [partnerBNameInput, setPartnerBNameInput] = useState(state.partnerBName || 'Cutie B');
  const [secretNoteInput, setSecretNoteInput] = useState(state.secretNote || '');
  const [justGuessedOptionId, setJustGuessedOptionId] = useState<string | null>(null);
  const [isRevealMode, setIsRevealMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [remoteCopied, setRemoteCopied] = useState(false);
  const [showRemoteShareUI, setShowRemoteShareUI] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // AI Couples Wizard Form States
  const [creationMode, setCreationMode] = useState<'classic' | 'ai'>('classic');
  const [aiThemeInput, setAiThemeInput] = useState('');
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [aiQuizError, setAiQuizError] = useState<string | null>(null);

  const [partnerBLiveProgress, setPartnerBLiveProgress] = useState<{
    isOnline: boolean;
    currentQuestionIndex: number;
    partnerBGuesses: Record<string, string>;
    phase: string;
    isCompleted: boolean;
    lastActive: number;
  } | null>(null);

  // Sync inputs if remote state was loaded from URL
  useEffect(() => {
    if (state.partnerAName) setPartnerANameInput(state.partnerAName);
    if (state.partnerBName) setPartnerBNameInput(state.partnerBName);
    if (state.secretNote) setSecretNoteInput(state.secretNote);
  }, [state.partnerAName, state.partnerBName, state.secretNote]);

  // Synchronize dynamic AI session from server on startup if session ID is in URL
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    let sId = params.get('sess') || params.get('session');

    // Fallback: parse from URL hash
    if (!sId && window.location.hash) {
      const hashSessMatch = window.location.hash.match(/[#&?]sess(ion)?=([^&]+)/);
      if (hashSessMatch) {
         sId = hashSessMatch[2];
      }
    }

    if (!sId) {
      setIsLoadingRemote(false);
      return;
    }

    const fetchInitialRemoteSession = async () => {
      setIsLoadingRemote(true);
      try {
        const res = await fetch(`/api/session/${sId}`);
        if (res.ok) {
          const data = await res.json();
          setState((prev) => {
            // Merge loaded data with existing state safely
            return {
              ...prev,
              partnerAName: data.partnerAName || prev.partnerAName,
              partnerBName: data.partnerBName || prev.partnerBName,
              secretNote: data.secretNote || prev.secretNote,
              customQuestions: data.customQuestions || prev.customQuestions,
              questionIds: data.questionIds || prev.questionIds,
              partnerAAnswers: data.partnerAAnswers || prev.partnerAAnswers,
              sessionId: data.sessionId || prev.sessionId,
              phase: prev.phase === 'welcome' ? 'partnerB_welcome' : prev.phase
            };
          });
          if (data.partnerAName) setPartnerANameInput(data.partnerAName);
          if (data.partnerBName) setPartnerBNameInput(data.partnerBName);
          if (data.secretNote) setSecretNoteInput(data.secretNote);
        }
      } catch (e) {
        console.error("Failed to load initial session details from server:", e);
      } finally {
        setIsLoadingRemote(false);
      }
    };

    fetchInitialRemoteSession();
  }, []);

  // Sync state to localStorage
  useEffect(() => {
    try {
      const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
      const role = params?.get('role');
      const storageKey = (role === 'b' || role === 'B') ? `${LOCAL_STORAGE_KEY}_b` : LOCAL_STORAGE_KEY;
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.error("Failed to save state to localStorage:", e);
    }
  }, [state]);

  // Partner B live progress reporting
  useEffect(() => {
    if (!state.isRemoteSession || !state.sessionId) return;
    // Prevent reporting progress with uninitialized / empty questions skeleton
    if (state.questionIds && state.questionIds.length === 0) return;
    
    const reportProgress = async () => {
      try {
        await fetch(`/api/session/${state.sessionId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            partnerAName: state.partnerAName,
            partnerBName: state.partnerBName,
            partnerAAnswers: state.partnerAAnswers,
            currentQuestionIndex: state.currentQuestionIndex,
            partnerBGuesses: state.partnerBGuesses,
            phase: state.phase,
            secretNote: state.secretNote || secretNoteInput,
            customQuestions: state.customQuestions || [],
            questionIds: state.questionIds || []
          })
        });
      } catch (e) {
        console.error("Failed to report live progress:", e);
      }
    };

    reportProgress();
  }, [state.isRemoteSession, state.sessionId, state.currentQuestionIndex, state.partnerBGuesses, state.phase, state.partnerAName, state.partnerBName, state.partnerAAnswers, state.secretNote, secretNoteInput, state.customQuestions, state.questionIds]);

  // Partner B live active connection ping heartbeat
  useEffect(() => {
    if (!state.isRemoteSession || !state.sessionId) return;

    const interval = setInterval(() => {
      fetch(`/api/session/${state.sessionId}/ping`, { method: "POST" })
        .catch(err => console.error("Heartbeat failed:", err));
    }, 4500);

    return () => clearInterval(interval);
  }, [state.isRemoteSession, state.sessionId]);

  // Partner A live polling when waiting on the share display
  useEffect(() => {
    if (state.phase !== 'partnerA_complete' || !state.sessionId) return;

    let isSubscribed = true;

    // Call init session on the server to make sure it's live-registered
    const initializeSessionOnBackend = async () => {
      try {
        await fetch("/api/session/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId: state.sessionId,
            partnerAName: state.partnerAName,
            partnerBName: state.partnerBName,
            partnerAAnswers: state.partnerAAnswers,
            secretNote: secretNoteInput || state.secretNote,
            customQuestions: state.customQuestions || [],
            questionIds: state.questionIds || []
          })
        });
      } catch (e) {
        console.error("Failed to initialize session registry on server:", e);
      }
    };

    initializeSessionOnBackend();

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/session/${state.sessionId}`);
        if (res.ok && isSubscribed) {
          const data = await res.json();
          setPartnerBLiveProgress({
            isOnline: data.isOnline,
            currentQuestionIndex: data.currentQuestionIndex,
            partnerBGuesses: data.partnerBGuesses || {},
            phase: data.phase,
            isCompleted: data.isCompleted,
            lastActive: data.lastActive
          });

          // Automatically sync and navigate Partner A to the final results dashboard once Partner B is done
          if (data.isCompleted) {
            setState((prev) => ({
              ...prev,
              partnerBGuesses: data.partnerBGuesses || {},
              phase: 'results'
            }));
          }
        }
      } catch (e) {
        console.error("Error polling live quiz sync:", e);
      }
    };

    // Initial fetch and start interval
    const timeoutId = setTimeout(fetchStatus, 500);
    const pollInterval = setInterval(fetchStatus, 3000);

    return () => {
      isSubscribed = false;
      clearTimeout(timeoutId);
      clearInterval(pollInterval);
    };
  }, [state.phase, state.sessionId, state.partnerAName, state.partnerBName, state.partnerAAnswers, state.secretNote, secretNoteInput, state.customQuestions, state.questionIds]);

  // Combine static and custom/AI-generated questions
  const allQuestions = useMemo(() => {
    const custom = state.customQuestions || [];
    return [...QUESTIONS, ...custom];
  }, [state.customQuestions]);

  // Resolve active/randomized questions for this session
  const activeQuestions = useMemo(() => {
    if (state.questionIds && state.questionIds.length > 0) {
      return state.questionIds
        .map(id => allQuestions.find(q => q.id === id))
        .filter((q): q is typeof QUESTIONS[0] => !!q);
    }
    return allQuestions;
  }, [state.questionIds, allQuestions]);

  const currentQuestion = activeQuestions[state.currentQuestionIndex];

  // Skip current question and replace with an AI-generated question of the same category
  const handleSkipQuestion = async () => {
    if (isGenerating || !currentQuestion) return;
    setIsGenerating(true);
    setGenerationError(null);

    try {
      const excludedTexts = allQuestions.map(q => q.text);

      const response = await fetch("/api/generate-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: currentQuestion.category,
          categoryLabel: currentQuestion.categoryLabel,
          partnerAName: state.partnerAName,
          partnerBName: state.partnerBName,
          excludedTexts
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Server failed to generate a matching question.");
      }

      const newQuestion = await response.json();

      if (!newQuestion.id || !newQuestion.text || !newQuestion.options) {
        throw new Error("Invalid structure returned from the Couples AI generator.");
      }

      const custom = state.customQuestions || [];
      const updatedCustom = [...custom, newQuestion];

      const updatedIds = [...(state.questionIds || [])];
      updatedIds[state.currentQuestionIndex] = newQuestion.id;

      setState({
        ...state,
        customQuestions: updatedCustom,
        questionIds: updatedIds,
      });
    } catch (e: any) {
      console.error("AI question load failed:", e);
      setGenerationError(e.message || "Failed to load an AI question. Please check server configurations.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset the entire game
  const handleReset = () => {
    setState({
      ...DEFAULT_STATE,
      questionIds: []
    });
    setPartnerANameInput('');
    setPartnerBNameInput('');
    setSecretNoteInput('');
    setJustGuessedOptionId(null);
    setIsRevealMode(false);
    setGenerationError(null);
  };

  // Start Phase 1 (Partner A Quiz) and randomize the questions
  const handleStartGame = (e: FormEvent) => {
    e.preventDefault();
    if (!partnerANameInput.trim() || !partnerBNameInput.trim()) {
      return;
    }
    // Perform robust shuffle of entire question library & slice to exactly 10 questions
    const shuffledIds = [...QUESTIONS]
      .map(q => q.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 10);

    setState({
      ...state,
      partnerAName: partnerANameInput.trim(),
      partnerBName: partnerBNameInput.trim(),
      phase: 'partnerA_quiz',
      currentQuestionIndex: 0,
      partnerAAnswers: {},
      partnerBGuesses: {},
      questionIds: shuffledIds
    });
  };

  const handleGenerateAIQuiz = async (e: FormEvent) => {
    e.preventDefault();
    if (!partnerANameInput.trim() || !partnerBNameInput.trim()) {
      return;
    }
    
    setIsGeneratingQuiz(true);
    setAiQuizError(null);
    
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerAName: partnerANameInput.trim(),
          partnerBName: partnerBNameInput.trim(),
          promptTheme: aiThemeInput.trim() || "general warm cute quirks, couple favorites, and future cozy wishes"
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to generate AI questions.");
      }

      const generatedQuestions = await response.json();
      
      if (!Array.isArray(generatedQuestions) || generatedQuestions.length < 5) {
        throw new Error("Invalid questions list returned by the Couples AI generator.");
      }

      // Inject these dynamically generated questions into custom questions & set questionIds
      const generatedIds = generatedQuestions.map(q => q.id);

      setState({
        ...state,
        partnerAName: partnerANameInput.trim(),
        partnerBName: partnerBNameInput.trim(),
        phase: 'partnerA_quiz',
        currentQuestionIndex: 0,
        partnerAAnswers: {},
        partnerBGuesses: {},
        questionIds: generatedIds,
        customQuestions: generatedQuestions
      });

    } catch (e: any) {
      console.error("AI quiz generation failed:", e);
      setAiQuizError(e.message || "Failed to establish a sweet AI connection. Please ensure your Gemini Key is active.");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Partner A chooses an option
  const handlePartnerASelect = (optionId: string) => {
    const updatedAnswers = {
      ...state.partnerAAnswers,
      [currentQuestion.id]: optionId
    };

    if (state.currentQuestionIndex < activeQuestions.length - 1) {
      setState({
        ...state,
        partnerAAnswers: updatedAnswers,
        currentQuestionIndex: state.currentQuestionIndex + 1
      });
    } else {
      const generatedSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      setState({
        ...state,
        partnerAAnswers: updatedAnswers,
        phase: 'partnerA_complete',
        sessionId: generatedSessionId
      });
    }
  };

  // Partner A submits secret note and hands over device
  const handlePartnerACompleteSubmit = (e: FormEvent) => {
    e.preventDefault();
    setState({
      ...state,
      secretNote: secretNoteInput,
      phase: 'partnerB_welcome',
      currentQuestionIndex: 0
    });
  };

  // Partner B submits a guess for the current question
  const handlePartnerBGuess = (optionId: string) => {
    setJustGuessedOptionId(optionId);
    setIsRevealMode(true);

    const updatedGuesses = {
      ...state.partnerBGuesses,
      [currentQuestion.id]: optionId
    };

    setState({
      ...state,
      partnerBGuesses: updatedGuesses
    });
  };

  // Partner B proceeds to the next question after seeing feedback
  const handleNextQuestionB = () => {
    if (!justGuessedOptionId) return;

    setJustGuessedOptionId(null);
    setIsRevealMode(false);

    if (state.currentQuestionIndex < activeQuestions.length - 1) {
      setState({
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1
      });
    } else {
      setState({
        ...state,
        phase: 'results'
      });
    }
  };

  // Calculate correct guesses
  const getScore = () => {
    let matches = 0;
    activeQuestions.forEach((q) => {
      if (state.partnerAAnswers[q.id] === state.partnerBGuesses[q.id]) {
        matches++;
      }
    });
    return matches;
  };

  // Sync results for long-distance / remote session tracking
  const handleSyncAndShowResults = () => {
    if (!partnerBLiveProgress) return;
    setState({
      ...state,
      partnerBGuesses: partnerBLiveProgress.partnerBGuesses,
      phase: 'results'
    });
  };

  // Beautiful summary based on match percentage
  const getResultsFeedback = (matches: number) => {
    const pct = (matches / activeQuestions.length) * 100;
    if (pct >= 90) {
      return {
        title: "✨ Soulmate Telepathy Level! ✨",
        color: "text-rose-600 bg-rose-50 border-rose-100",
        message: `Incredible! You matched ${matches} out of ${activeQuestions.length} points! You literally share single-heart telepathy. You could practically finish each other's sentences (and snack cravings)!`,
        emoji: '🥰🏹'
      };
    } else if (pct >= 70) {
      return {
        title: "💖 Divine Connection! 💖",
        color: "text-purple-600 bg-purple-50 border-purple-100",
        message: `Wonderful connection! You matched ${matches} out of ${activeQuestions.length} points. You understand each other's secret vibes and future dreams with beautiful ease!`,
        emoji: '🌸🧸'
      };
    } else if (pct >= 40) {
      return {
        title: "🌱 Sweet Buds & Sparks! 🌱",
        color: "text-indigo-600 bg-indigo-50 border-indigo-100",
        message: `Sweet! You matched ${matches} out of ${activeQuestions.length} points. This is a gorgeous baseline, and you have so many adorable details left to discover during your next cozy date night!`,
        emoji: '🧁✨'
      };
    } else {
      return {
        title: "🌻 Cozy New Exploration! 🌻",
        color: "text-amber-600 bg-amber-50 border-amber-100",
        message: `Amazing! You matched ${matches} out of ${activeQuestions.length} points. This means date nights are going to be so much fun as you laugh, compare notes, and learn sweet new details about each other!`,
        emoji: '☕🥑'
      };
    }
  };

  const score = getScore();
  const result = getResultsFeedback(score);

  // App Sharing URL
  const appURL = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}${window.location.pathname}` : '';

  const generatedRemoteURL = useMemo(() => {
    return `${appURL}?sess=${state.sessionId}&role=b`;
  }, [state.sessionId, appURL]);

  return (
    <div className="min-h-screen bg-[#FFF9FB] text-[#5A4B51] font-sans relative flex flex-col justify-between overflow-x-hidden py-6 px-4">
      
      {/* Background Hearts */}
      <FloatingHearts />

      {/* Decorative Background Sparkles from professional theme */}
      <div className="absolute top-[12%] left-[8%] w-4 h-4 bg-[#FFD1DC] rotate-45 rounded-sm opacity-60 animate-float pointer-events-none"></div>
      <div className="absolute bottom-[14%] right-[8%] w-6 h-6 bg-[#B2E2F2] rotate-12 rounded-full opacity-40 animate-pulse pointer-events-none" style={{ animationDuration: '4s' }}></div>

      {/* Main Container */}
      <div className="w-full max-w-4xl mx-auto flex flex-col flex-1 justify-between min-h-[680px]">
        
        {/* Professional Header Section */}
        <header className="flex items-center justify-between px-4 md:px-8 py-4 mb-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#FFD1DC] rounded-full flex items-center justify-center shadow-sm">
              <div className="text-xl">💖</div>
            </div>
            <div>
              <span className="text-xl md:text-2xl font-bold tracking-tight text-[#8A707B] font-display">
                Harmonia
              </span>
              <span className="text-[10px] text-[#B5A1A9] block font-bold uppercase tracking-wider -mt-1">
                Quiz & bonding game
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-[10px] uppercase tracking-widest text-[#B5A1A9] font-bold">
                Connection Status
              </span>
              <span className="text-xl md:text-2xl font-black text-[#FF85A1]">
                {state.phase === 'results' ? `${score} / ${activeQuestions.length}` : `${getScore()} matches`}
              </span>
            </div>
            <div className="w-11 h-11 rounded-full border-2 border-[#FFD1DC] p-0.5 flex items-center justify-center bg-white shrink-0">
              <div className="w-full h-full bg-[#E2F0CB] rounded-full flex items-center justify-center text-sm">
                🌸
              </div>
            </div>
          </div>
        </header>

        {/* The Main Polished Card Container */}
        <div className="w-full bg-white rounded-[48px] shadow-2xl shadow-[#FAD2E1]/50 border border-[#FAD2E1] p-6 md:p-10 flex flex-col justify-between transition-all duration-300 z-10 flex-1 my-4">
          
          {state.isRemoteSession && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-[#FF85A1]/10 to-[#9166CC]/10 border-2 border-[#FAD2E1] p-4 rounded-3xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left shadow-xs shrink-0"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="font-bold text-xs text-[#5D4A52]">Connected Team Challenge Mode!</h4>
                  <p className="text-[10px] text-[#8A707B] font-medium leading-normal">
                    You're playing the quiz shared by <strong>{state.partnerAName}</strong>. Predict their answers to unlock their secret note!
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const cleanUrl = window.location.origin + window.location.pathname;
                    window.history.replaceState({}, document.title, cleanUrl);
                  }
                  handleReset();
                }}
                type="button"
                className="text-[10px] font-extrabold text-[#9166CC] hover:text-[#7F54B8] bg-white hover:bg-[#FFF9FB] border-2 border-[#FAD2E1] py-1.5 px-3 rounded-full transition-all cursor-pointer whitespace-nowrap shrink-0 border-none focus:outline-none"
              >
                Start Free New Quiz 💖
              </button>
            </motion.div>
          )}

          {/* Dynamic Screens */}
          <AnimatePresence mode="wait">
            
            {isLoadingRemote && (
              <motion.div
                key="remote_loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[350px]"
              >
                <div className="relative mb-6">
                  <Heart className="w-16 h-16 text-[#FF85A1] animate-pulse fill-[#FF85A1]" />
                  <Sparkles className="w-6 h-6 text-[#9166CC] absolute -top-2 -right-2 animate-bounce" />
                </div>
                <h3 className="text-2xl font-extrabold font-display text-[#5D4A52] tracking-tight">
                  Retrieving Love Quiz...
                </h3>
                <p className="text-sm font-semibold text-[#8A707B] mt-2 max-w-sm italic">
                  🏹 Sparky is scanning the cosmos & fetching your partner's custom connection challenge! 💖
                </p>
                <div className="mt-6 flex items-center justify-center gap-1.5 text-xs text-[#B5A1A9] font-bold uppercase tracking-wider animate-pulse">
                  <span>Loading Secure Database Session</span>
                  <span className="inline-block w-1.5 h-1.5 bg-[#FF85A1] rounded-full animate-bounce" style={{ animationDelay: '100ms' }}></span>
                  <span className="inline-block w-1.5 h-1.5 bg-[#FF85A1] rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></span>
                  <span className="inline-block w-1.5 h-1.5 bg-[#FF85A1] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </motion.div>
            )}

            {/* SCREEN 1: Welcome and Name Entry */}
            {!isLoadingRemote && state.phase === 'welcome' && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center text-center py-4"
              >
                <div className="mb-6">
                  <span className="inline-block bg-[#F3E8FF] text-[#9166CC] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-3">
                    💘 Phase 1: Partner A
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold font-display leading-tight text-[#5D4A52]">
                    Couple's Connection Quiz
                  </h2>
                  <p className="text-sm text-[#B5A1A9] font-medium mt-2 max-w-md mx-auto">
                    A whimsical connection game designed for couples. Answer questions about yourself, then let your partner try to predict your choices!
                  </p>
                </div>

                {/* Sparky Welcome Message */}
                <div className="mb-8">
                  <SparkyCupid 
                    expression="welcome"
                    commentary="Hello lovebirds! I am Sparky, your cozy AI cupid. Let's find out how perfectly synced your hearts are! Enter your nicknames below to begin."
                  />
                </div>

                {/* Dual-Mode Quiz Creation Option selector */}
                <div className="flex justify-center gap-2 max-w-md mx-auto mb-4 bg-[#FFF0F3] p-1.5 rounded-full border border-[#FFD1DC] font-sans">
                  <button
                    type="button"
                    onClick={() => setCreationMode('classic')}
                    className={`flex-1 py-1 px-4 rounded-full text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer border-none focus:outline-none ${
                      creationMode === 'classic'
                        ? 'bg-[#5D4A52] text-white shadow-xs'
                        : 'text-[#8A707B] hover:text-[#5D4A52] bg-transparent'
                    }`}
                  >
                    📝 Classic Library
                  </button>
                  <button
                    type="button"
                    onClick={() => setCreationMode('ai')}
                    className={`flex-1 py-1 px-4 rounded-full text-xs font-extrabold uppercase tracking-wide transition-all cursor-pointer border-none focus:outline-none flex items-center justify-center gap-1 bg-transparent ${
                      creationMode === 'ai'
                        ? 'bg-gradient-to-r from-[#9166CC] to-[#FF85A1] text-white shadow-xs'
                        : 'text-[#8A707B] hover:text-[#5D4A52]'
                    }`}
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    🔮 AI Theme Master
                  </button>
                </div>

                {/* Form Input Container */}
                <div className="max-w-md mx-auto text-left bg-[#FFF9FB] p-6 rounded-3xl border border-[#FAD2E1] space-y-4 shadow-sm relative overflow-hidden">
                  
                  {isGeneratingQuiz && (
                    <div className="absolute inset-0 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6 z-20">
                      <div className="w-12 h-12 border-4 border-[#FF85A1] border-t-transparent rounded-full animate-spin mb-4"></div>
                      <h4 className="font-extrabold text-sm text-[#5D4A52]">AI Cupid Generation...</h4>
                      <p className="text-xs text-[#8A707B] mt-1.5 italic animate-pulse max-w-xs leading-relaxed text-center">
                        🏹 Sparky is channeling sweet telepathy to design custom personalized questions!🍳💖
                      </p>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#8A707B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 inline text-[#FF85A1]" /> Partner A's Nickname
                    </label>
                    <input 
                      type="text" 
                      value={partnerANameInput}
                      onChange={(e) => setPartnerANameInput(e.target.value)}
                      placeholder="e.g. Honey Bunny 🧸"
                      className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#FFD1DC] bg-white text-gray-800 placeholder-gray-400 font-sans focus:outline-none focus:border-[#FF85A1] transition-colors text-sm font-semibold"
                      maxLength={30}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#8A707B] uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 inline text-[#FF85A1]" /> Partner B's Nickname
                    </label>
                    <input 
                      type="text" 
                      value={partnerBNameInput}
                      onChange={(e) => setPartnerBNameInput(e.target.value)}
                      placeholder="e.g. Cutie Pie 🍯"
                      className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#FFD1DC] bg-white text-gray-800 placeholder-gray-400 font-sans focus:outline-none focus:border-[#FF85A1] transition-colors text-sm font-semibold"
                      maxLength={30}
                      required
                    />
                  </div>

                  <div className="border-t border-[#FAD2E1]/50 pt-4 space-y-4">
                    {/* Conditionally Render Bottom Section */}
                    {creationMode === 'classic' ? (
                      <form onSubmit={handleStartGame} className="space-y-3.5">
                        <p className="text-[10px] text-[#A68F9B] leading-normal italic font-semibold">
                          ✦ Generates 10 cute random questions from our offline connection collection!
                        </p>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          type="submit"
                          className="w-full bg-[#5D4A52] hover:bg-[#48383F] text-white font-bold py-3.5 px-6 rounded-full shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm group border-none focus:outline-none"
                        >
                          Let's Begin the Quiz! <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </motion.button>
                      </form>
                    ) : (
                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold text-[#9166CC] uppercase tracking-wider flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-[#9166CC]" /> Choose Theme or Vibe (AI-Powered)
                          </label>
                          <input 
                            type="text" 
                            value={aiThemeInput}
                            onChange={(e) => setAiThemeInput(e.target.value)}
                            placeholder="e.g. movie obsession, cafe dates, snuggle style..."
                            className="w-full px-4 py-2.5 rounded-2xl border-2 border-[#E1D1FF] bg-white text-gray-800 placeholder-gray-400 font-sans focus:outline-none focus:border-[#9166CC] transition-colors text-xs font-semibold"
                            maxLength={80}
                          />
                        </div>

                        {/* Suggestions Pill Cloud */}
                        <div className="space-y-1">
                          <span className="text-[9px] font-extrabold uppercase text-[#A68F9B] tracking-wider block">Cute Theme Suggestions:</span>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { label: "🥞 Pancakes & Coffee", prompt: "pancakes, funny eating habits, and morning coffee energy" },
                              { label: "✈️ Travel Journeys", prompt: "travel dreams, packing habits, and lost-luggage attitude" },
                              { label: "🎮 Gaming Rivalry", prompt: "Mario Kart, couch co-op gaming, and snack stealing" },
                              { label: "🐨 Snuggle Habits", prompt: "blanket hogs, sleepy animal memes, and wake up timing" }
                            ].map((pill, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => setAiThemeInput(pill.prompt)}
                                className="text-[9px] py-1 px-2 bg-[#FFF0F3] hover:bg-[#FFD1DC] text-[#FF85A1] border border-[#FFD1DC] rounded-lg cursor-pointer transition-all font-semibold"
                              >
                                {pill.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {aiQuizError && (
                          <div className="text-[10px] text-red-500 font-bold bg-red-50 p-2.5 rounded-xl border border-red-100 leading-normal">
                            ⚠️ {aiQuizError}
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={handleGenerateAIQuiz}
                          className="w-full bg-gradient-to-r from-[#9166CC] to-[#FF85A1] text-white font-extrabold py-3.5 px-6 rounded-full shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 text-sm border-none focus:outline-none"
                        >
                          <Wand2 className="w-4 h-4" />
                          Generate Bespoke AI Quiz! ✨
                        </motion.button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 2: Partner A Quiz Screen */}
            {!isLoadingRemote && state.phase === 'partnerA_quiz' && currentQuestion && (
              <motion.div
                key={`quizA-${state.currentQuestionIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-between py-2"
              >
                <div>
                  {/* Progress Indicators */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-6 font-semibold">
                    <span className="px-4 py-1.5 bg-[#F3E8FF] text-[#9166CC] rounded-full text-xs font-bold uppercase tracking-wider">
                      Phase 1: Your Choice
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FF85A1] rounded-full transition-all duration-300"
                          style={{ width: `${((state.currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-[#B5A1A9]">
                        Q. {String(state.currentQuestionIndex + 1).padStart(2, '0')} of {String(activeQuestions.length).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Sparky's comment */}
                  <div className="mb-6">
                    <SparkyCupid 
                      expression="thinking" 
                      commentary={currentQuestion.quizmasterComment.partnerA} 
                    />
                  </div>

                  {/* Question Text */}
                  <div className="text-center mb-8 px-2">
                    <span className="text-xs font-bold text-[#8A707B] uppercase tracking-widest block mb-1">
                      {currentQuestion.categoryLabel}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-[#5D4A52] tracking-tight leading-snug">
                      {currentQuestion.text}
                    </h3>
                  </div>

                  {/* Question Options */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                    {currentQuestion.options.map((option, idx) => (
                      <motion.button
                        key={option.id}
                        whileHover={{ scale: 1.03, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handlePartnerASelect(option.id)}
                        className="p-5 rounded-[24px] text-left bg-white border-2 border-[#FAD2E1]/60 hover:border-[#FF85A1] hover:bg-[#FFF9FB] shadow-xs hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer focus:outline-none"
                      >
                        <span className="w-12 h-12 bg-[#FFD1DC]/40 rounded-xl flex items-center justify-center text-2xl group-hover:bg-[#FFD1DC]/60 transition-colors shrink-0 border border-[#FAD2E1]/20">
                          {option.emoji}
                        </span>
                        <div className="flex-1">
                          <span className="text-[#B5A1A9] block text-[9px] font-bold uppercase tracking-wide">Option {String(idx + 1).padStart(2, '0')}</span>
                          <span className="text-[#5D4A52] text-sm font-bold leading-snug">{option.text}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Skip and Generate AI Question Card */}
                  <div className="max-w-2xl mx-auto mt-6">
                    <div className="bg-[#FFF9FB] border-2 border-dashed border-[#FAD2E1] rounded-[24px] p-5 text-center relative overflow-hidden flex flex-col items-center justify-center">
                      <div className="flex items-center gap-2 mb-1.5">
                        <Sparkles className="w-4 h-4 text-[#FF85A1] animate-pulse" />
                        <span className="text-xs font-bold text-[#8A707B] uppercase tracking-wider">
                          Feeling adventurous? Skip this question!
                        </span>
                      </div>
                      <p className="text-[11px] text-[#A68F9B] max-w-md mx-auto mb-3.5 leading-relaxed">
                        Don't fancy this question? Our whimsical Couples Quizmaster AI will analyze the category and context to instantly cook up a custom version tailored for <strong>{state.partnerAName}</strong> & <strong>{state.partnerBName}</strong>!
                      </p>

                      {generationError && (
                        <div className="mb-3 text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-150 rounded-xl py-2 px-4 max-w-md">
                          ⚠️ {generationError}
                        </div>
                      )}

                      <motion.button
                        disabled={isGenerating}
                        whileHover={!isGenerating ? { scale: 1.03 } : {}}
                        whileTap={!isGenerating ? { scale: 0.97 } : {}}
                        onClick={handleSkipQuestion}
                        className={`px-6 py-2.5 rounded-full font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer border-none focus:outline-none ${
                          isGenerating 
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                            : "bg-[#FF85A1] hover:bg-[#FF7092] text-white"
                        }`}
                      >
                        {isGenerating ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-gray-400" />
                            Quizmaster is crafting question...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                            Skip & Generate AI Question ✨
                          </>
                        )}
                      </motion.button>
                    </div>
                  </div>
                </div>

                <div className="text-center text-xs text-[#B5A1A9] font-bold mt-8 border-t border-[#FAD2E1]/30 pt-4">
                  🤫 Psst! No peeking, <strong className="text-[#5D4A52]">{state.partnerBName}</strong>! Keep it a cozy surprise.
                </div>
              </motion.div>
            )}

            {/* SCREEN 3: Partner A Complete (Secret Note Screen) */}
            {!isLoadingRemote && state.phase === 'partnerA_complete' && (
              <motion.div
                key="partnerA_complete"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center text-center py-4"
              >
                <div className="mb-6">
                  <span className="inline-block bg-[#E2F0CB] text-[#5A4B51] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-2">
                    🎉 PART A COMPLETED!
                  </span>
                  <h2 className="text-3xl font-extrabold font-display text-[#5D4A52]">
                    Great Job, {state.partnerAName}!
                  </h2>
                  <p className="text-sm text-[#B5A1A9] font-semibold mt-1 max-w-md mx-auto">
                    You've successfully secured your secret answers inside our offline local safe.
                  </p>
                </div>

                {/* Sparky Complete Commentary */}
                <div className="mb-6">
                  <SparkyCupid 
                    expression="complete"
                    commentary={`Ooh, lovely submissions! Now, before you hand the device to ${state.partnerBName}, let's write them a sweet secret note or doodle reminder. They'll unlock this note on the final results screen if they match enough of your sweet answers!`}
                  />
                </div>

                {/* No-form structural container to prevent accidental auto-redirects on Enter key */}
                <div className="space-y-6 max-w-lg mx-auto text-left bg-[#FFF9FB] p-6 rounded-[28px] border border-[#FAD2E1] shadow-xs">
                  <div>
                    <label className="block text-xs font-bold text-[#8A707B] uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-[#FF85A1]" /> Locked Secret Note for {state.partnerBName}
                    </label>
                    <textarea 
                      value={secretNoteInput}
                      onChange={(e) => setSecretNoteInput(e.target.value)}
                      placeholder="e.g. You are my absolute favorite person in the solar system. I love our sushi dates so much! Here is a virtual forehead kiss... 🥰"
                      className="w-full h-24 px-4 py-3 rounded-2xl border-2 border-[#FFD1DC] bg-white text-[#5D4A52] placeholder-gray-400 font-sans focus:outline-none focus:border-[#FF85A1] transition-colors text-xs resize-none leading-relaxed font-semibold"
                      maxLength={200}
                    />
                    <div className="flex justify-between text-[10px] text-[#B5A1A9] font-semibold mt-1 italic">
                      <span>This will only be unlocked at the final score board!</span>
                      <span>{secretNoteInput.length}/200</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#FAD2E1]/50 space-y-4">
                    {/* OPTION A: ONLINE CHALLENGE (PRIMARY & PROMINENT) */}
                    <div className="bg-white p-5 rounded-[20px] border border-[#FFD1DC] shadow-sm space-y-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-[#9166CC] uppercase tracking-widest">
                        <span className="text-sm">🔗</span> Share Custom Connection Magic Link
                      </div>
                      <p className="text-[11px] leading-relaxed text-[#86737D] font-medium">
                        Copy your custom game link below and send it to <strong className="text-[#5D4A52]">{state.partnerBName}</strong>! They will predict your answers in real-time on their device, sync questions perfectly (including AI-generated ones), and unlock your locked secret note!
                      </p>

                      {/* Copied Feedback */}
                      <AnimatePresence>
                        {remoteCopied && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-2.5 text-center text-xs font-bold shadow-xs"
                          >
                            🎉 Magic link copied to clipboard with love! Send it to your partner! 💖
                          </motion.div>
                         )}
                      </AnimatePresence>

                      {/* Unified Single URL Sharing Card */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-br from-[#9166CC]/5 to-white border border-[#FAD2E1] p-3.5 rounded-2xl space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[10px] font-extrabold text-[#9166CC] uppercase tracking-wider">
                              Couple's Connection Magic Link ✨
                            </span>
                            <span className="text-[9px] px-2 py-0.5 bg-purple-100 text-[#9166CC] font-extrabold rounded-full">
                              Highly Recommended
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 font-medium leading-normal">
                            Includes nicknames, transfers your custom quiz, and provides live progress tracking.
                          </p>
                          <div className="flex items-center gap-2 bg-[#FFF9FB] rounded-xl border border-[#FAD2E1] p-1.5 shadow-2xs">
                            <input 
                              type="text"
                              readOnly
                              value={generatedRemoteURL}
                              onClick={(e) => (e.target as any).select()}
                              className="bg-transparent text-[10px] text-[#8A707B] outline-none flex-1 truncate font-mono font-semibold px-2"
                            />
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(generatedRemoteURL);
                                setRemoteCopied(true);
                                setTimeout(() => setRemoteCopied(false), 2500);
                              }}
                              className="bg-[#9166CC] hover:bg-[#7F54B8] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all shrink-0 border-none flex items-center gap-1"
                            >
                              Copy Link 📋
                            </motion.button>
                          </div>
                        </div>
                      </div>

                      {/* Quick share options grid */}
                      <div className="grid grid-cols-2 gap-2.5 pt-1">
                        {/* WhatsApp Trigger */}
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Hey ${state.partnerBName}! 💖 I just took the Couple's Connection Quiz for us! Predict my answers online to check our compatibility and unlock my secret note! 💌 PLAY HERE: ${generatedRemoteURL}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-[#25D366] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm transition-all text-center cursor-pointer hover:bg-[#20b855] text-decoration-none"
                        >
                          💬 WhatsApp {state.partnerBName}
                        </motion.a>

                        {/* SMS Trigger */}
                        <motion.a
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          href={`sms:?body=${encodeURIComponent(`Hey ${state.partnerBName}! 💖 I just took the Couple's Connection Quiz for us! Predict my answers online to check our compatibility and unlock my secret note! 💌 PLAY HERE: ${generatedRemoteURL}`)}`}
                          className="bg-[#5D4A52] text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 text-xs shadow-sm transition-all text-center cursor-pointer hover:bg-[#48383F] text-decoration-none"
                        >
                          📲 Text/SMS
                        </motion.a>
                      </div>

                      {/* Live Interaction & Progress Tracker Widget */}
                      <div className="mt-4 pt-4 border-t border-[#FAD2E1] space-y-3 bg-gradient-to-br from-[#9166CC]/5 to-[#FF85A1]/5 p-4 rounded-2xl border border-[#FFD1DC]">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {partnerBLiveProgress?.isOnline ? (
                              <div className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                              </div>
                            ) : (
                              <div className="h-3 w-3 rounded-full bg-gray-300"></div>
                            )}
                            <span className="text-xs font-extrabold text-[#5D4A52] uppercase tracking-wide flex items-center gap-1">
                              {partnerBLiveProgress?.isOnline 
                                ? "🟢 Partner's Device Connected!" 
                                : "⚪ Waiting for Partner to join..."}
                            </span>
                          </div>
                          
                          {partnerBLiveProgress?.isOnline && (
                            <span className="text-[9px] bg-[#9166CC]/10 text-[#9166CC] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                              Live Syncing
                            </span>
                          )}
                        </div>

                        {partnerBLiveProgress ? (
                          <div className="space-y-3.5 text-left pt-1 font-semibold">
                            {/* Detailed Step Progress */}
                            <div className="flex items-center justify-between text-[11px] text-[#8A707B]">
                              <span>Current Screen:</span>
                              <span className="text-[#5D4A52] font-extrabold font-mono">
                                {partnerBLiveProgress.phase === 'partnerB_welcome' && "Welcome 👋"}
                                {partnerBLiveProgress.phase === 'partnerB_quiz' && "Answering Questions 📝"}
                                {partnerBLiveProgress.phase === 'results' && "Viewed Results 🎉"}
                              </span>
                            </div>

                            {/* Question Progress bar */}
                            <div className="space-y-1.5">
                              <div className="flex justify-between text-[11px] text-[#8A707B]">
                                <span>Quiz Progress:</span>
                                <span className="font-bold text-[#5D4A52]">
                                  {Object.keys(partnerBLiveProgress.partnerBGuesses || {}).length} of {activeQuestions.length} Checked
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-[#9166CC] to-[#FF85A1] rounded-full transition-all duration-500"
                                  style={{ 
                                    width: `${(Math.min(Object.keys(partnerBLiveProgress.partnerBGuesses || {}).length, activeQuestions.length) / activeQuestions.length) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>

                            {/* Compatibility Score so far */}
                            <div className="bg-white p-3 rounded-xl border border-[#FFD1DC]/60 flex items-center justify-between gap-2.5 shadow-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-lg">💖</span>
                                <div>
                                  <div className="text-[9px] text-[#A68F9B] uppercase tracking-wider leading-none">Vibe Tracker</div>
                                  <div className="text-[11px] text-[#5D4A52] font-extrabold">Matches so far</div>
                                </div>
                              </div>
                              <div className="text-base font-black text-[#FF85A1] px-3 py-1 bg-[#FFF9FB] rounded-full border border-[#FFD1DC]">
                                {(() => {
                                  let matches = 0;
                                  activeQuestions.forEach((q) => {
                                    if (state.partnerAAnswers[q.id] && state.partnerAAnswers[q.id] === partnerBLiveProgress.partnerBGuesses[q.id]) {
                                      matches++;
                                    }
                                  });
                                  return matches;
                                })()} Matches
                              </div>
                            </div>

                            {/* Sync results button */}
                            {partnerBLiveProgress.isCompleted && (
                              <motion.button
                                whileHover={{ scale: 1.03 }}
                                whileTap={{ scale: 0.97 }}
                                type="button"
                                onClick={handleSyncAndShowResults}
                                className="w-full mt-2.5 py-3 px-4 bg-gradient-to-r from-[#9166CC] to-[#FF85A1] text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-md cursor-pointer transition-all flex items-center justify-center gap-2 border-none"
                              >
                                <Sparkles className="w-3.5 h-3.5 text-white animate-spin" />
                                {state.partnerBName} completed! View results together! 👋
                              </motion.button>
                            )}
                          </div>
                        ) : (
                          <p className="text-[10px] text-[#A68F9B] leading-relaxed text-center py-2 italic font-semibold">
                            Send the link to your partner! This tracking screen will automatically show live calculations once they open the quiz 💘
                          </p>
                        )}
                      </div>
                    </div>

                    {/* OPTION B: OFFLINE HANDOVER / PASS DEVICE STATE */}
                    <div className="bg-[#FFF9FB] p-5 rounded-[20px] border border-[#FAD2E1] space-y-3 text-center">
                      <div className="text-xs font-bold text-[#8A707B] uppercase tracking-wide">
                        📲 Pathway 2: Local Play (Both at same screen)
                      </div>
                      <p className="text-[10px] text-[#A68F9B] leading-normal font-medium max-w-sm mx-auto">
                        Sitting right next to each other? You can simply save the note and handover this phone/device directly to them!
                      </p>

                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                          setState({
                            ...state,
                            secretNote: secretNoteInput,
                            phase: 'partnerB_welcome',
                            currentQuestionIndex: 0
                          });
                        }}
                        className="w-full bg-[#5D4A52] hover:bg-[#48383F] text-white font-bold py-3 px-6 rounded-xl shadow-sm cursor-pointer transition-all flex items-center justify-center gap-2 text-xs border-none"
                      >
                        Handover Device to {state.partnerBName}! <ArrowRight className="w-3.5 h-3.5" />
                      </motion.button>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}

            {/* SCREEN 4: Partner B Welcome */}
            {!isLoadingRemote && state.phase === 'partnerB_welcome' && (
              <motion.div
                key="partnerB_welcome"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="flex-1 flex flex-col justify-center text-center py-4"
              >
                <div className="mb-6">
                  <span className="inline-block bg-[#F3E8FF] text-[#9166CC] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-2">
                    📲 Handover Time!
                  </span>
                  <h2 className="text-3xl md:text-4xl font-extrabold font-display leading-tight text-[#5D4A52]">
                    {state.partnerBName}'s Challenge!
                  </h2>
                  <p className="text-sm text-[#B5A1A9] font-semibold mt-2 max-w-sm mx-auto">
                    {state.partnerAName} has completed their quiz! Do you think you *really* know their answers? Let's find out!
                  </p>
                </div>

                {/* Sparky's Welcome Challenge */}
                <div className="mb-8">
                  <SparkyCupid 
                    expression="welcome"
                    commentary={`Aha! Sit down, ${state.partnerBName}! Your goal is NOT to answer what YOU prefer, but to predict exactly what ${state.partnerAName} chose. Getting matches will unlock their locked secret note! Let's see your connection telepathy.`}
                  />
                </div>

                <div className="max-w-md mx-auto">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setState({ ...state, phase: 'partnerB_quiz', currentQuestionIndex: 0 })}
                    className="w-full bg-[#5D4A52] hover:bg-[#48383F] text-white font-bold py-4 px-8 rounded-full shadow-xl cursor-pointer transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    Start the Connection Challenge! <Sparkles className="w-4 h-4" />
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* SCREEN 5: Partner B Quiz Challenger */}
            {!isLoadingRemote && state.phase === 'partnerB_quiz' && currentQuestion && (
              <motion.div
                key={`quizB-${state.currentQuestionIndex}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col justify-between py-2"
              >
                <div>
                  {/* Progress Indicators */}
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-6 font-semibold">
                    <span className="px-4 py-1.5 bg-[#F3E8FF] text-[#9166CC] rounded-full text-xs font-bold uppercase tracking-wider">
                      Phase 2: The Challenge
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-[#F0F0F0] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-[#FF85A1] rounded-full transition-all duration-300"
                          style={{ width: `${((state.currentQuestionIndex + 1) / activeQuestions.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs font-bold text-[#B5A1A9]">
                        Q. {String(state.currentQuestionIndex + 1).padStart(2, '0')} of {String(activeQuestions.length).padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Main Challenge Form - Guess State */}
                  {!isRevealMode ? (
                    <>
                      <div className="mb-6">
                        <SparkyCupid 
                          expression="thinking" 
                          commentary={`What do you think ${state.partnerAName} chose for this question? Tap your prediction!`} 
                        />
                      </div>

                      <div className="text-center mb-8 px-2">
                        <span className="text-xs font-bold text-[#8A707B] uppercase tracking-widest block mb-1">
                          {currentQuestion.categoryLabel}
                        </span>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-[#5D4A52] tracking-tight leading-snug">
                          Which option represents {state.partnerAName}'s answer?
                        </h3>
                        <p className="text-sm font-semibold text-pink-500 mt-2 max-w-lg mx-auto bg-pink-50/50 py-2.5 px-4 rounded-2xl border border-pink-100/40">
                          "{currentQuestion.text}"
                        </p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                        {currentQuestion.options.map((option, idx) => (
                          <motion.button
                            key={option.id}
                            whileHover={{ scale: 1.03, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handlePartnerBGuess(option.id)}
                            className="p-5 rounded-[24px] text-left bg-white border-2 border-[#FAD2E1]/60 hover:border-[#FF85A1] hover:bg-[#FFF9FB] shadow-xs hover:shadow-md transition-all flex items-center gap-4 group cursor-pointer focus:outline-none"
                          >
                            <span className="w-12 h-12 bg-[#FFD1DC]/30 rounded-xl flex items-center justify-center text-2xl group-hover:bg-[#FFD1DC]/50 transition-colors shrink-0 border border-[#FAD2E1]/20">
                              {option.emoji}
                            </span>
                            <div className="flex-1">
                              <span className="text-[#B5A1A9] block text-[9px] font-bold uppercase tracking-wide">Option {String(idx + 1).padStart(2, '0')}</span>
                              <span className="text-[#5D4A52] text-sm font-bold leading-snug">{option.text}</span>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </>
                  ) : (
                    
                    /* REVEAL STATE (Comparison Feedback Grid) */
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="space-y-8 max-w-3xl mx-auto"
                    >
                      {(() => {
                        const actualChoiceId = state.partnerAAnswers[currentQuestion.id];
                        const guessedChoiceId = justGuessedOptionId;
                        const isCorrect = actualChoiceId === guessedChoiceId;
                        
                        const actualOption = currentQuestion.options.find(o => o.id === actualChoiceId);
                        const guessedOption = currentQuestion.options.find(o => o.id === guessedChoiceId);

                        return (
                          <>
                            <div className="mb-4">
                              <SparkyCupid 
                                expression={isCorrect ? 'correct' : 'incorrect'} 
                                commentary={isCorrect ? currentQuestion.quizmasterComment.partnerBCorrect : currentQuestion.quizmasterComment.partnerBIncorrect} 
                              />
                            </div>

                            <h3 className="text-xl md:text-2xl font-bold text-center text-[#5D4A52] px-4 max-w-xl mx-auto mb-4">
                              "{currentQuestion.text}"
                            </h3>

                            {/* Comparison Result Visualization Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-center justify-items-center">
                              
                              {/* Column 1: Partner A's Actual Choice */}
                              <div className="flex flex-col items-center w-full">
                                <span className="text-[10px] font-bold text-[#B5A1A9] uppercase mb-3 tracking-widest">{state.partnerAName}'s Choice</span>
                                <div className="w-full max-w-[180px] h-44 bg-[#FFF1E6] rounded-[32px] border-4 border-[#FFB7B2] flex flex-col items-center justify-center gap-2 shadow-inner p-4 text-center">
                                  <span className="text-5xl md:text-6xl animate-float">{actualOption?.emoji}</span>
                                  <span className="font-bold text-[#5D4A52] text-sm leading-tight line-clamp-2">{actualOption?.text}</span>
                                </div>
                              </div>

                              {/* Column 2: Feedback Circle */}
                              <div className="flex flex-col items-center text-center py-2 shrink-0">
                                <motion.div 
                                  className={`w-20 h-20 ${
                                    isCorrect ? 'bg-[#FF85A1] shadow-[#FF85A1]/40' : 'bg-[#B5A1A9] shadow-[#B5A1A9]/30'
                                  } rounded-full flex items-center justify-center shadow-lg mb-3`}
                                  animate={{ scale: isCorrect ? [1, 1.12, 1] : 1 }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                >
                                  <span className="text-white text-3xl font-bold">{isCorrect ? '✨' : '✖'}</span>
                                </motion.div>
                                <h3 className="text-xl font-black text-[#FF85A1] uppercase tracking-tighter">
                                  {isCorrect ? "It's a Match!" : "Almost!"}
                                </h3>
                                <p className="text-xs text-[#B5A1A9] font-semibold mt-0.5">
                                  {isCorrect ? "You know them perfectly!" : "A sweet discovery!"}
                                </p>
                              </div>

                              {/* Column 3: Partner B's Guess */}
                              <div className="flex flex-col items-center w-full">
                                <span className="text-[10px] font-bold text-[#B5A1A9] uppercase mb-3 tracking-widest">Your Guess ({state.partnerBName})</span>
                                <div className={`w-full max-w-[180px] h-44 ${
                                  isCorrect ? 'bg-[#E2F0CB] border-[#A5D6A7]' : 'bg-rose-50 border-rose-200'
                                } rounded-[32px] border-4 flex flex-col items-center justify-center gap-2 shadow-inner p-4 text-center`}>
                                  <span className="text-5xl md:text-6xl">{guessedOption?.emoji}</span>
                                  <span className="font-bold text-[#5D4A52] text-sm leading-tight line-clamp-2">{guessedOption?.text}</span>
                                </div>
                              </div>

                            </div>

                            {/* Controls */}
                            <div className="flex justify-center mt-4">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleNextQuestionB}
                                className="px-12 py-5 bg-[#5D4A52] text-white rounded-full font-bold text-lg hover:bg-[#48383F] shadow-xl transition-all cursor-pointer flex items-center gap-2"
                              >
                                {state.currentQuestionIndex < activeQuestions.length - 1 ? (
                                  <>Next Question →</>
                                ) : (
                                  <>View Complete Love Board! 🏆</>
                                )}
                              </motion.button>
                            </div>
                          </>
                        );
                      })()}
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {/* SCREEN 6: Final Results and Love Score */}
            {state.phase === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.35 }}
                className="flex-1 flex flex-col justify-between py-2"
              >
                <div className="text-center space-y-6">
                  <div>
                    <span className="inline-block bg-[#F3E8FF] text-[#9166CC] text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wider mb-2">
                      🏆 Scoreboard Revealed
                    </span>
                    <h2 className="text-3xl font-extrabold font-display leading-tight text-[#5D4A52]">
                      Connectivity Report
                    </h2>
                  </div>

                  {/* Major Score Circle */}
                  <div className="relative w-44 h-44 mx-auto flex items-center justify-center">
                    {/* Decorative background circle */}
                    <div className="absolute inset-0 rounded-full bg-[#FFD1DC]/40 animate-pulse opacity-60" />
                    <div className="absolute inset-2 rounded-full bg-white border-2 border-[#FAD2E1] flex items-center justify-center shadow-lg animate-float" />
                    
                    <div className="relative text-center z-10">
                      <span className="text-6xl font-black font-display text-[#FF85A1]">
                        {score}
                      </span>
                      <span className="text-[10px] font-bold text-[#8A707B] block mt-0.5 uppercase tracking-widest">
                        / {activeQuestions.length} MATCHES
                      </span>
                      <span className="text-3xl mt-1.5 block">{result.emoji}</span>
                    </div>
                  </div>

                  {/* Custom Evaluation Card */}
                  <div className="p-6 rounded-[28px] border-2 text-left space-y-2 bg-[#FFF9FB] border-[#FAD2E1]">
                    <h3 className="text-lg font-bold font-display text-[#5D4A52]">{result.title}</h3>
                    <p className="text-xs font-medium leading-relaxed text-[#8A707B]">{result.message}</p>
                  </div>

                  {/* Interactive Secret Note Box Reveal with unrolling paper scroll */}
                  {state.secretNote && (
                    <SparkyGiftBoxReveal 
                      secretNote={state.secretNote}
                      partnerAName={state.partnerAName}
                      partnerBName={state.partnerBName}
                    />
                  )}

                  {/* Highly polished Social Sharing Feature */}
                  <div className="bg-[#FFF9FB] border-2 border-[#FAD2E1] rounded-[28px] p-6 text-left space-y-4 shadow-sm">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-[#FF85A1] uppercase tracking-widest">
                      <Sparkles className="w-4 h-4 text-[#FF85A1]" /> Social Connection Sharing
                    </div>
                    <p className="text-xs leading-relaxed text-[#8A707B]">
                      Share your amazing compatibility score, or send a challenge link to invite your partner or friends to play!
                    </p>

                    {/* Copied Popup Feedback */}
                    <AnimatePresence>
                      {copied && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-xl p-2 text-center text-xs font-bold"
                        >
                          🎉 Match Message copied to clipboard with love! 💖 Paste it anywhere!
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Social Buttons Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {/* WhatsApp Button */}
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`We completed the Couple's Connection Quiz! 💖 We got ${score} / ${activeQuestions.length} matches! Try to beat our compatibility score here: ${appURL}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#25D366] text-white font-bold py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs shadow-md transition-all text-center cursor-pointer hover:bg-[#20b855]"
                      >
                        <span className="text-xl">💬</span>
                        <span>WhatsApp</span>
                      </motion.a>

                      {/* Twitter Button */}
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`We completed the Couple's Connection Quiz! 💖 We got ${score} / ${activeQuestions.length} matches! Try to beat our compatibility score here: ${appURL}`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#000000] text-white font-bold py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs shadow-md transition-all text-center cursor-pointer hover:bg-slate-900"
                      >
                        <span className="text-xl">🐦</span>
                        <span>Twitter/X</span>
                      </motion.a>

                      {/* Messenger/FB Button */}
                      <motion.a
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appURL)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-[#1877F2] text-white font-bold py-3 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs shadow-md transition-all text-center cursor-pointer hover:bg-[#145dbd]"
                      >
                        <span className="text-xl">🔵</span>
                        <span>Facebook</span>
                      </motion.a>

                      {/* Copy Message Button */}
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => {
                          const msg = `We completed the Couple's Connection Quiz! 💖 We got ${score} / ${activeQuestions.length} matches! Try to beat our compatibility score here: ${appURL}`;
                          navigator.clipboard.writeText(msg);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2500);
                        }}
                        className="bg-[#9166CC] text-white font-bold py-4 px-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-xs shadow-md transition-all text-center cursor-pointer hover:bg-[#7F54B8] border-none"
                      >
                        <span className="text-xl">📋</span>
                        <span>Copy Invite</span>
                      </motion.button>
                    </div>

                    {/* Traditional SMS as alternative trigger below */}
                    <div className="pt-2 border-t border-[#FAD2E1]/40 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-center sm:text-left">
                      <motion.a
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        href={`sms:?body=${encodeURIComponent(`We completed the Couple's Connection Quiz! 💖 We got ${score} / ${activeQuestions.length} matches! Try to beat our compatibility score here: ${appURL}`)}`}
                        className="w-full text-center text-[11px] font-bold text-[#5D4A52] underline flex items-center justify-center gap-1 hover:text-pink-500 transition-colors"
                      >
                        📲 Prefer to send a traditional SMS instead?
                      </motion.a>
                    </div>
                  </div>

                  {/* Question Breakdown Scroll Section */}
                  <div className="text-left mt-8">
                    <h4 className="text-xs font-bold text-[#8A707B] uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 inline text-[#FF85A1]" /> Quiz Breakdown Review
                    </h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {activeQuestions.map((q, idx) => {
                        const ansAId = state.partnerAAnswers[q.id];
                        const guessBId = state.partnerBGuesses[q.id];
                        const isMatch = ansAId === guessBId;

                        const optA = q.options.find(o => o.id === ansAId);
                        const optB = q.options.find(o => o.id === guessBId);

                        return (
                          <div key={q.id} className="p-4 rounded-[20px] bg-[#FFF9FB]/80 border border-[#FAD2E1] flex items-start gap-3 text-xs leading-relaxed font-semibold">
                            <span className="font-bold text-[#5D4A52] bg-[#FFD1DC] border border-[#FAD2E1] w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div className="flex-1 space-y-1.5 min-w-0 font-medium text-[#5D4A52]">
                              <span className="font-bold text-[#5D4A52] block text-wrap">
                                {q.text}
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                                <div className="bg-white p-2 rounded-xl border border-[#FAD2E1]/40">
                                  <span className="text-[#FF85A1] font-bold block uppercase tracking-wide text-[9px]">{state.partnerAName}:</span>
                                  <span className="text-[#5D4A52] font-semibold">{optA?.emoji} {optA?.text}</span>
                                </div>
                                <div className={`p-2 rounded-xl border ${
                                  isMatch ? 'bg-[#E2F0CB]/60 border-[#A5D6A7]' : 'bg-rose-50 border-rose-100'
                                }`}>
                                  <span className={`font-bold block uppercase tracking-wide text-[9px] ${
                                    isMatch ? 'text-emerald-500' : 'text-rose-500'
                                  }`}>{state.partnerBName}:</span>
                                  <span className="text-[#5D4A52] font-semibold">{optB?.emoji} {optB?.text}</span>
                                </div>
                              </div>
                            </div>
                            <span className="text-lg shrink-0 pt-0.5 font-bold">
                              {isMatch ? '💖' : '🤍'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Let's Switch / Play Again Button */}
                  <div className="pt-6 border-t border-[#FAD2E1]/40 flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleReset}
                      className="flex-1 py-3.5 px-5 rounded-full border-2 border-[#FFD1DC] text-[#5D4A52] hover:bg-[#FFF9FB] font-bold transition-all text-xs cursor-pointer flex items-center justify-center gap-1.5 focus:outline-none"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset and Play Again
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>

        </div> {/* Card container ends */}

        {/* Footer section matching Professional Polish theme precisely */}
        <footer className="px-4 md:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 mt-2 border-t border-[#FAD2E1]/25 relative">
          <div className="flex gap-4">
            <div className="flex items-center gap-2 text-xs font-extrabold text-[#5D4A52]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF85A1] animate-ping shrink-0" />
              <span className="w-2.5 h-2.5 bg-[#FF85A1] rounded-full shrink-0 absolute" />
              <span className="pl-4">
                Connected: {state.partnerAName && state.partnerBName ? `${state.partnerAName} & ${state.partnerBName}` : 'Honey Bunny & Cutie Pie'}
              </span>
            </div>
          </div>
          <div className="flex gap-4 md:gap-6 text-xs font-extrabold text-[#B5A1A9]">
            <button onClick={handleReset} className="hover:text-[#5D4A52] transition-colors cursor-pointer focus:outline-none">Restart Quiz</button>
            <button onClick={() => alert("All progress is securely autosaved in your local storage safe! 💖")} className="hover:text-[#5D4A52] transition-colors cursor-pointer focus:outline-none">Save Progress</button>
            <button onClick={() => alert("Take the quiz as Partner A, lock your secret note, then hand the device over to Partner B to find out your matches!")} className="hover:text-[#5D4A52] transition-colors cursor-pointer focus:outline-none">Help</button>
          </div>
        </footer>

      </div> {/* Main container ends */}

    </div>
  );
}
