import { MaterialCommunityIcons } from '@expo/vector-icons';
import { usePathname, useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Task } from '../types';

interface TaskHeaderProps {
  task: Task;
}

export const TaskHeader: React.FC<TaskHeaderProps> = ({ task }) => {
  const router = useRouter();
  const pathname = usePathname();

  const isCalendarScreen = pathname.includes('calendar');
  const isStatsScreen = pathname.includes('stats');

  const navigateToCalendar = () => {
    router.push({
      pathname: '/task-calendar',
      params: { taskId: task.id }
    });
  };

  const navigateToStats = () => {
    router.push({
      pathname: '/task-stats',
      params: { taskId: task.id }
    });
  };

  return (
    <View>
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
            <View style={styles.streakContainer}>
              {task.stats?.streakStatus === 'up_to_date' && task.stats?.currentStreak > 0 ? (
                <>
                  <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <MaterialCommunityIcons name="fire" size={16} color="#fff" />
                    <Text style={styles.streakText}>{task.stats.currentStreak}</Text>
                  </View>
                  {task.stats.currentStreak === task.stats.bestStreak && (
                    <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" style={styles.trophyIcon} />
                  )}
                </>
              ) : task.stats?.streakStatus === 'expiring' && task.stats?.currentStreak > 0 ? (
                <>
                  <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <MaterialCommunityIcons name="fire" size={16} color="#fff" />
                    <Text style={styles.streakText}>{task.stats.currentStreak}</Text>
                  </View>
                  <MaterialCommunityIcons name="clock-outline" size={20} color="rgba(255, 255, 255, 0.6)" style={styles.statusIcon} />
                  {task.stats.currentStreak === task.stats.bestStreak && (
                    <MaterialCommunityIcons name="trophy" size={20} color="#FFD700" style={styles.trophyIcon} />
                  )}
                </>
              ) : task.stats?.lastStreak && task.stats.lastStreak > 0 ? (
                <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <MaterialCommunityIcons name="sleep" size={16} color="#fff" />
                  <Text style={styles.streakText}>{task.stats.lastStreak}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.headerButton}
          onPress={() => router.push({
            pathname: '/task-details',
            params: { taskId: task.id }
          })}
        >
          <MaterialCommunityIcons name="pencil" size={24} color="rgba(255, 255, 255, 0.8)" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, isCalendarScreen && styles.activeTab]} 
          onPress={navigateToCalendar}
        >
          <MaterialCommunityIcons 
            name="calendar" 
            size={20} 
            color={isCalendarScreen ? task.color : '#666'} 
          />
          <Text style={[styles.tabText, isCalendarScreen && { color: task.color }]}>
            Calendar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.tab, isStatsScreen && styles.activeTab]} 
          onPress={navigateToStats}
        >
          <MaterialCommunityIcons 
            name="chart-bar" 
            size={20} 
            color={isStatsScreen ? task.color : '#666'} 
          />
          <Text style={[styles.tabText, isStatsScreen && { color: task.color }]}>
            Stats
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 48,
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
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  trophyIcon: {
    marginTop: 2,
  },
  statusIcon: {
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
}); 