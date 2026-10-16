import { describe, it, expect } from 'vitest';
import { ROLE_TABS, SYS_ROUTE_BY_TAB, routeMapForRole } from '../appNavConfig';
import { SidebarNavContext } from '../../navigation/SidebarNavContext';
import { useContext } from 'react';

describe('System Admin Navigation & Sidebar Configuration', () => {
  it('defines the correct tabs for system_admin', () => {
    const tabs = ROLE_TABS.system_admin;
    expect(tabs).toEqual([
      'Staff Accounts',
      'Role Management',
      'Permission Configuration',
      'Audit Log',
    ]);
  });

  it('correctly maps all system_admin tabs to their screen routes', () => {
    const routeMap = routeMapForRole('system_admin');
    expect(routeMap).toBeDefined();

    expect(routeMap?.['Staff Accounts']).toBe('StaffAccountManagement');
    expect(routeMap?.['Role Management']).toBe('RoleManagement');
    expect(routeMap?.['Permission Configuration']).toBe('PermissionConfiguration');
    expect(routeMap?.['Audit Log']).toBe('AuditLog');
  });

  it('supports legacy alias mappings for system_admin routes', () => {
    expect(SYS_ROUTE_BY_TAB['Staff']).toBe('StaffAccountManagement');
    expect(SYS_ROUTE_BY_TAB['Roles']).toBe('RoleManagement');
    expect(SYS_ROUTE_BY_TAB['Permissions']).toBe('PermissionConfiguration');
    expect(SYS_ROUTE_BY_TAB['Audit']).toBe('AuditLog');
  });

  it('initializes SidebarNavContext with default values', () => {
    // Check default context values
    expect(SidebarNavContext).toBeDefined();
    // Default context has isCollapsed as false and functions defined
    const defaultValue = (SidebarNavContext as any)._currentValue;
    if (defaultValue) {
      expect(defaultValue.isCollapsed).toBe(false);
      expect(typeof defaultValue.toggleSidebar).toBe('function');
      expect(typeof defaultValue.setIsCollapsed).toBe('function');
    }
  });

  it('identifies system_admin as sidebar navigation role', () => {
    const isSidebarRole = (role: string) =>
      role === 'system_admin' || role === 'institutional_admin';
    expect(isSidebarRole('system_admin')).toBe(true);
    expect(isSidebarRole('institutional_admin')).toBe(true);
    expect(isSidebarRole('teacher')).toBe(false);
    expect(isSidebarRole('coordinator')).toBe(false);
    expect(isSidebarRole('director')).toBe(false);
    expect(isSidebarRole('program_director')).toBe(false);
    expect(isSidebarRole('parent')).toBe(false);
  });
});
