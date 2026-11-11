export type Role = 'STUDENT' | 'TEACHER';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface LeaderboardEntry {
  rank: number;
  studentId: number;
  userId: number;
  name: string;
  email: string;
  points: number;
}

export type SortBy = 'points' | 'name';
export type Direction = 'asc' | 'desc';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  sortBy: SortBy;
  direction: Direction;
}

export interface ApiError {
  status: number;
  message: string;
  fieldErrors?: Record<string, string>;
}
