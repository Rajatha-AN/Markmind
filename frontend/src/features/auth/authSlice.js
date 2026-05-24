import { createSlice } from '@reduxjs/toolkit';

const saved = JSON.parse(localStorage.getItem('markmind_auth') || 'null');

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: saved?.user || null, token: saved?.token || null },
  reducers: {
    setCredentials(state, { payload }) {
      state.user = payload.user;
      state.token = payload.token;
      localStorage.setItem('markmind_auth', JSON.stringify(payload));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('markmind_auth');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
