import { MaterialCommunityIcons } from '@expo/vector-icons';
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
import { DEFAULT_COLORS, DEFAULT_ICONS } from '../constants/task';
import { useTaskContext } from '../context/TaskContext';
import { FrequencyType, MaterialCommunityIconName } from '../types';

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const AddTaskScreen: React.FC = () => {
  const router = useRouter();
  const { addTask, tasks } = useTaskContext();

  // Find first unused icon and color
  const { initialIcon, initialColor } = useMemo(() => {
    const usedIcons = new Set(tasks.map(task => task.icon));
    const usedColors = new Set(tasks.map(task => task.color));

    const unusedIcon = DEFAULT_ICONS.find(icon => !usedIcons.has(icon)) || DEFAULT_ICONS[0];
    const unusedColor = DEFAULT_COLORS.find(color => !usedColors.has(color)) || DEFAULT_COLORS[0];

    return { initialIcon: unusedIcon, initialColor: unusedColor };
  }, [tasks]);

  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<MaterialCommunityIconName>(initialIcon);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [frequency, setFrequency] = useState<FrequencyType>('daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [daysPerWeek, setDaysPerWeek] = useState(3);
  const [daysPerMonth, setDaysPerMonth] = useState(15);
  const [timesPerDay, setTimesPerDay] = useState(1);

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
      frequency,
      daysOfWeek,
      daysPerWeek,
      daysPerMonth,
      timesPerDay,
    };

    try {
      await addTask(task);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to create task');
    }
  };

  const toggleDayOfWeek = (dayIndex: number) => {
    setDaysOfWeek(prev => 
      prev.includes(dayIndex)
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort()
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.label}>Task Name</Text>
        <View style={styles.card}>
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
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Icon</Text>
        <View style={styles.card}>
          <IconPicker
            selectedIcon={selectedIcon}
            selectedColor={selectedColor}
            onIconSelect={setSelectedIcon}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Color</Text>
        <View style={styles.card}>
          <ColorPicker
            selectedColor={selectedColor}
            onColorSelect={setSelectedColor}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Frequency</Text>
        <View style={styles.card}>
          <View style={styles.frequencyTypeContainer}>
            <TouchableOpacity
              style={[styles.frequencyTypeButton, frequency === 'daily' && { backgroundColor: selectedColor }]}
              onPress={() => setFrequency('daily')}
            >
              <Text style={[styles.frequencyTypeText, frequency === 'daily' && styles.selectedText]}>
                Daily
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.frequencyTypeButton, frequency === 'specific_days_of_week' && { backgroundColor: selectedColor }]}
              onPress={() => setFrequency('specific_days_of_week')}
            >
              <Text style={[styles.frequencyTypeText, frequency === 'specific_days_of_week' && styles.selectedText]}>
                Specific Days
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.frequencyTypeButton, frequency === 'days_per_week' && { backgroundColor: selectedColor }]}
              onPress={() => setFrequency('days_per_week')}
            >
              <Text style={[styles.frequencyTypeText, frequency === 'days_per_week' && styles.selectedText]}>
                Days/Week
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.frequencyTypeButton, frequency === 'days_per_month' && { backgroundColor: selectedColor }]}
              onPress={() => setFrequency('days_per_month')}
            >
              <Text style={[styles.frequencyTypeText, frequency === 'days_per_month' && styles.selectedText]}>
                Days/Month
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.frequencyOptionsContainer}>
            {frequency === 'specific_days_of_week' && (
              <View style={styles.optionCard}>
                <Text style={styles.optionLabel}>Select Days</Text>
                <View style={styles.daysContainer}>
                  {weekDays.map((day, index) => (
                    <TouchableOpacity
                      key={day}
                      style={[
                        styles.dayButton,
                        daysOfWeek.includes(index) && { backgroundColor: selectedColor }
                      ]}
                      onPress={() => toggleDayOfWeek(index)}
                    >
                      <Text style={[
                        styles.dayText,
                        daysOfWeek.includes(index) && styles.selectedText
                      ]}>
                        {day.slice(0, 1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {frequency === 'days_per_week' && (
              <View style={styles.optionCard}>
                <Text style={styles.optionLabel}>Days per week</Text>
                <View style={styles.numberInputRow}>
                  <TouchableOpacity
                    style={[styles.numberInputButton, { backgroundColor: selectedColor }]}
                    onPress={() => setDaysPerWeek(prev => Math.max(1, prev - 1))}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.numberInputValue}>{daysPerWeek}</Text>
                  <TouchableOpacity
                    style={[styles.numberInputButton, { backgroundColor: selectedColor }]}
                    onPress={() => setDaysPerWeek(prev => Math.min(7, prev + 1))}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {frequency === 'days_per_month' && (
              <View style={styles.optionCard}>
                <Text style={styles.optionLabel}>Days per month</Text>
                <View style={styles.numberInputRow}>
                  <TouchableOpacity
                    style={[styles.numberInputButton, { backgroundColor: selectedColor }]}
                    onPress={() => setDaysPerMonth(prev => Math.max(1, prev - 1))}
                  >
                    <MaterialCommunityIcons name="minus" size={20} color="#fff" />
                  </TouchableOpacity>
                  <Text style={styles.numberInputValue}>{daysPerMonth}</Text>
                  <TouchableOpacity
                    style={[styles.numberInputButton, { backgroundColor: selectedColor }]}
                    onPress={() => setDaysPerMonth(prev => Math.min(31, prev + 1))}
                  >
                    <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <View style={styles.optionCard}>
              <Text style={styles.optionLabel}>Times per day</Text>
              <View style={styles.numberInputRow}>
                <TouchableOpacity
                  style={[styles.numberInputButton, { backgroundColor: selectedColor }]}
                  onPress={() => setTimesPerDay(prev => Math.max(1, prev - 1))}
                >
                  <MaterialCommunityIcons name="minus" size={20} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.numberInputValue}>{timesPerDay}</Text>
                <TouchableOpacity
                  style={[styles.numberInputButton, { backgroundColor: selectedColor }]}
                  onPress={() => setTimesPerDay(prev => prev + 1)}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
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
    backgroundColor: '#f5f5f5',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  frequencyTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  frequencyOptionsContainer: {
    gap: 16,
  },
  optionCard: {
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
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
  frequencyTypeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  frequencyTypeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  selectedText: {
    color: '#fff',
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  numberInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  numberInputButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberInputValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
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