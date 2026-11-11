import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { leaderboardApi } from '../api/leaderboardApi';
import { toApiError } from '../api/client';
import { logout } from './authSlice';
import type { ApiError, Direction, LeaderboardEntry, PageResponse, SortBy } from '../types';
import type { RootState } from './index';

export const PAGE_SIZE = 10;

type ListStatus = 'idle' | 'loading' | 'refreshing' | 'loadingMore' | 'succeeded' | 'failed';

interface LeaderboardState {
  items: LeaderboardEntry[];
  /** index of the last page loaded (-1 = none) */
  page: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  sortBy: SortBy;
  direction: Direction;
  status: ListStatus;
  error: ApiError | null;
  myEntry: LeaderboardEntry | null;
  awarding: boolean;
  awardError: ApiError | null;
}

const initialState: LeaderboardState = {
  items: [],
  page: -1,
  totalElements: 0,
  totalPages: 0,
  last: false,
  sortBy: 'points',
  direction: 'desc',
  status: 'idle',
  error: null,
  myEntry: null,
  awarding: false,
  awardError: null,
};

type Cfg = { state: RootState; rejectValue: ApiError };

interface PagePayload {
  data: PageResponse<LeaderboardEntry>;
  sortBy: SortBy;
  direction: Direction;
}

/** Loads page 0 for the current sort (used for first load, sort change, pull-to-refresh). */
export const fetchFirstPage = createAsyncThunk<PagePayload, { refreshing?: boolean } | void, Cfg>(
  'leaderboard/fetchFirstPage',
  async (_arg, { getState, rejectWithValue }) => {
    const { sortBy, direction } = getState().leaderboard;
    try {
      const data = await leaderboardApi.list({ page: 0, size: PAGE_SIZE, sortBy, direction });
      return { data, sortBy, direction };
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  },
);

/** Infinite scroll: appends the next page. */
export const fetchNextPage = createAsyncThunk<PagePayload, void, Cfg>(
  'leaderboard/fetchNextPage',
  async (_arg, { getState, rejectWithValue }) => {
    const { sortBy, direction, page } = getState().leaderboard;
    try {
      const data = await leaderboardApi.list({ page: page + 1, size: PAGE_SIZE, sortBy, direction });
      return { data, sortBy, direction };
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  },
  {
    condition: (_arg, { getState }) => {
      const s = getState().leaderboard;
      return !s.last && s.status !== 'loading' && s.status !== 'loadingMore' && s.page >= 0;
    },
  },
);

/** Silently re-fetches every page already on screen so ranks match the server exactly. */
export const refreshLoaded = createAsyncThunk<PagePayload, void, Cfg>(
  'leaderboard/refreshLoaded',
  async (_arg, { getState, rejectWithValue }) => {
    const { sortBy, direction, page } = getState().leaderboard;
    try {
      const pages = await Promise.all(
        Array.from({ length: Math.max(page, 0) + 1 }, (_, p) =>
          leaderboardApi.list({ page: p, size: PAGE_SIZE, sortBy, direction }),
        ),
      );
      const last = pages[pages.length - 1];
      const data: PageResponse<LeaderboardEntry> = { ...last, content: pages.flatMap((p) => p.content) };
      return { data, sortBy, direction };
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  },
);

export const fetchMyEntry = createAsyncThunk<LeaderboardEntry, void, Cfg>(
  'leaderboard/fetchMyEntry',
  async (_arg, { rejectWithValue }) => {
    try {
      return await leaderboardApi.me();
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  },
);

/** Teacher action. Updates the store immediately from the response, then reconciles with the server. */
export const awardPoints = createAsyncThunk<LeaderboardEntry, { studentId: number; points: number }, Cfg>(
  'leaderboard/awardPoints',
  async ({ studentId, points }, { dispatch, rejectWithValue }) => {
    try {
      const updated = await leaderboardApi.awardPoints(studentId, points);
      void dispatch(refreshLoaded());
      return updated;
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  },
);

/** Same ordering the server uses: chosen key + studentId ASC as the deterministic tie-breaker. */
function sortItems(items: LeaderboardEntry[], sortBy: SortBy, direction: Direction) {
  const dir = direction === 'asc' ? 1 : -1;
  items.sort((a, b) => {
    const primary = sortBy === 'points' ? a.points - b.points : a.name.localeCompare(b.name);
    return primary !== 0 ? primary * dir : a.studentId - b.studentId;
  });
}

const leaderboardSlice = createSlice({
  name: 'leaderboard',
  initialState,
  reducers: {
    setSort(state, action: PayloadAction<{ sortBy: SortBy; direction: Direction }>) {
      state.sortBy = action.payload.sortBy;
      state.direction = action.payload.direction;
      state.items = [];
      state.page = -1;
      state.last = false;
      state.status = 'loading';
    },
    clearAwardError(state) {
      state.awardError = null;
    },
  },
  extraReducers: (builder) => {
    const applyFirst = (state: LeaderboardState, p: PagePayload) => {
      if (p.sortBy !== state.sortBy || p.direction !== state.direction) return; // stale response
      state.items = p.data.content;
      state.page = p.data.page;
      state.totalElements = p.data.totalElements;
      state.totalPages = p.data.totalPages;
      state.last = p.data.last;
      state.status = 'succeeded';
      state.error = null;
    };

    builder
      .addCase(fetchFirstPage.pending, (state, action) => {
        const refreshing = !!(action.meta.arg && action.meta.arg.refreshing);
        state.status = refreshing ? 'refreshing' : 'loading';
      })
      .addCase(fetchFirstPage.fulfilled, (state, action) => applyFirst(state, action.payload))
      .addCase(fetchFirstPage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? { status: 0, message: 'Failed to load leaderboard' };
      })

      .addCase(fetchNextPage.pending, (state) => {
        state.status = 'loadingMore';
      })
      .addCase(fetchNextPage.fulfilled, (state, action) => {
        const { data, sortBy, direction } = action.payload;
        if (sortBy !== state.sortBy || direction !== state.direction) return;
        const known = new Set(state.items.map((i) => i.studentId));
        state.items.push(...data.content.filter((i) => !known.has(i.studentId)));
        state.page = data.page;
        state.totalElements = data.totalElements;
        state.totalPages = data.totalPages;
        state.last = data.last;
        state.status = 'succeeded';
      })
      .addCase(fetchNextPage.rejected, (state, action) => {
        state.status = 'succeeded'; // keep what we have; user can scroll again to retry
        state.error = action.payload ?? { status: 0, message: 'Failed to load more' };
      })

      .addCase(refreshLoaded.fulfilled, (state, action) => {
        if (state.status === 'loading' || state.status === 'loadingMore') return;
        applyFirst(state, action.payload);
      })

      .addCase(fetchMyEntry.fulfilled, (state, action) => {
        state.myEntry = action.payload;
      })

      .addCase(awardPoints.pending, (state) => {
        state.awarding = true;
        state.awardError = null;
      })
      .addCase(awardPoints.fulfilled, (state, action) => {
        state.awarding = false;
        const updated = action.payload;
        // 1) immediate update: write the new points/rank and re-order the list right now
        const idx = state.items.findIndex((i) => i.studentId === updated.studentId);
        if (idx >= 0) state.items[idx] = updated;
        sortItems(state.items, state.sortBy, state.direction);
        // 2) when viewing the true ranking (points DESC) the loaded rows are the top of the table,
        //    so their positions are their ranks; the background refresh then confirms with the server.
        if (state.sortBy === 'points' && state.direction === 'desc') {
          state.items.forEach((it, i) => {
            it.rank = i + 1;
          });
        }
      })
      .addCase(awardPoints.rejected, (state, action) => {
        state.awarding = false;
        state.awardError = action.payload ?? { status: 0, message: 'Failed to award points' };
      })

      .addCase(logout, () => initialState);
  },
});

export const { setSort, clearAwardError } = leaderboardSlice.actions;
export default leaderboardSlice.reducer;

/** Changes the sort and reloads from page 0. */
export const changeSort =
  (sortBy: SortBy, direction: Direction) => (dispatch: (a: unknown) => unknown) => {
    dispatch(setSort({ sortBy, direction }));
    dispatch(fetchFirstPage());
  };
