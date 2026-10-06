// theme/zIndex.ts
//
// Centralized z-index layering system.
// Prevents magic numbers and z-index wars across the codebase.

export const zIndex = {
  /** Default layer for page content */
  base: 0,

  /** Sticky elements like table headers */
  sticky: 10,

  /** Fixed navigation bars (AppNavbar, RoleSidebar) */
  navigation: 100,

  /** Dropdown menus, popovers, tooltips */
  dropdown: 200,

  /** Modal overlays and bottom sheets */
  modal: 300,

  /** Toast notifications — always above modals */
  toast: 400,

  /** Development tools, debug overlays */
  devTools: 9999,
} as const;

export type ZIndexToken = keyof typeof zIndex;

export default zIndex;
