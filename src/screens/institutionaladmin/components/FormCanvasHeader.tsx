// src/screens/institutionaladmin/components/FormCanvasHeader.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { radius } from '../../../theme/colors';

interface FormCanvasHeaderProps {
  selectedForm: string;
  onAddSkillType: () => void;
  onAddInfoType: () => void;
}

export default function FormCanvasHeader({
  selectedForm,
  onAddSkillType,
  onAddInfoType,
}: FormCanvasHeaderProps) {
  return (
    <View style={styles.canvasHeaderRow}>
      <Text style={styles.canvasHeader}>FORM CANVAS — {selectedForm.toUpperCase()}</Text>
      {selectedForm === 'ABLLS Assessment Form' && (
        <TouchableOpacity
          style={styles.addSkillTypeTopBtn}
          onPress={onAddSkillType}
          accessibilityRole="button"
          accessibilityLabel="Add a Skill Type"
        >
          <Feather name="folder-plus" size={13} color="#0284C7" />
          <Text style={styles.addSkillTypeTopBtnText}>Add a Skill Type</Text>
        </TouchableOpacity>
      )}
      {selectedForm === 'Enrollment Wizard' && (
        <TouchableOpacity
          style={styles.addSkillTypeTopBtn}
          onPress={onAddInfoType}
          accessibilityRole="button"
          accessibilityLabel="Add a Info Type"
        >
          <Feather name="folder-plus" size={13} color="#0284C7" />
          <Text style={styles.addSkillTypeTopBtnText}>Add a Info Type</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvasHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  canvasHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  addSkillTypeTopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.sm,
    gap: 4,
  },
  addSkillTypeTopBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
});
