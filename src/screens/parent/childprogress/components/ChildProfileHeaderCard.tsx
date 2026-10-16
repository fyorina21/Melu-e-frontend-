// src/screens/parent/childprogress/components/ChildProfileHeaderCard.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../../../theme/colors';
import StudentAvatar from '../../../../components/StudentAvatar';

interface ChildProfileHeaderCardProps {
  name: string;
  age: number;
  program: string;
  group: string;
  photoUrl?: string;
}

export const ChildProfileHeaderCard: React.FC<ChildProfileHeaderCardProps> = React.memo(
  ({ name, age, program, group, photoUrl }) => {
    return (
      <View style={styles.profileCard}>
        <StudentAvatar name={name} photoUrl={photoUrl} size={64} style={{ marginRight: 16 }} />
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{name}</Text>
          <Text style={styles.profileMeta}>
            Age {age} · Program: {program} · Group: {group}
          </Text>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    padding: spacing.lg,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileMeta: {
    fontSize: 13,
    color: colors.mutedText,
    marginTop: 2,
  },
});
