import { MaterialCommunityIcons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import tinycolor from 'tinycolor2';

// Modern, pleasing colors suitable for icons
const COLOR_OPTIONS = [
  '#FF6B6B', // Coral Red
  '#4ECDC4', // Turquoise
  '#45B7D1', // Sky Blue
  '#96CEB4', // Sage Green
  '#FFD93D', // Warm Yellow
  '#9B59B6', // Royal Purple
  '#E67E22', // Burnt Orange
  '#2ECC71', // Emerald
  '#F1C40F', // Sunflower
  '#3498DB', // Ocean Blue
  '#E74C3C', // Cherry Red
  '#1ABC9C', // Mint
  '#E84393', // Rose
];

interface ColorPickerProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  selectedColor,
  onColorSelect,
}) => {
  const [additionalColors, setAdditionalColors] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Generate 10 random colors using tinycolor
  const generateRandomColors = () => {
    return Array.from({ length: 10 }, () => {
      // Generate a random hue (0-360)
      const hue = Math.floor(Math.random() * 360);
      // Use high saturation and medium lightness for vibrant colors
      return tinycolor({ h: hue, s: 85, l: 65 }).toHexString();
    });
  };

  const handleShowMore = () => {
    setAdditionalColors(prev => [... new Set([...prev, ...generateRandomColors()])]);
  };

  const handleShowLess = () => {
    setAdditionalColors([]);
  };

  // Scroll to bottom when additional colors are added
  useEffect(() => {
    if (additionalColors.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100); // Small delay to ensure content is rendered
    }
  }, [additionalColors]);

  const allColors = [...COLOR_OPTIONS, ...additionalColors];

  return (
    <View>
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.colorGrid}>
          {allColors.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorButton,
                { backgroundColor: color },
                selectedColor === color && {
                  ...styles.selectedColor,
                  borderColor: tinycolor(color).lighten(15).toString(),
                },
              ]}
              onPress={() => onColorSelect(color)}
            >
              {selectedColor === color && (
                <MaterialCommunityIcons
                  name="check"
                  size={20}
                  color="#fff"
                  style={styles.checkIcon}
                />
              )}
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={styles.moreButton}
            onPress={handleShowMore}
          >
            <MaterialCommunityIcons 
              name="dots-horizontal" 
              size={24} 
              color="#999" 
            />
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {additionalColors.length > 0 && (
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
  scrollView: {
    maxHeight: 200,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColor: {
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  checkIcon: {
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  moreButton: {
    width: 40,
    height: 40,
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