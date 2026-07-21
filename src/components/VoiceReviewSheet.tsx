import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, spacing, typography, radius } from '../theme';
import { categoryColor, categoryColorLight } from '../theme/colors';
import type { GroqParsedResult, SuggestedObservation } from '../types/voice';

interface VoiceReviewSheetProps {
  visible: boolean;
  transcript: string;
  parsedResult: GroqParsedResult | null;
  error: string | null;
  isAnalyzing: boolean;
  onChangeTranscript: (text: string) => void;
  onReanalyze: () => void;
  onToggleObservation: (id: string) => void;
  onRemoveObservation: (id: string) => void;
  onConfirm: () => void;
  onDiscard: () => void;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100);
  const badgeColor = confidence >= 0.7 ? colors.success : colors.warning;
  return (
    <View style={[styles.badge, { backgroundColor: badgeColor + '20' }]}>
      <Text style={[styles.badgeText, { color: badgeColor }]}>{pct}%</Text>
    </View>
  );
}

function ObservationCard({
  observation,
  onToggle,
  onRemove,
}: {
  observation: SuggestedObservation;
  onToggle: () => void;
  onRemove: () => void;
}) {
  const catColor = categoryColor(observation.category);
  const dimmed = !observation.confirmed;

  return (
    <View style={[styles.card, dimmed && styles.cardDimmed]}>
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
          <Text style={styles.categoryLabel}>{observation.category}</Text>
          <ConfidenceBadge confidence={observation.confidence} />
        </View>
        <View style={styles.cardActions}>
          <Pressable onPress={onToggle} style={styles.actionBtn}>
            <Text style={styles.actionText}>{observation.confirmed ? '✓' : '○'}</Text>
          </Pressable>
          <Pressable onPress={onRemove} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: colors.danger }]}>✕</Text>
          </Pressable>
        </View>
      </View>
      <Text style={styles.cardTitle}>{observation.title}</Text>
      {observation.tagNames.length > 0 && (
        <View style={styles.tagRow}>
          {observation.tagNames.map((tag) => (
            <View
              key={tag}
              style={[styles.tagChip, { backgroundColor: categoryColorLight(observation.category) }]}
            >
              <Text style={[styles.tagChipText, { color: catColor }]}>{tag}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function VoiceReviewSheet({
  visible,
  transcript,
  parsedResult,
  error,
  isAnalyzing,
  onChangeTranscript,
  onReanalyze,
  onToggleObservation,
  onRemoveObservation,
  onConfirm,
  onDiscard,
}: VoiceReviewSheetProps) {
  const confirmedCount = parsedResult?.suggestedObservations.filter((o) => o.confirmed).length ?? 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.sheet}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Voice Log</Text>
          <Pressable onPress={onDiscard} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {/* Transcript */}
          <Text style={styles.sectionLabel}>Transcript</Text>
          <TextInput
            style={styles.transcriptInput}
            value={transcript}
            onChangeText={onChangeTranscript}
            multiline
            placeholder="Your speech will appear here..."
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            onPress={onReanalyze}
            style={[styles.reanalyzeBtn, isAnalyzing && styles.btnDisabled]}
            disabled={isAnalyzing}
          >
            <Text style={styles.reanalyzeBtnText}>
              {isAnalyzing ? 'Analyzing...' : parsedResult ? 'Re-analyze' : 'Analyze'}
            </Text>
          </Pressable>

          {/* Error */}
          {error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* AI Summary */}
          {parsedResult && (
            <>
              <Text style={styles.summary}>{parsedResult.summary}</Text>

              {/* Observation Cards */}
              <Text style={styles.sectionLabel}>
                Suggested Observations ({parsedResult.suggestedObservations.length})
              </Text>
              {parsedResult.suggestedObservations.map((obs) => (
                <ObservationCard
                  key={obs.id}
                  observation={obs}
                  onToggle={() => onToggleObservation(obs.id)}
                  onRemove={() => onRemoveObservation(obs.id)}
                />
              ))}
            </>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Pressable onPress={onDiscard} style={styles.discardBtn}>
            <Text style={styles.discardBtnText}>Discard</Text>
          </Pressable>
          <Pressable
            onPress={onConfirm}
            style={[styles.confirmBtn, confirmedCount === 0 && styles.btnDisabled]}
            disabled={confirmedCount === 0}
          >
            <Text style={styles.confirmBtnText}>
              Confirm{confirmedCount > 0 ? ` (${confirmedCount})` : ''}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.text,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  transcriptInput: {
    ...typography.body,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reanalyzeBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  reanalyzeBtnText: {
    ...typography.button,
    color: colors.primary,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.danger,
  },
  summary: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardDimmed: {
    opacity: 0.5,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  badgeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.success,
  },
  cardTitle: {
    ...typography.body,
    color: colors.text,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.sm,
  },
  tagChipText: {
    ...typography.caption,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  discardBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  discardBtnText: {
    ...typography.button,
    color: colors.textSecondary,
  },
  confirmBtn: {
    flex: 2,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmBtnText: {
    ...typography.button,
    color: colors.white,
  },
});
