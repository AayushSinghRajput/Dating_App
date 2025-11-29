import React from "react";
import { View, Text, Pressable, StyleSheet, ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Define props interface with more flexible icon typing
interface SettingsCardProps {
  item: {
    id: string;
    title: string;
    icon: string; // Allow any string, but we'll handle invalid icons gracefully
    description?: string;
  };
  onPress: () => void;
  style?: ViewStyle | ViewStyle[];
  isLogout?: boolean;
}

const SettingsCard: React.FC<SettingsCardProps> = ({ 
  item, 
  onPress, 
  style,
  isLogout = false 
}) => {
  // Safe icon rendering - fallback to a default icon if the provided one is invalid
  const renderIcon = () => {
    try {
      // Check if the icon name exists in Ionicons
      if (item.icon in Ionicons.glyphMap) {
        return (
          <Ionicons 
            name={item.icon as keyof typeof Ionicons.glyphMap} 
            size={22} 
            color={isLogout ? "#FF6B6B" : "#FF6B6B"} 
          />
        );
      }
    } catch (error) {
      console.warn(`Invalid icon name: ${item.icon}`);
    }
    
    // Fallback icon
    return (
      <Ionicons 
        name="settings" 
        size={22} 
        color={isLogout ? "#FF6B6B" : "#FF6B6B"} 
      />
    );
  };

  return (
    <Pressable 
      style={({ pressed }) => [
        styles.card,
        isLogout && styles.logoutCard,
        pressed && styles.pressedCard,
        style
      ]} 
      onPress={onPress}
      android_ripple={{ color: isLogout ? 'rgba(255,107,107,0.1)' : 'rgba(0,0,0,0.05)' }}
    >
      <View style={styles.content}>
        <View style={[
          styles.iconContainer,
          isLogout && styles.logoutIconContainer
        ]}>
          {renderIcon()}
        </View>
        
        <View style={styles.textContainer}>
          <Text style={[
            styles.title,
            isLogout && styles.logoutTitle
          ]}>
            {item.title}
          </Text>
          {item.description && (
            <Text style={styles.description}>{item.description}</Text>
          )}
        </View>
        
        {!isLogout && (
          <View style={styles.chevronContainer}>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color="#ccc" 
            />
          </View>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 0,
    marginVertical: 0,
    overflow: "hidden",
  },
  logoutCard: {
    borderColor: "#FFE5E5",
    borderWidth: 1,
  },
  pressedCard: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFF5F5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  logoutIconContainer: {
    backgroundColor: "#FFF5F5",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 2,
  },
  logoutTitle: {
    color: "#FF6B6B",
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    color: "#666",
    fontWeight: "400",
    marginTop: 2,
  },
  chevronContainer: {
    marginLeft: 8,
  },
});

export default SettingsCard;