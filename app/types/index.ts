import { MaterialCommunityIcons } from '@expo/vector-icons';

export type MaterialCommunityIconName = keyof typeof MaterialCommunityIcons.glyphMap;

export interface Task {
  id: string;
  name: string;
  icon: MaterialCommunityIconName;
  color: string;
  daysOfWeek: number[];
  timesPerDay: number;
  duration: number;
  createdAt: string;
  updatedAt: string;
  stats?: TaskStats;
  completions?: TaskCompletion[];
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  date: string;
  completedAt: string;
  timesCompleted: number;
}

export interface TaskStats {
  currentStreak: number;
  bestStreak: number;
  totalCompletions: number;
  completionRate: number;
  lastCompleted?: string;
  lastStreak: number;
}

export interface TaskWithStats extends Task {
  stats: TaskStats;
  completions: TaskCompletion[];
}

export type RootStackParamList = {
  Home: undefined;
  AddTask: undefined;
  TaskDetails: { taskId: string };
}; 