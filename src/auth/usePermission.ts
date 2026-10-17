// src/auth/usePermission.ts

import { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import type { ActionKey, ModuleId, PermissionMap } from '../types/auth';
import { parsePermissions, hasPermission, hasModuleAccess } from './permissions';

/**
 * Parses session.permissions once and memoizes the PermissionMap.
 * Falls back to session.permissionMap if already computed on the session.
 * All permission hooks downstream consume this.
 */
export function usePermissionMap(): PermissionMap {
  const { session } = useAuth();
  return useMemo(() => {
    if (session?.permissionMap) {
      return session.permissionMap;
    }
    return parsePermissions(session?.permissions);
  }, [session?.permissionMap, session?.permissions]);
}

/**
 * Returns true if the current user has the specified action on the resource.
 *
 * Usage:
 *   const canDelete = usePermission('behavior_incidents', 'delete');
 *   const canApprove = usePermission('iups', 'approve');
 */
export function usePermission(resource: string, action: ActionKey): boolean {
  const map = usePermissionMap();
  return hasPermission(map, resource, action);
}

/**
 * Returns true if the current user has the specified module in session.modules.
 *
 * Usage:
 *   const hasAssessments = useModule('assessments');
 */
export function useModule(moduleId: ModuleId): boolean {
  const { session } = useAuth();
  return hasModuleAccess(session?.modules, moduleId);
}

/**
 * Returns a convenience object with all 5 action booleans for a given resource.
 *
 * Usage:
 *   const sessions = useResourcePermissions('sessions');
 *   if (sessions.canEdit) { ... }
 *   if (sessions.canDelete) { ... }
 */
export function useResourcePermissions(resource: string) {
  const map = usePermissionMap();
  return useMemo(
    () => ({
      canView: hasPermission(map, resource, 'view'),
      canCreate: hasPermission(map, resource, 'create'),
      canEdit: hasPermission(map, resource, 'edit'),
      canDelete: hasPermission(map, resource, 'delete'),
      canApprove: hasPermission(map, resource, 'approve'),
    }),
    [map, resource],
  );
}
