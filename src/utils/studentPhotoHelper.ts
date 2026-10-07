// src/utils/studentPhotoHelper.ts
import { env } from '../api/config/env';

const STORAGE_KEY = 'melue_student_photos_registry_v1';

// In-memory registry cache
const memoryRegistry: Map<string, string> = new Map();
let isInitialized = false;

function normalizeKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, ' ');
}

function loadRegistry() {
  if (isInitialized) return;
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([k, v]) => {
            if (typeof v === 'string' && v) {
              memoryRegistry.set(k, v);
            }
          });
        }
      }
    }
  } catch (err) {
    // Ignore storage errors
  }
  isInitialized = true;
}

function persistRegistry() {
  try {
    if (typeof localStorage !== 'undefined') {
      const obj: Record<string, string> = {};
      memoryRegistry.forEach((v, k) => {
        obj[k] = v;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    }
  } catch (err) {
    // Ignore storage quota errors
  }
}

/**
 * Resolves a photo URL (handles relative backend blob URLs, base64, external links)
 */
export function resolveStudentPhotoUri(photoUriOrUrl?: string | null): string | null {
  if (!photoUriOrUrl || typeof photoUriOrUrl !== 'string') return null;
  const trimmed = photoUriOrUrl.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('file:')) {
    return trimmed;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    const base = env.apiUrl.replace(/\/+$/, '');
    return `${base}${trimmed}`;
  }
  return trimmed;
}

/**
 * Registers or updates a student photo in the global registry
 */
export function saveStudentPhoto(info: {
  id?: string;
  name?: string;
  fullName?: string;
  photo?: string | null;
  photoUrl?: string | null;
  headshotUrl?: string | null;
  photoBase64?: string | null;
  photoUri?: string | null;
}) {
  loadRegistry();
  const rawPhoto =
    info.photoBase64 ||
    info.photo ||
    info.photoUrl ||
    info.headshotUrl ||
    info.photoUri;

  if (!rawPhoto || typeof rawPhoto !== 'string') return;
  const resolved = resolveStudentPhotoUri(rawPhoto);
  if (!resolved) return;

  let changed = false;

  if (info.id) {
    const idKey = `id:${info.id.trim()}`;
    memoryRegistry.set(idKey, resolved);
    changed = true;
  }

  const name = info.fullName || info.name;
  if (name && typeof name === 'string' && name.trim()) {
    const nameKey = `name:${normalizeKey(name)}`;
    memoryRegistry.set(nameKey, resolved);
    changed = true;
  }

  if (changed) {
    persistRegistry();
  }
}

/**
 * Batch registers student photos from API responses
 */
export function registerStudentPhotos(
  students: Array<{
    id?: string;
    name?: string;
    fullName?: string;
    photo?: string | null;
    photoUrl?: string | null;
    headshotUrl?: string | null;
    photoBase64?: string | null;
    photoUri?: string | null;
  }>
) {
  if (!Array.isArray(students)) return;
  students.forEach((s) => {
    if (s && typeof s === 'object') {
      saveStudentPhoto(s);
    }
  });
}

/**
 * Retrieves a student's photo by ID or name, with optional fallback photo string
 */
export function getStudentPhoto(nameOrId?: string | null, fallback?: string | null): string | null {
  loadRegistry();
  if (fallback) {
    const resolvedFallback = resolveStudentPhotoUri(fallback);
    if (resolvedFallback) return resolvedFallback;
  }

  if (!nameOrId || typeof nameOrId !== 'string') return null;
  const raw = nameOrId.trim();
  if (!raw) return null;

  // Try ID lookup
  const byId = memoryRegistry.get(`id:${raw}`);
  if (byId) return byId;

  // Try Name lookup
  const byName = memoryRegistry.get(`name:${normalizeKey(raw)}`);
  if (byName) return byName;

  return null;
}
