import { MaterialCommunityIcons } from '@expo/vector-icons';
import { addMonths, format, getDay, getDaysInMonth, startOfMonth, subMonths } from 'date-fns';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TaskHeader } from '../components/TaskHeader';
import { useTaskContext } from '../context/TaskContext';

// Add type definitions at the top of the file
type CalendarDay = {
  type: 'day';
  date: Date;
  isCompleted: boolean;
  isToday: boolean;
  dayNumber: number;
  index: number;
};

type EmptyDay = {
  type: 'empty';
  index: number;
};

type CalendarItem = CalendarDay | EmptyDay;

export default function TaskCalendarScreen() {
  const router = useRouter();
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const { tasks, completeTask, uncompleteTask, isTaskCompleted } = useTaskContext();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const task = tasks.find(t => t.id === taskId);
  if (!task) {
    throw new Error('Missing task');
  }

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startingDayOfWeek = getDay(firstDayOfMonth);
  const today = format(new Date(), 'yyyy-MM-dd');

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i + 1);
    const isCompleted = isTaskCompleted(task, date);
    const isToday = format(date, 'yyyy-MM-dd') === today;
    return {
      date,
      isCompleted,
      isToday,
      dayNumber: i + 1
    };
  }),
  [currentMonth, daysInMonth, task, isTaskCompleted, today]);

  const handleDayPress = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    const isCompleted = isTaskCompleted(task, date);
    const isFuture = dateString > today;
    
    if (isFuture) {
      return; // Don't allow completing future dates
    }
    
    if (isCompleted) {
      uncompleteTask(taskId, date);
    } else {
      completeTask(taskId, date);
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <View style={styles.container}>
      <TaskHeader task={task} />

      <View style={styles.content}>
        <View style={styles.navigation}>
          <TouchableOpacity onPress={handlePrevMonth} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.monthText}>{format(currentMonth, 'MMMM yyyy')}</Text>
          <TouchableOpacity onPress={handleNextMonth} style={styles.navButton}>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekDays}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <Text key={day} style={styles.weekDay}>{day}</Text>
            ))}
          </View>
          <FlatList<CalendarItem>
            data={Array(42).fill(null).map((_, index) => {
              const dayIndex = index - startingDayOfWeek;
              if (dayIndex < 0 || dayIndex >= daysInMonth) {
                return { type: 'empty', index };
              }
              const day = days[dayIndex];
              return { 
                type: 'day', 
                date: day.date,
                isCompleted: day.isCompleted || false,
                isToday: day.isToday,
                dayNumber: day.dayNumber,
                index 
              };
            })}
            renderItem={({ item }) => {
              if (item.type === 'empty') {
                return <View key={`empty-${item.index}`} style={styles.day} />;
              }

              const { date, isCompleted, isToday, dayNumber } = item;
              const dateString = format(date, 'yyyy-MM-dd');
              const isPast = dateString < today;
              const isMissed = isPast && !isCompleted;
              const isFuture = dateString > today;

              return (
                <TouchableOpacity
                  key={dateString}
                  style={styles.day}
                  onPress={() => handleDayPress(date)}
                  delayLongPress={500}
                >
                  <View key={ `${task.id}-${isCompleted}` } style={[
                    styles.dayContent,
                    isCompleted && { backgroundColor: task.color },
                    isToday && !isCompleted && { borderWidth: 2, borderColor: task.color }
                  ]}>
                    {isMissed ? (
                      <MaterialCommunityIcons name="close" size={20} color="#E0E0E0" />
                    ) : (
                      <Text style={[
                        styles.dayNumber,
                        isCompleted && styles.completedDayNumber,
                        isToday && !isCompleted && { color: task.color },
                        isFuture && styles.futureDay
                      ]}>
                        {dayNumber}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            }}
            numColumns={7}
            scrollEnabled={false}
            keyExtractor={(item) => item.type === 'empty' ? `empty-${item.index}` : format(item.date, 'yyyy-MM-dd')}
          />
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
  content: {
    flex: 1,
    padding: 16,
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
  day: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayContent: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: '50%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  completedDayNumber: {
    color: '#fff',
  },
  futureDay: {
    opacity: 0.4,
  },
}); 