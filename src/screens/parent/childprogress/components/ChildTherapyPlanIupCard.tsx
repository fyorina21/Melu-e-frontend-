// src/screens/parent/childprogress/components/ChildTherapyPlanIupCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';

interface ChildTherapyPlanIupCardProps {
  iupStation1: string[];
  iupStation2: string[];
  onDownloadIup: () => void;
}

export const ChildTherapyPlanIupCard: React.FC<ChildTherapyPlanIupCardProps> = React.memo(
  ({ iupStation1, iupStation2, onDownloadIup }) => {
    return (
      <View style={styles.card}>
        <View style={styles.iupHeader}>
          <Text style={styles.cardTitle}>Therapy Plan (IUP)</Text>
          <View style={styles.finalizedBadge}>
            <Feather name="check-circle" size={14} color="#16A34A" />
            <Text style={styles.finalizedText}>Finalized</Text>
          </View>
        </View>

        <View style={[styles.iupStation, { backgroundColor: '#F0F9FF' }]}>
          <Text style={[styles.iupStationLabel, { color: '#0EA5E9' }]}>STATION 1 GOALS</Text>
          {iupStation1.map((g) => (
            <View key={g} style={styles.goalListItem}>
              <View style={[styles.goalDot, { backgroundColor: '#38BDF8' }]} />
              <Text style={styles.goalListText}>{g}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.iupStation, { backgroundColor: '#FFFBEB' }]}>
          <Text style={[styles.iupStationLabel, { color: '#EAB308' }]}>STATION 2 GOALS</Text>
          {iupStation2.map((g) => (
            <View key={g} style={styles.goalListItem}>
              <View style={[styles.goalDot, { backgroundColor: '#FACC15' }]} />
              <Text style={styles.goalListText}>{g}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity
          style={styles.iupBtn}
          onPress={onDownloadIup}
          accessibilityRole="button"
          accessibilityLabel="Download IUP as HTML/PDF"
        >
          <Feather name="download" size={16} color={colors.navyText} />
          <Text style={styles.iupBtnText}>Download IUP (PDF)</Text>
        </TouchableOpacity>
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
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: spacing.md,
  },
  iupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  finalizedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  finalizedText: {
    fontSize: 12,
    color: '#15803D',
    fontWeight: '500',
  },
  iupStation: {
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  iupStationLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  goalListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 2,
  },
  goalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  goalListText: {
    fontSize: 13,
    color: '#374151',
  },
  iupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#FCD34D',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  iupBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
  },
});
