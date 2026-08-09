import { useState } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { useVideoPlayer, VideoView } from "expo-video";
import { Ionicons } from "@expo/vector-icons";

function VideoMessageBubble({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
  });

  return (
    <VideoView
      style={styles.thumbnail}
      player={player}
      nativeControls
      allowsFullscreen
      allowsPictureInPicture={false}
      contentFit="cover"
    />
  );
}

export default function MediaMessageBubble({
  url,
  type,
}: {
  url: string;
  type: "image" | "video";
}) {
  const [viewerOpen, setViewerOpen] = useState(false);

  if (type === "video") {
    return <VideoMessageBubble url={url} />;
  }

  return (
    <>
      <Pressable onPress={() => setViewerOpen(true)}>
        <Image source={{ uri: url }} style={styles.thumbnail} contentFit="cover" />
      </Pressable>
      <Modal
        visible={viewerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerOpen(false)}
      >
        <View style={styles.viewerBackdrop}>
          <Pressable
            style={styles.viewerClose}
            onPress={() => setViewerOpen(false)}
            hitSlop={12}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          <Image source={{ uri: url }} style={styles.viewerImage} contentFit="contain" />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  thumbnail: {
    width: 220,
    height: 260,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  viewerBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  viewerClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  viewerImage: {
    width: "100%",
    height: "80%",
  },
});
