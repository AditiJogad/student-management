import { http } from './client';
import type { Direction, LeaderboardEntry, PageResponse, SortBy } from '../types';

export const leaderboardApi = {
  list: (params: { page: number; size: number; sortBy: SortBy; direction: Direction }) =>
    http.get<PageResponse<LeaderboardEntry>>('/api/leaderboard', { params }).then((r) => r.data),

  me: () => http.get<LeaderboardEntry>('/api/leaderboard/me').then((r) => r.data),

  awardPoints: (studentId: number, points: number) =>
    http.post<LeaderboardEntry>(`/api/leaderboard/${studentId}/points`, { points }).then((r) => r.data),
};
