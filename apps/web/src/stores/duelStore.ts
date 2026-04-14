import { create } from 'zustand';

interface DuelQuestion {
  id: string;
  duel_id: string;
  question_number: number;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  time_limit_seconds: number;
  points: number;
}

interface DuelAnswer {
  id: string;
  duel_id: string;
  question_id: string;
  user_id: string;
  answer: string;
  points_earned: number;
}

interface Duel {
  id: string;
  user1_id: string;
  user2_id: string;
  match_id: string | null;
  status: string;
  type: string;
  user1_score: number;
  user2_score: number;
  user1_completed: boolean;
  user2_completed: boolean;
  total_questions: number;
  current_question: number;
  compatibility_score: number | null;
  ai_insight: string | null;
  started_at: string | null;
  completed_at: string | null;
  expires_at: string | null;
}

interface DuelState {
  currentDuel: Duel | null;
  questions: DuelQuestion[];
  myAnswers: DuelAnswer[];
  opponentAnswers: DuelAnswer[];
  currentQuestionIndex: number;
  myScore: number;
  setDuel: (duel: Duel) => void;
  setQuestions: (questions: DuelQuestion[]) => void;
  addAnswer: (answer: DuelAnswer) => void;
  setMyAnswers: (answers: DuelAnswer[]) => void;
  setOpponentAnswers: (answers: DuelAnswer[]) => void;
  nextQuestion: () => void;
  addScore: (points: number) => void;
  reset: () => void;
}

export const useDuelStore = create<DuelState>((set) => ({
  currentDuel: null,
  questions: [],
  myAnswers: [],
  opponentAnswers: [],
  currentQuestionIndex: 0,
  myScore: 0,

  setDuel: (duel) => set({ currentDuel: duel }),
  setQuestions: (questions) => set({ questions }),
  addAnswer: (answer) =>
    set((state) => ({
      myAnswers: [...state.myAnswers, answer],
    })),
  setMyAnswers: (answers) => set({ myAnswers: answers }),
  setOpponentAnswers: (answers) => set({ opponentAnswers: answers }),
  nextQuestion: () =>
    set((state) => ({
      currentQuestionIndex: state.currentQuestionIndex + 1,
    })),
  addScore: (points) =>
    set((state) => ({
      myScore: state.myScore + points,
    })),
  reset: () =>
    set({
      currentDuel: null,
      questions: [],
      myAnswers: [],
      opponentAnswers: [],
      currentQuestionIndex: 0,
      myScore: 0,
    }),
}));
