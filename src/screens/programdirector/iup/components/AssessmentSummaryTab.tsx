import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { IupCandidate, IupContext } from '../types';
import { AbllsGridSheet, AbllsItemInspectorModal } from '../../../assessments/components';
import {
  DEFAULT_ABLLS_DOMAINS,
  buildAbllsDomainsFromConfig,
  loadStorageAssessment,
  type AbllsDomainDef,
  type Score,
} from '../../../assessments/abllsConfigHelper';
import { computeAbllsSummaryData } from '../../../assessments/abllsCalculationHelper';
import type { SelectedItemState } from '../../../assessments/types';
import {
  getSkillsAssessment,
  getBehaviorAssessment,
  getSensoryAssessment,
} from '../../../../api/teacherExtrasApi';
import {
  MASS_ITEMS,
  FAST_ITEMS,
  calculateMassCategoryScores,
  calculateFastCategoryScores,
  type MassItem,
  type FastItem,
  type BehaviorTargetAssessmentData,
} from '../../../assessments/behavior/behaviorTypes';
import type { SensoryActivityItem } from '../../../assessments/sensory/types';
import { getFormConfig } from '../../../../api/institutionalAdminApi';

interface AssessmentSummaryTabProps {
  context: IupContext | null;
  selectedCandidate: IupCandidate | null;
  report?: any;
}

export function AssessmentSummaryTab({
  context,
  selectedCandidate,
  report,
}: AssessmentSummaryTabProps) {
  const studentId = selectedCandidate?.id || '';
  const [abllsDomains, setAbllsDomains] = useState<AbllsDomainDef[]>(DEFAULT_ABLLS_DOMAINS);
  const [abllsScores, setAbllsScores] = useState<Record<string, Score>>({});
  const [selectedAbllsItem, setSelectedAbllsItem] = useState<SelectedItemState | null>(null);

  const [targetBehaviors, setTargetBehaviors] = useState<BehaviorTargetAssessmentData[]>([
    {
      id: 'default-1',
      behaviorName: 'Aggression',
      definition: 'Physical or verbal acts directed toward others',
      massAnswers: {},
      fastAnswers: {},
      abcNotes: '',
    },
  ]);
  const [massItems] = useState<MassItem[]>(MASS_ITEMS);
  const [fastItems] = useState<FastItem[]>(FAST_ITEMS);
  const [sensoryActivities, setSensoryActivities] = useState<SensoryActivityItem[]>([]);

  useEffect(() => {
    if (!studentId) return;

    let mounted = true;
    getFormConfig('ABLLS Assessment Form')
      .then(({ data: cfg }) => {
        if (mounted && cfg && Array.isArray(cfg.fields) && cfg.fields.length > 0) {
          setAbllsDomains(buildAbllsDomainsFromConfig(cfg.fields));
        } else {
          setAbllsDomains(DEFAULT_ABLLS_DOMAINS);
        }
      })
      .catch(() => {
        if (mounted) setAbllsDomains(DEFAULT_ABLLS_DOMAINS);
      });

    getSkillsAssessment(studentId)
      .then(({ data: saved }) => {
        const savedData = (saved?.data ?? saved ?? {}) as { scores?: Record<string, Score> };
        const apiScores = savedData.scores ?? (saved as any)?.scores ?? {};
        const localData = loadStorageAssessment(studentId);
        const mergedScores: Record<string, Score> = {
          ...apiScores,
          ...(localData?.scores ?? {}),
        };
        if (mounted) setAbllsScores(mergedScores);
      })
      .catch(() => {
        const localData = loadStorageAssessment(studentId);
        if (mounted) {
          if (localData?.scores) setAbllsScores(localData.scores);
          else setAbllsScores({});
        }
      });

    // Fetch Behavior Assessment data
    getBehaviorAssessment(studentId)
      .then(({ data: saved }) => {
        if (!mounted) return;
        const savedData = (saved?.data ?? saved ?? {}) as any;
        if (Array.isArray(savedData.target_behaviors) && savedData.target_behaviors.length > 0) {
          const parsed: BehaviorTargetAssessmentData[] = savedData.target_behaviors.map(
            (b: any, idx: number) => ({
              id: b.id || `target-${idx}-${Date.now()}`,
              behaviorName: b.behavior_name || b.behaviorName || `Target ${idx + 1}`,
              definition: b.definition || b.behaviorDefinition || '',
              massAnswers: b.mass_responses || b.massAnswers || {},
              fastAnswers: b.fast_responses || b.fastAnswers || {},
              abcNotes: b.abc_notes || b.abcNotes || '',
              dominantFunction: b.dominant_function,
              hypothesizedFunction: b.hypothesized_function,
              status: b.status,
            }),
          );
          setTargetBehaviors(parsed);
        } else if (savedData.massAnswers || savedData.fastAnswers) {
          setTargetBehaviors([
            {
              id: 'legacy-1',
              behaviorName: 'Aggression',
              definition: 'Physical or verbal acts directed toward others',
              massAnswers: savedData.massAnswers || {},
              fastAnswers: savedData.fastAnswers || {},
              abcNotes: '',
            },
          ]);
        } else {
          setTargetBehaviors([
            {
              id: 'default-1',
              behaviorName: 'Aggression',
              definition: 'Physical or verbal acts directed toward others',
              massAnswers: {},
              fastAnswers: {},
              abcNotes: '',
            },
          ]);
        }
      })
      .catch(() => {
        if (mounted) {
          setTargetBehaviors([
            {
              id: 'default-1',
              behaviorName: 'Aggression',
              definition: 'Physical or verbal acts directed toward others',
              massAnswers: {},
              fastAnswers: {},
              abcNotes: '',
            },
          ]);
        }
      });

    // Fetch Sensory Assessment data
    getSensoryAssessment(studentId)
      .then(({ data: res }) => {
        if (!mounted) return;
        const savedData = (res?.data ?? res ?? {}) as any;
        if (Array.isArray(savedData.activities) && savedData.activities.length > 0) {
          setSensoryActivities(savedData.activities);
        } else {
          setSensoryActivities([]);
        }
      })
      .catch(() => {
        if (mounted) setSensoryActivities([]);
      });

    return () => {
      mounted = false;
    };
  }, [studentId]);

  const countSensoryEngagement = useCallback(
    (level: string) => sensoryActivities.filter((a) => a.engagementLevel === level).length,
    [sensoryActivities],
  );

  const countSensoryReaction = useCallback(
    (reaction: string) => sensoryActivities.filter((a) => a.responseReaction === reaction).length,
    [sensoryActivities],
  );

  const abllsSummaryData = useMemo(
    () => computeAbllsSummaryData(abllsDomains, abllsScores),
    [abllsDomains, abllsScores],
  );

  const preferenceItems = useMemo(() => {
    const raw = report?.preferences?.top_items || context?.topReinforcers;
    const items =
      Array.isArray(raw) && raw.length > 0
        ? raw
        : ['Sensory swing', 'Visual timer', 'Kinetic sand', 'Bubbles'];
    const pcts = [95, 80, 65, 50, 40];
    const levels = [
      'High Preference',
      'High Preference',
      'Moderate Preference',
      'Moderate Preference',
      'Low Preference',
    ];
    const colorsList = ['#10B981', '#10B981', '#F59E0B', '#F59E0B', '#6B7280'];
    return items.slice(0, 5).map((name: string, idx: number) => ({
      name,
      level: levels[idx] || 'Moderate',
      pct: pcts[idx] || 50,
      color: colorsList[idx] || '#F59E0B',
    }));
  }, [report, context]);

  const handleUpdateItemScore = (itemId: string, newScore: Score) => {
    setAbllsScores((prev) => ({
      ...prev,
      [itemId]: newScore,
    }));
    if (selectedAbllsItem && selectedAbllsItem.id === itemId) {
      setSelectedAbllsItem((prev) => (prev ? { ...prev, score: newScore } : null));
    }
  };

  return (
    <View style={styles.tabContentWrap}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Student Demographics & Intake Context</Text>
        <View style={styles.demoGrid}>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Student Name</Text>
            <Text style={styles.demoValue}>
              {context?.studentName || selectedCandidate?.name || '—'}
            </Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Age / DOB</Text>
            <Text style={styles.demoValue}>
              Age {context?.age ?? selectedCandidate?.age ?? '—'} · {context?.dob || '—'}
            </Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Program</Text>
            <Text style={styles.demoValue}>
              {context?.program || selectedCandidate?.program || 'ABA Therapy'}
            </Text>
          </View>
          <View style={styles.demoItem}>
            <Text style={styles.demoLabel}>Enrolled Date</Text>
            <Text style={styles.demoValue}>{context?.enrollmentDate || '—'}</Text>
          </View>
        </View>
      </View>

      {/* 1. ABLLS-R Skill Tracking System & Color Need Map */}
      <View style={styles.card}>
        <View style={styles.contextHeaderRow}>
          <Feather name="grid" size={16} color={colors.primaryBlue} />
          <Text style={styles.cardTitle}>
            Skills Assessment (ABLLS-R Skill Tracking & Color Need Map)
          </Text>
        </View>
        <AbllsGridSheet summaryData={abllsSummaryData} onSelectItem={setSelectedAbllsItem} />
      </View>

      {/* 2. Assessment Summary by Target Behavior */}
      <View style={styles.card}>
        <View style={styles.contextHeaderRow}>
          <Feather name="alert-triangle" size={16} color="#EF4444" />
          <Text style={styles.cardTitle}>Assessment Summary by Target Behavior</Text>
        </View>
        <Text style={styles.cardSubtitle}>
          Review computed function rankings and maintaining variables across all evaluated target
          behaviors.
        </Text>

        {targetBehaviors.map((b, idx) => {
          const mCount = massItems.filter((i) => {
            const val = b.massAnswers?.[i.id] ?? b.massAnswers?.[String(i.questionNumber)];
            return val !== undefined && val !== null && val !== '';
          }).length;
          const fCount = fastItems.filter((i) => {
            const val = b.fastAnswers?.[i.id] ?? b.fastAnswers?.[String(i.questionNumber)];
            return val !== undefined && val !== null && val !== '';
          }).length;

          const bMassScores = calculateMassCategoryScores(b.massAnswers || {});
          const bFastScores = calculateFastCategoryScores(b.fastAnswers || {});

          return (
            <View key={b.id || idx} style={styles.behaviorSummaryCard}>
              <View style={styles.behaviorSummaryRow}>
                <View style={{ flex: 1, paddingRight: spacing.sm }}>
                  <Text style={styles.behaviorSummaryTitle}>{b.behaviorName}</Text>
                  {b.definition ? (
                    <Text style={styles.behaviorSummaryDef}>{b.definition}</Text>
                  ) : null}
                </View>
                <View style={styles.summaryBadgeRow}>
                  <View style={styles.miniBadge}>
                    <Text style={styles.miniBadgeText}>
                      MASS: {mCount}/{massItems.length}
                    </Text>
                  </View>
                  <View style={styles.miniBadge}>
                    <Text style={styles.miniBadgeText}>
                      FAST: {fCount}/{fastItems.length}
                    </Text>
                  </View>
                </View>
              </View>

              {(mCount > 0 || fCount > 0) && (
                <View style={styles.summaryBox}>
                  {mCount > 0 && (
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineLabel}>MAS-II Primary Function:</Text>
                      <Text style={styles.summaryLineValue}>
                        {bMassScores.primaryMaintainingVariable} (Mean:{' '}
                        {bMassScores.scores[bMassScores.primaryMaintainingVariable]?.mean.toFixed(
                          2,
                        )}
                        )
                      </Text>
                    </View>
                  )}
                  {fCount > 0 && (
                    <View style={styles.summaryLine}>
                      <Text style={styles.summaryLineLabel}>FAST Dominant Variable:</Text>
                      <Text style={styles.summaryLineValue}>
                        {bFastScores.dominantVariables.join(', ') || 'None flagged'} (
                        {bFastScores.maxPercentage}%)
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* 3. Preference & Reinforcement Assessment */}
      <View style={styles.card}>
        <View style={styles.contextHeaderRow}>
          <Feather name="star" size={16} color="#F59E0B" />
          <Text style={styles.cardTitle}>Preference & Reinforcement Assessment</Text>
        </View>
        <View style={styles.graphContainer}>
          {preferenceItems.map((p) => (
            <View key={p.name} style={styles.chartBarRow}>
              <View style={styles.chartBarHeader}>
                <Text style={styles.chartBarLabel}>{p.name}</Text>
                <Text style={styles.chartBarValue}>
                  {p.level} · {p.pct}%
                </Text>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[styles.progressBarFill, { width: `${p.pct}%`, backgroundColor: p.color }]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* 4. Sensory Assessment Summary */}
      <View style={styles.card}>
        <View style={styles.contextHeaderRow}>
          <Feather name="feather" size={16} color="#8B5CF6" />
          <Text style={styles.cardTitle}>Summary</Text>
        </View>

        <Text style={styles.sensorySummarySubtitle}>BY ENGAGEMENT LEVEL</Text>
        <View style={styles.sensoryBadgeRow}>
          <View style={styles.blueBadge}>
            <Text style={styles.badgeValBlue}>{countSensoryEngagement('Independent')}</Text>
            <Text style={styles.badgeLabelBlue}>Independent</Text>
          </View>
          <View style={styles.blueBadge}>
            <Text style={styles.badgeValBlue}>
              {countSensoryEngagement('Partial Physical Prompt')}
            </Text>
            <Text style={styles.badgeLabelBlue}>Partial Physical Prompt</Text>
          </View>
          <View style={styles.blueBadge}>
            <Text style={styles.badgeValBlue}>
              {countSensoryEngagement('Full Physical Prompt')}
            </Text>
            <Text style={styles.badgeLabelBlue}>Full Physical Prompt</Text>
          </View>
          <View style={styles.blueBadge}>
            <Text style={styles.badgeValBlue}>{countSensoryEngagement('Not Applicable')}</Text>
            <Text style={styles.badgeLabelBlue}>Not Applicable</Text>
          </View>
        </View>

        <Text style={[styles.sensorySummarySubtitle, { marginTop: 16 }]}>
          BY RESPONSE / REACTION
        </Text>
        <View style={styles.sensoryBadgeRow}>
          <View style={styles.yellowBadge}>
            <Text style={styles.badgeValYellow}>{countSensoryReaction('Enjoyed')}</Text>
            <Text style={styles.badgeLabelYellow}>Enjoyed</Text>
          </View>
          <View style={styles.yellowBadge}>
            <Text style={styles.badgeValYellow}>{countSensoryReaction('Neutral')}</Text>
            <Text style={styles.badgeLabelYellow}>Neutral</Text>
          </View>
          <View style={styles.yellowBadge}>
            <Text style={styles.badgeValYellow}>{countSensoryReaction('Refused')}</Text>
            <Text style={styles.badgeLabelYellow}>Refused</Text>
          </View>
          <View style={styles.yellowBadge}>
            <Text style={styles.badgeValYellow}>{countSensoryReaction('Not Observed')}</Text>
            <Text style={styles.badgeLabelYellow}>Not Observed</Text>
          </View>
        </View>
      </View>

      {/* Skill Item Inspector Modal */}
      <AbllsItemInspectorModal
        selectedItem={selectedAbllsItem}
        onClose={() => setSelectedAbllsItem(null)}
        onUpdateScore={handleUpdateItemScore}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabContentWrap: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.navyText,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 2,
    marginBottom: spacing.sm,
  },
  behaviorSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  behaviorSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  behaviorSummaryTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  behaviorSummaryDef: {
    fontSize: 12,
    color: colors.mutedText,
    marginTop: 2,
  },
  summaryBadgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  miniBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  miniBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.navyText,
  },
  summaryBox: {
    backgroundColor: '#FFFFFF',
    padding: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  summaryLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLineLabel: {
    fontSize: 12,
    color: colors.mutedText,
    fontWeight: '600',
  },
  summaryLineValue: {
    fontSize: 12,
    color: colors.navyText,
    fontWeight: '700',
  },
  sensorySummarySubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  sensoryBadgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  blueBadge: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 110,
  },
  badgeValBlue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0284C7',
  },
  badgeLabelBlue: {
    fontSize: 11,
    color: '#0369A1',
    marginTop: 2,
    textAlign: 'center',
  },
  yellowBadge: {
    backgroundColor: '#FEFCE8',
    borderWidth: 1,
    borderColor: '#FEF08A',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    minWidth: 100,
  },
  badgeValYellow: {
    fontSize: 20,
    fontWeight: '700',
    color: '#D97706',
  },
  badgeLabelYellow: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    textAlign: 'center',
  },
  demoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginTop: 12,
  },
  demoItem: {
    minWidth: 180,
    flex: 1,
  },
  demoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  demoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.navyText,
    marginTop: 2,
  },
  contextSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contextHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  contextSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  contextText: {
    fontSize: 13,
    color: colors.bodyText,
    lineHeight: 20,
  },
  reinforcerChipsWrap: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  reinforcerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.full,
    gap: 4,
  },
  reinforcerRank: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  reinforcerChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  graphContainer: {
    gap: spacing.md,
    marginTop: spacing.md,
  },
  chartBarRow: {
    gap: 4,
  },
  chartBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chartBarLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  chartBarValue: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
  },
  progressBarBg: {
    height: 10,
    backgroundColor: '#E2E8F0',
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: radius.pill,
  },
});
