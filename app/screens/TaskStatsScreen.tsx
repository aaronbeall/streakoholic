import { MaterialCommunityIcons } from '@expo/vector-icons';
import { startOfWeek, subDays } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTaskContext } from '../context/TaskContext';

export default function TaskStatsScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { tasks } = useTaskContext();

  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return null;
  }

  const getWeeklyStats = () => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const completions = task.completions?.filter(completion => {
      const date = new Date(completion.date);
      return date >= weekStart && date <= today;
    }) || [];
    return {
      completed: completions.length,
      total: 7
    };
  };

  const getMonthlyStats = () => {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);
    const completions = task.completions?.filter(completion => {
      const date = new Date(completion.date);
      return date >= thirtyDaysAgo && date <= today;
    }) || [];
    return {
      completed: completions.length,
      total: 30
    };
  };

  const getYearlyStats = () => {
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    const completions = task.completions?.filter(completion => {
      const date = new Date(completion.date);
      return date >= yearStart && date <= today;
    }) || [];
    return {
      completed: completions.length,
      total: Math.ceil((today.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24))
    };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();
  const yearlyStats = getYearlyStats();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name={task.icon} size={24} color={task.color} />
          <Text style={styles.title}>{task.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Streak</Text>
            <View style={styles.statValue}>
              <MaterialCommunityIcons name="fire" size={20} color="#FF6B6B" />
              <Text style={styles.statNumber}>{task.stats?.currentStreak || 0}</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Best Streak</Text>
            <View style={styles.statValue}>
              <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" />
              <Text style={styles.statNumber}>{task.stats?.bestStreak || 0}</Text>
            </View>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Total Completions</Text>
            <View style={styles.statValue}>
              <MaterialCommunityIcons name="check-circle" size={20} color="#4CAF50" />
              <Text style={styles.statNumber}>{task.stats?.totalCompletions || 0}</Text>
            </View>
          </View>
        </View>

        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Completion Rates</Text>
          
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>This Week</Text>
              <Text style={styles.progressValue}>{weeklyStats.completed}/{weeklyStats.total}</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: task.color + '33' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: task.color,
                    width: `${(weeklyStats.completed / weeklyStats.total) * 100}%`
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Past 30 Days</Text>
              <Text style={styles.progressValue}>{monthlyStats.completed}/{monthlyStats.total}</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: task.color + '33' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: task.color,
                    width: `${(monthlyStats.completed / monthlyStats.total) * 100}%`
                  }
                ]} 
              />
            </View>
          </View>

          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>This Year</Text>
              <Text style={styles.progressValue}>{yearlyStats.completed}/{yearlyStats.total}</Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: task.color + '33' }]}>
              <View 
                style={[
                  styles.progressFill, 
                  { 
                    backgroundColor: task.color,
                    width: `${(yearlyStats.completed / yearlyStats.total) * 100}%`
                  }
                ]} 
              />
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  progressSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 16,
    color: '#666',
  },
  progressValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
}); 