import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { type NotificationItem } from '../types';
import { NotificationDropdown } from './NotificationDropdown';

interface DashboardHeaderProps {
  unreadCount: number;
  bellOpen: boolean;
  onToggleBell: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onCloseBell: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(
  ({ unreadCount, bellOpen, onToggleBell, notifications, onMarkAllRead, onCloseBell }) => {
    return (
      <View style={styles.headerCard}>
        <View style={styles.titleCol}>
          <Text style={styles.headerTitle}>Therapy Coordinator Dashboard</Text>
          <Text style={styles.headerSubtitle}>
            Foundation operations overview & live monitoring
          </Text>
        </View>

        <View style={styles.bellAnchor}>
          <TouchableOpacity
            onPress={onToggleBell}
            style={styles.bellButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel={`Notifications (${unreadCount} unread)`}
          >
            <Feather name="bell" size={20} color="#4B5563" />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <NotificationDropdown
            visible={bellOpen}
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAllRead={onMarkAllRead}
            onClose={onCloseBell}
          />
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 20,
  },
  titleCol: {
    flex: 1,
  },
  headerTitle: {
    color: colors.navyText,
    fontSize: 20,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#6B7280',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  bellAnchor: {
    position: 'relative',
  },
  bellButton: {
    padding: 8,
    borderRadius: radius.md,
    backgroundColor: colors.bgApp,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
});
