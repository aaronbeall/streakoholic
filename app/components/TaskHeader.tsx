import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Task } from '../types';

interface TaskHeaderProps {
  task: Task;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => {
  const router = useRouter();

  return (
    <View style={[styles.header, { backgroundColor: task.color }]}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => router.push('/')}
      >
        <MaterialCommunityIcons name="arrow-left" size={24} color="rgba(255, 255, 255, 0.8)" />
      </TouchableOpacity>

      <View style={styles.centerContent}>
        <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <MaterialCommunityIcons name={task.icon} size={48} color="#fff" />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{task.name}</Text>
          {task.stats?.streakStatus === 'up_to_date' && task.stats?.currentStreak > 0 ? (
            <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <MaterialCommunityIcons name="fire" size={16} color="#fff" />
              <Text style={styles.streakText}>{task.stats.currentStreak}</Text>
            </View>
          ) : task.stats?.streakStatus === 'expiring' && task.stats?.currentStreak > 0 ? (
            <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="#fff" />
              <Text style={styles.streakText}>{task.stats.currentStreak}</Text>
            </View>
          ) : task.stats?.lastStreak && task.stats.lastStreak > 0 ? (
            <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <MaterialCommunityIcons name="sleep" size={16} color="#fff" />
              <Text style={styles.streakText}>{task.stats.lastStreak}</Text>
            </View>
          ) : null}
        </View>
      </View>

      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => router.push({
          pathname: '/add-task',
          params: { taskId: task.id }
        })}
      >
        <MaterialCommunityIcons name="pencil" size={24} color="rgba(255, 255, 255, 0.8)" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  streakText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
}); 