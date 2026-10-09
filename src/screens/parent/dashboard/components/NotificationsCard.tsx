// src/screens/parent/dashboard/components/NotificationsCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { radius, spacing, makeShadow } from '../../../../theme/colors';
import { type NotificationItem } from '../parentDashboardTypes';

interface NotificationsCardProps {
  notifications: NotificationItem[];
  onDismiss: (id: number) => void;
  style?: ViewStyle;
}

export default function NotificationsCard({
  notifications,
  onDismiss,
  style,
}: NotificationsCardProps) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.notifCardHeader}>
        <Text style={styles.cardTitle}>Notifications</Text>
        {notifications.length > 0 && (
          <View style={styles.newBadge}>
            <Text style={styles.newBadgeText}>{notifications.length} new</Text>
          </View>
        )}
      </View>

      {notifications.length === 0 ? (
        <Text style={styles.noNotifText}>No new notifications.</Text>
      ) : (
        <View style={styles.notifList}>
          {notifications.map((n) => (
            <View key={n.id} style={styles.notifRow}>
              <View style={styles.notifOrangeDot} />
              <Text style={styles.notifText}>{n.text}</Text>
              <TouchableOpacity
                onPress={() => onDismiss(n.id)}
                accessibilityLabel={`Dismiss notification ${n.text}`}
                accessibilityRole="button"
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.notifX}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.xl,
    gap: spacing.md,
    ...makeShadow(1, 3, 0.05, '0, 0, 0', 1),
  },
  cardTitle: {
    fontWeight: '700',
    color: '#1F2937',
    fontSize: 16,
  },
  notifCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newBadge: {
    backgroundColor: '#FEE2E2',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  newBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#DC2626',
  },
  noNotifText: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  notifList: {
    gap: spacing.sm,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
  },
  notifOrangeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FB923C',
  },
  notifText: {
    flex: 1,
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
  notifX: {
    fontSize: 14,
    color: '#D1D5DB',
  },
});
