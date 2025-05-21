import { Stack } from 'expo-router';
import { TaskProvider } from './context/TaskContext';

export default function Layout() {
  return (
    <TaskProvider>
      <Stack>
        <Stack.Screen
          name="index"
          options={{
            title: 'Streakaholic',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerShadowVisible: false,
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        />
        <Stack.Screen
          name="add-task"
          options={{
            title: 'Add New Task',
            presentation: 'modal',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="task-details"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="task-calendar"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="task-stats"
          options={{
            headerShown: false,
            presentation: 'modal',
          }}
        />
      </Stack>
    </TaskProvider>
  );
}
