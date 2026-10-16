// src/screens/programdirector/summaryreport/components/BehaviorSummaryCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { MASS_ITEMS, FAST_ITEMS, type BehaviorData } from '../summaryReportTypes';

interface BehaviorSummaryCardProps {
  behavior?: BehaviorData;
}

export const BehaviorSummaryCard: React.FC<BehaviorSummaryCardProps> = React.memo(
  ({ behavior }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Behavior Assessment</Text>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.sectionTitle}>Motivation Assessment Scale (MASS) - Q&A</Text>
          {MASS_ITEMS.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQuestion}>
                {item.id}. {item.text}
              </Text>
              <Text style={styles.itemAnswer}>
                Answer:{' '}
                <Text
                  style={[
                    styles.answerValue,
                    behavior?.massAnswers?.[item.id] ? styles.answeredText : styles.unansweredText,
                  ]}
                >
                  {behavior?.massAnswers?.[item.id] || 'Not answered'}
                </Text>
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Functional Analysis Screening Tool (FAST) - Q&A</Text>
          {FAST_ITEMS.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <Text style={styles.itemQuestion}>
                {item.id}. {item.text}
              </Text>
              <Text style={styles.itemAnswer}>
                Answer:{' '}
                <Text
                  style={[
                    styles.answerValue,
                    behavior?.fastAnswers?.[item.id] ? styles.answeredText : styles.unansweredText,
                  ]}
                >
                  {behavior?.fastAnswers?.[item.id] || 'Not answered'}
                </Text>
              </Text>
            </View>
          ))}

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>ABC Incident Log Summary</Text>
          <Text style={styles.subNote}>
            Total incidents:{' '}
            <Text style={styles.subNoteBold}>{behavior?.abc?.totalIncidents ?? 0}</Text>
          </Text>
          {(behavior?.abc?.topAntecedents || []).length > 0 ? (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeaderRow}>
                <Text style={styles.tableHeaderCell}>Top Antecedents</Text>
                <Text style={[styles.tableHeaderCell, styles.tableRight]}>Count</Text>
              </View>
              {behavior?.abc?.topAntecedents?.map((item, idx) => (
                <View
                  key={item.antecedent ? `ante-${item.antecedent}` : `ante-idx-${idx}`}
                  style={styles.tableRow}
                >
                  <Text style={styles.tableCell}>{item.antecedent || item.name}</Text>
                  <Text style={[styles.tableCell, styles.tableRight]}>{item.count}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>No behavior incidents logged for this student.</Text>
          )}
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeaderBlue: {
    backgroundColor: '#0284C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  cardBody: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.navyText,
    marginBottom: spacing.xs,
  },
  itemRow: {
    marginBottom: spacing.sm,
  },
  itemQuestion: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
    marginBottom: 4,
  },
  itemAnswer: {
    fontSize: 13,
    color: colors.bodyText,
  },
  answerValue: {
    fontWeight: '600',
  },
  answeredText: {
    color: '#0284C7',
  },
  unansweredText: {
    color: colors.mutedText,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.md,
  },
  subNote: {
    fontSize: 13,
    color: colors.bodyText,
    marginBottom: spacing.xs,
  },
  subNoteBold: {
    fontWeight: '700',
    color: colors.navyText,
  },
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginTop: spacing.xs,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.bgApp,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderCell: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedText,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableCell: {
    fontSize: 13,
    color: colors.navyText,
  },
  tableRight: {
    textAlign: 'right',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    fontStyle: 'italic',
    marginVertical: 8,
  },
});
