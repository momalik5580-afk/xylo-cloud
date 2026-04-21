import { Permissions, UserRole } from "./roles"

export function hasPermission(
  permissions: Permissions | null,
  permission: keyof Permissions
): boolean {
  return permissions?.[permission] || false
}

export function canManageDepartment(
  userRole: UserRole,
  userDept: string | undefined,
  targetDept: string
): boolean {
  // GM can manage all departments
  if (userRole === 'GENERAL_MANAGER') return true
  
  // Department heads can manage their own department
  if (userRole.includes('MANAGER') && userDept === targetDept) return true
  
  return false
}