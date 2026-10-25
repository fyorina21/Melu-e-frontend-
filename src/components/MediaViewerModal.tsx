import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../theme/colors';
import { env } from '../api/config/env';

export interface MediaViewerModalProps {
  visible: boolean;
  onClose: () => void;
  mediaUrl?: string | null;
  mediaType?: 'image' | 'video' | 'pdf' | 'document' | 'other';
  title?: string;
  fileName?: string;
  fileSize?: string | number;
  uploadDate?: string;
}

export function formatFileSize(bytes?: number | string | null): string {
  if (!bytes) return '';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num) || num <= 0) return '';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Resolves a media URL to an absolute URL accessible by the browser/app.
 * Prepends backend API URL if given a relative Rails storage path.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  const lower = trimmed.toLowerCase();

  // Reject unsafe / script schemes
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.includes('\n') ||
    lower.includes('\r')
  ) {
    return '';
  }

  // Allow trusted web and secure protocols
  if (lower.startsWith('https://') || lower.startsWith('http://')) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
        return trimmed;
      }
      return '';
    } catch {
      return '';
    }
  }

  if (lower.startsWith('blob:')) {
    return trimmed;
  }

  if (lower.startsWith('data:')) {
    return trimmed;
  }

  if (lower.startsWith('file:')) {
    return Platform.OS === 'web' ? '' : trimmed;
  }

  if (trimmed.startsWith('/')) {
    const base = env.apiUrl.replace(/\/+$/, '');
    return `${base}${trimmed}`;
  }

  return '';
}

/**
 * High-precision media type detection:
 * Prioritizes explicit MIME types, then file extensions, then keyword heuristics.
 */
export function detectMediaType(
  urlOrType?: string | null,
  fileName?: string | null,
  fallbackLabel?: string | null,
): 'image' | 'video' | 'pdf' | 'document' {
  const normType = (urlOrType || '').toLowerCase().trim();
  const normName = (fileName || '').toLowerCase().trim();
  const normLabel = (fallbackLabel || '').toLowerCase().trim();

  // 1. Explicit MIME check (highest precision)
  if (
    normType.startsWith('image/') ||
    normType.startsWith('data:image/') ||
    normType === 'image' ||
    normType === 'photo'
  ) {
    return 'image';
  }
  if (normType.startsWith('video/') || normType.startsWith('data:video/') || normType === 'video') {
    return 'video';
  }
  if (
    normType === 'application/pdf' ||
    normType.startsWith('data:application/pdf') ||
    normType === 'pdf'
  ) {
    return 'pdf';
  }

  // 2. File extension on fileName or URL (strip query parameters/hashes)
  const cleanName = (normName || normType).split('?')[0].split('#')[0];
  if (/\.(jpe?g|png|webp|gif|svg|bmp|jfif|ico|tiff)$/i.test(cleanName)) {
    return 'image';
  }
  if (/\.(mp4|webm|mov|avi|mkv|m4v|3gp)$/i.test(cleanName)) {
    return 'video';
  }
  if (/\.pdf$/i.test(cleanName)) {
    return 'pdf';
  }

  // 3. String content checks
  const combined = `${normType} ${normName} ${normLabel}`;
  if (
    combined.includes('data:image') ||
    combined.includes('.jpg') ||
    combined.includes('.jpeg') ||
    combined.includes('.png') ||
    combined.includes('.webp') ||
    combined.includes('.gif') ||
    combined.includes('image/')
  ) {
    return 'image';
  }

  if (
    combined.includes('data:video') ||
    combined.includes('.mp4') ||
    combined.includes('.webm') ||
    combined.includes('.mov') ||
    combined.includes('video/')
  ) {
    return 'video';
  }

  if (
    combined.includes('data:application/pdf') ||
    combined.includes('application/pdf') ||
    combined.includes('.pdf')
  ) {
    return 'pdf';
  }

  // 4. Keyword heuristics for schema field names and titles
  if (/photo|headshot|avatar|picture|image|selfie|portrait/i.test(combined)) {
    return 'image';
  }
  if (/video|recording|clip|session_video/i.test(combined)) {
    return 'video';
  }

  return 'document';
}

export default function MediaViewerModal({
  visible,
  onClose,
  mediaUrl,
  mediaType,
  title,
  fileName,
  fileSize,
  uploadDate,
}: MediaViewerModalProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [zoomScale, setZoomScale] = useState(1);

  // Reset internal states on open
  useEffect(() => {
    if (visible) {
      setImageError(false);
      setImageLoading(true);
      setZoomScale(1);
    }
  }, [visible, mediaUrl]);

  if (!visible || !mediaUrl) return null;

  const resolvedUrl = resolveMediaUrl(mediaUrl);
  const resolvedType = mediaType || detectMediaType(mediaUrl, fileName, title);
  const displayTitle = title || fileName || 'Media Preview';
  const sizeText = typeof fileSize === 'number' ? formatFileSize(fileSize) : fileSize || '';

  const handleDownload = () => {
    if (!resolvedUrl) return;
    try {
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const link = document.createElement('a');
        link.href = resolvedUrl;
        link.download =
          fileName ||
          (resolvedType === 'video'
            ? 'baseline_video.mp4'
            : resolvedType === 'pdf'
              ? 'document.pdf'
              : 'attachment.jpg');
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        Linking.openURL(resolvedUrl);
      }
    } catch {
      if (resolvedUrl) {
        Linking.openURL(resolvedUrl);
      }
    }
  };

  const handleOpenNewTab = () => {
    if (!resolvedUrl) return;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(resolvedUrl, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(resolvedUrl);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerMeta}>
              <View style={styles.iconBadge}>
                <Feather
                  name={
                    resolvedType === 'video'
                      ? 'video'
                      : resolvedType === 'image'
                        ? 'image'
                        : resolvedType === 'pdf'
                          ? 'file-text'
                          : 'file'
                  }
                  size={18}
                  color="#0284C7"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.title} numberOfLines={1}>
                  {displayTitle}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.typeBadge}>{resolvedType.toUpperCase()}</Text>
                  {Boolean(sizeText) && <Text style={styles.metaSub}>• {sizeText}</Text>}
                  {Boolean(uploadDate) && <Text style={styles.metaSub}>• {uploadDate}</Text>}
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              {/* Zoom controls for Image view */}
              {resolvedType === 'image' && !imageError && (
                <View style={styles.zoomControls}>
                  <TouchableOpacity
                    style={styles.zoomBtn}
                    onPress={() => setZoomScale((s) => Math.max(0.6, s - 0.25))}
                    accessibilityLabel="Zoom out"
                  >
                    <Feather name="minus" size={14} color="#0F172A" />
                  </TouchableOpacity>
                  <Text style={styles.zoomText}>{Math.round(zoomScale * 100)}%</Text>
                  <TouchableOpacity
                    style={styles.zoomBtn}
                    onPress={() => setZoomScale((s) => Math.min(2.5, s + 0.25))}
                    accessibilityLabel="Zoom in"
                  >
                    <Feather name="plus" size={14} color="#0F172A" />
                  </TouchableOpacity>
                  {zoomScale !== 1 && (
                    <TouchableOpacity
                      style={styles.zoomResetBtn}
                      onPress={() => setZoomScale(1)}
                      accessibilityLabel="Reset zoom"
                    >
                      <Text style={styles.zoomResetText}>Reset</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleDownload}
                accessibilityRole="button"
                accessibilityLabel="Download Document"
              >
                <Feather name="download" size={15} color="#0F172A" />
                <Text style={styles.actionBtnText}>Download</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleOpenNewTab}
                accessibilityRole="button"
                accessibilityLabel="Open in New Tab"
              >
                <Feather name="external-link" size={15} color="#0F172A" />
                <Text style={styles.actionBtnText}>New Tab</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                accessibilityRole="button"
                accessibilityLabel="Close Preview"
              >
                <Feather name="x" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body Viewer */}
          <View style={styles.body}>
            {resolvedType === 'video' ? (
              <View style={styles.videoWrap}>
                {Platform.OS === 'web' ? (
                  React.createElement('video', {
                    controls: true,
                    autoPlay: true,
                    playsInline: true,
                    src: resolvedUrl,
                    style: {
                      width: '100%',
                      height: '100%',
                      maxHeight: 520,
                      backgroundColor: '#000000',
                      borderRadius: 8,
                      outline: 'none',
                    },
                  })
                ) : (
                  <View style={styles.fallbackWrap}>
                    <Feather name="video" size={48} color="#0284C7" />
                    <Text style={styles.fallbackText}>Video playback active</Text>
                    <TouchableOpacity style={styles.nativePlayBtn} onPress={handleOpenNewTab}>
                      <Feather name="play" size={16} color="#FFFFFF" />
                      <Text style={styles.nativePlayBtnText}>Play in External Player</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : resolvedType === 'image' ? (
              <View style={styles.imageContainer}>
                {imageError ? (
                  <View style={styles.fallbackWrap}>
                    <Feather name="alert-circle" size={44} color="#F59E0B" />
                    <Text style={styles.fallbackTitle}>Unable to display image preview inline</Text>
                    <Text style={styles.fallbackText}>
                      The image format can still be viewed cleanly in a dedicated tab or downloaded.
                    </Text>
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <TouchableOpacity style={styles.nativePlayBtn} onPress={handleOpenNewTab}>
                        <Feather name="external-link" size={16} color="#FFFFFF" />
                        <Text style={styles.nativePlayBtnText}>Open in New Tab</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.nativePlayBtn, { backgroundColor: '#334155' }]}
                        onPress={handleDownload}
                      >
                        <Feather name="download" size={16} color="#FFFFFF" />
                        <Text style={styles.nativePlayBtnText}>Download Picture</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : Platform.OS === 'web' ? (
                  <View style={styles.webImageWrapper}>
                    {imageLoading && (
                      <View style={styles.loadingOverlay}>
                        <ActivityIndicator size="large" color="#0284C7" />
                      </View>
                    )}
                    {React.createElement('img', {
                      src: resolvedUrl,
                      alt: displayTitle,
                      style: {
                        maxWidth: zoomScale === 1 ? '100%' : 'none',
                        maxHeight: zoomScale === 1 ? '490px' : 'none',
                        width: zoomScale === 1 ? 'auto' : `${zoomScale * 100}%`,
                        height: 'auto',
                        objectFit: 'contain',
                        display: 'block',
                        margin: 'auto',
                        borderRadius: 6,
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45)',
                        transition: 'transform 0.15s ease-out',
                      },
                      onLoad: () => setImageLoading(false),
                      onError: () => {
                        setImageError(true);
                        setImageLoading(false);
                      },
                    })}
                  </View>
                ) : (
                  <ScrollView
                    contentContainerStyle={styles.imageScrollContainer}
                    maximumZoomScale={3}
                    minimumZoomScale={1}
                  >
                    <Image
                      source={{ uri: resolvedUrl }}
                      style={styles.imagePreview}
                      resizeMode="contain"
                      onError={() => setImageError(true)}
                    />
                  </ScrollView>
                )}
              </View>
            ) : resolvedType === 'pdf' ? (
              <View style={styles.pdfWrap}>
                {Platform.OS === 'web' ? (
                  React.createElement('iframe', {
                    src: resolvedUrl,
                    title: displayTitle,
                    style: {
                      width: '100%',
                      height: 520,
                      border: 'none',
                      borderRadius: 8,
                      backgroundColor: '#FFFFFF',
                    },
                  })
                ) : (
                  <View style={styles.fallbackWrap}>
                    <Feather name="file-text" size={48} color="#0284C7" />
                    <Text style={styles.fallbackTitle}>{fileName || 'PDF Document'}</Text>
                    <Text style={styles.fallbackText}>Tap below to view full document</Text>
                    <TouchableOpacity style={styles.nativePlayBtn} onPress={handleOpenNewTab}>
                      <Feather name="eye" size={16} color="#FFFFFF" />
                      <Text style={styles.nativePlayBtnText}>Open Document</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.fallbackWrap}>
                <Feather name="file" size={48} color="#64748B" />
                <Text style={styles.fallbackTitle}>{fileName || 'Document File'}</Text>
                <Text style={styles.fallbackText}>
                  This file type can be inspected or downloaded directly.
                </Text>
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity style={styles.nativePlayBtn} onPress={handleOpenNewTab}>
                    <Feather name="external-link" size={16} color="#FFFFFF" />
                    <Text style={styles.nativePlayBtnText}>Open in New Tab</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.nativePlayBtn, { backgroundColor: '#334155' }]}
                    onPress={handleDownload}
                  >
                    <Feather name="download" size={16} color="#FFFFFF" />
                    <Text style={styles.nativePlayBtnText}>Download File</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    zIndex: 99999,
  },
  container: {
    width: '100%',
    maxWidth: 920,
    maxHeight: '94%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    ...makeShadow(16, 0.25),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    gap: 12,
  },
  headerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  typeBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  metaSub: {
    fontSize: 11,
    color: '#64748B',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 2,
    gap: 4,
    marginRight: 4,
  },
  zoomBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  zoomText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    minWidth: 38,
    textAlign: 'center',
  },
  zoomResetBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  zoomResetText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    marginLeft: 4,
  },
  body: {
    backgroundColor: '#0F172A',
    minHeight: 380,
    maxHeight: 560,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  videoWrap: {
    width: '100%',
    height: '100%',
    maxHeight: 520,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: '100%',
    minHeight: 380,
    maxHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  webImageWrapper: {
    width: '100%',
    height: '100%',
    minHeight: 380,
    maxHeight: 520,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
    padding: 16,
    borderRadius: 8,
    position: 'relative',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  imageScrollContainer: {
    width: '100%',
    height: 520,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F172A',
  },
  imagePreview: {
    width: '100%',
    height: 500,
  },
  pdfWrap: {
    width: '100%',
    height: 520,
    backgroundColor: '#FFFFFF',
  },
  fallbackWrap: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fallbackTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 6,
    textAlign: 'center',
  },
  fallbackText: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 18,
  },
  nativePlayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  nativePlayBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
