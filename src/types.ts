/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface QuestionOption {
  id: string;
  text: string;
  emoji: string;
}

export type QuestionCategory = 'favorites' | 'memory' | 'future' | 'habits' | 'anniversary_memories' | 'pet_peeves_quirks' | 'future_dreams';

export interface Question {
  id: string;
  category: QuestionCategory;
  categoryLabel: string;
  text: string;
  options: QuestionOption[];
  quizmasterComment: {
    partnerA: string;
    partnerBCorrect: string;
    partnerBIncorrect: string;
  };
}

export interface QuizState {
  partnerAName: string;
  partnerBName: string;
  partnerAAnswers: Record<string, string>; // questionId -> optionId
  partnerBGuesses: Record<string, string>; // questionId -> optionId
  currentQuestionIndex: number;
  phase: 'welcome' | 'partnerA_quiz' | 'partnerA_complete' | 'partnerB_welcome' | 'partnerB_quiz' | 'results';
  secretNote: string;
  questionIds?: string[];
  customQuestions?: Question[];
  isRemoteSession?: boolean;
  sessionId?: string;
}
