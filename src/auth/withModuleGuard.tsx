// src/auth/withModuleGuard.tsx

import React from 'react';
import type { ModuleId } from '../types/auth';
import { useAuth } from '../context/AuthContext';
import { hasModuleAccess } from './permissions';
import AccessDeniedScreen from '../components/AccessDeniedScreen';
import { FALLBACK_MODULES } from '../screens/systemadmin/permissions/permissionTypes';

/**
 * Higher-Order Component that gates a screen behind a module check.
 *
 * If session.modules is undefined/empty (i.e., the backend hasn't sent
 * module data yet, or the role predates this feature), the guard falls
 * back to ALLOWING access to preserve backward compatibility during rollout.
 *
 * Usage:
 *   const GuardedIupGeneration = withModuleGuard(IupGenerationScreen, 'iups');
 *   <Stack.Screen name="IupGeneration" component={GuardedIupGeneration} />
 */
export function withModuleGuard<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  moduleId: ModuleId,
  options?: { screenName?: string },
): React.FC<P> {
  const moduleMeta = FALLBACK_MODULES.find((m) => m.id === moduleId);
  const displayName = options?.screenName || moduleMeta?.name || moduleId;

  const Guarded: React.FC<P> = (props) => {
    const { session } = useAuth();

    // System Administrator is the root superadmin responsible for configuring roles
    // and permissions; they must always retain access to all modules and screens
    if (session?.role === 'system_admin') {
      return <WrappedComponent {...props} />;
    }

    // Fallback: if backend hasn't provided modules or permissions, allow access
    // (backward-compatible during phased rollout)
    if (
      (!session?.modules || session.modules.length === 0) &&
      (!session?.permissions || session.permissions.length === 0)
    ) {
      return <WrappedComponent {...props} />;
    }

    if (!hasModuleAccess(session?.modules, moduleId, session?.permissions)) {
      return <AccessDeniedScreen screenName={displayName} moduleName={displayName} />;
    }

    return <WrappedComponent {...props} />;
  };

  Guarded.displayName = `withModuleGuard(${
    WrappedComponent.displayName || WrappedComponent.name || 'Component'
  })`;

  return Guarded;
}

export default withModuleGuard;
