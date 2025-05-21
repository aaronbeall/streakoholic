import { MaterialCommunityIcons } from '@expo/vector-icons';
import { startOfDay, subDays, subMonths, subYears } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTaskContext } from '../context/TaskContext';
import { TaskStats } from '../types/Task';

type TimeFrame = 'week' | 'month' | 'year' | 'all';

const DashboardHeader: React.FC<{
  selectedTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  selectedTasks: string[];
  onTaskToggle: (taskId: string) => void;
}> = ({ selectedTimeFrame, onTimeFrameChange, selectedTasks, onTaskToggle }) => {
  const { tasks } = useTaskContext();
  const router = useRouter();

  return (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push('/')}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dashboard</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.headerContent}>
        <View style={styles.timeFrameContainer}>
          {(['week', 'month', 'year', 'all'] as TimeFrame[]).map((timeFrame) => (
            <TouchableOpacity
              key={timeFrame}
              style={[
                styles.timeFrameButton,
                selectedTimeFrame === timeFrame && styles.selectedTimeFrame,
              ]}
              onPress={() => onTimeFrameChange(timeFrame)}
            >
              <Text style={[
                styles.timeFrameText,
                selectedTimeFrame === timeFrame && styles.selectedTimeFrameText,
              ]}>
                {timeFrame === 'week' ? 'Last Week' :
                 timeFrame === 'month' ? 'Last Month' :
                 timeFrame === 'year' ? 'Last Year' : 'All Time'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.taskFilterContainer}>
          {tasks.map((task) => (
            <TouchableOpacity
              key={task.id}
              style={[
                styles.taskFilterButton,
                { backgroundColor: 'rgba(0, 0, 0, 0.05)' },
                selectedTasks.includes(task.id) && { backgroundColor: task.color },
              ]}
              onPress={() => onTaskToggle(task.id)}
            >
              <MaterialCommunityIcons
                name={task.icon}
                size={16}
                color={selectedTasks.includes(task.id) ? '#fff' : task.color}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
};

export const DashboardScreen: React.FC = () => {
  const { tasks } = useTaskContext();
  const { width } = useWindowDimensions();
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('week');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(tasks.map(t => t.id));

  const getDateRange = () => {
    const end = startOfDay(new Date());
    switch (selectedTimeFrame) {
      case 'week':
        return { start: subDays(end, 7), end };
      case 'month':
        return { start: subMonths(end, 1), end };
      case 'year':
        return { start: subYears(end, 1), end };
      default:
        return { start: new Date(0), end };
    }
  };

  const { start, end } = getDateRange();

  const filteredTasks = tasks.filter(task => selectedTasks.includes(task.id));

  const calculateAggregateStats = (): TaskStats => {
    const stats: TaskStats = {
      totalCompletions: 0,
      completionRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      streakStatus: 'never_started',
      lastStreak: null,
    };

    filteredTasks.forEach(task => {
      if (task.stats) {
        stats.totalCompletions += task.stats.totalCompletions;
        stats.completionRate = (stats.completionRate + task.stats.completionRate) / 2;
        stats.currentStreak = Math.max(stats.currentStreak, task.stats.currentStreak);
        stats.bestStreak = Math.max(stats.bestStreak, task.stats.bestStreak);
      }
    });

    return stats;
  };

  const stats = calculateAggregateStats();

  const chartData = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      data: [0, 0, 0, 0, 0, 0, 0], // TODO: Calculate actual completion data
    }],
  };

  return (
    <View style={styles.container}>
      <DashboardHeader
        selectedTimeFrame={selectedTimeFrame}
        onTimeFrameChange={setSelectedTimeFrame}
        selectedTasks={selectedTasks}
        onTaskToggle={(taskId) => {
          setSelectedTasks(prev => 
            prev.includes(taskId)
              ? prev.filter(id => id !== taskId)
              : [...prev, taskId]
          );
        }}
      />
      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#2E7D32" />
            <Text style={[styles.statLabel, { color: '#2E7D32' }]}>Total Completions</Text>
            <Text style={[styles.statValue, { color: '#2E7D32' }]}>{stats.totalCompletions}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#1976D2" />
            <Text style={[styles.statLabel, { color: '#1976D2' }]}>Completion Rate</Text>
            <Text style={[styles.statValue, { color: '#1976D2' }]}>{Math.round(stats.completionRate * 100)}%</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF3E0' }]}>
            <MaterialCommunityIcons name="fire" size={24} color="#E65100" />
            <Text style={[styles.statLabel, { color: '#E65100' }]}>Current Streak</Text>
            <Text style={[styles.statValue, { color: '#E65100' }]}>{stats.currentStreak}</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFF8E1' }]}>
            <MaterialCommunityIcons name="trophy" size={24} color="#FFA000" />
            <Text style={[styles.statLabel, { color: '#FFA000' }]}>Best Streak</Text>
            <Text style={[styles.statValue, { color: '#FFA000' }]}>{stats.bestStreak}</Text>
          </View>
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Completion History</Text>
          <LineChart
            data={chartData}
            width={width - 32}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              style: {
                borderRadius: 16,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  headerContent: {
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeFrameContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
  },
  timeFrameButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
  selectedTimeFrame: {
    backgroundColor: '#007AFF',
  },
  timeFrameText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedTimeFrameText: {
    color: '#fff',
  },
  taskFilterContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  taskFilterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 16,
  },
  statCard: {
    width: '47%',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    margin: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 