import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Share,
} from 'react-native';
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

export default function ExportPreviewModal({
  visible,
  title,
  filename,
  content,
  onClose,
}: ExportPreviewModalProps) {
  const [viewMode, setViewMode] = useState<'formatted' | 'raw'>('formatted');
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    Share.share({ title: filename, message: content }).catch(() => {});
  };

  const handleCopy = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    } else {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handlePrint = () => {
    openPrintWindow(content, title);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerIconWrap}>
              <Feather name="printer" size={20} color={colors.navyText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{title}</Text>
              <Text style={styles.headerSubtitle}>{filename}</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close export preview"
            >
              <Feather name="x" size={20} color={colors.navyText} />
            </TouchableOpacity>
          </View>

          {/* View Mode Segmented Controls */}
          <View style={styles.modeBar}>
            <View style={styles.segmentedWrap}>
              <TouchableOpacity
                style={[styles.segmentBtn, viewMode === 'formatted' && styles.segmentBtnActive]}
                onPress={() => setViewMode('formatted')}
              >
                <Feather
                  name="file-text"
                  size={13}
                  color={viewMode === 'formatted' ? colors.navyText : colors.bodyText}
                />
                <Text
                  style={[
                    styles.segmentText,
                    viewMode === 'formatted' && styles.segmentTextActive,
                  ]}
                >
                  Formatted Document
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.segmentBtn, viewMode === 'raw' && styles.segmentBtnActive]}
                onPress={() => setViewMode('raw')}
              >
                <Feather
                  name="code"
                  size={13}
                  color={viewMode === 'raw' ? colors.navyText : colors.bodyText}
                />
                <Text
                  style={[styles.segmentText, viewMode === 'raw' && styles.segmentTextActive]}
                >
                  Raw Plaintext
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
              <Feather
                name={copied ? 'check' : 'clipboard'}
                size={13}
                color={copied ? colors.successGreen : colors.navyText}
              />
              <Text style={[styles.copyBtnText, copied && { color: colors.successGreen }]}>
                {copied ? 'Copied!' : 'Copy'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Body Preview */}
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {viewMode === 'formatted' ? (
              <View style={styles.formattedDoc}>
                <View style={styles.docLetterhead}>
                  <Text style={styles.docBrand}>Melu'e Foundation</Text>
                  <Text style={styles.docMeta}>
                    Exported: {new Date().toLocaleDateString()} · Official Document
                  </Text>
                </View>
                <Text style={styles.docContentText}>{content || 'Nothing to export.'}</Text>
              </View>
            ) : (
              <Text style={styles.mono}>{content || 'Nothing to export.'}</Text>
            )}
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Close</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.printBtn} onPress={handlePrint}>
              <Feather name="printer" size={15} color="#1A73E8" />
              <Text style={styles.printBtnText}>Print / Save PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadBtn}
              onPress={() => downloadTextFile(filename, content)}
            >
              <Feather name="download" size={15} color="#137333" />
              <Text style={styles.downloadBtnText}>Download File</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
              <Feather name="share-2" size={15} color={colors.navyText} />
              <Text style={styles.shareBtnText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  sheet: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.lg,
    maxHeight: '90%',
    padding: spacing.lg,
    gap: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  headerIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.primaryYellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 17, fontWeight: '700', color: colors.navyText },
  headerSubtitle: { fontSize: 12, color: colors.mutedText, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgApp,
  },

  modeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  segmentedWrap: {
    flexDirection: 'row',
    backgroundColor: colors.bgApp,
    borderRadius: radius.md,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  segmentBtnActive: { backgroundColor: colors.bgCard, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  segmentText: { fontSize: 12, fontWeight: '600', color: colors.bodyText },
  segmentTextActive: { color: colors.navyText, fontWeight: '700' },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    backgroundColor: colors.bgCard,
  },
  copyBtnText: { fontSize: 12, fontWeight: '600', color: colors.navyText },

  body: { flexGrow: 1, backgroundColor: colors.bgApp, borderRadius: radius.md, maxHeight: 420 },
  bodyContent: { padding: spacing.md },
  formattedDoc: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  docLetterhead: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primaryYellow,
    paddingBottom: spacing.sm,
    marginBottom: spacing.xs,
  },
  docBrand: { fontSize: 16, fontWeight: '800', color: colors.navyText },
  docMeta: { fontSize: 11, color: colors.mutedText, marginTop: 2 },
  docContentText: { fontSize: 13, color: colors.navyText, lineHeight: 20, fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }) },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }),
    fontSize: 12,
    color: colors.navyText,
    lineHeight: 19,
  },

  footer: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  cancelBtn: {
    flex: 1,
    minWidth: 80,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: { fontWeight: '600', color: colors.navyText, fontSize: 13 },
  printBtn: {
    flex: 1.5,
    minWidth: 140,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F0FE',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  printBtnText: { fontWeight: '700', color: '#1A73E8', fontSize: 13 },
  downloadBtn: {
    flex: 1.5,
    minWidth: 140,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E6F4EA',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  downloadBtnText: { fontWeight: '700', color: '#137333', fontSize: 13 },
  shareBtn: {
    flex: 1,
    minWidth: 90,
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryYellow,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  shareBtnText: { fontWeight: '700', color: colors.navyText, fontSize: 13 },
});

