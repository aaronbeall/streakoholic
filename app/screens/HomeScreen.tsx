import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { TaskCard } from '../components/TaskCard';
import { useTaskContext } from '../context/TaskContext';

const GRID_SPACING = 16;
const SIDE_PADDING = 16;

type FilterType = 'up_to_date' | 'expiring' | null;

const HomeHeader: React.FC<{ onFilterChange: (filter: FilterType) => void }> = ({ onFilterChange }) => {
  const router = useRouter();
  const { tasks } = useTaskContext();
  const [activeFilter, setActiveFilter] = useState<FilterType>(null);

  const streakStats = tasks.reduce((acc, task) => {
    if (task.stats?.streakStatus === 'up_to_date' && task.stats.currentStreak > 0) {
      acc.upToDate++;
    } else if (task.stats?.streakStatus === 'expiring' && task.stats.currentStreak > 0) {
      acc.expiring++;
    }
    return acc;
  }, { upToDate: 0, expiring: 0 });

  const handleFilterPress = (filter: FilterType) => {
    const newFilter = activeFilter === filter ? null : filter;
    setActiveFilter(newFilter);
    onFilterChange(newFilter);
  };

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => router.push({ pathname: '/dashboard' })}
      >
        <MaterialCommunityIcons name="view-dashboard" size={24} color="#333" />
      </TouchableOpacity>

      <View style={styles.streakBubbles}>
        {streakStats.upToDate > 0 && (
          <TouchableOpacity 
            style={[
              styles.streakBubble, 
              { backgroundColor: 'rgba(255, 59, 48, 0.1)' },
              activeFilter === 'up_to_date' && { backgroundColor: '#FF3B30' }
            ]}
            onPress={() => handleFilterPress('up_to_date')}
          >
            <MaterialCommunityIcons 
              name="fire" 
              size={16} 
              color={activeFilter === 'up_to_date' ? '#fff' : '#FF3B30'} 
            />
            <Text style={[
              styles.streakBubbleText, 
              { color: activeFilter === 'up_to_date' ? '#fff' : '#FF3B30' }
            ]}>
              {streakStats.upToDate}
            </Text>
          </TouchableOpacity>
        )}
        {streakStats.expiring > 0 && (
          <TouchableOpacity 
            style={[
              styles.streakBubble, 
              { backgroundColor: 'rgba(255, 167, 38, 0.1)' },
              activeFilter === 'expiring' && { backgroundColor: '#FFA726' }
            ]}
            onPress={() => handleFilterPress('expiring')}
          >
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={16} 
              color={activeFilter === 'expiring' ? '#fff' : '#FFA726'} 
            />
            <Text style={[
              styles.streakBubbleText, 
              { color: activeFilter === 'expiring' ? '#fff' : '#FFA726' }
            ]}>
              {streakStats.expiring}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity 
        style={styles.headerButton}
        onPress={() => router.push('/')}
      >
        <MaterialCommunityIcons name="cog" size={24} color="#333" />
      </TouchableOpacity>
    </View>
  );
};

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { tasks, completeTask } = useTaskContext();
  const { width } = useWindowDimensions();
  const [filter, setFilter] = useState<FilterType>(null);

  const filteredTasks = tasks.filter(task => {
    if (!filter) return true;
    if (filter === 'up_to_date') {
      return task.stats?.streakStatus === 'up_to_date' && task.stats.currentStreak > 0;
    }
    if (filter === 'expiring') {
      return task.stats?.streakStatus === 'expiring' && task.stats.currentStreak > 0;
    }
    return true;
  });

  const getColumnCount = () => {
    if (width >= 1200) return 4;
    if (width >= 900) return 3;
    return 2;
  };

  const columnCount = getColumnCount();
  const availableWidth = width - (SIDE_PADDING * 2) - (GRID_SPACING * (columnCount - 1));
  const cardSize = Math.floor(availableWidth / columnCount);

  return (
    <View style={styles.container}>
      <HomeHeader onFilterChange={setFilter} />
      <FlatList
        key={columnCount}
        data={filteredTasks}
        keyExtractor={(item) => item.id}
        numColumns={columnCount}
        columnWrapperStyle={styles.row}
        getItemLayout={(data, index) => ({
          length: cardSize,
          offset: cardSize * Math.floor(index / columnCount),
          index,
        })}
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onPress={() => router.push({ pathname: '/task-details', params: { taskId: item.id } })}
            onComplete={() => completeTask(item.id)}
            size={cardSize}
            onLongPressCalendar={() => router.push({ 
              pathname: '/task-calendar', 
              params: { taskId: item.id } 
            })}
            onLongPressStats={() => router.push({ 
              pathname: '/task-stats', 
              params: { taskId: item.id } 
            })}
            onLongPressTask={() => router.push({ pathname: '/task-details', params: { taskId: item.id } })}
          />
        )}
        contentContainerStyle={styles.listContent}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => router.push('/add-task')}>
        <MaterialCommunityIcons name="plus" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakBubbles: {
    flexDirection: 'row',
    gap: 8,
  },
  streakBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  streakBubbleText: {
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    padding: SIDE_PADDING,
    gap: GRID_SPACING,
  },
  row: {
    justifyContent: 'space-between',
    gap: GRID_SPACING,
  },
  addButton: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
}); 