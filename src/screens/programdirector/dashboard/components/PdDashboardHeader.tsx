// src/screens/programdirector/dashboard/components/PdDashboardHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { NotificationItem } from '../dashboardTypes';

interface PdDashboardHeaderProps {
  notifications: NotificationItem[];
  showNotif: boolean;
  onToggleNotif: () => void;
  onCloseNotif: () => void;
}

export const PdDashboardHeader: React.FC<PdDashboardHeaderProps> = React.memo(
  ({ notifications, showNotif, onToggleNotif, onCloseNotif }) => {
    const urgentCount = notifications.filter((n) => n.urgent).length;

    return (
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={typography.h1}>Program Director Dashboard</Text>
            <Text style={typography.caption}>
              Student workflow · Assessments · Sessions · Clinical oversight
            </Text>
          </View>
          <TouchableOpacity
            style={styles.notifBell}
            onPress={onToggleNotif}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Feather name="bell" size={20} color={colors.navyText} />
            {urgentCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>{urgentCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {showNotif && (
          <View style={styles.notifPanel}>
            <View style={styles.notifHeader}>
              <Text style={styles.notifHeaderText}>Notifications</Text>
              <TouchableOpacity onPress={onCloseNotif}>
                <Text style={styles.notifClose}>Close</Text>
              </TouchableOpacity>
            </View>
            {notifications.map((n) => (
              <View key={n.id} style={[styles.notifRow, n.urgent && styles.notifRowUrgent]}>
                <View
                  style={[
                    styles.notifDot,
                    n.urgent ? styles.notifDotUrgent : styles.notifDotNormal,
                  ]}
                />
                <Text style={styles.notifText}>{n.text}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notifBell: {
    position: 'relative',
    padding: spacing.sm,
  },
  notifBadge: {
    position: 'absolute',
    top: 2,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  notifPanel: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  notifHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notifHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.navyText,
  },
  notifClose: {
    fontSize: 12,
    color: colors.mutedText,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  notifRowUrgent: {
    backgroundColor: '#FEF2F2',
  },
  notifDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  notifDotUrgent: {
    backgroundColor: '#EF4444',
  },
  notifDotNormal: {
    backgroundColor: '#D1D5DB',
  },
  notifText: {
    fontSize: 12,
    color: colors.bodyText,
    flex: 1,
  },
});
