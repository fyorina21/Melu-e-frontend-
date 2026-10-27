import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../theme/colors';
import MediaViewerModal, { detectMediaType, formatFileSize } from './MediaViewerModal';

export interface DocumentAttachmentCardProps {
  label: string;
  fileUrl?: string | null;
  fileName?: string | null;
  fileSize?: number | string | null;
  uploadDate?: string | null;
  fileType?: string | null;
  onReplace?: () => void;
  onRemove?: () => void;
  editable?: boolean;
}

export function extractDocumentMeta(docOrVal: any, defaultLabel: string = 'Document') {
  if (!docOrVal) return null;

  if (typeof docOrVal === 'string') {
    const isData = docOrVal.startsWith('data:');
    let mime = '';
    if (isData) {
      const match = docOrVal.match(/^data:([^;,]+)/i);
      if (match) mime = match[1];
    }
    const detected = detectMediaType(mime || docOrVal, undefined, defaultLabel);
    const ext =
      detected === 'pdf'
        ? '.pdf'
        : detected === 'video'
          ? '.mp4'
          : detected === 'image'
            ? '.jpg'
            : '';
    const cleanLabel = defaultLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    return {
      url: docOrVal,
      fileName: `${cleanLabel}${ext}`,
      fileType: mime || detected.toUpperCase(),
      fileSize: isData ? Math.round((docOrVal.length * 3) / 4) : undefined,
      uploadDate: 'Attached',
    };
  }

  if (typeof docOrVal === 'object') {
    const url = docOrVal.url || docOrVal.file_url || docOrVal.fileUrl || docOrVal.uri;
    const mime = docOrVal.content_type || docOrVal.contentType || docOrVal.type;
    const rawName = docOrVal.filename || docOrVal.fileName || docOrVal.name;
    const detected = detectMediaType(mime || url, rawName, defaultLabel);
    const ext =
      detected === 'image'
        ? '.jpg'
        : detected === 'video'
          ? '.mp4'
          : detected === 'pdf'
            ? '.pdf'
            : '';
    const cleanLabel = defaultLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const name = rawName || `${cleanLabel}${ext || '.pdf'}`;
    const size = docOrVal.byte_size || docOrVal.byteSize || docOrVal.file_size || docOrVal.size;
    const date = docOrVal.upload_date || docOrVal.uploadDate || docOrVal.created_at;
    return {
      url,
      fileName: name,
      fileType: mime || detected.toUpperCase(),
      fileSize: size,
      uploadDate: date
        ? typeof date === 'string' && date.includes('T')
          ? date.split('T')[0]
          : String(date)
        : 'Attached',
    };
  }

  return null;
}

export default function DocumentAttachmentCard({
  label,
  fileUrl,
  fileName,
  fileSize,
  uploadDate,
  fileType,
  onReplace,
  onRemove,
  editable = false,
}: DocumentAttachmentCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!fileUrl) return null;

  const resolvedType = detectMediaType(fileType || fileUrl, fileName, label);
  const displayFileName =
    fileName ||
    `${label.toLowerCase().replace(/[^a-z0-9]+/g, '_')}.${resolvedType === 'pdf' ? 'pdf' : resolvedType === 'video' ? 'mp4' : 'jpg'}`;
  const sizeText = typeof fileSize === 'number' ? formatFileSize(fileSize) : fileSize || '';

  const getIconName = () => {
    switch (resolvedType) {
      case 'video':
        return 'video';
      case 'image':
        return 'image';
      case 'pdf':
        return 'file-text';
      default:
        return 'file';
    }
  };

  const getBadgeColor = () => {
    switch (resolvedType) {
      case 'video':
        return { bg: '#EEF2FF', text: '#4338CA' };
      case 'image':
        return { bg: '#FDF2F8', text: '#BE185D' };
      case 'pdf':
        return { bg: '#FEF2F2', text: '#B91C1C' };
      default:
        return { bg: '#F1F5F9', text: '#334155' };
    }
  };

  const badgeColors = getBadgeColor();

  return (
    <>
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <View style={[styles.iconWrap, { backgroundColor: badgeColors.bg }]}>
            <Feather name={getIconName()} size={18} color={badgeColors.text} />
          </View>
          <View style={styles.metaWrap}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.fileName} numberOfLines={1}>
              {displayFileName}
            </Text>
            <View style={styles.chipsRow}>
              <View style={[styles.typeChip, { backgroundColor: badgeColors.bg }]}>
                <Text style={[styles.typeChipText, { color: badgeColors.text }]}>
                  {resolvedType.toUpperCase()}
                </Text>
              </View>
              {Boolean(sizeText) && <Text style={styles.metaText}>• {sizeText}</Text>}
              {Boolean(uploadDate) && <Text style={styles.metaText}>• {uploadDate}</Text>}
            </View>
          </View>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => setModalOpen(true)}
            accessibilityRole="button"
            accessibilityLabel={`Preview ${label}`}
          >
            <Feather name="eye" size={13} color="#0284C7" />
            <Text style={styles.viewBtnText}>Preview</Text>
          </TouchableOpacity>

          {editable && onReplace && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={onReplace}
              accessibilityRole="button"
              accessibilityLabel={`Replace ${label}`}
            >
              <Feather name="refresh-cw" size={12} color="#475569" />
              <Text style={styles.actionBtnText}>Replace</Text>
            </TouchableOpacity>
          )}

          {editable && onRemove && (
            <TouchableOpacity
              style={[styles.actionBtn, styles.removeBtn]}
              onPress={onRemove}
              accessibilityRole="button"
              accessibilityLabel={`Remove ${label}`}
            >
              <Feather name="trash-2" size={12} color="#DC2626" />
              <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>Remove</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <MediaViewerModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        mediaUrl={fileUrl}
        mediaType={resolvedType}
        title={label}
        fileName={displayFileName}
        fileSize={fileSize || undefined}
        uploadDate={uploadDate || undefined}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 6,
    marginBottom: 6,
    gap: 12,
    ...makeShadow(1, 0.05),
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaWrap: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  fileName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
    marginTop: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  typeChip: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeChipText: {
    fontSize: 9,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 11,
    color: '#64748B',
  },
  cardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#475569',
  },
  removeBtn: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FEF2F2',
  },
});
