import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, radius, spacing } from '../theme/colors';

interface CameraCaptureModalProps {
  visible: boolean;
  onClose: () => void;
  onCapture: (photoUri: string, photoBase64?: string) => void;
}

export default function CameraCaptureModal({
  visible,
  onClose,
  onCapture,
}: CameraCaptureModalProps) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);

  // Stop camera tracks helper
  const stopTracks = () => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
  };

  // Start web camera
  const startWebCamera = async (mode: 'user' | 'environment') => {
    setErrorMsg(null);
    setLoading(true);
    setCapturedImage(null);

    // Stop existing stream first
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: mode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setErrorMsg('Camera access is not supported by your browser.');
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setErrorMsg('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setErrorMsg('No camera hardware found on this device.');
      } else {
        setErrorMsg(err?.message || 'Unable to open camera.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      if (Platform.OS === 'web') {
        startWebCamera(facingMode);
      } else {
        // Native mobile
        (async () => {
          try {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (!perm.granted) {
              setErrorMsg('Camera permission is required.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
              base64: true,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
              const asset = result.assets[0];
              const b64 = asset.base64 ? `data:${asset.mimeType || 'image/jpeg'};base64,${asset.base64}` : asset.uri;
              onCapture(asset.uri, b64);
              onClose();
            } else {
              onClose();
            }
          } catch (e: any) {
            setErrorMsg(e?.message || 'Could not open native camera');
          }
        })();
      }
    } else {
      stopTracks();
      setCapturedImage(null);
      setErrorMsg(null);
    }

    return () => {
      stopTracks();
    };
  }, [visible]);

  // Keep video ref connected to stream when DOM is mounted
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  const handleTakeSnapshot = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, flip horizontally for natural mirror feel
    if (facingMode === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(dataUrl);
    stopTracks();
  };

  const handleConfirmPhoto = () => {
    if (capturedImage) {
      onCapture(capturedImage, capturedImage);
      handleClose();
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startWebCamera(facingMode);
  };

  const handleSwitchFacing = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startWebCamera(nextMode);
  };

  const handleClose = () => {
    stopTracks();
    setCapturedImage(null);
    setErrorMsg(null);
    onClose();
  };

  if (!visible) return null;

  // On native mobile, ImagePicker is launched directly, modal UI is web-first
  if (Platform.OS !== 'web') {
    return null;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.cameraIconBadge}>
                <Feather name="camera" size={18} color="#0284C7" />
              </View>
              <Text style={styles.headerTitle}>Take Student Photo</Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} accessibilityLabel="Close Camera">
              <Feather name="x" size={20} color="#64748B" />
            </TouchableOpacity>
          </View>

          {/* Camera Viewport / Captured Preview */}
          <View style={styles.viewportContainer}>
            {loading && (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="large" color="#0284C7" />
                <Text style={styles.loadingText}>Initializing camera...</Text>
              </View>
            )}

            {errorMsg && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={36} color="#DC2626" />
                <Text style={styles.errorTitle}>Camera Unavailable</Text>
                <Text style={styles.errorDesc}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => startWebCamera(facingMode)}>
                  <Feather name="refresh-cw" size={14} color="#FFFFFF" />
                  <Text style={styles.retryBtnText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {!loading && !errorMsg && !capturedImage && (
              <div
                ref={videoContainerRef as any}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0F172A',
                  overflow: 'hidden',
                  borderRadius: 12,
                }}
              >
                <video
                  ref={videoRef as any}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    transform: facingMode === 'user' ? 'scaleX(-1)' : 'none',
                  }}
                />
                {/* Target Frame / Face guide overlay */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '220px',
                    height: '220px',
                    borderRadius: '50%',
                    border: '3px dashed rgba(255, 255, 255, 0.7)',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.35)',
                    pointerEvents: 'none',
                  }}
                />
              </div>
            )}

            {capturedImage && (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0F172A',
                  overflow: 'hidden',
                  borderRadius: 12,
                }}
              >
                <img
                  src={capturedImage}
                  alt="Captured student preview"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
          </View>

          {/* Controls Footer */}
          <View style={styles.controlsFooter}>
            {!capturedImage && !errorMsg && (
              <View style={styles.captureRow}>
                <TouchableOpacity
                  style={styles.switchCameraBtn}
                  onPress={handleSwitchFacing}
                  disabled={loading}
                  accessibilityLabel="Switch camera">
                  <Feather name="refresh-cw" size={18} color="#475569" />
                  <Text style={styles.switchCameraText}>Flip</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.snapBtn}
                  onPress={handleTakeSnapshot}
                  disabled={loading}
                  accessibilityLabel="Take snapshot"
                >
                  <View style={styles.snapBtnInner}>
                    <Feather name="camera" size={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelActionBtn} onPress={handleClose}>
                  <Text style={styles.cancelActionText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}

            {capturedImage && (
              <View style={styles.confirmRow}>
                <TouchableOpacity style={styles.retakeBtn} onPress={handleRetake}>
                  <Feather name="rotate-ccw" size={16} color="#475569" />
                  <Text style={styles.retakeBtnText}>Retake Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPhoto}>
                  <Feather name="check" size={18} color="#FFFFFF" />
                  <Text style={styles.confirmBtnText}>Save & Use Photo</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 25,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cameraIconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  viewportContainer: {
    width: '100%',
    height: 380,
    backgroundColor: '#0F172A',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingBox: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '500',
  },
  errorBox: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 380,
  },
  errorTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  errorDesc: {
    color: '#CBD5E1',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginTop: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  controlsFooter: {
    padding: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  switchCameraBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 2,
    minWidth: 50,
  },
  switchCameraText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  snapBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#0284C7',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  snapBtnInner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelActionBtn: {
    padding: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  cancelActionText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  confirmRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  retakeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  retakeBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
