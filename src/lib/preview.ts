import type { AppUser, UserRole } from '@/types';

function getPathname() {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.location.pathname;
}

export function isPreviewMode(pathname = getPathname()) {
  return pathname.startsWith('/preview/');
}

export function getPreviewRole(pathname = getPathname()): UserRole {
  return pathname.startsWith('/preview/admin') ? 'ADMIN' : 'STAFF';
}

export function getPreviewBase(pathname = getPathname()) {
  if (!isPreviewMode(pathname)) {
    return '';
  }

  return getPreviewRole(pathname) === 'ADMIN' ? '/preview/admin' : '/preview/staff';
}

export function appPath(path: string, pathname = getPathname()) {
  if (!path.startsWith('/')) {
    return path;
  }

  const base = getPreviewBase(pathname);
  return base ? `${base}${path}` : path;
}

export function getPreviewUser(role = getPreviewRole()): AppUser {
  if (role === 'ADMIN') {
    return {
      id: 'preview-admin',
      email: 'admin.preview@beantrack.local',
      name: 'Preview Admin',
      role: 'ADMIN',
      phone: '+1-555-0100',
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    };
  }

  return {
    id: 'preview-staff',
    email: 'staff.preview@beantrack.local',
    name: 'Preview Staff',
    role: 'STAFF',
    phone: '+1-555-0101',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  };
}
