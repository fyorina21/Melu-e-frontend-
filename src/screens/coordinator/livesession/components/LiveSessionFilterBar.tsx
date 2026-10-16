import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { STATUS_OPTIONS, STATION_OPTIONS, SKY } from '../types';

interface LiveSessionFilterBarProps {
  statusFilter: string;
  stationFilter: string;
  refreshCountdown: number;
  onStatusFilterChange: (status: string) => void;
  onStationFilterChange: (station: string) => void;
  onManualRefresh: () => void;
  onExport: () => void;
}

export const LiveSessionFilterBar: React.FC<LiveSessionFilterBarProps> = React.memo(
  ({
    statusFilter,
    stationFilter,
    refreshCountdown,
    onStatusFilterChange,
    onStationFilterChange,
    onManualRefresh,
    onExport,
  }) => {
    return (
      <View style={styles.container}>
        {/* Filter Row */}
        <View style={styles.filterRow}>
          <View style={[styles.pillWrap, { flex: 1, minWidth: 150 }]}>
            <Text style={styles.pillLabel}>
              {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label}
            </Text>
            <View style={styles.optionRow}>
              {STATUS_OPTIONS.map((opt) => {
                const isActive = statusFilter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onStatusFilterChange(opt.value)}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        isActive && { color: SKY, fontWeight: '700' as const },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.pillWrap, { flex: 1, minWidth: 140 }]}>
            <Text style={styles.pillLabel}>
              {STATION_OPTIONS.find((o) => o.value === stationFilter)?.label}
            </Text>
            <View style={styles.optionRow}>
              {STATION_OPTIONS.map((opt) => {
                const isActive = stationFilter === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    onPress={() => onStationFilterChange(opt.value)}
                    style={[styles.optionChip, isActive && styles.optionChipActive]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isActive }}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        isActive && { color: SKY, fontWeight: '700' as const },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Action Controls Row */}
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.skyButton}
            onPress={onManualRefresh}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Refresh active sessions"
          >
            <Feather name="refresh-cw" size={14} color={SKY} />
            <Text style={styles.skyButtonText}>Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.skyButton}
            onPress={onExport}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Export session log"
          >
            <Feather name="download" size={16} color={SKY} />
            <Text style={styles.skyButtonText}>Export Session Log</Text>
          </TouchableOpacity>

          <View style={styles.autoRefreshBadge}>
            <View style={styles.autoRefreshDot} />
            <Text style={styles.autoRefreshText}>Auto-refresh: {refreshCountdown}s</Text>
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pillWrap: {
    gap: spacing.xs,
  },
  pillLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgCard,
  },
  optionChipActive: {
    borderColor: SKY,
    backgroundColor: `${SKY}1A`,
  },
  optionChipText: {
    fontSize: 12,
    color: '#4B5563',
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.md,
  },
  skyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: `${SKY}4D`,
    backgroundColor: `${SKY}1A`,
  },
  skyButtonText: {
    color: SKY,
    fontSize: 13,
    fontWeight: '600',
  },
  autoRefreshBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: `${SKY}4D`,
    backgroundColor: `${SKY}1A`,
  },
  autoRefreshDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SKY,
  },
  autoRefreshText: {
    color: SKY,
    fontSize: 11,
    fontWeight: '600',
  },
});
