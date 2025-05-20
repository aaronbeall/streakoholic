import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, format, subDays, subMonths } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import tinycolor from 'tinycolor2';
import { useTaskContext } from '../context/TaskContext';

type TimeRange = 'week' | 'month' | 'year' | 'all';

export default function TaskStatsScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { tasks } = useTaskContext();
  const [timeRange, setTimeRange] = useState<TimeRange>('month');

  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return null;
  }

  const getTimeRangeData = () => {
    const today = new Date();
    let startDate: Date;
    let labels: string[] = [];
    let data: number[] = [];
    let groupSize = 1; // Default group size

    switch (timeRange) {
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
        const completionDates = task.completions?.map(c => new Date(c.date)) || [];
        if (completionDates.length === 0) {
          startDate = new Date(task.createdAt);
        } else {
          startDate = new Date(Math.min(...completionDates.map(d => d.getTime())));
          const lastCompletion = new Date(Math.max(...completionDates.map(d => d.getTime())));
          today.setTime(lastCompletion.getTime()); // Use last completion as the end date
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

    task.completions?.forEach(completion => {
      const date = new Date(completion.date);
      if (date >= startDate && date <= today) {
        const index = timeRange === 'week' 
          ? 6 - Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
          : timeRange === 'month'
          ? 29 - Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
          : timeRange === 'year'
          ? 11 - Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30))
          : Math.floor((date.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * groupSize));
        if (index >= 0 && index < data.length) {
          data[index] += completion.timesCompleted;
        }
      }
    });

    return { labels, data };
  };

  const { labels, data } = getTimeRangeData();
  const chartData = {
    labels,
    datasets: [{
      data,
      color: (opacity = 1) => task.color,
      strokeWidth: 2,
    }],
  };

  const getBackgroundColor = (color: string) => {
    const colorObj = tinycolor(color);
    return tinycolor({
      h: colorObj.toHsl().h,
      s: 15,
      l: 95
    }).toString();
  };

  const TimeRangeButton = ({ range, label }: { range: TimeRange; label: string }) => (
    <TouchableOpacity
      style={[styles.timeRangeButton, timeRange === range && { backgroundColor: task.color }]}
      onPress={() => setTimeRange(range)}
    >
      <Text style={[styles.timeRangeButtonText, timeRange === range && { color: '#fff' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const getCompletionPatterns = () => {
    const dayOfWeekData = Array(7).fill(0);
    const hourOfDayData = Array(24).fill(0);

    task.completions?.forEach(completion => {
      const date = new Date(completion.date);
      // Day of week (0 = Sunday, 6 = Saturday)
      dayOfWeekData[date.getDay()] += completion.timesCompleted;
      // Hour of day (0-23)
      hourOfDayData[date.getHours()] += completion.timesCompleted;
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
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name={task.icon} size={24} color={task.color} />
          <Text style={styles.title}>{task.name}</Text>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: getBackgroundColor(task.color) }]}>
            <MaterialCommunityIcons name="fire" size={24} color="#FF6B6B" />
            <Text style={[styles.statNumber, { color: '#FF6B6B' }]}>{task.stats?.currentStreak || 0}</Text>
            <Text style={styles.statLabel}>Current Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: getBackgroundColor(task.color) }]}>
            <MaterialCommunityIcons name="trophy" size={24} color="#FFD700" />
            <Text style={[styles.statNumber, { color: '#FFD700' }]}>{task.stats?.bestStreak || 0}</Text>
            <Text style={styles.statLabel}>Best Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: getBackgroundColor(task.color) }]}>
            <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
            <Text style={[styles.statNumber, { color: '#4CAF50' }]}>{task.stats?.totalCompletions || 0}</Text>
            <Text style={styles.statLabel}>Total Completions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: getBackgroundColor(task.color) }]}>
            <MaterialCommunityIcons name="chart-line" size={24} color="#2196F3" />
            <Text style={[styles.statNumber, { color: '#2196F3' }]}>
              {Math.round((task.stats?.completionRate || 0) * 100)}%
            </Text>
            <Text style={styles.statLabel}>Completion Rate</Text>
          </View>
        </View>

        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Activity</Text>
            <View style={styles.timeRangeContainer}>
              <TimeRangeButton range="week" label="Week" />
              <TimeRangeButton range="month" label="Month" />
              <TimeRangeButton range="year" label="Year" />
              <TimeRangeButton range="all" label="All Time" />
            </View>
          </View>
          <View style={[styles.chartCard, { padding: 0, marginBottom: 16 }]}>
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - 48}
              height={180}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => task.color,
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
                fillShadowGradient: task.color,
                fillShadowGradientOpacity:.2,
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

          <View style={[styles.chartCard, { padding: 0, marginBottom: 16 }]}>
            <BarChart
              data={dayOfWeekChartData}
              width={Dimensions.get('window').width - 48}
              height={180}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => task.color,
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
                  stroke: '#f0f0f0',
                  strokeWidth: 1,
                },
              }}
              style={styles.chart}
              fromZero
            />
          </View>

          <View style={[styles.chartCard, { padding: 0 }]}>
            <LineChart
              data={hourOfDayChartData}
              width={Dimensions.get('window').width - 48}
              height={180}
              chartConfig={{
                backgroundColor: '#fff',
                backgroundGradientFrom: '#fff',
                backgroundGradientTo: '#fff',
                decimalPlaces: 0,
                color: (opacity = 1) => task.color,
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
                fillShadowGradient: task.color,
                fillShadowGradientOpacity: .2,
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  chartSection: {
    marginBottom: 24,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  timeRangeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  timeRangeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  timeRangeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
}); 