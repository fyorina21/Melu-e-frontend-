import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { TaskAnalysisTemplate } from '../types';

interface TaskAnalysisTemplatesTableProps {
  templates: TaskAnalysisTemplate[];
  onAddNew: () => void;
  onEdit: (template: TaskAnalysisTemplate) => void;
  onDelete: (template: TaskAnalysisTemplate) => void;
}

export const TaskAnalysisTemplatesTable: React.FC<TaskAnalysisTemplatesTableProps> = React.memo(
  ({ templates, onAddNew, onEdit, onDelete }) => {
    return (
      <View style={styles.tableCard}>
        <View style={styles.tableCardHeader}>
          <Text style={styles.cardHeaderTitle}>Step-by-Step Task Analysis Routines</Text>
          <TouchableOpacity
            style={styles.headerAddBtn}
            onPress={onAddNew}
            accessibilityRole="button"
            accessibilityLabel="Add New Template"
          >
            <Feather name="plus" size={14} color={colors.navyText} />
            <Text style={styles.headerAddBtnText}>Add New Template</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.th, { flex: 3 }]}>TEMPLATE NAME</Text>
          <Text style={[styles.th, { flex: 2.5 }]}>STEPS COUNT</Text>
          <Text style={[styles.th, { flex: 2 }]}>STATUS</Text>
          <Text style={[styles.th, { width: 70, textAlign: 'right' }]}>ACTIONS</Text>
        </View>

        {templates.map((t) => (
          <View key={t.id} style={styles.tableRow}>
            <View style={{ flex: 3 }}>
              <Text style={styles.templateNameText}>{t.name}</Text>
              {t.description ? <Text style={styles.templateDescSub}>{t.description}</Text> : null}
            </View>

            <View style={{ flex: 2.5 }}>
              <Text style={styles.stepCountText}>{t.steps?.length ?? 0} Steps</Text>
            </View>

            <View style={{ flex: 2 }}>
              <View style={styles.activePill}>
                <Text style={styles.activePillText}>Active</Text>
              </View>
            </View>

            <View style={styles.actionsCol}>
              <TouchableOpacity
                onPress={() => onEdit(t)}
                style={{ padding: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`Edit template ${t.name}`}
              >
                <Feather name="edit-2" size={15} color={colors.navyText} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onDelete(t)}
                style={{ padding: 4 }}
                accessibilityRole="button"
                accessibilityLabel={`Delete template ${t.name}`}
              >
                <Feather name="trash-2" size={15} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {templates.length === 0 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No task analysis templates configured yet.</Text>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  tableCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  tableCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  cardHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.navyText,
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  headerAddBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.navyText,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgApp,
    paddingVertical: 10,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.bodyText,
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.bgApp,
  },
  templateNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  templateDescSub: {
    fontSize: 11,
    color: colors.mutedText,
    marginTop: 1,
  },
  stepCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.bodyText,
  },
  activePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  activePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#166534',
  },
  actionsCol: {
    width: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
  },
});
