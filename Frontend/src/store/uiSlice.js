import { createSlice } from '@reduxjs/toolkit';

let toastIdCounter = 0;

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    toasts: [],
    isLoading: false,
  },
  reducers: {
    addToast: (state, action) => {
      state.toasts.push({
        id: ++toastIdCounter,
        type: action.payload.type || 'info', // 'success' | 'error' | 'info' | 'warning'
        message: action.payload.message,
        duration: action.payload.duration || 4000,
      });
    },
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
});

export const { addToast, removeToast, setLoading } = uiSlice.actions;

export const selectToasts = (state) => state.ui.toasts;
export const selectIsLoading = (state) => state.ui.isLoading;

export default uiSlice.reducer;
