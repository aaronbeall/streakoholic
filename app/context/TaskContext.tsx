import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Task, TaskCompletion, TaskStats } from '../types';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string, date?: Date) => Promise<void>;
  uncompleteTask: (taskId: string, date: Date) => Promise<void>;
  getTaskStats: (taskId: string) => TaskStats;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const useTaskContext = () => {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
};

export const TaskProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem('tasks');
      if (storedTasks) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

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
    };
    await saveTasks([...tasks, newTask]);
  };

  const updateTask = async (task: Task) => {
    const updatedTasks = tasks.map(t => 
      t.id === task.id ? { ...task, updatedAt: new Date().toISOString() } : t
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

    const dateString = date.toISOString();
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
      stats: calculateTaskStats(newCompletions),
    };

    await updateTask(updatedTask);
  };

  const uncompleteTask = async (taskId: string, date: Date) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const dateString = date.toISOString();
    const newCompletions = (task.completions || []).filter(
      completion => completion.date !== dateString
    );
    
    const updatedTask = {
      ...task,
      completions: newCompletions,
      stats: calculateTaskStats(newCompletions),
    };

    await updateTask(updatedTask);
  };

  const calculateTaskStats = (completions: TaskCompletion[]): TaskStats => {
    const sortedCompletions = [...completions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedCompletions.length; i++) {
      const completion = sortedCompletions[i];
      const nextCompletion = sortedCompletions[i + 1];
      
      if (nextCompletion) {
        const currentDate = new Date(completion.date);
        const nextDate = new Date(nextCompletion.date);
        const dayDiff = (nextDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

        if (dayDiff === 1) {
          tempStreak++;
          if (tempStreak > bestStreak) {
            bestStreak = tempStreak;
          }
        } else {
          tempStreak = 0;
        }
      }
    }

    // Calculate current streak
    const lastCompletion = sortedCompletions[sortedCompletions.length - 1];
    if (lastCompletion && lastCompletion.date === today) {
      currentStreak = tempStreak + 1;
    }

    const totalCompletions = completions.reduce((sum, c) => sum + c.timesCompleted, 0);
    const completionRate = Math.round((totalCompletions / (tasks.length * 7)) * 100);

    return {
      currentStreak,
      bestStreak,
      totalCompletions,
      completionRate,
      lastCompleted: lastCompletion?.date,
    };
  };

  const getTaskStats = (taskId: string): TaskStats => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || !task.completions) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        totalCompletions: 0,
        completionRate: 0,
      };
    }
    return calculateTaskStats(task.completions);
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
        getTaskStats,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
}; 