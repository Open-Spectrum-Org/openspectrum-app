export const colors = {
  // Category colors
  behavior: '#7C3AED',
  food: '#14B8A6',
  medication: '#F59E0B',
  emotion: '#EC4899',
  sleep: '#6366F1',
  sensory: '#8B5CF6',
  transitions: '#06B6D4',
  successes: '#22C55E',
  trigger: '#EF4444',
  other: '#6B7280',

  // UI colors
  primary: '#3B82F6',
  primaryLight: '#DBEAFE',
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceAlt: '#F3F4F6',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  white: '#FFFFFF',
  black: '#000000',

  // Semantic
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
  success: '#22C55E',
  successLight: '#DCFCE7',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',

  // Reflection
  betterThanUsual: '#22C55E',
  typical: '#3B82F6',
  difficult: '#EF4444',
} as const;

export type CategoryColor = keyof typeof colors;

export function categoryColor(category: string): string {
  return (colors as Record<string, string>)[category] ?? colors.other;
}

export function categoryColorLight(category: string, opacity = 0.15): string {
  const hex = categoryColor(category);
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
