import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, isToday, parseISO, startOfWeek } from 'date-fns';
import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  size: number;
}

type CardSide = 'task' | 'calendar' | 'stats';

const TaskView: React.FC<{ task: Task }> = ({ task }) => {
  const getStreakBadgeStyle = () => {
    const currentStreak = task.stats?.currentStreak || 0;
    const lastCompleted = task.stats?.lastCompleted;
    
    if (!lastCompleted) {
      return {
        backgroundColor: '#6B8AFE',
        icon: 'sleep' as const,
      };
    }

    const lastCompletedDate = parseISO(lastCompleted);
    
    if (isToday(lastCompletedDate)) {
      return {
        backgroundColor: '#FF6B6B',
        icon: 'fire' as const,
      };
    }

    return {
      backgroundColor: '#FFA726',
      icon: 'clock-outline' as const,
    };
  };

  const streakBadgeStyle = getStreakBadgeStyle();

  return (
    <View style={styles.contentContainer}>
      <View style={[styles.iconContainer, { backgroundColor: task.color }]}>
        <MaterialCommunityIcons name={task.icon} size={64} color="#fff" />
      </View>
      <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
      <View style={styles.streakBadge}>
        <View style={[styles.streakBubble, { backgroundColor: streakBadgeStyle.backgroundColor }]}>
          <MaterialCommunityIcons name={streakBadgeStyle.icon} size={14} color="#fff" />
          <Text style={styles.streakText}>{task.stats?.currentStreak || 0}</Text>
        </View>
      </View>
    </View>
  );
};

const CalendarView: React.FC<{ task: Task }> = ({ task }) => {
  const today = new Date();
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const daysInMonth = endOfMonth.getDate();
  
  // Get the day of week for the first day of the month (0 = Sunday, 6 = Saturday)
  const firstDayOfWeek = startOfMonth.getDay();
  
  // Create array of all days in the month
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(today.getFullYear(), today.getMonth(), i + 1);
    const isCompleted = task.completions?.some(completion => 
      isToday(parseISO(completion.date)) && 
      parseISO(completion.date).getDate() === date.getDate()
    );
    return {
      date,
      isCompleted,
      isPast: date < today,
      isFuture: date > today,
      isToday: isToday(date)
    };
  });

  // Create grid array with empty cells for start of month
  const gridDays = [
    ...Array(firstDayOfWeek).fill(null),
    ...days
  ];

  const renderDay = ({ item: day, index }: { item: typeof days[0] | null, index: number }) => (
    <View style={styles.calendarDay}>
      {day ? (
        <View style={styles.calendarDayInner}>
          {day.isCompleted ? (
            // Completed day (past or current) - show filled colored circle
            <View style={[styles.calendarDot, { backgroundColor: task.color }]} />
          ) : day.isToday ? (
            // Current day incomplete - show colored border circle
            <View style={[styles.calendarDot, { borderWidth: 2, borderColor: task.color, backgroundColor: 'transparent' }]} />
          ) : day.isPast ? (
            // Past incomplete day - show X
            <Text style={styles.calendarX}>×</Text>
          ) : (
            // Future day - show gray circle
            <View style={[styles.calendarDot, styles.calendarDotFuture]} />
          )}
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarGrid}>
        <View style={styles.calendarDayNames}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.calendarDayName}>{day}</Text>
          ))}
        </View>
        <FlatList
          data={gridDays}
          renderItem={renderDay}
          numColumns={7}
          scrollEnabled={false}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>
    </View>
  );
};

const StatsView: React.FC<{ task: Task }> = ({ task }) => {
  const getWeeklyStats = () => {
    const today = new Date();
    const weekStart = startOfWeek(today);
    const completions = task.completions?.filter(completion => {
      const date = parseISO(completion.date);
      return date >= weekStart && date <= today;
    }) || [];
    return {
      completed: completions.length,
      total: 7
    };
  };

  const getMonthlyStats = () => {
    const today = new Date();
    const thirtyDaysAgo = addDays(today, -30);
    const completions = task.completions?.filter(completion => {
      const date = parseISO(completion.date);
      return date >= thirtyDaysAgo && date <= today;
    }) || [];
    return {
      completed: completions.length,
      total: 30
    };
  };

  const weeklyStats = getWeeklyStats();
  const monthlyStats = getMonthlyStats();

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Streak: {task.stats?.currentStreak || 0}</Text>
        <Text style={styles.statLabel}>Best: {task.stats?.bestStreak || 0}</Text>
      </View>
      <View style={[styles.progressBar, { backgroundColor: task.color + '33' }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: task.color,
              width: `${Math.min((task.stats?.currentStreak || 0) / 10 * 100, 100)}%` as const
            }
          ]} 
        />
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>This week</Text>
        <Text style={styles.statValue}>{weeklyStats.completed}/{weeklyStats.total}</Text>
      </View>
      <View style={[styles.progressBar, { backgroundColor: task.color + '33' }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: task.color,
              width: `${(weeklyStats.completed / weeklyStats.total) * 100}%` as const
            }
          ]} 
        />
      </View>

      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Past 30 days</Text>
        <Text style={styles.statValue}>{monthlyStats.completed}/{monthlyStats.total}</Text>
      </View>
      <View style={[styles.progressBar, { backgroundColor: task.color + '33' }]}>
        <View 
          style={[
            styles.progressFill, 
            { 
              backgroundColor: task.color,
              width: `${(monthlyStats.completed / monthlyStats.total) * 100}%` as const
            }
          ]} 
        />
      </View>
    </View>
  );
};

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onComplete, size }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const [sides, setSides] = useState<[CardSide, CardSide]>(['task', 'calendar']);
  const [isFlipped, setIsFlipped] = useState(false);

  const flipCard = () => {
    const nextSides: [CardSide, CardSide] = [...sides];
    if (!isFlipped) {
      // Flipping to back, update back side
      if (sides[0] === 'task') {
        nextSides[1] = 'calendar';
      } else if (sides[0] === 'calendar') {
        nextSides[1] = 'stats';
      } else if (sides[0] === 'stats') {
        nextSides[1] = 'task';
      }
    } else {
      // Flipping to front, update front side
      if (sides[1] === 'calendar') {
        nextSides[0] = 'stats';
      } else if (sides[1] === 'stats') {
        nextSides[0] = 'task';
      } else if (sides[1] === 'task') {
        nextSides[0] = 'calendar';
      }
    }
    setSides(nextSides);
    setIsFlipped(!isFlipped);
    
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const frontAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '180deg'],
        }),
      },
    ],
  };

  const backAnimatedStyle = {
    transform: [
      {
        rotateY: flipAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['180deg', '360deg'],
        }),
      },
    ],
  };

  const renderContent = (side: CardSide) => {
    switch (side) {
      case 'task':
        return <TaskView task={task} />;
      case 'calendar':
        return <CalendarView task={task} />;
      case 'stats':
        return <StatsView task={task} />;
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <TouchableOpacity onPress={flipCard} activeOpacity={0.9} style={styles.touchable}>
        <Animated.View style={[styles.card, frontAnimatedStyle]}>
          {renderContent(sides[0])}
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          {renderContent(sides[1])}
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  touchable: {
    flex: 1,
  },
  card: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    backfaceVisibility: 'hidden',
  },
  cardBack: {
    transform: [{ rotateY: '180deg' }],
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  streakBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  streakBubble: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  streakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  calendarContainer: {
    flex: 1,
    padding: 12,
  },
  calendarGrid: {
    flex: 1,
  },
  calendarDayNames: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  calendarDayName: {
    flex: 1,
    textAlign: 'center',
    fontSize: 10,
    color: '#666',
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  calendarDayInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  calendarDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
  },
  calendarDotFuture: {
    opacity: 0.3,
  },
  calendarX: {
    fontSize: 24,
    color: '#E0E0E0',
    fontWeight: '300',
    lineHeight: 24,
  },
  statsContainer: {
    flex: 1,
    padding: 16,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
}); 