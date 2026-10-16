import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../theme/colors';
import type { FormField } from '../../../types';

interface FormSectionAccordionProps {
  sectionName: string;
  domainLetter?: string | null;
  fields: FormField[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  onAddField: () => void;
  onEditSection?: () => void;
  onDeleteSection?: () => void;
  renderFieldCard: (field: FormField) => React.ReactNode;
  renderInlineAdd?: React.ReactNode;
}

export default function FormSectionAccordion({
  sectionName,
  domainLetter,
  fields,
  isExpanded,
  onToggleExpand,
  onAddField,
  onEditSection,
  onDeleteSection,
  renderFieldCard,
  renderInlineAdd,
}: FormSectionAccordionProps) {
  return (
    <View style={styles.accordionContainer}>
      {/* Accordion Section Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.headerLeft} onPress={onToggleExpand}>
          <Feather name={isExpanded ? 'chevron-down' : 'chevron-right'} size={18} color="#475569" />

          {domainLetter ? (
            <View style={styles.domainBadge}>
              <Text style={styles.domainBadgeText}>{domainLetter}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>{sectionName}</Text>

          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{fields.length} items</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.actionBtnAdd}
            onPress={onAddField}
            accessibilityLabel={`Add Item to ${sectionName}`}
          >
            <Feather name="plus" size={13} color="#0284C7" />
            <Text style={styles.actionBtnAddText}>Add Item</Text>
          </TouchableOpacity>

          {onEditSection && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onEditSection}
              accessibilityLabel={`Edit ${sectionName}`}
            >
              <Feather name="edit-2" size={14} color="#64748B" />
            </TouchableOpacity>
          )}

          {onDeleteSection && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={onDeleteSection}
              accessibilityLabel={`Delete ${sectionName}`}
            >
              <Feather name="trash-2" size={14} color="#F87171" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Accordion Body */}
      {isExpanded && (
        <View style={styles.body}>
          {renderInlineAdd}

          {fields.length === 0 && !renderInlineAdd ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                No fields in this section yet. Click "Add Item" above to add one.
              </Text>
            </View>
          ) : (
            fields.map((f) => renderFieldCard(f))
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  accordionContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  domainBadge: {
    backgroundColor: '#0284C7',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  domainBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  actionBtnAddText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  iconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  body: {
    backgroundColor: '#FFFFFF',
  },
  emptyState: {
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 13,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
});
