import Constants from 'expo-constants';
export function getWsUrl() {
  const base = Constants.expoConfig?.extra?.WS_BASE || 'ws://192.168.2.138:8080';
  // Spring SockJS raw WS endpoint:
  return `${base}/ws`;
}
