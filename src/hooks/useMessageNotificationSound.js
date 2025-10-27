import { useCallback, useEffect, useRef } from "react";
import { Audio } from "expo-av";

const SOUND_RESOURCE = require("../../assets/message-notification.wav");

export default function useMessageNotificationSound() {
  const soundRef = useRef(null);
  const loadingRef = useRef(false);

  const loadSound = useCallback(async () => {
    if (soundRef.current || loadingRef.current) return soundRef.current;
    try {
      loadingRef.current = true;
      const { sound } = await Audio.Sound.createAsync(SOUND_RESOURCE, { shouldPlay: false });
      soundRef.current = sound;
      return sound;
    } finally {
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const play = useCallback(async () => {
    try {
      const sound = soundRef.current || (await loadSound());
      if (!sound) return;
      await sound.replayAsync();
    } catch (error) {
      console.warn("Play notification sound failed", error);
    }
  }, [loadSound]);

  return play;
}