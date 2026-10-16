// src/screens/systemadmin/permissions/permissionHelper.ts

import {
  ACTIONS,
  type ActionType,
  type CatalogModule,
  type PermissionMatrix,
  blankActions,
} from './permissionTypes';

export function buildPermissionSummaryList(
  matrix: PermissionMatrix,
  modules: CatalogModule[],
): string[] {
  const statements: string[] = [];

  modules.forEach((mod) => {
    const perms = matrix[mod.name];
    if (!perms) return;

    const activeActions: string[] = [];
    if (perms.VIEW) activeActions.push('view');
    if (perms.CREATE) activeActions.push('create');
    if (perms.EDIT) activeActions.push('edit');
    if (perms.DELETE) activeActions.push('delete');
    if (perms.APPROVE) activeActions.push('approve');

    if (activeActions.length > 0) {
      let actionStr = '';
      if (activeActions.length === 1) {
        actionStr = activeActions[0];
      } else if (activeActions.length === 2) {
        actionStr = `${activeActions[0]} and ${activeActions[1]}`;
      } else {
        const last = activeActions.pop();
        actionStr = `${activeActions.join(', ')}, and ${last}`;
      }
      statements.push(`Can ${actionStr} ${mod.name}`);
    }
  });

  return statements;
}

export function extractSelectedPermissionIds(
  matrix: PermissionMatrix,
  modules: CatalogModule[],
): string[] {
  const selectedIds: string[] = [];

  modules.forEach((mod) => {
    ACTIONS.forEach((act) => {
      if (matrix[mod.name]?.[act]) {
        const p = mod.permissions?.find((cp) => cp.action.toLowerCase() === act.toLowerCase());
        if (p?.id) {
          selectedIds.push(p.id);
        }
      }
    });
  });

  return selectedIds;
}

export function buildFullAccessMatrix(modules: CatalogModule[]): PermissionMatrix {
  const full: PermissionMatrix = {};
  modules.forEach((m) => {
    full[m.name] = { VIEW: true, CREATE: true, EDIT: true, DELETE: true, APPROVE: true };
  });
  return full;
}

export function buildReadOnlyMatrix(modules: CatalogModule[]): PermissionMatrix {
  const readOnly: PermissionMatrix = {};
  modules.forEach((m) => {
    readOnly[m.name] = { VIEW: true, CREATE: false, EDIT: false, DELETE: false, APPROVE: false };
  });
  return readOnly;
}

export function toggleCellAction(
  prev: PermissionMatrix,
  moduleName: string,
  action: ActionType,
): PermissionMatrix {
  return {
    ...prev,
    [moduleName]: {
      ...prev[moduleName],
      [action]: !prev[moduleName]?.[action],
    },
  };
}

export function toggleRowActions(prev: PermissionMatrix, moduleName: string): PermissionMatrix {
  const currentVal = prev[moduleName] ?? blankActions();
  const allChecked = ACTIONS.every((a) => currentVal[a]);
  const nextState: Record<ActionType, boolean> = {
    VIEW: !allChecked,
    CREATE: !allChecked,
    EDIT: !allChecked,
    DELETE: !allChecked,
    APPROVE: !allChecked,
  };
  return { ...prev, [moduleName]: nextState };
}

export function toggleColumnAction(
  prev: PermissionMatrix,
  action: ActionType,
  modules: CatalogModule[],
): PermissionMatrix {
  const allChecked = modules.every((m) => prev[m.name]?.[action]);
  const updated: PermissionMatrix = { ...prev };
  modules.forEach((m) => {
    updated[m.name] = {
      ...(updated[m.name] ?? blankActions()),
      [action]: !allChecked,
    };
  });
  return updated;
}
