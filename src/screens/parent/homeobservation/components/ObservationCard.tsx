// src/screens/parent/homeobservation/components/ObservationCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import {
  CATEGORY_STYLE,
  STATUS_CONFIG,
  formatDisplayDate,
  formatTime,
  type Observation,
} from '../homeObservationTypes';

interface ObservationCardProps {
  observation: Observation;
  isExpanded: boolean;
  onToggleExpand: (id: string) => void;
}

export const ObservationCard: React.FC<ObservationCardProps> = React.memo(
  ({ observation, isExpanded, onToggleExpand }) => {
    const sc = STATUS_CONFIG[observation.status];
    const cc = CATEGORY_STYLE[observation.category];

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <Text style={styles.cardMeta}>
            {formatDisplayDate(observation.date)}
            {observation.time ? ` · ${formatTime(observation.time)}` : ''}
          </Text>
          <View
            style={[
              styles.badge,
              styles.categoryBadge,
              { backgroundColor: cc.bg, borderColor: cc.border },
            ]}
          >
            <Text style={[styles.badgeText, { color: cc.text }]}>{observation.category}</Text>
          </View>
          <View
            style={[
              styles.badge,
              styles.statusBadge,
              {
                backgroundColor: sc.bg,
                borderColor: sc.border,
                marginLeft: 'auto',
              },
            ]}
          >
            <Feather name={sc.icon} size={12} color={sc.text} />
            <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
          </View>
        </View>

        <Text style={styles.cardText}>{observation.text}</Text>

        {observation.status === 'Acknowledged' && observation.teamResponse && (
          <View style={styles.responseBox}>
            <View style={styles.responseHeader}>
              <Feather name="message-square" size={13} color="#0EA5E9" />
              <Text style={styles.responseLabel}>Team Response</Text>
            </View>
            <Text style={styles.responseText}>{observation.teamResponse}</Text>
            {observation.therapistName && (
              <Text style={styles.responseAuthor}>— {observation.therapistName}</Text>
            )}
          </View>
        )}

        <TouchableOpacity
          style={styles.expandBtn}
          onPress={() => onToggleExpand(observation.id)}
          accessibilityRole="button"
          accessibilityLabel={isExpanded ? 'Hide Details' : 'View Observation Details'}
        >
          <Text style={styles.expandBtnText}>{isExpanded ? 'Hide Details' : 'View Details'}</Text>
          <Feather name={isExpanded ? 'chevron-up' : 'chevron-down'} size={13} color="#0284C7" />
        </TouchableOpacity>

        {isExpanded && (
          <View style={styles.detailBox}>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Category: </Text>
              {observation.category}
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date: </Text>
              {formatDisplayDate(observation.date)}
            </Text>
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time: </Text>
              {observation.time ? formatTime(observation.time) : '—'}
            </Text>
            {observation.location ? (
              <Text style={styles.detailRow}>
                <Text style={styles.detailLabel}>Location: </Text>
                {observation.location}
              </Text>
            ) : null}
            {observation.duration ? (
              <Text style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration: </Text>
                {observation.duration}
              </Text>
            ) : null}
            <Text style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status: </Text>
              {observation.status}
            </Text>
          </View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.lg,
  },
  cardTop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.mutedText,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 3,
    borderWidth: 1,
  },
  categoryBadge: {},
  statusBadge: {},
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardText: {
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  responseBox: {
    marginTop: spacing.md,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#E0F2FE',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  responseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 4,
  },
  responseLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },
  responseText: {
    fontSize: 13,
    lineHeight: 19,
    color: '#0C4A6E',
  },
  responseAuthor: {
    fontSize: 11,
    color: '#0284C7',
    marginTop: 5,
    fontWeight: '500',
  },
  expandBtn: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0284C7',
  },
  detailBox: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 3,
  },
  detailRow: {
    fontSize: 11,
    color: colors.mutedText,
  },
  detailLabel: {
    fontWeight: '600',
    color: '#4B5563',
  },
});
