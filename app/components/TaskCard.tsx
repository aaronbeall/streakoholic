import { MaterialCommunityIcons } from '@expo/vector-icons';
import { isToday, parseISO } from 'date-fns';
import React, { useRef } from 'react';
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

export const TaskCard: React.FC<TaskCardProps> = ({ task, onPress, onComplete }) => {
  const flipAnim = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: flipAnim._value === 0 ? 1 : 0,
      friction: 8,
      tension: 10,
      useNativeDriver: true,
    }).start();
  };

  const getStreakBadgeStyle = () => {
    const currentStreak = task.stats?.currentStreak || 0;
    const lastCompleted = task.stats?.lastCompleted;
    
    if (!lastCompleted) {
      return {
        backgroundColor: '#6B8AFE', // Cool blue for no streak
        icon: 'sleep' as const,
      };
    }

    const lastCompletedDate = parseISO(lastCompleted);
    
    if (isToday(lastCompletedDate)) {
      return {
        backgroundColor: '#FF6B6B', // Solid red for completed today
        icon: 'fire' as const,
      };
    }

    return {
      backgroundColor: '#FFA726', // Warm orange for pending
      icon: 'clock-outline' as const,
    };
  };

  const streakBadgeStyle = getStreakBadgeStyle();

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

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={flipCard} activeOpacity={0.9}>
        <Animated.View style={[styles.card, frontAnimatedStyle]}>
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
        </Animated.View>

        <Animated.View style={[styles.card, styles.cardBack, backAnimatedStyle]}>
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
          </View>
          <TouchableOpacity
            style={[styles.completeButton, { backgroundColor: task.color }]}
            onPress={onComplete}
          >
            <Text style={styles.completeButtonText}>Complete</Text>
          </TouchableOpacity>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
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