import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, format, isToday, parseISO, startOfWeek } from 'date-fns';
import React, { useRef, useState } from 'react';
import {
  Animated,
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
        <MaterialCommunityIcons name={task.icon} size={48} color="#fff" />
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
  const weekStart = startOfWeek(today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarHeader}>
        <Text style={styles.calendarTitle}>This Week</Text>
      </View>
      <View style={styles.calendarGrid}>
        {days.map((day, index) => {
          const isCompleted = task.completions?.some(completion => 
            isToday(parseISO(completion.date))
          );
          const isCurrentDay = isToday(day);
          
          return (
            <View key={index} style={styles.calendarDay}>
              <Text style={styles.calendarDayName}>{format(day, 'EEE')}</Text>
              <View style={[
                styles.calendarDayCircle,
                isCompleted && styles.calendarDayCompleted,
                isCurrentDay && styles.calendarDayCurrent,
              ]}>
                <Text style={[
                  styles.calendarDayNumber,
                  (isCompleted || isCurrentDay) && styles.calendarDayNumberActive
                ]}>
                  {format(day, 'd')}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const StatsView: React.FC<{ task: Task; onComplete: () => void }> = ({ task, onComplete }) => (
  <View style={styles.statsContainer}>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{task.stats?.currentStreak || 0}</Text>
      <Text style={styles.statLabel}>Current Streak</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{task.stats?.bestStreak || 0}</Text>
      <Text style={styles.statLabel}>Best Streak</Text>
    </View>
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{task.stats?.completionRate || 0}%</Text>
      <Text style={styles.statLabel}>Completion Rate</Text>
    </View>
    <TouchableOpacity
      style={[styles.completeButton, { backgroundColor: task.color }]}
      onPress={onComplete}
    >
      <Text style={styles.completeButtonText}>Complete</Text>
    </TouchableOpacity>
  </View>
);

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onComplete }) => {
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
        return <StatsView task={task} onComplete={onComplete} />;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={flipCard} activeOpacity={0.9}>
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
    marginBottom: 16,
  },
  card: {
    flex: 1,
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
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
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
    padding: 16,
  },
  calendarHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  calendarGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    alignItems: 'center',
  },
  calendarDayName: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  calendarDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayCompleted: {
    backgroundColor: '#FF6B6B',
    borderColor: '#FF6B6B',
  },
  calendarDayCurrent: {
    borderColor: '#FFA726',
    borderWidth: 2,
  },
  calendarDayNumber: {
    fontSize: 14,
    color: '#333',
  },
  calendarDayNumberActive: {
    color: '#fff',
  },
  statsContainer: {
    flex: 1,
    justifyContent: 'space-around',
    padding: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  completeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 