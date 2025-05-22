import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { ColorPicker } from '../components/ColorPicker';
import { IconPicker } from '../components/IconPicker';
import { useTaskContext } from '../context/TaskContext';
import { MaterialCommunityIconName } from '../types';

export const AddTaskScreen: React.FC = () => {
  const router = useRouter();
  const { addTask, tasks } = useTaskContext();
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<MaterialCommunityIconName>('run');
  const [selectedColor, setSelectedColor] = useState('#FF6B6B');

  const isNameValid = useMemo(() => {
    const trimmedName = name.trim();
    if (!trimmedName) return false;
    return !tasks.some(task => task.name.toLowerCase() === trimmedName.toLowerCase());
  }, [name, tasks]);

  const handleSave = async () => {
    if (!isNameValid) {
      Alert.alert('Error', 'Please enter a unique task name');
      return;
    }

    const task = {
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      timesPerDay: 1,
      duration: 30,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6], // All days by default
    };

    try {
      await addTask(task);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Task Name</Text>
        <TextInput
          style={[styles.input, !isNameValid && !!name.trim() && styles.inputError]}
          value={name}
          onChangeText={setName}
          placeholder="Enter task name"
          placeholderTextColor="#999"
        />
        {!isNameValid && !!name.trim() && (
          <Text style={styles.errorText}>This task name already exists</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Icon</Text>
        <IconPicker
          selectedIcon={selectedIcon}
          selectedColor={selectedColor}
          onIconSelect={setSelectedIcon}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <ColorPicker
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
        />
      </View>

      <TouchableOpacity 
        style={[styles.saveButton, !isNameValid && styles.saveButtonDisabled]} 
        onPress={handleSave}
        disabled={!isNameValid}
      >
        <Text style={[styles.saveButtonText, !isNameValid && styles.saveButtonTextDisabled]}>
          Save Task
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#E5E5EA',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#8E8E93',
  },
}); 