import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit';
import authReducer, { bootstrapAuth, login, logout, register } from './authSlice';
import leaderboardReducer from './leaderboardSlice';
import { authStorage } from '../storage/authStorage';
import { setAuthToken, setUnauthorizedHandler } from '../api/client';

/**
 * Keeps secure storage in sync with the auth slice. Anything that logs in
 * saves the session; logout (manual or forced by a 401) wipes it.
 */
const listener = createListenerMiddleware();

for (const creator of [login, register]) {
  listener.startListening({
    actionCreator: creator.fulfilled,
    effect: async (action) => {
      await authStorage.save(action.payload);
    },
  });
}

listener.startListening({
  matcher: isAnyOf(logout, bootstrapAuth.fulfilled),
  effect: async (action, api) => {
    const { token } = (api.getState() as RootState).auth;
    if (!token) await authStorage.clear();
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    leaderboard: leaderboardReducer,
  },
  middleware: (getDefault) => getDefault().prepend(listener.middleware),
});

// Keep the axios Authorization header in lockstep with Redux auth state.
let lastToken: string | null = null;
store.subscribe(() => {
  const token = store.getState().auth.token;
  if (token !== lastToken) {
    lastToken = token;
    setAuthToken(token);
  }
});
// A 401 on any protected call (expired token) logs the user out everywhere.
setUnauthorizedHandler(() => store.dispatch(logout()));

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
