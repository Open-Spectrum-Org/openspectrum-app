import React, { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { colors, spacing, typography } from '../theme';
import type { VoiceRecordingState } from '../types/voice';

interface MicButtonProps {
  onPressIn: () => void;
  onPressOut: () => void;
  state: VoiceRecordingState;
  durationSeconds: number;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function MicButton({ onPressIn, onPressOut, state, durationSeconds }: MicButtonProps) {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (state === 'recording') {
      pulse.value = withRepeat(withTiming(1.08, { duration: 800 }), -1, true);
    } else {
      cancelAnimation(pulse);
      pulse.value = 1;
    }
  }, [state, pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const isRecording = state === 'recording';
  const isProcessing = state === 'transcribing' || state === 'analyzing' || state === 'saving';

  const label = isRecording
    ? 'Release to Stop'
    : isProcessing
      ? state === 'analyzing' ? 'Analyzing...' : 'Processing...'
      : 'Hold to Speak';

  return (
    <View style={styles.container}>
      <Animated.View style={animatedStyle}>
        <Pressable
          onPressIn={isProcessing ? undefined : onPressIn}
          onPressOut={isProcessing ? undefined : onPressOut}
          style={[
            styles.button,
            isRecording && styles.recording,
            isProcessing && styles.processing,
          ]}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="large" color={colors.white} />
          ) : (
            <Text style={styles.icon}>{isRecording ? '🔴' : '🎙️'}</Text>
          )}
        </Pressable>
      </Animated.View>
      {isRecording && (
        <Text style={styles.duration}>{formatDuration(durationSeconds)}</Text>
      )}
      <Text style={[styles.label, isRecording && styles.labelRecording]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.primaryLight,
    borderWidth: 3,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recording: {
    backgroundColor: colors.danger,
    borderColor: colors.danger,
  },
  processing: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  icon: {
    fontSize: 48,
  },
  duration: {
    ...typography.h3,
    color: colors.danger,
    fontVariant: ['tabular-nums'],
  },
  label: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  labelRecording: {
    color: colors.danger,
    fontWeight: '600',
  },
});
