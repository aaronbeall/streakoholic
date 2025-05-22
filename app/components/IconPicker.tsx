import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useDebounce } from 'use-debounce';
import { MaterialCommunityIconName } from '../types';

// Get all available icons from MaterialCommunityIcons
const ALL_ICONS = Object.keys(MaterialCommunityIcons.glyphMap) as MaterialCommunityIconName[];

const INITIAL_ICON_OPTIONS: MaterialCommunityIconName[] = [
  'run',
  'dumbbell',
  'book-open-variant',
  'meditation',
  'water',
  'food-apple',
  'sleep',
  'brush',
  'music',
  'pencil',
  'yoga',
  'bike',
];

const ADDITIONAL_ICON_OPTIONS: MaterialCommunityIconName[] = [
  'swim',
  'weight',
  'book-open',
  'pill',
  'coffee',
  'bed',
  'toothbrush',
  'guitar-acoustic',
  'pencil-outline',
  'heart',
  'star',
  'target',
  'flag',
  'trophy',
  'medal',
  'crown',
  'lightning-bolt',
  'fire',
  'clock',
];

interface IconPickerProps {
  selectedIcon: MaterialCommunityIconName;
  selectedColor: string;
  onIconSelect: (icon: MaterialCommunityIconName) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({
  selectedIcon,
  selectedColor,
  onIconSelect,
}) => {
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 300);
  const [visibleCount, setVisibleCount] = useState(12);
  const scrollViewRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const searchHeight = useRef(new Animated.Value(0)).current;

  // Animate search container height
  useEffect(() => {
    Animated.timing(searchHeight, {
      toValue: showAll ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      // Focus input after animation completes
      if (showAll) {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 200);
      }
    });
  }, [showAll]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(12);
  }, [debouncedQuery]);

  // Memoize filtered icons
  const filteredIcons = useMemo(() => {
    if (!debouncedQuery) {
      return [...INITIAL_ICON_OPTIONS, ...ADDITIONAL_ICON_OPTIONS];
    }

    const searchTerms = debouncedQuery.toLowerCase().split(/\s+/).filter(Boolean);
    
    return ALL_ICONS
      .filter(icon => {
        const iconName = icon.toLowerCase();
        return searchTerms.every(term => iconName.includes(term));
      });
  }, [debouncedQuery]);

  const handleShowMore = useCallback(() => {
    setVisibleCount(prev => prev + 12);
  }, []);

  // Scroll to bottom when additional colors are added
  useEffect(() => {
    if (visibleCount > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100); // Small delay to ensure content is rendered
    }
  }, [visibleCount]);

  const handleShowLess = useCallback(() => {
    setShowAll(false);
    setSearchQuery('');
    setVisibleCount(12);
  }, []);

  // Scroll to top when search query changes
  useEffect(() => {
    if (debouncedQuery) {
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [debouncedQuery]);

  return (
    <View>
      <Animated.View style={[
        styles.searchContainer,
        {
          height: searchHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 45], // 56 = height of search input + margin
          }),
          opacity: searchHeight,
          marginBottom: searchHeight.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 16],
          }),
        },
      ]}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search all icons..."
          placeholderTextColor="#999"
          autoFocus
        />
        <MaterialCommunityIcons 
          name="magnify" 
          size={20} 
          color="#999" 
          style={styles.searchIcon}
        />
      </Animated.View>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.iconGrid}>
          {filteredIcons.slice(0, visibleCount).map((icon) => (
            <TouchableOpacity
              key={icon}
              style={[
                styles.iconButton,
                selectedIcon === icon && { backgroundColor: selectedColor },
              ]}
              onPress={() => onIconSelect(icon)}
            >
              <MaterialCommunityIcons
                name={icon}
                size={24}
                color={selectedIcon === icon ? '#fff' : '#333'}
              />
            </TouchableOpacity>
          ))}
          {filteredIcons.length > visibleCount && (
            <TouchableOpacity
              style={styles.moreButton}
              onPress={() => {
                setShowAll(true);
                handleShowMore();
              }}
            >
              <MaterialCommunityIcons 
                name="dots-horizontal" 
                size={24} 
                color="#999" 
              />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      {showAll && (
        <TouchableOpacity
          style={styles.showLessButton}
          onPress={handleShowLess}
        >
          <Text style={styles.showLessText}>Show Less</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    paddingRight: 40, // Make room for the icon
    fontSize: 16,
    backgroundColor: '#fff',
  },
  searchIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }], // Center vertically
  },
  scrollView: {
    maxHeight: 300,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  showLessButton: {
    marginTop: 8,
    padding: 8,
    alignItems: 'center',
  },
  showLessText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
}); 