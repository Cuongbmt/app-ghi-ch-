
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  mood?: string;
  aiInsights?: AIInsight | null;
}

export interface AIInsight {
  moodSummary: string;
  keyThemes: string[];
  suggestions: string;
  sentimentScore: number; // 1-10
}

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
};
