import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

interface AbllsBottomBarProps {
  onSaveDraft: () => void;
  onOpenNeedMap: () => void;
}

export const AbllsBottomBar: React.FC<AbllsBottomBarProps> = React.memo(
  ({ onSaveDraft, onOpenNeedMap }) => {
    return (
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.saveDraftBtn}
          onPress={onSaveDraft}
          accessibilityRole="button"
          accessibilityLabel="Save assessment draft"
        >
          <Feather name="file-text" size={16} color="#0F172A" />
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.needMapBtn}
          onPress={onOpenNeedMap}
          accessibilityRole="button"
          accessibilityLabel="View Need Analysis Map"
        >
          <Feather name="bar-chart-2" size={16} color="#0F172A" />
          <Text style={styles.needMapText}>View Need Analysis Map</Text>
          <Feather name="chevron-right" size={16} color="#0F172A" />
        </TouchableOpacity>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  bottomBar: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  saveDraftBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
  },
  saveDraftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  needMapBtn: {
    flex: 2,
    backgroundColor: '#FACC15',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
  },
  needMapText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
});
