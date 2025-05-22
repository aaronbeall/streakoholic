import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MaterialCommunityIconName } from "../types";

// Modern, pleasing colors suitable for icons
export const DEFAULT_COLORS = [
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

// Get all available icons from MaterialCommunityIcons
export const ALL_ICONS = Object.keys(MaterialCommunityIcons.glyphMap) as MaterialCommunityIconName[];

export const DEFAULT_ICONS: MaterialCommunityIconName[] = [
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