import AsyncStorage from '@react-native-async-storage/async-storage';
import { differenceInDays, format, subDays } from 'date-fns';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { StreakStatus, Task, TaskCompletion, TaskStats } from '../types';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, date?: Date) => Promise<void>;
  uncompleteTask: (taskId: string, date: Date) => Promise<void>;
  isTaskCompleted: (task: Task, date?: Date) => boolean;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

const calculateTaskStats = (completions: TaskCompletion[]): TaskStats => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

  // Sort completions by date in ascending order
  const sortedCompletions = [...completions].sort((a, b) => a.date.localeCompare(b.date));
  
  // Find all streaks
  const streaks: { start: string; end: string; length: number }[] = [];
  let currentStreak: { start: string; end: string; length: number } | null = null;

  for (let i = 0; i < sortedCompletions.length; i++) {
    const current = sortedCompletions[i];
    const next = sortedCompletions[i + 1];
    
    if (!currentStreak) {
      currentStreak = {
        start: current.date,
        end: current.date,
        length: 1
      };
    }

    if (next) {
      const currentDate = new Date(current.date);
      const nextDate = new Date(next.date);
      const dayDiff = differenceInDays(nextDate, currentDate);
      
      if (dayDiff === 1) {
        // Continue streak
        currentStreak.end = next.date;
        currentStreak.length++;
      } else {
        // End streak
        streaks.push(currentStreak);
        currentStreak = {
          start: next.date,
          end: next.date,
          length: 1
        };
      }
    } else {
      // Last completion
      streaks.push(currentStreak);
    }
  }

  // Sort streaks by end date (most recent first)
  streaks.sort((a, b) => b.end.localeCompare(a.end));

  // Find best streak
  const bestStreak = streaks.length > 0 
    ? Math.max(...streaks.map(s => s.length))
    : 0;

  // Determine current streak and streak status
  let currentStreakLength = 0;
  let lastStreakLength = 0;
  let streakStatus: StreakStatus = 'never_started';

  if (streaks.length > 0) {
    const mostRecentStreak = streaks[0];
    lastStreakLength = mostRecentStreak.length;

    if (mostRecentStreak.end === today) {
      currentStreakLength = mostRecentStreak.length;
      streakStatus = 'up_to_date';
    } else if (mostRecentStreak.end === yesterday) {
      currentStreakLength = mostRecentStreak.length;
      streakStatus = 'expiring';
    } else {
      streakStatus = 'expired';
    }
  }

  // Calculate completion rate
  const totalDays = differenceInDays(new Date(), new Date(sortedCompletions[0]?.date || today)) + 1;
  const completionRate = totalDays > 0 ? completions.length / totalDays : 0;

  return {
    currentStreak: currentStreakLength,
    lastStreak: lastStreakLength,
    bestStreak,
    totalCompletions: completions.length,
    completionRate,
    streakStatus,
  };
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completionCache, setCompletionCache] = useState<Map<string, Set<string>>>(new Map());

  // Update completion cache when tasks change
  useEffect(() => {
    const newCache = new Map<string, Set<string>>();
    tasks.forEach(task => {
      if (task.completions) {
        const dates = new Set(task.completions.map(c => c.date));
        newCache.set(task.id, dates);
      }
    });
    setCompletionCache(newCache);
  }, [tasks]);

  // Load tasks and calculate initial stats
  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        const loadedTasks: Task[] = JSON.parse(storedTasks);
        const tasksWithStats = loadedTasks.map(task => ({
          ...task,
          stats: calculateTaskStats(task.completions || []),
        }));
        setTasks(tasksWithStats);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  // Check for day change and update stats
  useEffect(() => {
    let lastDate = format(new Date(), 'yyyy-MM-dd');
    const interval = setInterval(() => {
      const currentDate = format(new Date(), 'yyyy-MM-dd');
      if (currentDate !== lastDate) {
        lastDate = currentDate;
        const updatedTasks = tasks.map(task => ({
          ...task,
          stats: calculateTaskStats(task.completions || []),
        }));
        setTasks(updatedTasks);
      }
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks]);

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      setTasks(updatedTasks);
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
    } catch (error) {
      console.error('Error saving tasks:', error);
    }
  };

  const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completions: [],
      stats: calculateTaskStats([]),
    };
    await saveTasks([...tasks, newTask]);
  };

  const updateTask = async (task: Task) => {
    const updatedTask = {
      ...task,
      updatedAt: new Date().toISOString(),
      stats: calculateTaskStats(task.completions || []),
    };
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? updatedTask : t
    );
    await saveTasks(updatedTasks);
  };

  const deleteTask = async (taskId: string) => {
    const updatedTasks = tasks.filter(t => t.id !== taskId);
    await saveTasks(updatedTasks);
  };

  const completeTask = async (taskId: string, date: Date = new Date()) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const completion: TaskCompletion = {
      id: Date.now().toString(),
      taskId,
      date: dateString,
      completedAt: new Date().toISOString(),
      timesCompleted: 1,
    };

    const newCompletions = [...(task.completions || []), completion];
    const updatedTask = {
      ...task,
      completions: newCompletions,
    };
    await updateTask(updatedTask);
  };

  const uncompleteTask = async (taskId: string, date: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const dateString = format(date, 'yyyy-MM-dd');
    const newCompletions = (task.completions || []).filter(
      completion => completion.date !== dateString
    );
    const updatedTask = {
      ...task,
      completions: newCompletions,
    };
    await updateTask(updatedTask);
  };

  const isCompleted = (task: Task, date: Date = new Date()) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const taskDates = completionCache.get(task.id);
    return taskDates?.has(dateString) ?? false;
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        uncompleteTask,
        isTaskCompleted: isCompleted,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}; 