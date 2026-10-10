// src/screens/programdirector/dashboard/components/PdWorkflowPipelineCard.tsx

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { STAGE_COLORS, type WorkflowStage } from '../dashboardTypes';

interface PdWorkflowPipelineCardProps {
  stages: WorkflowStage[];
}

export const PdWorkflowPipelineCard: React.FC<PdWorkflowPipelineCardProps> = React.memo(
  ({ stages }) => {
    return (
      <View style={styles.card}>
        <Text style={[typography.h3, { marginBottom: spacing.md }]}>Student Workflow</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pipelineScroll}
        >
          {stages.map((stage, i) => {
            const c = STAGE_COLORS[stage.key] ?? STAGE_COLORS.enrolled;
            return (
              <View key={stage.key} style={styles.pipelineItem}>
                <View
                  style={[styles.pipelineStage, { backgroundColor: c.bg, borderColor: c.border }]}
                >
                  <View style={[styles.pipelineDot, { backgroundColor: c.dot }]} />
                  <Text style={[styles.pipelineStageName, { color: c.text }]}>{stage.name}</Text>
                  <Text style={[styles.pipelineStageCount, { color: c.text }]}>{stage.count}</Text>
                  <Text style={styles.pipelineStageSub}>student{stage.count !== 1 ? 's' : ''}</Text>
                </View>
                {i < stages.length - 1 && (
                  <View style={styles.pipelineArrow}>
                    <Feather name="chevron-right" size={20} color="#CBD5E1" />
                  </View>
                )}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...makeShadow(1, 3, 0.04, '0, 0, 0', 1),
  },
  pipelineScroll: {
    paddingVertical: spacing.xs,
  },
  pipelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pipelineStage: {
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    minWidth: 96,
    borderWidth: 1,
  },
  pipelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: spacing.xs,
  },
  pipelineStageName: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  pipelineStageCount: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: 2,
  },
  pipelineStageSub: {
    fontSize: 10,
    color: colors.mutedText,
    marginTop: 1,
  },
  pipelineArrow: {
    paddingHorizontal: spacing.xs,
  },
});
