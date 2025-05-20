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
            title: 'Task Details',
            presentation: 'modal',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="task-calendar"
          options={{
            title: 'Task Calendar',
            presentation: 'modal',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="task-stats"
          options={{
            title: 'Task Stats',
            presentation: 'modal',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerShadowVisible: false,
          }}
        />
      </Stack>
    </TaskProvider>
  );
}
