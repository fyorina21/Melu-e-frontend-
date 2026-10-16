// src/screens/systemadmin/permissions/components/PermissionSaveBar.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface PermissionSaveBarProps {
  dirty: boolean;
  saving: boolean;
  onSave: () => void;
  onViewAuditTrail: () => void;
}

export default function PermissionSaveBar({
  dirty,
  saving,
  onSave,
  onViewAuditTrail,
}: PermissionSaveBarProps) {
  const disabled = !dirty || saving;

  return (
    <View style={styles.bottomActionsRow}>
      <TouchableOpacity
        style={[styles.saveConfigBtn, disabled && styles.saveConfigBtnDisabled]}
        disabled={disabled}
        onPress={onSave}
        accessibilityRole="button"
        accessibilityLabel="Save permission configuration"
      >
        {saving ? (
          <ActivityIndicator size="small" color={colors.navyText} />
        ) : (
          <Feather name="save" size={16} color={colors.navyText} />
        )}
        <Text style={styles.saveConfigBtnText}>{saving ? 'Saving...' : 'Save Configuration'}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.auditTrailLink}
        onPress={onViewAuditTrail}
        accessibilityRole="button"
        accessibilityLabel="View audit trail"
      >
        <Feather name="file-text" size={14} color="#0284C7" />
        <Text style={styles.auditTrailLinkText}>View Audit Trail</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveConfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryYellow,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  saveConfigBtnDisabled: {
    opacity: 0.45,
  },
  saveConfigBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  auditTrailLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: spacing.sm,
  },
  auditTrailLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
    textDecorationLine: 'underline',
  },
});
