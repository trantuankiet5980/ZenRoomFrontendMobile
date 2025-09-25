import Constants from 'expo-constants';
export function getWsUrl() {
  const base = Constants.expoConfig?.extra?.WS_BASE || 'ws://10.0.2.2:8080';
  // Spring SockJS raw WS endpoint:
  return `${base}/ws`;
}
