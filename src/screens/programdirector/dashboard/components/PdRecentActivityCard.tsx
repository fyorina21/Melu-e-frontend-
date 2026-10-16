// src/screens/programdirector/dashboard/components/PdRecentActivityCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import type { RecentActivityItem } from '../dashboardTypes';

interface PdRecentActivityCardProps {
  recentActivity: RecentActivityItem[];
}

export const PdRecentActivityCard: React.FC<PdRecentActivityCardProps> = React.memo(
  ({ recentActivity }) => {
    return (
      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={typography.h3}>Recent Activity</Text>
          <Text style={typography.caption}>
            {recentActivity.length} event
            {recentActivity.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {recentActivity.length === 0 ? (
          <Text style={styles.emptyText}>No recent activity.</Text>
        ) : (
          recentActivity.map((a, i) => {
            const iconColor =
              a.type === 'session' ? '#10B981' : a.type === 'incident' ? '#EF4444' : '#F59E0B';
            const iconName =
              a.type === 'session'
                ? 'check-circle'
                : a.type === 'incident'
                  ? 'alert-circle'
                  : 'clipboard';
            return (
              <View key={i} style={styles.activityRow}>
                <View style={[styles.activityIcon, { backgroundColor: iconColor + '18' }]}>
                  <Feather name={iconName as any} size={12} color={iconColor} />
                </View>
                <Text style={styles.activityText} numberOfLines={1}>
                  {a.text}
                </Text>
                <Text style={styles.activityTime}>{a.time}</Text>
              </View>
            );
          })
        )}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  activityIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityText: {
    fontSize: 12,
    color: colors.bodyText,
    flex: 1,
  },
  activityTime: {
    fontSize: 11,
    color: colors.mutedText,
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
