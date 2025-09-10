import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import furnishingsReducer from '../features/furnishings/furnishingsSlice';
import roomTypeReducer from '../features/room-type/roomTypesSlice';
import roomsReducer from '../features/rooms/roomsSlice';
import buildingReducer from '../features/building/buildingSlice';
import propertiesReducer from '../features/properties/propertiesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    furnishings: furnishingsReducer,
    roomTypes: roomTypeReducer,
    rooms: roomsReducer,
    properties: propertiesReducer,
    building: buildingReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});
