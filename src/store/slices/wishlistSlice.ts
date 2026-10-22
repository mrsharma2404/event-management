import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { hydrate } from '../actions';

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { slugs: [] as string[] },
  reducers: {
    toggleWishlist(state, { payload }: PayloadAction<string>) {
      state.slugs = state.slugs.includes(payload) ? state.slugs.filter(s => s !== payload) : [payload, ...state.slugs];
    },
    clearWishlist(state) {
      state.slugs = [];
    },
  },
  extraReducers: b => b.addCase(hydrate, (state, { payload }) => (payload.wishlist ? payload.wishlist : state)),
});

export const { toggleWishlist, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
