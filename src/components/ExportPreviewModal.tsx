import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet, Platform, Share } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing } from '../theme/colors';
import { typography } from '../theme/typography';
import { downloadTextFile, openPrintWindow } from '../utils/webExport';

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

  const handlePrint = () => {
    // Generate clean pre-formatted HTML wrapper to display the text formatted nicely for PDF conversion
    const formattedHtml = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: monospace; white-space: pre-wrap; padding: 20px; font-size: 14px; line-height: 1.5; color: #1e293b; }
          </style>
        </head>
        <body>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</body>
      </html>
    `;
    openPrintWindow(formattedHtml, title);
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
            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Feather name="printer" size={16} color="#1A73E8" />
              <Text style={styles.printBtnText}>Print/PDF</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.downloadBtn} onPress={() => downloadTextFile(filename, content)}>
              <Feather name="download" size={16} color="#137333" />
              <Text style={styles.downloadBtnText}>Download</Text>
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
  footer: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  cancelBtn: { flex: 1, minWidth: 80, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  cancelBtnText: { fontWeight: '600', color: colors.navyText },
  printBtn: { flex: 1, minWidth: 100, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E8F0FE', borderRadius: radius.md, paddingVertical: spacing.md },
  printBtnText: { fontWeight: '700', color: '#1A73E8' },
  downloadBtn: { flex: 1, minWidth: 110, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E6F4EA', borderRadius: radius.md, paddingVertical: spacing.md },
  downloadBtnText: { fontWeight: '700', color: '#137333' },
  shareBtn: { flex: 1, minWidth: 80, flexDirection: 'row', gap: spacing.xs, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryYellow, borderRadius: radius.md, paddingVertical: spacing.md },
  shareBtnText: { fontWeight: '700', color: colors.navyText },
});
