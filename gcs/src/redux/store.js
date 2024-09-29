import { configureStore} from '@reduxjs/toolkit';
import logAnalyserReducer from './logAnalyserSlice';

export const store = configureStore({
  reducer: {
    logAnalyser: logAnalyserReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    immutableCheck: false,
    serializableCheck: false,
  }),
});