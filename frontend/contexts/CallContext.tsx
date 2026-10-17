import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  AppState,
  Linking,
  NativeEventEmitter,
  NativeModules,
  PermissionsAndroid,
  Platform,
} from "react-native";
import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
} from "react-native-webrtc";
import InCallManager from "react-native-incall-manager";
import Toast from "react-native-toast-message";
import { socket, connectSocket } from "../utils/socket";
import { getIceServers, DEFAULT_ICE_SERVERS, rejectCallApi, endCallApi } from "@/services/callService";
import { Notifications } from "../src/hooks/usePushNotifications";

const { CallRingingModule } = NativeModules;

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
  const callStatusRef = useRef<CallStatus>("idle");
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

  const acceptCallRef = useRef<() => Promise<void>>(null);

  const cleanup = useCallback(() => {
    InCallManager.stopRingtone();
    InCallManager.stopRingback();
    InCallManager.stop();
    if (Platform.OS === "android" && CallRingingModule?.stopRinging) {
      try {
        CallRingingModule.stopRinging();
      } catch (e) {
        console.warn("[CallContext] Error stopping CallRingingModule:", e);
      }
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    remoteUserRef.current = null;
    pendingOfferRef.current = null;
    pendingCandidatesRef.current = [];

    const activeCallId = callIdRef.current;
    callIdRef.current = null;

    if (Notifications) {
      if (activeCallId && Notifications.dismissNotificationAsync) {
        Notifications.dismissNotificationAsync(`call_${activeCallId}`).catch(() => {});
      }
      Notifications.dismissNotificationAsync?.("777").catch(() => {});
      if (Notifications.dismissAllNotificationsAsync) {
        Notifications.dismissAllNotificationsAsync().catch(() => {});
      }
    }

    setLocalStream(null);
    setRemoteStream(null);
    setRemoteUser(null);
    setIsMuted(false);
    setIsSpeakerOn(true);
    setIsFrontCamera(true);
    callStatusRef.current = "idle";
    setCallStatus("idle");
  }, []);

  const createPeerConnection = useCallback((toUserId: string, iceServers: any = DEFAULT_ICE_SERVERS) => {
    const pc = new RTCPeerConnection({ iceServers });

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

  const handleIncomingCall = useCallback(
    ({
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

      // Duplicate guard: ignore if already ringing or connected to this same call
      if (
        callId &&
        callIdRef.current === callId &&
        (callStatusRef.current === "incoming-ringing" || callStatusRef.current === "connected")
      ) {
        return;
      }

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
      callStatusRef.current = "incoming-ringing";
      setCallStatus("incoming-ringing");
      // Ringtone audio: CallRingingService is the single source of truth on Android; InCallManager on iOS
      if (Platform.OS === "android" && CallRingingModule?.startRinging) {
        try {
          CallRingingModule.startRinging(
            fromName || "Someone",
            incomingType || "audio",
            callId || "",
            fromUserId || "",
            fromAvatar || "",
            chatId || ""
          );
        } catch (e) {
          console.warn("[CallContext] Failed to start CallRingingService:", e);
        }
      } else {
        InCallManager.startRingtone("_DEFAULT_", [1000, 1500], "playback", 45);
      }
      try {
        InCallManager.pokeScreen(45000);
      } catch (e) {
        console.warn("[CallContext] InCallManager.pokeScreen error:", e);
      }

      // Clear any dismissable Expo push notification so only the ongoing un-dismissable notification stays
      const dismissPushNotifications = () => {
        if (Notifications?.dismissAllNotificationsAsync) {
          Notifications.dismissAllNotificationsAsync().catch(() => {});
        }
      };
      dismissPushNotifications();
      setTimeout(dismissPushNotifications, 600);
      setTimeout(dismissPushNotifications, 1500);

      console.log(
        "[CallContext] Incoming call received! AppState:",
        AppState.currentState,
        "caller:",
        fromName,
        "callId:",
        callId
      );
    },
    []
  );

  useEffect(() => {
    connectSocket();
    // Warm ICE/TURN servers cache in background for quick call negotiation
    getIceServers().catch(() => {});

    const processNotification = (response: any) => {
      const data = response?.notification?.request?.content?.data;
      if (data?.type !== "incoming_call") return;

      const actionId = response?.actionIdentifier;
      if (actionId === "decline") {
        const toUserId = data.fromUserId || "";
        const callId = data.callId;
        console.log("[CallContext] Notification decline pressed:", { toUserId, callId });
        socket.emit("rejectCall", { toUserId, callId });
        if (callId) {
          rejectCallApi(callId, toUserId).catch(() => {});
        }
        cleanup();
        return;
      }

      handleIncomingCall({
        fromUserId: data.fromUserId,
        fromName: data.fromName,
        fromAvatar: data.fromAvatar,
        chatId: data.chatId,
        callType: data.callType,
        offer: data.offer,
        callId: data.callId,
      });

      // Verify if the call is still active on the server
      socket.emit("checkCallStatus", { callId: data.callId }, (res: any) => {
        if (res && res.active === false) {
          Toast.show({ type: "info", text1: "Call ended", text2: "The caller hung up." });
          cleanup();
        } else if (res?.call?.offer && !pendingOfferRef.current) {
          pendingOfferRef.current = res.call.offer;
        }
      });

      if (actionId === "accept") {
        setTimeout(() => {
          acceptCallRef.current?.();
        }, 400);
      }
    };

    // Cold-start launch: check if app was opened by tapping an incoming call notification
    if (Notifications?.getLastNotificationResponseAsync) {
      Notifications.getLastNotificationResponseAsync().then((response: any) => {
        if (response) {
          processNotification(response);
        }
      }).catch((err: any) => console.warn("Failed checking last notification:", err));
    }

    // Native notification Decline listener
    let declineSub: any = null;
    if (Platform.OS === "android" && CallRingingModule) {
      try {
        const eventEmitter = new NativeEventEmitter(CallRingingModule);
        declineSub = eventEmitter.addListener("onCallDeclinedFromNotification", () => {
          console.log("[CallContext] Decline clicked from ongoing notification");
          const toUserId = remoteUserRef.current?.userId || "";
          const activeCallId = callIdRef.current;
          if (toUserId || activeCallId) {
            socket.emit("rejectCall", { toUserId, callId: activeCallId });
            if (activeCallId) {
              rejectCallApi(activeCallId, toUserId).catch(() => {});
            }
          }
          cleanup();
        });
      } catch (err) {
        console.warn("[CallContext] Failed to bind notification decline listener:", err);
      }
    }

    // App in background/foreground: incoming push notification received
    let notificationReceivedSub: any = null;
    if (Notifications?.addNotificationReceivedListener) {
      notificationReceivedSub = Notifications.addNotificationReceivedListener((notification: any) => {
        const data = notification?.request?.content?.data;
        if (data?.type === "incoming_call") {
          console.log("[CallContext] Incoming call push notification received:", data);
          const notifId = notification?.request?.identifier;
          if (notifId && Notifications?.dismissNotificationAsync) {
            Notifications.dismissNotificationAsync(notifId).catch(() => {});
          }
          if (Notifications?.dismissAllNotificationsAsync) {
            Notifications.dismissAllNotificationsAsync().catch(() => {});
          }
          handleIncomingCall({
            fromUserId: data.fromUserId,
            fromName: data.fromName,
            fromAvatar: data.fromAvatar,
            chatId: data.chatId,
            callType: data.callType,
            offer: data.offer,
            callId: data.callId,
          });
        }
      });
    }

    // App in background: user tapped notification or action button
    let notificationSub: any = null;
    if (Notifications?.addNotificationResponseReceivedListener) {
      notificationSub = Notifications.addNotificationResponseReceivedListener(processNotification);
    }

    // Handle deep link when app is launched over lockscreen via fullScreenIntent (datingapp://call?...)
    const handleCallUrl = (url: string | null) => {
      if (!url || !url.includes("datingapp://call")) return;
      try {
        const queryIndex = url.indexOf("?");
        if (queryIndex === -1) return;
        const search = url.slice(queryIndex + 1);
        const params = new URLSearchParams(search);
        if (params.get("type") === "call_rejected" || params.get("type") === "call_ended") {
          const rejectedCallId = params.get("callId") || callIdRef.current || "";
          const toUserId = params.get("fromUserId") || remoteUserRef.current?.userId || "";
          console.log("[CallContext] Deep link received call rejection:", { rejectedCallId, toUserId });
          if (toUserId || rejectedCallId) {
            socket.emit("rejectCall", { toUserId, callId: rejectedCallId });
            rejectCallApi(rejectedCallId, toUserId).catch(() => {});
          }
          cleanup();
          return;
        }

        if (params.get("type") === "incoming_call") {
          const incomingCallId = params.get("callId") || "";
          const fromUserId = params.get("fromUserId") || "";
          const fromName = params.get("fromName") || "Someone";
          const fromAvatar = params.get("fromAvatar") || "";
          const callType = (params.get("callType") as CallType) || "audio";
          const chatId = params.get("chatId") || "";
          const callAction = params.get("callAction");

          if (!incomingCallId) {
            console.warn("[CallContext] Deep link incoming_call missing callId, ignoring");
            return;
          }

          if (callStatusRef.current === "incoming-ringing" && callIdRef.current === incomingCallId) {
            if (callAction === "accept") {
              setTimeout(() => {
                acceptCallRef.current?.();
              }, 300);
            }
            return;
          }

          handleIncomingCall({
            fromUserId,
            fromName,
            fromAvatar,
            chatId,
            callType,
            offer: null,
            callId: incomingCallId,
          });

          // Ensure socket is connected and sync call status / offer from server
          connectSocket().then((sock: any) => {
            if (sock) {
              sock.emit("checkCallStatus", { callId: incomingCallId }, (res: any) => {
                if (res && res.active === false) {
                  Toast.show({ type: "info", text1: "Call ended", text2: "The caller hung up." });
                  cleanup();
                } else if (res?.call?.offer && !pendingOfferRef.current) {
                  pendingOfferRef.current = res.call.offer;
                }
              });
            }
          });

          if (callAction === "accept") {
            setTimeout(() => {
              acceptCallRef.current?.();
            }, 350);
          }
        }
      } catch (err) {
        console.warn("[CallContext] Error parsing call deep link:", err);
      }
    };

    Linking.getInitialURL().then(handleCallUrl).catch(() => {});
    const linkingSub = Linking.addEventListener("url", (event) => handleCallUrl(event.url));

    const handleCallAnswered = async ({ answer }: any) => {
      const pc = peerConnectionRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
        await flushPendingCandidates(pc);
        InCallManager.setSpeakerphoneOn(true);
        callStatusRef.current = "connected";
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
      declineSub?.remove?.();
      notificationReceivedSub?.remove?.();
      notificationSub?.remove?.();
      linkingSub.remove();
      socket.off("incomingCall", handleIncomingCall);
      socket.off("callAnswered", handleCallAnswered);
      socket.off("iceCandidate", handleIceCandidate);
      socket.off("callRejected", handleCallRejected);
      socket.off("callEnded", handleCallEnded);
    };
  }, [cleanup, flushPendingCandidates, handleIncomingCall]);

  const startCall = useCallback(
    async (
      toUserId: string,
      chatId: string,
      type: CallType,
      name: string,
      avatar: string
    ) => {
      if (!toUserId) {
        Toast.show({
          type: "error",
          text1: "Cannot start call",
          text2: "Recipient could not be identified. Please reopen the chat.",
        });
        return;
      }

      if (callStatus !== "idle") {
        cleanup();
      }

      await connectSocket();

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

        const iceServers = await getIceServers();
        const pc = createPeerConnection(toUserId, iceServers);
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
        callStatusRef.current = "outgoing-ringing";
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
    if (!remoteUserRef.current || !pendingOfferRef.current) return;

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

      const iceServers = await getIceServers();
      const pc = createPeerConnection(remoteUserRef.current.userId, iceServers);
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
      if (Platform.OS === "android" && CallRingingModule?.stopRinging) {
        try {
          CallRingingModule.stopRinging();
        } catch (e) {
          console.warn("[CallContext] Error stopping CallRingingModule on accept:", e);
        }
      }
      InCallManager.start({ media: callTypeRef.current });
      InCallManager.setSpeakerphoneOn(true);
      callStatusRef.current = "connected";
      setCallStatus("connected");

      // Dismiss incoming call notification once call is picked
      if (Notifications) {
        if (Notifications.dismissNotificationAsync) {
          Notifications.dismissNotificationAsync("777").catch(() => {});
          if (callIdRef.current) {
            Notifications.dismissNotificationAsync(`call_${callIdRef.current}`).catch(() => {});
          }
        }
        if (Notifications.dismissAllNotificationsAsync) {
          Notifications.dismissAllNotificationsAsync().catch(() => {});
        }
      }
    } catch (err) {
      console.error("Failed to accept call:", err);
      Toast.show({
        type: "error",
        text1: "Call failed",
        text2: "Could not answer the call.",
      });
      cleanup();
    }
  }, [createPeerConnection, flushPendingCandidates, cleanup]);

  acceptCallRef.current = acceptCall;

  const rejectCall = useCallback(() => {
    const toUserId = remoteUserRef.current?.userId || "";
    const callId = callIdRef.current;
    console.log("[CallContext] rejectCall triggered:", { toUserId, callId });
    cleanup();
    if (callId || toUserId) {
      socket.emit("rejectCall", { toUserId, callId });
      if (callId) {
        rejectCallApi(callId, toUserId).catch(() => {});
      }
    }
  }, [cleanup]);

  const endCall = useCallback(() => {
    const toUserId = remoteUserRef.current?.userId || "";
    const callId = callIdRef.current;
    console.log("[CallContext] endCall triggered:", { toUserId, callId });
    cleanup();
    if (toUserId || callId) {
      socket.emit("endCall", { toUserId, callId });
      if (callId) {
        endCallApi(callId, toUserId).catch(() => {});
      }
    }
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
