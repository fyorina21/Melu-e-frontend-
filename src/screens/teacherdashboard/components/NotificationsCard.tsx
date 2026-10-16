import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../theme/colors';
import { typography } from '../../../theme/typography';
import { NOTIF_ICON_MAP, type NotificationItem } from '../teacherDashboardTypes';

interface NotificationsCardProps {
  notifications: NotificationItem[];
  onOpenAll: () => void;
}

export const NotificationsCard: React.FC<NotificationsCardProps> = React.memo(
  ({ notifications, onOpenAll }) => {
    const unreadCount = notifications.filter((n) => n.unread).length;

    return (
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            style={styles.titleRow}
            onPress={onOpenAll}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Open all notifications"
          >
            <Feather name="bell" size={18} color="#EAB308" />
            <Text style={typography.h3}>Notifications</Text>
          </TouchableOpacity>
          <View style={styles.unreadPill}>
            <Text style={styles.unreadPillText}>{unreadCount} Unread</Text>
          </View>
        </View>

        <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
          {notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No recent notifications.</Text>
            </View>
          ) : (
            notifications.map((n) => {
              const icon = NOTIF_ICON_MAP[n.type] || NOTIF_ICON_MAP.alert;
              return (
                <View key={n.id} style={styles.notifRow}>
                  <Feather name={icon.name} size={16} color={icon.color} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={typography.bodyBold}>{n.title}</Text>
                    <Text style={typography.caption}>
                      {n.source} · {n.timeAgo}
                    </Text>
                  </View>
                  {n.unread && <View style={styles.unreadDot} />}
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 310,
    maxHeight: 360,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scrollArea: {
    flex: 1,
  },
  unreadPill: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  unreadPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  emptyContainer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.mutedText,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0EA5E9',
    marginTop: 4,
  },
});
