export enum GameMode {
  MENU = 'MENU',
  SINGLE_PLAYER = 'SINGLE_PLAYER',
  LOCAL_VS = 'LOCAL_VS',
  ONLINE_VS = 'ONLINE_VS', // Simulated
}

export enum Operator {
  ADD = '+',
  SUB = '-',
  MUL = '×',
  DIV = '÷',
}

export interface Question {
  id: string;
  num1: number;
  num2: number;
  operator: Operator;
  answer: number;
  options: number[];
}

export interface PlayerState {
  score: number;
  streak: number;
  health: number; // For single player or VS
  currentQuestion: Question | null;
  questionIndex: number; // Track progress in shared queue
  isCorrect: boolean | null; // For animation feedback
  name: string;
  wrongAnswers: { question: Question; selected: number }[];
}

// For Gemini Analysis
export interface GameSessionStats {
  totalQuestions: number;
  correctAnswers: number;
  averageTimeSeconds: number;
  mode: string;
}