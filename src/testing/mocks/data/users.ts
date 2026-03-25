import { User, UserRole } from '../../../app/core/models/user.model';

export const mockUsers: User[] = [
  {
    id: '1',
    code: '123456',
    email: 'admin@test.com',
    name: 'Admin User',
    role: UserRole.ADMIN,
    companyId: 'TEST',
    isActive: true,
    createdAt: new Date('2024-01-01'),
  },
  {
    id: '2',
    code: '654321',
    email: 'signer@test.com',
    name: 'John Signer',
    role: UserRole.SIGNER,
    companyId: 'TEST',
    isActive: true,
    createdAt: new Date('2024-01-15'),
  },
  {
    id: '3',
    code: '111111',
    email: 'viewer@test.com',
    name: 'Jane Viewer',
    role: UserRole.VIEWER,
    companyId: 'TEST',
    isActive: false,
    createdAt: new Date('2024-02-01'),
  },
];

export const mockUser = mockUsers[0];
export const mockAdminUser = mockUsers[0];
export const mockSignerUser = mockUsers[1];
export const mockInactiveUser = mockUsers[2];
