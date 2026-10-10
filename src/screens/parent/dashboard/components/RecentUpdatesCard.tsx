// src/screens/parent/dashboard/components/RecentUpdatesCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing, makeShadow } from '../../../../theme/colors';
import { type RecentUpdateItem } from '../parentDashboardTypes';

interface RecentUpdatesCardProps {
  updates: RecentUpdateItem[];
  onSelectUpdate: () => void;
  style?: ViewStyle;
}

export default function RecentUpdatesCard({
  updates,
  onSelectUpdate,
  style,
}: RecentUpdatesCardProps) {
  return (
    <View style={[styles.card, style]}>
      <Text style={styles.cardTitle}>Recent Updates</Text>
      <View style={styles.updatesList}>
        {updates.map((u) => (
          <TouchableOpacity
            key={u.id}
            style={styles.updateRow}
            onPress={onSelectUpdate}
            accessibilityRole="button"
            accessibilityLabel={`Update: ${u.text}`}
          >
            <View style={[styles.updateIconBg, { backgroundColor: u.iconBg }]}>
              <Text style={styles.updateIcon}>{u.icon}</Text>
            </View>
            <View style={styles.updateMain}>
              <Text style={styles.updateText}>{u.text}</Text>
              {u.time ? <Text style={styles.updateTime}>{u.time}</Text> : null}
            </View>
            <Feather name="chevron-right" size={16} color="#D1D5DB" />
          </TouchableOpacity>
        ))}
      </View>
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
  updatesList: {
    gap: spacing.sm,
  },
  updateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: '#F9FAFB',
  },
  updateIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateIcon: {
    fontSize: 14,
  },
  updateMain: {
    flex: 1,
  },
  updateText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1F2937',
    lineHeight: 18,
  },
  updateTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
