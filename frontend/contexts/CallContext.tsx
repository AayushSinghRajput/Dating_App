import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { PermissionsAndroid, Platform } from "react-native";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";
import Toast from "react-native-toast-message";
import { socket, connectSocket } from "@/utils/socket";

export type CallType = "audio" | "video";
export type CallStatus =
  | "idle"
  | "outgoing-ringing"
  | "incoming-ringing"
  | "connected";

export interface RemoteCallUser {
  userId: string;
  name: string;
  avatar: string;
  chatId: string;
}

interface CallContextValue {
  callStatus: CallStatus;
  callType: CallType;
  remoteUser: RemoteCallUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isSpeakerOn: boolean;
  isFrontCamera: boolean;
  startCall: (
    toUserId: string,
    chatId: string,
    callType: CallType,
    name: string,
    avatar: string
  ) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  flipCamera: () => void;
}

const ICE_SERVERS = [
  { urls: "stun:stun.l.google.com:19302" },
  {
    urls: "turn:openrelay.metered.ca:80",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
  {
    urls: "turn:openrelay.metered.ca:443?transport=tcp",
    username: "openrelayproject",
    credential: "openrelayproject",
  },
];

const CallContext = createContext<CallContextValue | null>(null);

async function requestCallPermissions(type: CallType) {
  if (Platform.OS !== "android") return true;
  const perms = [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
  if (type === "video") perms.push(PermissionsAndroid.PERMISSIONS.CAMERA);
  const results = await PermissionsAndroid.requestMultiple(perms);
  return Object.values(results).every(
    (r) => r === PermissionsAndroid.RESULTS.GRANTED
  );
}

export function CallProvider({ children }: { children: React.ReactNode }) {
  const [callStatus, setCallStatus] = useState<CallStatus>("idle");
  const [callType, setCallType] = useState<CallType>("audio");
  const [remoteUser, setRemoteUser] = useState<RemoteCallUser | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteUserRef = useRef<RemoteCallUser | null>(null);
  const callTypeRef = useRef<CallType>("audio");
  const pendingOfferRef = useRef<any>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const callIdRef = useRef<string | null>(null);

  const cleanup = useCallback(() => {
    InCallManager.stopRingtone();
    InCallManager.stopRingback();
    InCallManager.stop();
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteUserRef.current = null;
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];
    callIdRef.current = null;

    setLocalStream(null);
    setRemoteStream(null);
    setRemoteUser(null);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsFrontCamera(true);
    setCallStatus("idle");
  }, []);

  const createPeerConnection = useCallback((toUserId: string) => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event: any) => {
      if (event.candidate) {
        socket.emit("iceCandidate", { toUserId, candidate: event.candidate });
      }
    };

    pc.ontrack = (event: any) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  }, []);

  const flushPendingCandidates = useCallback(async (pc: RTCPeerConnection) => {
    for (const candidate of pendingCandidatesRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        console.error("Failed to add queued ICE candidate:", err);
      }
    }
    pendingCandidatesRef.current = [];
  }, []);

  useEffect(() => {
    connectSocket();

    const handleIncomingCall = ({
      fromUserId,
      fromName,
      fromAvatar,
      chatId,
      callType: incomingType,
      offer,
      callId,
    }: any) => {
      // Busy: already in/starting a call, ignore silently (no call-waiting support yet)
      if (peerConnectionRef.current) return;

      pendingOfferRef.current = offer;
      callIdRef.current = callId;
      const remote: RemoteCallUser = {
        userId: fromUserId,
        name: fromName || "Unknown",
        avatar: fromAvatar || "",
        chatId,
      };
      remoteUserRef.current = remote;
      callTypeRef.current = incomingType;
      setRemoteUser(remote);
      setCallType(incomingType);
      setCallStatus("incoming-ringing");
      InCallManager.startRingtone("_DEFAULT_", [1000, 1000], "", 30);
    };

    const handleCallAnswered = async ({ answer }: any) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(pc);
        InCallManager.setSpeakerphoneOn(true);
        setCallStatus("connected");
      } catch (err) {
        console.error("Failed to apply call answer:", err);
        cleanup();
      }
    };

    const handleIceCandidate = async ({ candidate }: any) => {
      if (!candidate) return;
      const pc = peerConnectionRef.current;
      if (pc && pc.remoteDescription) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error("Failed to add ICE candidate:", err);
        }
      } else {
        pendingCandidatesRef.current.push(candidate);
      }
    };

    const handleCallRejected = () => {
      Toast.show({ type: "info", text1: "Call declined" });
      cleanup();
    };

    const handleCallEnded = () => {
      cleanup();
    };

    socket.on("incomingCall", handleIncomingCall);
    socket.on("callAnswered", handleCallAnswered);
    socket.on("iceCandidate", handleIceCandidate);
    socket.on("callRejected", handleCallRejected);
    socket.on("callEnded", handleCallEnded);

    return () => {
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAnswered", handleCallAnswered);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callRejected", handleCallRejected);
      socket.off("callEnded", handleCallEnded);
    };
  }, [cleanup, flushPendingCandidates]);

  const startCall = useCallback(
    async (
      toUserId: string,
      chatId: string,
      type: CallType,
      name: string,
      avatar: string
    ) => {
      if (callStatus !== "idle") return;

      const granted = await requestCallPermissions(type);
      if (!granted) {
        Toast.show({
          type: "error",
          text1: "Permission required",
          text2: "Camera/microphone access is needed to make a call.",
        });
        return;
      }

      try {
        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: type === "video" ? { facingMode: "user" } : false,
        });
        localStreamRef.current = stream as unknown as MediaStream;
        setLocalStream(stream as unknown as MediaStream);

        const remote: RemoteCallUser = { userId: toUserId, name, avatar, chatId };
        remoteUserRef.current = remote;
        callTypeRef.current = type;
        callIdRef.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setRemoteUser(remote);
        setCallType(type);

        const pc = createPeerConnection(toUserId);
        (stream as any)
          .getTracks()
          .forEach((track: any) => pc.addTrack(track, stream as any));

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        socket.emit("callUser", {
          toUserId,
          chatId,
          callType: type,
          offer,
          callId: callIdRef.current,
        });

        // No ringback here: only the callee should hear a ring, the caller just
        // sees the silent "Ringing…" screen until answered.
        InCallManager.start({ media: type });
        setCallStatus("outgoing-ringing");
      } catch (err: any) {
        console.error("Failed to start call:", err);
        Toast.show({
          type: "error",
          text1: "Call failed",
          text2: err?.message || "Could not start the call.",
        });
        cleanup();
      }
    },
    [callStatus, createPeerConnection, cleanup]
  );

  const acceptCall = useCallback(async () => {
    if (callStatus !== "incoming-ringing" || !remoteUserRef.current) return;

    const granted = await requestCallPermissions(callTypeRef.current);
    if (!granted) {
      Toast.show({
        type: "error",
        text1: "Permission required",
        text2: "Camera/microphone access is needed to answer.",
      });
      socket.emit("rejectCall", { toUserId: remoteUserRef.current.userId, callId: callIdRef.current });
      cleanup();
      return;
    }

    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: callTypeRef.current === "video" ? { facingMode: "user" } : false,
      });
      localStreamRef.current = stream as unknown as MediaStream;
      setLocalStream(stream as unknown as MediaStream);

      const pc = createPeerConnection(remoteUserRef.current.userId);
      (stream as any)
        .getTracks()
        .forEach((track: any) => pc.addTrack(track, stream as any));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current));
      await flushPendingCandidates(pc);

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answerCall", {
        toUserId: remoteUserRef.current.userId,
        answer,
        callId: callIdRef.current,
      });

      InCallManager.stopRingtone();
      InCallManager.start({ media: callTypeRef.current });
      InCallManager.setSpeakerphoneOn(true);
      setCallStatus("connected");
    } catch (err) {
      console.error("Failed to accept call:", err);
      Toast.show({
        type: "error",
        text1: "Call failed",
        text2: "Could not answer the call.",
      });
      cleanup();
    }
  }, [callStatus, createPeerConnection, flushPendingCandidates, cleanup]);

  const rejectCall = useCallback(() => {
    if (remoteUserRef.current) {
      socket.emit("rejectCall", { toUserId: remoteUserRef.current.userId, callId: callIdRef.current });
    }
    cleanup();
  }, [cleanup]);

  const endCall = useCallback(() => {
    if (remoteUserRef.current) {
      socket.emit("endCall", { toUserId: remoteUserRef.current.userId, callId: callIdRef.current });
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    const stream = localStreamRef.current;
    const audioTrack = (stream as any)?.getAudioTracks?.()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  }, []);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      InCallManager.setSpeakerphoneOn(next);
      return next;
    });
  }, []);

  const flipCamera = useCallback(() => {
    const stream = localStreamRef.current;
    const videoTrack = (stream as any)?.getVideoTracks?.()[0];
    if (videoTrack && typeof videoTrack._switchCamera === "function") {
      videoTrack._switchCamera();
      setIsFrontCamera((prev) => !prev);
    }
  }, []);

  return (
    <CallContext.Provider
      value={{
        callStatus,
        callType,
        remoteUser,
        localStream,
        remoteStream,
        isMuted,
        isSpeakerOn,
        isFrontCamera,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleSpeaker,
        flipCamera,
      }}
    >
      {children}
    </CallContext.Provider>
  );
}

export function useCall() {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
}
