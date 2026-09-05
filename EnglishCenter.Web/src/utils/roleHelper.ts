export const getRoleHomeRoute = (roles: string[]): string => {
  if (roles.includes('ADMIN')) return '/admin';
  if (roles.includes('STAFF')) return '/staff';
  if (roles.includes('TEACHER')) return '/teacher';
  if (roles.includes('STUDENT')) return '/student';
  return '/login';
};
