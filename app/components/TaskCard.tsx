import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addDays, format, getDay, getDaysInMonth, parseISO, startOfMonth, startOfWeek } from 'date-fns';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onComplete: () => void;
  size: number;
  onLongPressCalendar?: () => void;
  onLongPressStats?: () => void;
  onLongPressTask?: () => void;
}

type CardSide = 'task' | 'calendar' | 'stats';

const CardTask = React.memo(({ task }: { task: Task }) => {
  const getStreakBadgeStyle = () => {
    const currentStreak = task.stats?.currentStreak || 0;
    const lastStreak = task.stats?.lastStreak || 0;
    const bestStreak = task.stats?.bestStreak || 0;
    const streakStatus = task.stats?.streakStatus;
    
    if (!streakStatus || streakStatus === 'never_started') {
      return null;
    }

    if (currentStreak > 0) {
      if (streakStatus === 'up_to_date') {
        return {
          backgroundColor: '#FF6B6B',
          icon: 'fire' as const,
          value: currentStreak,
          showTrophy: currentStreak === bestStreak
        };
      }
      return {
        backgroundColor: '#FFA726',
        icon: 'clock-outline' as const,
        value: currentStreak,
        showTrophy: currentStreak === bestStreak
      };
    }

    if (lastStreak > 0) {
      return {
        backgroundColor: '#90A4AE',
        icon: 'sleep' as const,
        value: lastStreak,
        showTrophy: false
      };
    }

    return null;
  };

  const streakBadgeStyle = getStreakBadgeStyle();

  return (
    <View style={styles.contentContainer}>
      <View style={[styles.iconContainer, { backgroundColor: task.color }]}>
        <MaterialCommunityIcons name={task.icon} size={64} color="#fff" />
      </View>
      <Text style={styles.taskName} numberOfLines={1}>{task.name}</Text>
      {streakBadgeStyle && (
        <View style={styles.streakBadge}>
          <View style={[styles.streakBubble, { backgroundColor: streakBadgeStyle.backgroundColor }]}>
            <MaterialCommunityIcons name={streakBadgeStyle.icon} size={14} color="#fff" />
            <Text style={styles.streakText}>{streakBadgeStyle.value}</Text>
          </View>
          {streakBadgeStyle.showTrophy && (
            <MaterialCommunityIcons 
              name="trophy" 
              size={20} 
              color="#FFD700" 
              style={styles.trophyIcon} 
            />
          )}
        </View>
      )}
    </View>
  );
});

CardTask.displayName = 'CardTask';

const CardCalendar = React.memo(({ task }: { task: Task }) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  const currentMonth = new Date();
  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayOfWeek = getDay(firstDayOfMonth);
  
  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
    const dateString = format(date, 'yyyy-MM-dd');
    const isCompleted = task.completions?.some(completion => completion.date === dateString);
    const isToday = dateString === today;
    const isPast = dateString < today;
    const isMissed = isPast && !isCompleted;
    return {
      date,
      isCompleted,
      isToday,
      isMissed,
      dayNumber: i + 1
    };
  });

  return (
    <View style={styles.calendarContainer}>
      <View style={styles.calendarGrid}>
        <View style={styles.calendarDayNames}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <Text key={index} style={styles.calendarDayName}>{day}</Text>
          ))}
        </View>
        <FlatList
          data={[
            ...Array(startingDayOfWeek).fill(null),
            ...days
          ]}
          renderItem={({ item: day, index }) => (
            <View style={styles.calendarDay}>
              {day ? (
                <View style={styles.calendarDayInner}>
                  {day.isCompleted ? (
                    <View style={[styles.calendarDot, { backgroundColor: task.color }]} />
                  ) : day.isToday ? (
                    <View style={[styles.calendarDot, { borderWidth: 2, borderColor: task.color, backgroundColor: 'transparent' }]} />
                  ) : day.isMissed ? (
                    <MaterialCommunityIcons name="close" size={20} color="#E0E0E0" />
                  ) : (
                    <View style={[styles.calendarDot, styles.calendarDotFuture]} />
                  )}
                </View>
              ) : null}
            </View>
          )}
          numColumns={7}
          scrollEnabled={false}
          keyExtractor={(_, index) => index.toString()}
        />
      </View>
    </View>
  );
});

CardCalendar.displayName = 'CardCalendar';

const CardStats = React.memo(({ task }: { task: Task }) => {
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
  const isBestStreak = task.stats?.currentStreak === task.stats?.bestStreak && (task.stats?.bestStreak || 0) > 0;

  return (
    <View style={styles.statsContainer}>
      <View style={styles.statRow}>
        <Text style={styles.statLabel}>Streak: <Text style={styles.statValue}>{task.stats?.currentStreak || 0}</Text></Text>
        {isBestStreak ? (
          <View style={styles.bestStreakContainer}>
            <MaterialCommunityIcons name="trophy" size={16} color="#FFD700" />
            <Text style={[styles.statLabel, styles.bestStreakText]}>Best!</Text>
          </View>
        ) : (
          <Text style={styles.statLabel}>Best: <Text style={styles.statValue}>{task.stats?.bestStreak || 0}</Text></Text>
        )}
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
});

CardStats.displayName = 'CardStats';

export const TaskCard = React.memo(({ 
  task, 
  onPress, 
  onComplete, 
  size,
  onLongPressCalendar,
  onLongPressStats,
  onLongPressTask,
}: TaskCardProps) => {
  const flipAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [sides, setSides] = useState<[CardSide, CardSide]>(['task', 'calendar']);
  const [isFlipped, setIsFlipped] = useState(false);
  const router = useRouter();

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4
    }).start();
  };

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
      { scale: scaleAnim }
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
      { scale: scaleAnim }
    ],
  };

  const renderContent = (side: CardSide) => {
    switch (side) {
      case 'task':
        return <CardTask task={task} />;
      case 'calendar':
        return <CardCalendar task={task} />;
      case 'stats':
        return <CardStats task={task} />;
    }
  };

  const handleLongPress = () => {
    const visibleSide = isFlipped ? sides[1] : sides[0];
    if (visibleSide === 'calendar' && onLongPressCalendar) {
      onLongPressCalendar();
    } else if (visibleSide === 'stats' && onLongPressStats) {
      onLongPressStats();
    } else if (visibleSide === 'task' && onLongPressTask) {
      onLongPressTask();
    }
  };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Pressable 
        onPress={flipCard} 
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        delayLongPress={500}
        style={styles.touchable}
      >
        <Animated.View style={[styles.card, frontAnimatedStyle]}>
          {renderContent(sides[0])}
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
          {renderContent(sides[1])}
        </Animated.View>
      </Pressable>
    </View>
  );
});

TaskCard.displayName = 'TaskCard';

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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    aspectRatio: 1,
  },
  calendarDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontWeight: '700',
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
  trophyIcon: {
    marginLeft: 2,
  },
  bestStreakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bestStreakText: {
    color: '#FFD700',
    fontWeight: '600',
  },
}); 