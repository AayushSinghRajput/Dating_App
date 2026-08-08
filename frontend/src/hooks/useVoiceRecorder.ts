import { useRef, useState } from "react";
import Toast from "react-native-toast-message";
import {
  useAudioRecorder,
  useAudioRecorderState,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";

// Dragging the mic button left past this distance (px) cancels the recording,
// mirroring WhatsApp's slide-to-cancel gesture.
const CANCEL_DRAG_THRESHOLD = -80;

export function useVoiceRecorder(
  onRecordingComplete: (uri: string, durationSec: number) => void,
) {
  const [isRecording, setIsRecording] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 200);
  const isRecordingRef = useRef(false);
  const cancelledRef = useRef(false);
  const touchStartXRef = useRef(0);

  const startRecording = async () => {
    if (isRecordingRef.current) return;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        Toast.show({
          type: "error",
          text1: "Microphone permission required",
          text2: "Enable microphone access to record voice messages.",
        });
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      isRecordingRef.current = true;
      cancelledRef.current = false;
      setIsCancelling(false);
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording:", err);
      Toast.show({ type: "error", text1: "Could not start recording" });
    }
  };

  const finishRecording = async (cancelled: boolean) => {
    if (!isRecordingRef.current) return;
    isRecordingRef.current = false;
    const durationSec = Math.round((recorderState.durationMillis || 0) / 1000);

    setIsRecording(false);
    setIsCancelling(false);

    try {
      await recorder.stop();
    } catch (err) {
      console.error("Failed to stop recording:", err);
    }
    setAudioModeAsync({ allowsRecording: false }).catch(() => {});

    if (cancelled) return;
    if (durationSec < 1) {
      Toast.show({ type: "info", text1: "Recording too short" });
      return;
    }

    const uri = recorder.uri;
    if (!uri) return;

    onRecordingComplete(uri, durationSec);
  };

  const micResponderHandlers = {
    onStartShouldSetResponder: () => true,
    onMoveShouldSetResponder: () => true,
    onResponderGrant: (evt: any) => {
      touchStartXRef.current = evt.nativeEvent.pageX;
      startRecording();
    },
    onResponderMove: (evt: any) => {
      const dx = evt.nativeEvent.pageX - touchStartXRef.current;
      const shouldCancel = dx < CANCEL_DRAG_THRESHOLD;
      cancelledRef.current = shouldCancel;
      setIsCancelling(shouldCancel);
    },
    onResponderRelease: () => {
      finishRecording(cancelledRef.current);
    },
    onResponderTerminate: () => {
      finishRecording(true);
    },
  };

  return {
    isRecording,
    isCancelling,
    durationMillis: recorderState.durationMillis || 0,
    micResponderHandlers,
  };
}
