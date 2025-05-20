import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, TaskCompletion, TaskStats } from '../types';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, date?: Date) => Promise<void>;
  uncompleteTask: (taskId: string, date: Date) => Promise<void>;
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
  if (!completions || completions.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      totalCompletions: 0,
      completionRate: 0,
      lastCompleted: undefined,
      lastStreak: 0,
    };
  }

  // Sort completions by date in descending order
  const sortedCompletions = [...completions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Calculate current streak
  let currentStreak = 0;
  const today = format(new Date(), 'yyyy-MM-dd');
  const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

  // Only count streak if most recent completion is today or yesterday
  if (sortedCompletions[0].date === today || sortedCompletions[0].date === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < sortedCompletions.length; i++) {
      const currentDate = new Date(sortedCompletions[i - 1].date);
      const prevDate = new Date(sortedCompletions[i].date);
      const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (dayDiff === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate best streak and last streak
  let bestStreak = 0;
  let lastStreak = 0;
  let tempStreak = 1;
  let foundLastStreak = false;

  for (let i = 1; i < sortedCompletions.length; i++) {
    const currentDate = new Date(sortedCompletions[i - 1].date);
    const prevDate = new Date(sortedCompletions[i].date);
    const dayDiff = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (dayDiff === 1) {
      tempStreak++;
      bestStreak = Math.max(bestStreak, tempStreak);
    } else {
      if (!foundLastStreak) {
        lastStreak = tempStreak;
        foundLastStreak = true;
      }
      tempStreak = 1;
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);
  if (!foundLastStreak) {
    lastStreak = tempStreak;
  }

  const totalCompletions = completions.reduce((sum, c) => sum + c.timesCompleted, 0);
  const completionRate = totalCompletions / (completions.length * 7); // Assuming 7 days per week

  return {
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRate,
    lastCompleted: sortedCompletions[0].date,
    lastStreak,
  };
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

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
      await AsyncStorage.setItem('tasks', JSON.stringify(updatedTasks));
      setTasks(updatedTasks);
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

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        uncompleteTask,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}; 