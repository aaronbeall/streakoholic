import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, format, parseISO, startOfDay, subDays, subMonths, subYears } from 'date-fns';
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
import { BarChart, LineChart } from 'react-native-chart-kit';
import { useTaskContext } from '../context/TaskContext';
import { TaskStats } from '../types/Task';

type TimeFrame = 'week' | 'month' | 'year' | 'all';

const DashboardHeader: React.FC<{
  selectedTimeFrame: TimeFrame;
  onTimeFrameChange: (timeFrame: TimeFrame) => void;
  selectedTasks: string[];
  onTaskToggle: (taskId: string) => void;
  dateRangeLabel: string;
}> = ({ selectedTimeFrame, onTimeFrameChange, selectedTasks, onTaskToggle, dateRangeLabel }) => {
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
        <View style={styles.headerTitleContainer}>
          <MaterialCommunityIcons name="calendar" size={16} color="#666" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>{dateRangeLabel}</Text>
        </View>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.headerContent}>
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
      </View>
    </View>
  );
};

export const DashboardScreen: React.FC = () => {
  const { tasks } = useTaskContext();
  const { width } = useWindowDimensions();
  const [selectedTimeFrame, setSelectedTimeFrame] = useState<TimeFrame>('week');
  const [selectedTasks, setSelectedTasks] = useState<string[]>(tasks.map(t => t.id));
  const [isCumulative, setIsCumulative] = useState(false);

  const getDateRange = () => {
    const end = startOfDay(new Date());
    
    if (selectedTimeFrame === 'all') {
      // Find earliest completion date across all tasks
      let minDate = new Date();
      let hasCompletions = false;

      tasks.forEach(task => {
        task.completions?.forEach(completion => {
          const completionDate = parseISO(completion.date);
          if (completionDate < minDate) minDate = completionDate;
          hasCompletions = true;
        });
      });

      // If no completions, default to last 30 days
      if (!hasCompletions) {
        return { start: subDays(end, 30), end };
      }

      return { 
        start: startOfDay(minDate),
        end
      };
    }

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

  const getFilteredCompletions = () => {
    return filteredTasks.map(task => ({
      ...task,
      completions: task.completions?.filter(completion => {
        // Skip date filtering for "all" time frame
        if (selectedTimeFrame === 'all') return true;
        
        const completionDate = parseISO(completion.date);
        return completionDate >= start && completionDate <= end;
      }) || []
    }));
  };

  const filteredTaskData = getFilteredCompletions();

  const calculateAggregateStats = (): TaskStats => {
    const stats: TaskStats = {
      totalCompletions: 0,
      completionRate: 0,
      currentStreak: 0,
      bestStreak: 0,
      streakStatus: 'never_started',
      lastStreak: null,
    };

    filteredTaskData.forEach(task => {
      if (task.stats) {
        stats.totalCompletions += task.completions.length;
        stats.completionRate = (stats.completionRate + task.stats.completionRate) / 2;
        stats.currentStreak = Math.max(stats.currentStreak, task.stats.currentStreak);
        stats.bestStreak = Math.max(stats.bestStreak, task.stats.bestStreak);
      }
    });

    return stats;
  };

  const stats = calculateAggregateStats();

  const getChartData = () => {
    const today = new Date();
    let startDate: Date;
    let labels: string[] = [];
    let data: number[] = [];
    let groupSize = 1; // Default group size

    switch (selectedTimeFrame) {
      case 'week':
        startDate = subDays(today, 6); // 7 days including today
        labels = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(today, i); // Start from today and go backwards
          return format(date, 'EEE');
        }).reverse(); // Reverse to maintain left-to-right order
        data = Array(7).fill(0);
        break;
      case 'month':
        startDate = subDays(today, 29); // 30 days including today
        labels = Array.from({ length: 30 }, (_, i) => {
          const date = subDays(today, i); // Start from today and go backwards
          return i % 5 === 0 ? format(date, 'MMM d') : '';
        }).reverse(); // Reverse to maintain left-to-right order
        data = Array(30).fill(0);
        break;
      case 'year':
        startDate = subMonths(today, 11); // 12 months including current month
        labels = Array.from({ length: 12 }, (_, i) => {
          const date = subMonths(today, i); // Start from today and go backwards
          return format(date, 'MMM');
        }).reverse(); // Reverse to maintain left-to-right order
        data = Array(12).fill(0);
        break;
      case 'all':
        // Find first and last completion dates
        const completionDates = filteredTaskData.flatMap(task => 
          task.completions?.map(c => parseISO(c.date)) || []
        );
        if (completionDates.length === 0) {
          startDate = subDays(today, 30);
        } else {
          startDate = new Date(Math.min(...completionDates.map(d => d.getTime())));
        }
        
        const totalDays = Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        let dateFormat: string;

        if (totalDays <= 30) {
          // If less than a month, show daily
          groupSize = 1;
          dateFormat = 'MMM d';
        } else if (totalDays <= 90) {
          // If less than 3 months, show weekly
          groupSize = 7;
          dateFormat = 'MMM d';
        } else if (totalDays <= 365) {
          // If less than a year, show monthly
          groupSize = 30;
          dateFormat = 'MMM';
        } else {
          // If more than a year, show quarterly
          groupSize = 90;
          dateFormat = 'MMM yyyy';
        }

        const numGroups = Math.ceil(totalDays / groupSize);
        const midPoint = Math.floor(numGroups / 2);
        
        labels = Array.from({ length: numGroups }, (_, i) => {
          if (i === 0 || i === midPoint || i === numGroups - 1) {
            const date = addDays(startDate, i * groupSize);
            return format(date, dateFormat);
          }
          return '';
        });
        data = Array(numGroups).fill(0);
        break;
    }

    filteredTaskData.forEach(task => {
      task.completions.forEach(completion => {
        const date = parseISO(completion.date);
        if (date >= startDate && date <= today) {
          const index = selectedTimeFrame === 'week' 
            ? 6 - Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
            : selectedTimeFrame === 'month'
            ? 29 - Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
            : selectedTimeFrame === 'year'
            ? 11 - Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30))
            : Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * groupSize));
          if (index >= 0 && index < data.length) {
            data[index]++;
          }
        }
      });
    });

    // Convert to cumulative if needed
    if (isCumulative) {
      let runningTotal = 0;
      data = data.map(value => {
        runningTotal += value;
        return runningTotal;
      });
    }

    return { labels, data };
  };

  const { labels, data } = getChartData();
  const chartData = {
    labels,
    datasets: [{
      data,
      color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
      strokeWidth: 2,
    }],
  };

  const getDateRangeLabel = () => {
    const { start, end } = getDateRange();
    
    const startYear = start.getFullYear();
    const endYear = end.getFullYear();
    const startMonth = start.getMonth();
    const endMonth = end.getMonth();
    const startDay = start.getDate();
    const endDay = end.getDate();

    // If same year and month, only show day range
    if (startYear === endYear && startMonth === endMonth) {
      return `${format(start, 'MMM d')} - ${endDay}`;
    }
    
    // If same year but different months, show month and day
    if (startYear === endYear) {
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d')}`;
    }
    
    // If different years, show full date
    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
  };

  const getCompletionPatterns = () => {
    const dayOfWeekData = Array(7).fill(0);
    const hourOfDayData = Array(24).fill(0);
    const today = new Date();
    let startDate: Date;

    // Set start date based on time range
    switch (selectedTimeFrame) {
      case 'week':
        startDate = subDays(today, 6);
        break;
      case 'month':
        startDate = subDays(today, 29);
        break;
      case 'year':
        startDate = subMonths(today, 11);
        break;
      case 'all':
        // Find first completion date
        const completionDates = filteredTaskData.flatMap(task => 
          task.completions?.map(c => parseISO(c.date)) || []
        );
        startDate = completionDates.length > 0 
          ? new Date(Math.min(...completionDates.map(d => d.getTime())))
          : subDays(today, 30);
        break;
    }

    filteredTaskData.forEach(task => {
      task.completions.forEach(completion => {
        const date = parseISO(completion.date);
        if (date >= startDate && date <= today) {
          // Day of week (0 = Sunday, 6 = Saturday)
          dayOfWeekData[date.getDay()] += completion.timesCompleted;
          // Hour of day (0-23)
          hourOfDayData[date.getHours()] += completion.timesCompleted;
        }
      });
    });

    return { dayOfWeekData, hourOfDayData };
  };

  const { dayOfWeekData, hourOfDayData } = getCompletionPatterns();

  const dayOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hourOfDayLabels = Array.from({ length: 24 }, (_, i) => {
    if (i % 6 === 0) { // Show every 6 hours
      const hour = i === 0 || i === 12 ? 12 : i % 12;
      const ampm = i < 12 ? 'am' : 'pm';
      return `${hour}${ampm}`;
    }
    return '';
  });

  const dayOfWeekChartData = {
    labels: dayOfWeekLabels,
    datasets: [{
      data: dayOfWeekData,
    }],
  };

  const hourOfDayChartData = {
    labels: hourOfDayLabels,
    datasets: [{
      data: hourOfDayData,
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
        dateRangeLabel={getDateRangeLabel()}
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
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Activity</Text>
            <TouchableOpacity
              style={[styles.cumulativeToggle, isCumulative && styles.cumulativeToggleActive]}
              onPress={() => setIsCumulative(!isCumulative)}
            >
              <MaterialCommunityIcons 
                name="chart-line-variant" 
                size={20} 
                color={isCumulative ? '#fff' : '#666'} 
              />
            </TouchableOpacity>
          </View>
          <LineChart
            data={chartData}
            width={width - 48}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => '#999',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#f0f0f0',
                strokeWidth: 1,
              },
              propsForLabels: {
                fontSize: 11,
                fontFamily: 'System',
                fontWeight: '400',
              },
              fillShadowGradient: '#007AFF',
              fillShadowGradientOpacity: 0.2,
            }}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={true}
            style={styles.chart}
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Day of Week</Text>
          <BarChart
            data={dayOfWeekChartData}
            width={width - 48}
            height={220}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => '#999',
              style: {
                borderRadius: 16,
              },
              propsForLabels: {
                fontSize: 11,
                fontFamily: 'System',
                fontWeight: '400',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: 'rgba(0,0,0,0)',
                strokeWidth: 1,
              },
            }}
            style={styles.chart}
            fromZero
          />
        </View>

        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Hour of Day</Text>
          <LineChart
            data={hourOfDayChartData}
            width={width - 48}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
              labelColor: (opacity = 1) => '#999',
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
              },
              propsForBackgroundLines: {
                strokeDasharray: '',
                stroke: '#f0f0f0',
                strokeWidth: 1,
              },
              propsForLabels: {
                fontSize: 11,
                fontFamily: 'System',
                fontWeight: '400',
              },
              fillShadowGradient: '#007AFF',
              fillShadowGradientOpacity: 0.2,
            }}
            bezier
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={true}
            withDots={true}
            withShadow={true}
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
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666',
  },
  headerIcon: {
    marginTop: 1,
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
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  cumulativeToggle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(240, 240, 240, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cumulativeToggleActive: {
    backgroundColor: '#007AFF',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 