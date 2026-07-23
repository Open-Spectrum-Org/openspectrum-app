import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppHeader } from '../../src/components/AppHeader';
import { useChild } from '../../src/hooks/useChild';
import { useInsightsData } from '../../src/hooks/useInsightsData';
import { colors, typography, spacing, radius, categoryColor, categoryColorLight } from '../../src/theme';
import { todayDateString, addDays } from '../../src/utils/date';

type RangeOption = '7' | '14' | '30';

const RANGE_LABELS: Record<RangeOption, string> = {
  '7': '7 Days',
  '14': '14 Days',
  '30': '30 Days',
};

const CATEGORY_EMOJIS: Record<string, string> = {
  behavior: '⚡',
  emotion: '😊',
  food: '🍽️',
  medication: '💊',
  sleep: '😴',
  sensory: '🔮',
  transitions: '🔄',
  successes: '🌟',
  trigger: '⚠️',
  other: '📝',
};

const RATING_INFO: Record<string, { label: string; emoji: string; color: string }> = {
  better_than_usual: { label: 'Better days', emoji: '😊', color: colors.betterThanUsual },
  typical: { label: 'Typical days', emoji: '😐', color: colors.typical },
  difficult: { label: 'Difficult days', emoji: '😟', color: colors.difficult },
};

function hourLabel(h: number): string {
  if (h === 0) return '12a';
  if (h < 12) return `${h}a`;
  if (h === 12) return '12p';
  return `${h - 12}p`;
}

export default function InsightsScreen() {
  const { child } = useChild();
  const [range, setRange] = useState<RangeOption>('7');

  const today = todayDateString();
  const startDate = addDays(today, -parseInt(range) + 1);
  const { data, loading } = useInsightsData(startDate, today);

  // Derived insights
  const peakHour = useMemo(() => {
    if (!data?.hourlyDistribution.length) return null;
    return data.hourlyDistribution.reduce((best, cur) => (cur.count > best.count ? cur : best));
  }, [data]);

  const trend = useMemo(() => {
    if (!data?.dailyCounts || data.dailyCounts.length < 2) return null;
    const counts = data.dailyCounts;
    const mid = Math.floor(counts.length / 2);
    const firstHalf = counts.slice(0, mid);
    const secondHalf = counts.slice(mid);
    const avg = (arr: typeof counts) => arr.reduce((s, d) => s + d.count, 0) / (arr.length || 1);
    const first = avg(firstHalf);
    const second = avg(secondHalf);
    const diff = second - first;
    const pct = first > 0 ? Math.round((Math.abs(diff) / first) * 100) : 0;
    if (Math.abs(diff) < 0.5) return { direction: 'stable' as const, pct: 0 };
    return { direction: diff > 0 ? ('up' as const) : ('down' as const), pct };
  }, [data]);

  const avgPerDay = useMemo(() => {
    if (!data) return 0;
    const days = parseInt(range);
    return Math.round((data.totalCount / days) * 10) / 10;
  }, [data, range]);

  const maxHourly = useMemo(() => {
    if (!data?.hourlyDistribution.length) return 0;
    return Math.max(...data.hourlyDistribution.map((h) => h.count));
  }, [data]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <AppHeader
        searchQuery=""
        onSearchChange={() => {}}
        placeholder="Search coming soon"
        showHome={true}
        editable={false}
      />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Range selector */}
        <View style={styles.rangeRow}>
          {(Object.keys(RANGE_LABELS) as RangeOption[]).map((opt) => (
            <Pressable
              key={opt}
              onPress={() => setRange(opt)}
              style={[styles.rangeBtn, range === opt && styles.rangeBtnActive]}
            >
              <Text style={[styles.rangeBtnText, range === opt && styles.rangeBtnTextActive]}>
                {RANGE_LABELS[opt]}
              </Text>
            </Pressable>
          ))}
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : !data || data.totalCount === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>Not enough data yet</Text>
            <Text style={styles.emptySubtext}>Keep logging to discover patterns</Text>
          </View>
        ) : (
          <>
            {/* Summary cards row */}
            <View style={styles.summaryRow}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>{data.totalCount}</Text>
                <Text style={styles.summaryLabel}>Total Logs</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>{avgPerDay}</Text>
                <Text style={styles.summaryLabel}>Per Day</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryNumber}>{data.categoryBreakdown.length}</Text>
                <Text style={styles.summaryLabel}>Categories</Text>
              </View>
            </View>

            {/* Trend insight */}
            {trend && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>
                  {trend.direction === 'up' ? '📈' : trend.direction === 'down' ? '📉' : '➡️'}
                </Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Activity Trend</Text>
                  <Text style={styles.insightBody}>
                    {trend.direction === 'stable'
                      ? 'Observation rate has been steady this period.'
                      : `Observations are ${trend.direction === 'up' ? 'up' : 'down'} ~${trend.pct}% compared to the first half of this period.`}
                  </Text>
                </View>
              </View>
            )}

            {/* Peak hour insight */}
            {peakHour && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>🕐</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Busiest Time</Text>
                  <Text style={styles.insightBody}>
                    Most observations logged around {hourLabel(peakHour.hour)} ({peakHour.count} entries).
                  </Text>
                </View>
              </View>
            )}

            {/* Top category insight */}
            {data.categoryBreakdown.length > 0 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>
                  {CATEGORY_EMOJIS[data.categoryBreakdown[0].category] ?? '📝'}
                </Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Most Tracked</Text>
                  <Text style={styles.insightBody}>
                    <Text style={{ fontWeight: '600', textTransform: 'capitalize' }}>
                      {data.categoryBreakdown[0].category}
                    </Text>{' '}
                    is the most logged category with {data.categoryBreakdown[0].count} observations (
                    {Math.round((data.categoryBreakdown[0].count / data.totalCount) * 100)}%).
                  </Text>
                </View>
              </View>
            )}

            {/* Reflection correlation */}
            {data.reflectionCorrelation.length > 0 && (
              <View style={styles.insightCard}>
                <Text style={styles.insightIcon}>💡</Text>
                <View style={styles.insightContent}>
                  <Text style={styles.insightTitle}>Reflection Patterns</Text>
                  {data.reflectionCorrelation.map((rc) => {
                    const info = RATING_INFO[rc.rating];
                    return (
                      <Text key={rc.rating} style={styles.insightBody}>
                        {info?.emoji ?? '❓'} {info?.label ?? rc.rating}: avg{' '}
                        <Text style={{ fontWeight: '600' }}>{rc.avgObservations}</Text> observations/day
                      </Text>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Hourly distribution */}
            {data.hourlyDistribution.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Time of Day</Text>
                <View style={styles.hourlyChart}>
                  {data.hourlyDistribution.map((h) => (
                    <View key={h.hour} style={styles.hourlyCol}>
                      <View
                        style={[
                          styles.hourlyBar,
                          {
                            height: maxHourly > 0 ? Math.max((h.count / maxHourly) * 60, 2) : 2,
                            backgroundColor:
                              peakHour && h.hour === peakHour.hour ? colors.primary : colors.primaryLight,
                          },
                        ]}
                      />
                      <Text style={styles.hourlyLabel}>{h.hour % 3 === 0 ? hourLabel(h.hour) : ''}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Top tags */}
            {data.topTags.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Most Used Tags</Text>
                {data.topTags.map((tag, i) => (
                  <View key={tag.name} style={styles.tagRow}>
                    <View style={[styles.rankBadge, { backgroundColor: categoryColorLight(tag.category, 0.15) }]}>
                      <Text style={[styles.rankText, { color: categoryColor(tag.category) }]}>{i + 1}</Text>
                    </View>
                    <Text style={styles.tagName}>{tag.name}</Text>
                    <Text style={[styles.tagCount, { color: categoryColor(tag.category) }]}>{tag.count}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxxl,
  },
  rangeRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  rangeBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rangeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rangeBtnText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  rangeBtnTextActive: {
    color: colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 80,
    gap: spacing.sm,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    ...typography.h3,
    color: colors.text,
  },
  emptySubtext: {
    ...typography.body,
    color: colors.textSecondary,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryNumber: {
    ...typography.h2,
    color: colors.primary,
  },
  summaryLabel: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  insightIcon: {
    fontSize: 28,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...typography.label,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  insightBody: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  hourlyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 90,
    gap: 1,
  },
  hourlyCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  hourlyBar: {
    width: '80%',
    borderRadius: 2,
    minHeight: 2,
  },
  hourlyLabel: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
    height: 12,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: {
    ...typography.label,
  },
  tagName: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  tagCount: {
    ...typography.label,
  },
});
