import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import furnishingsReducer from '../features/furnishings/furnishingsSlice';
import roomTypeReducer from '../features/room-type/roomTypesSlice';
import roomsReducer from '../features/rooms/roomsSlice';
import buildingReducer from '../features/building/buildingSlice';
import propertiesReducer from '../features/properties/propertiesSlice';
import apartmentReducer from '../features/apartmentCategory/apartmentSlice';
import FavoritesReducer from '../features/favorites/favoritesSlice';
import propertyMediaReducer from "../features/propertyMedia/propertyMediaSlice";
import userReducer from "../features/user/userSlice";
import notificationReducer from '../features/notifications/notificationsSlice';
import chatReducer from '../features/chat/chatSlice';
import addressReducer from '../features/address/addressSlice';
import administrativeReducer from '../features/administrative/administrativeSlice';
import bookingReducer from '../features/bookings/bookingSlice';
import contractReducer from "../features/contracts/contractSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    furnishings: furnishingsReducer,
    roomTypes: roomTypeReducer,
    rooms: roomsReducer,
    properties: propertiesReducer,
    building: buildingReducer,
    apartment: apartmentReducer,
    favorites: FavoritesReducer,
    propertyMedia: propertyMediaReducer,
    user: userReducer,
    notifications: notificationReducer,
    chat: chatReducer,
    address: addressReducer,
    administrative: administrativeReducer,
    bookings: bookingReducer,
    contracts: contractReducer,
  },
  middleware: (getDefault) => getDefault({ serializableCheck: false }),
});
