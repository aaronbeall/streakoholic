import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import {
  FlatList,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { TaskCard } from '../components/TaskCard';
import { useTaskContext } from '../context/TaskContext';

const GRID_SPACING = 16;
const SIDE_PADDING = 16;

export const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { tasks, completeTask } = useTaskContext();
  const { width } = useWindowDimensions();

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
      <FlatList
        key={columnCount}
        data={tasks}
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