import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../../../theme/colors';
import { typography } from '../../../../theme/typography';
import { DOMAIN_OPTIONS } from '../types';

interface DomainPickerProps {
  visible: boolean;
  selected: string;
  onSelect: (domain: string) => void;
  onClose: () => void;
}

export const DomainPicker: React.FC<DomainPickerProps> = React.memo(
  ({ visible, selected, onSelect, onClose }) => {
    if (!visible) return null;

    return (
      <View style={styles.pickerOverlay}>
        <TouchableOpacity
          style={styles.pickerBackdrop}
          activeOpacity={1}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close domain picker"
        />
        <View style={styles.pickerCard}>
          <View style={styles.modalHeader}>
            <Text style={typography.h3}>Select Domain</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Feather name="x" size={18} color={colors.mutedText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.optionsList}>
            {DOMAIN_OPTIONS.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.optionRow, selected === d && styles.optionRowActive]}
                onPress={() => {
                  onSelect(d);
                  onClose();
                }}
                accessibilityRole="button"
                accessibilityLabel={d}
                accessibilityState={{ selected: selected === d }}
              >
                <Text style={[styles.optionText, selected === d && styles.optionTextActive]}>
                  {d}
                </Text>
                {selected === d && <Feather name="check" size={14} color="#0284C7" />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  pickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  pickerCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '90%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionsList: {
    maxHeight: 350,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionRowActive: {
    backgroundColor: '#F0F9FF',
    borderRadius: radius.sm,
  },
  optionText: {
    fontSize: 14,
    color: colors.bodyText,
  },
  optionTextActive: {
    fontWeight: '700',
    color: colors.navyText,
  },
});
