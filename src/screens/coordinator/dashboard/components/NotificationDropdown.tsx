import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type NotificationItem } from '../types';

interface NotificationDropdownProps {
  visible: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkAllRead: () => void;
  onClose: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = React.memo(
  ({ visible, notifications, unreadCount, onMarkAllRead, onClose }) => {
    if (!visible) return null;

    return (
      <View style={styles.notifDropdown}>
        <View style={styles.notifDropdownHeader}>
          <Text style={styles.notifDropdownTitle}>Notifications</Text>
          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={onMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <Text style={styles.linkText}>Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.listScroll} nestedScrollEnabled>
          {notifications.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No notifications yet.</Text>
            </View>
          ) : (
            notifications.map((n) => (
              <View
                key={n.id}
                style={[styles.notifRow, n.read ? styles.notifRead : styles.notifUnread]}
              >
                <Feather
                  name="alert-circle"
                  size={14}
                  color={n.read ? '#D1D5DB' : n.urgent ? '#FB923C' : colors.primaryYellowDark}
                  style={styles.iconOffset}
                />
                <View style={styles.contentCol}>
                  <Text style={[styles.notifText, n.read && styles.notifTextRead]}>{n.text}</Text>
                  <Text style={styles.notifTime}>{n.time}</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close notifications"
        >
          <Text style={styles.closeBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  notifDropdown: {
    position: 'absolute',
    right: 0,
    top: 44,
    width: 320,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  notifDropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notifDropdownTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
  linkText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primaryYellowDark,
  },
  listScroll: {
    maxHeight: 280,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  notifRead: {
    backgroundColor: colors.bgCard,
  },
  notifUnread: {
    backgroundColor: colors.bgApp,
  },
  iconOffset: {
    marginTop: 2,
  },
  contentCol: {
    flex: 1,
  },
  notifText: {
    fontSize: 12,
    color: colors.navyText,
    lineHeight: 16,
  },
  notifTextRead: {
    color: '#9CA3AF',
  },
  notifTime: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  emptyWrap: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12,
    color: colors.mutedText,
  },
  closeBtn: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingVertical: spacing.sm,
  },
  closeBtnText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
});
