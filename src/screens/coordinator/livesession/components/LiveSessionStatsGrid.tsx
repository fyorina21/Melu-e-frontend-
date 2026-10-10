import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius, spacing } from '../../../../theme/colors';
import { SKY, PANEL } from '../types';

interface LiveSessionStatsGridProps {
  counts: {
    total: number;
    onTrack: number;
    needsAttention: number;
    overdue: number;
  };
}

export const LiveSessionStatsGrid: React.FC<LiveSessionStatsGridProps> = React.memo(
  ({ counts }) => {
    const summaryTiles = [
      { label: 'Active Sessions', value: counts.total, icon: 'activity' as const, color: SKY },
      { label: 'On Track', value: counts.onTrack, icon: 'check-circle' as const, color: '#4ADE80' },
      {
        label: 'Needs Attention',
        value: counts.needsAttention,
        icon: 'alert-triangle' as const,
        color: '#FCD34D',
      },
      { label: 'Overdue', value: counts.overdue, icon: 'clock' as const, color: '#F87171' },
    ];

    return (
      <View style={styles.statsGrid}>
        {summaryTiles.map((tile) => (
          <View key={tile.label} style={[styles.statTile, { borderColor: `${tile.color}33` }]}>
            <View style={[styles.statIconWrap, { backgroundColor: `${tile.color}1A` }]}>
              <Feather name={tile.icon} size={20} color={tile.color} />
            </View>
            <View>
              <Text style={[styles.statValue, { color: tile.color }]}>{tile.value}</Text>
              <Text style={styles.statLabel}>{tile.label}</Text>
            </View>
          </View>
        ))}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statTile: {
    flexGrow: 1,
    minWidth: '46%',
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: PANEL,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
});
