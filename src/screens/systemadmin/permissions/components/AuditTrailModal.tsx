import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { AuditEntry } from '../permissionTypes';

interface AuditTrailModalProps {
  visible: boolean;
  roleName: string;
  auditTrail: AuditEntry[];
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = React.memo(
  ({ visible, roleName, auditTrail, onClose }) => {
    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={typography.h2}>Audit Trail</Text>
            <Text style={typography.caption}>Recent permission changes for {roleName}</Text>
            <ScrollView style={styles.auditList}>
              {auditTrail.length === 0 ? (
                <Text style={styles.emptyText}>No recorded audit log changes for this role.</Text>
              ) : (
                auditTrail.map((a, i) => {
                  const dateStr = a.created_at || a.date || '';
                  const userStr = a.changed_by || a.user || 'Administrator';
                  const actionStr = a.action || 'update_permissions';
                  return (
                    <View key={a.id || i} style={styles.auditItem}>
                      <View style={styles.itemHeader}>
                        <Text style={typography.bodyBold}>{userStr}</Text>
                        <Text style={typography.caption}>
                          {dateStr ? new Date(dateStr).toLocaleString() : ''}
                        </Text>
                      </View>
                      <Text style={[typography.caption, { color: colors.navyText }]}>
                        Action: {actionStr}
                      </Text>
                      {a.change_data?.added?.length ? (
                        <Text style={[typography.caption, { color: '#10B981' }]}>
                          + Added {a.change_data.added.length} permission(s)
                        </Text>
                      ) : null}
                      {a.change_data?.removed?.length ? (
                        <Text style={[typography.caption, { color: '#EF4444' }]}>
                          - Removed {a.change_data.removed.length} permission(s)
                        </Text>
                      ) : null}
                    </View>
                  );
                })
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close audit trail"
            >
              <Text style={styles.closeModalBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.md,
  },
  auditList: {
    maxHeight: 300,
    marginVertical: spacing.md,
  },
  emptyText: {
    ...typography.caption,
    fontStyle: 'italic',
    paddingVertical: spacing.md,
    color: colors.mutedText,
  },
  auditItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  closeModalBtn: {
    alignSelf: 'flex-end',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  closeModalBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedText,
  },
});
