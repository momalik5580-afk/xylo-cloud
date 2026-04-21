// src/lib/roles.ts

// ==========================================
// TYPES (from your old code)
// ==========================================

export type UserRole =
  | 'GENERAL_MANAGER'
  | 'HOUSEKEEPING_MANAGER'
  | 'ENGINEERING_MANAGER'
  | 'FB_MANAGER'
  | 'GUEST_SERVICES_MANAGER'
  | 'SECURITY_MANAGER'

export type DeptCode = 'HK' | 'ENG' | 'FNB' | 'GS' | 'SEC'
export type AccessLevel = 'full' | 'readonly' | 'blurred' | 'none'

// ==========================================
// DATABASE MAPPING (new - connects DB to code)
// ==========================================

// Database role names → Code constants
export const ROLE_MAPPING: Record<string, UserRole> = {
  "General Manager": "GENERAL_MANAGER",
  "Housekeeping Manager": "HOUSEKEEPING_MANAGER",
  "Engineering Manager": "ENGINEERING_MANAGER",
  "F&B Manager": "FB_MANAGER",
  "Guest Services Manager": "GUEST_SERVICES_MANAGER",
  "Security Manager": "SECURITY_MANAGER",
}

// Reverse mapping: Code constants → Database names
export const ROLE_LABELS: Record<UserRole, string> = {
  GENERAL_MANAGER:        'General Manager',
  HOUSEKEEPING_MANAGER:   'Housekeeping Manager',
  ENGINEERING_MANAGER:    'Engineering Manager',
  FB_MANAGER:             'F&B Manager',
  GUEST_SERVICES_MANAGER: 'Guest Services Manager',
  SECURITY_MANAGER:       'Security Manager',
}

// ==========================================
// HELPER FUNCTIONS (new)
// ==========================================

/**
 * Convert database role name to code constant
 * Example: "General Manager" → "GENERAL_MANAGER"
 */
export function normalizeRole(dbRole: string): UserRole {
  return ROLE_MAPPING[dbRole] || (dbRole.toUpperCase().replace(/\s+/g, "_") as UserRole)
}

/**
 * Convert code constant to database/display name
 * Example: "GENERAL_MANAGER" → "General Manager"
 */
export function getRoleDisplayName(roleConstant: UserRole): string {
  return ROLE_LABELS[roleConstant] || roleConstant.replace(/_/g, " ")
}

// ==========================================
// DEPARTMENT MAPPING (from your old code)
// ==========================================

export const ROLE_TO_DEPT: Partial<Record<UserRole, DeptCode>> = {
  HOUSEKEEPING_MANAGER:   'HK',
  ENGINEERING_MANAGER:    'ENG',
  FB_MANAGER:             'FNB',
  GUEST_SERVICES_MANAGER: 'GS',
  SECURITY_MANAGER:       'SEC',
}

export const DEPT_COLORS: Record<DeptCode, string> = {
  HK:  'emerald',
  ENG: 'amber',
  FNB: 'orange',
  GS:  'blue',
  SEC: 'red',
}

export const DEPT_NAMES: Record<DeptCode, string> = {
  HK:  'Housekeeping',
  ENG:  'Engineering',
  FNB:  'F&B',
  GS:   'Guest Services',
  SEC:  'Security',
}

// ==========================================
// ACCESS CONTROL (from your old code)
// ==========================================

export function getDeptAccess(role: UserRole, deptCode: DeptCode): AccessLevel {
  if (role === 'GENERAL_MANAGER') return 'full'
  const ownDept = ROLE_TO_DEPT[role]
  if (ownDept === deptCode) return 'full'
  if (role === 'GUEST_SERVICES_MANAGER' && deptCode === 'HK') return 'readonly'
  return 'blurred'
}

// ==========================================
// PERMISSIONS (from your old code)
// ==========================================

export interface Permissions {
  viewGMPage: boolean
  viewAllDepartments: boolean
  viewAllTasks: boolean
  createTaskForOtherDept: boolean
  escalateToOtherDept: boolean
  viewAllReports: boolean
  manageUsers: boolean
  broadcastToAll: boolean
  viewGuestFeatures: boolean
}

export function getPermissions(role: UserRole): Permissions {
  const isGM = role === 'GENERAL_MANAGER'
  const isGS = role === 'GUEST_SERVICES_MANAGER'
  return {
    viewGMPage:             isGM,
    viewAllDepartments:     isGM,
    viewAllTasks:           isGM,
    createTaskForOtherDept: isGM || isGS,
    escalateToOtherDept:    isGM || isGS,
    viewAllReports:         isGM,
    manageUsers:            isGM,
    broadcastToAll:         isGM,
    viewGuestFeatures:      isGM || isGS,
  }
}

// ==========================================
// CONVENIENCE CHECKS (new)
// ==========================================

/** Check if user has specific role */
export function hasRole(userRole: string, requiredRole: UserRole): boolean {
  const normalized = normalizeRole(userRole)
  return normalized === requiredRole
}

/** Check if user is GM */
export function isGeneralManager(userRole: string): boolean {
  return hasRole(userRole, 'GENERAL_MANAGER')
}

/** Check if user is any department manager */
export function isDepartmentManager(userRole: string): boolean {
  const normalized = normalizeRole(userRole)
  return normalized !== 'GENERAL_MANAGER' && normalized.includes('MANAGER')
}