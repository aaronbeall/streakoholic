import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addMonths, format, getDay, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTaskContext } from '../context/TaskContext';

export default function TaskCalendarScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { tasks, completeTask, uncompleteTask } = useTaskContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    return null;
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayOfWeek = getDay(firstDayOfMonth);

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
    const isCompleted = task.completions?.some(completion => 
      new Date(completion.date).toDateString() === date.toDateString()
    );
    return {
      date,
      isCompleted,
      dayNumber: i + 1
    };
  });

  const handleDayPress = (date: Date) => {
    completeTask(taskId, date);
  };

  const handleDayLongPress = (date: Date) => {
    uncompleteTask(taskId, date);
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <MaterialCommunityIcons name={task.icon} size={24} color={task.color} />
          <Text style={styles.title}>{task.name}</Text>
        </View>
        <View style={styles.navigation}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.calendar}>
        <View style={styles.weekDays}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <Text key={day} style={styles.weekDay}>{day}</Text>
          ))}
        </View>
        <View style={styles.days}>
          {Array(startingDayOfWeek).fill(null).map((_, index) => (
            <View key={`empty-${index}`} style={styles.day} />
          ))}
          {days.map(({ date, isCompleted, dayNumber }) => (
            <TouchableOpacity
              key={date.toISOString()}
              style={styles.day}
              onPress={() => handleDayPress(date)}
              onLongPress={() => handleDayLongPress(date)}
              delayLongPress={500}
            >
              <View style={[
                styles.dayContent,
                isCompleted && { backgroundColor: task.color }
              ]}>
                <Text style={[
                  styles.dayNumber,
                  isCompleted && styles.completedDayNumber
                ]}>
                  {dayNumber}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
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
  navigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  navButton: {
    padding: 8,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#333',
  },
  calendar: {
    flex: 1,
    padding: 16,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  days: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  day: {
    width: '14.28%',
    aspectRatio: 1,
    padding: 4,
  },
  dayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  dayNumber: {
    fontSize: 16,
    color: '#333',
  },
  completedDayNumber: {
    color: '#fff',
  },
}); 