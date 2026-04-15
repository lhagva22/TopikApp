// store/levelTestStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LevelTestResult {
  id: string;
  level: string;
  levelValue: number;
  percentage: number;
  correctCount: number;
  totalQuestions: number;
  date: string;
  answers: Record<number, number>;
}

interface LevelTestState {
  results: LevelTestResult[];
  isLoading: boolean;
  error: string | null;
  
  saveResult: (result: Omit<LevelTestResult, 'id' | 'date'>) => Promise<void>;
  getResults: () => LevelTestResult[];
  getLatestResult: () => LevelTestResult | null;
  clearResults: () => Promise<void>;
}

export const useLevelTestStore = create<LevelTestState>((set, get) => ({
  results: [],
  isLoading: false,
  error: null,

  saveResult: async (result) => {
    set({ isLoading: true, error: null });
    try {
      const newResult: LevelTestResult = {
        ...result,
        id: Date.now().toString(),
        date: new Date().toISOString(),
      };
      
      // Local state хадгалах
      set((state) => ({
        results: [newResult, ...state.results],
        isLoading: false,
      }));
      
      // AsyncStorage-д хадгалах
      const savedResults = await AsyncStorage.getItem('level_test_results');
      const existingResults = savedResults ? JSON.parse(savedResults) : [];
      const updatedResults = [newResult, ...existingResults];
      await AsyncStorage.setItem('level_test_results', JSON.stringify(updatedResults));
      
    } catch (error) {
      console.error('Error saving level test result:', error);
      set({ error: 'Failed to save result', isLoading: false });
    }
  },

  getResults: () => {
    return get().results;
  },

  getLatestResult: () => {
    const results = get().results;
    return results.length > 0 ? results[0] : null;
  },

  clearResults: async () => {
    set({ isLoading: true });
    try {
      await AsyncStorage.removeItem('level_test_results');
      set({ results: [], isLoading: false });
    } catch (error) {
      console.error('Error clearing results:', error);
      set({ error: 'Failed to clear results', isLoading: false });
    }
  },
}));

// Load saved results on app start
export const loadLevelTestResults = async () => {
  try {
    const savedResults = await AsyncStorage.getItem('level_test_results');
    if (savedResults) {
      const results = JSON.parse(savedResults);
      useLevelTestStore.setState({ results });
    }
  } catch (error) {
    console.error('Error loading level test results:', error);
  }
};