import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors, radius, spacing, makeShadow } from '../theme/colors';
import MediaViewerModal from './MediaViewerModal';

export interface VideoPlayerViewProps {
  videoUrl?: string | null;
  title?: string;
  subtitle?: string;
  onUpload?: () => void;
  onRemove?: () => void;
  onUploadPress?: () => void;
  onRemovePress?: () => void;
  editable?: boolean;
}

export default function VideoPlayerView({
  videoUrl,
  title = 'Baseline Behavioral Assessment Video',
  subtitle = 'Behavioral intake assessment sample (MP4, WebM, MOV)',
  onUpload,
  onRemove,
  onUploadPress,
  onRemovePress,
  editable = false,
}: VideoPlayerViewProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const handleUpload = onUploadPress || onUpload;
  const handleRemove = onRemovePress || onRemove;

  if (!videoUrl) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Feather name="video" size={24} color="#94A3B8" />
        </View>
        <View style={styles.emptyMeta}>
          <Text style={styles.emptyTitle}>{title}</Text>
          <Text style={styles.emptySubtitle}>{subtitle}</Text>
        </View>
        {handleUpload && (
          <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
            <Feather name="upload" size={13} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>Upload Video</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.playerContainer}>
      <View style={styles.playerHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.liveDot} />
          <Text style={styles.headerTitle}>{title}</Text>
        </View>
        <View style={styles.headerRight}>
          {editable && handleUpload && (
            <TouchableOpacity
              style={styles.iconActionBtn}
              onPress={handleUpload}
              accessibilityRole="button"
              accessibilityLabel="Replace Video"
            >
              <Feather name="refresh-cw" size={13} color="#64748B" />
              <Text style={styles.iconActionText}>Replace</Text>
            </TouchableOpacity>
          )}
          {editable && handleRemove && (
            <TouchableOpacity
              style={[styles.iconActionBtn, styles.removeBtn]}
              onPress={handleRemove}
              accessibilityRole="button"
              accessibilityLabel="Remove Video"
            >
              <Feather name="trash-2" size={13} color="#DC2626" />
              <Text style={[styles.iconActionText, { color: '#DC2626' }]}>Remove</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.fullscreenBtn} onPress={() => setModalOpen(true)}>
            <Feather name="maximize-2" size={13} color="#0284C7" />
            <Text style={styles.fullscreenBtnText}>Expand</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.videoScreen}>
        {Platform.OS === 'web' ? (
          React.createElement('video', {
            controls: true,
            playsInline: true,
            src: videoUrl,
            style: {
              width: '100%',
              height: 240,
              backgroundColor: '#000000',
              borderRadius: 8,
              outline: 'none',
              objectFit: 'contain',
            },
          })
        ) : (
          <TouchableOpacity style={styles.nativeFallbackWrap} onPress={() => setModalOpen(true)}>
            <Feather name="play-circle" size={48} color="#FFFFFF" />
            <Text style={styles.nativeFallbackText}>Tap to Play Baseline Video</Text>
          </TouchableOpacity>
        )}
      </View>

      <MediaViewerModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        mediaUrl={videoUrl}
        mediaType="video"
        title={title}
        fileName="baseline_video.mp4"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 12,
    gap: 12,
    marginVertical: 6,
  },
  emptyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMeta: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  uploadBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  playerContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    ...makeShadow(4, 0.15),
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconActionText: {
    fontSize: 11,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  removeBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  fullscreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#E0F2FE',
  },
  fullscreenBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0284C7',
  },
  videoScreen: {
    width: '100%',
    height: 240,
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativeFallbackWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  nativeFallbackText: {
    fontSize: 12,
    color: '#94A3B8',
  },
});
