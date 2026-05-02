export type UserRole = 'STUDENT' | 'LECTURER' | 'ADMIN'

export interface User {
  id: string
  email: string
  role: UserRole
  firstName: string
  lastName: string
  createdAt: Date
  updatedAt: Date
}

export interface UserWithPassword extends User {
  passwordHash: string
}
