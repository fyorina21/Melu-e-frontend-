// src/screens/programdirector/summaryreport/components/StudentOverviewCard.tsx

import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import type { StudentInfo } from '../summaryReportTypes';

interface StudentOverviewCardProps {
  studentInfo?: StudentInfo;
  resolvedPhoto?: string | null;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoItem}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export const StudentOverviewCard: React.FC<StudentOverviewCardProps> = React.memo(
  ({ studentInfo, resolvedPhoto }) => {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderBlue}>
          <Text style={styles.cardHeaderText}>Student Information</Text>
        </View>
        <View style={styles.studentInfoCardBody}>
          <View style={styles.photoContainer}>
            {resolvedPhoto ? (
              <Image
                source={{ uri: resolvedPhoto }}
                style={styles.studentPhoto}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.noPhotoBox}>
                <Feather name="camera-off" size={24} color={colors.mutedText} />
                <Text style={styles.noPhotoText}>no photo inserted</Text>
              </View>
            )}
          </View>

          <View style={styles.studentDetailsGrid}>
            <InfoItem label="Full Name" value={studentInfo?.fullName || '—'} />
            <InfoItem label="Date of Birth" value={studentInfo?.dateOfBirth || '—'} />
            <InfoItem label="Age" value={studentInfo?.age ? `${studentInfo.age} years old` : '—'} />
            <InfoItem label="Parent / Guardian" value={studentInfo?.parentGuardian || '—'} />
            <InfoItem label="Station" value={studentInfo?.station || 'Station 1'} />
            <InfoItem
              label="Photo Status"
              value={resolvedPhoto ? 'Photo Uploaded' : 'no photo inserted'}
            />
          </View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardHeaderBlue: {
    backgroundColor: '#0284C7',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  cardHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
  },
  studentInfoCardBody: {
    padding: spacing.md,
    flexDirection: 'row',
    gap: spacing.lg,
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  photoContainer: {
    width: 100,
    height: 100,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgApp,
  },
  studentPhoto: {
    width: '100%',
    height: '100%',
  },
  noPhotoBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xs,
    gap: 4,
  },
  noPhotoText: {
    fontSize: 10,
    color: colors.mutedText,
    textAlign: 'center',
  },
  studentDetailsGrid: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  infoItem: {
    minWidth: '45%',
    flexGrow: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.mutedText,
    fontWeight: '600',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.navyText,
    marginTop: 2,
  },
});
