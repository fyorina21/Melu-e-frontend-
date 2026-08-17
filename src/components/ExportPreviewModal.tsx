import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, Platform, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';

interface ExportPreviewModalProps {
  visible: boolean;
  title: string;
  filename: string;
  content: string;
  onClose: () => void;
}

export default function ExportPreviewModal({ visible, title, filename, content, onClose }: ExportPreviewModalProps) {
  const handleShare = () => {
    Share.share({ title: filename, message: content }).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={typography.h3}>{title}</Text>
              <Text style={typography.caption}>{filename}</Text>
            </View>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close export preview">
              <Feather name="x" size={20} color={colors.navyText} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.mono}>{content || 'Nothing to export.'}</Text>
          </ScrollView>
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Feather name="share-2" size={16} color={colors.navyText} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.lg },
  sheet: { backgroundColor: colors.bgCard, borderRadius: radius.lg, maxHeight: '85%', padding: spacing.lg, gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  body: { flexGrow: 1, backgroundColor: colors.bgApp, borderRadius: radius.md },
  bodyContent: { padding: spacing.md },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 12, color: colors.navyText, lineHeight: 18 },
  footer: { flexDirection: 'row', gap: spacing.sm },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  shareBtn: { flex: 2, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md },
  shareBtnText: { fontWeight: '700', color: colors.navyText },
});
