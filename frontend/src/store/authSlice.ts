import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { authApi } from '../api/authApi';
import { setAuthToken, toApiError } from '../api/client';
import { authStorage } from '../storage/authStorage';
import type { ApiError, AuthResponse, Role, User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  /** false until the persisted session has been read + validated at app start */
  bootstrapped: boolean;
  loading: boolean;
  error: ApiError | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  bootstrapped: false,
  loading: false,
  error: null,
};

export const login = createAsyncThunk<AuthResponse, { email: string; password: string }, { rejectValue: ApiError }>(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await authApi.login(email.trim(), password);
    } catch (e) {
      return rejectWithValue(toApiError(e));
    }
  },
);

export const register = createAsyncThunk<
  AuthResponse,
  { name: string; email: string; password: string; role: Role },
  { rejectValue: ApiError }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    return await authApi.register({ ...payload, name: payload.name.trim(), email: payload.email.trim() });
  } catch (e) {
    return rejectWithValue(toApiError(e));
  }
});

/**
 * Runs once at startup: restores the saved session from secure storage and
 * re-validates the token with the backend. A 401 drops the session; a network
 * failure keeps it (so the app still opens offline and retries on next call).
 */
export const bootstrapAuth = createAsyncThunk<AuthResponse | null>('auth/bootstrap', async () => {
  const stored = await authStorage.load();
  if (!stored) return null;
  setAuthToken(stored.token);
  try {
    const user = await authApi.me();
    return { token: stored.token, user };
  } catch (e) {
    if (toApiError(e).status === 401) {
      setAuthToken(null);
      return null;
    }
    return stored;
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      state.loading = false;
    },
    clearAuthError(state) {
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<ApiError | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    const pending = (state: AuthState) => {
      state.loading = true;
      state.error = null;
    };
    const fulfilled = (state: AuthState, action: PayloadAction<AuthResponse>) => {
      state.loading = false;
      state.user = action.payload.user;
      state.token = action.payload.token;
    };
    const rejected = (state: AuthState, action: { payload?: ApiError }) => {
      state.loading = false;
      state.error = action.payload ?? { status: 0, message: 'Something went wrong' };
    };

    builder
      .addCase(login.pending, pending)
      .addCase(login.fulfilled, fulfilled)
      .addCase(login.rejected, rejected)
      .addCase(register.pending, pending)
      .addCase(register.fulfilled, fulfilled)
      .addCase(register.rejected, rejected)
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.bootstrapped = true;
        if (action.payload) {
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(bootstrapAuth.rejected, (state) => {
        state.bootstrapped = true;
      });
  },
});

export const { logout, clearAuthError, setAuthError } = authSlice.actions;
export default authSlice.reducer;
