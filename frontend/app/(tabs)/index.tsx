import React, { useEffect, useState } from "react";
import { View, FlatList, StyleSheet, RefreshControl, Dimensions } from "react-native";
import HomeHeader from "../../src/components/HomeHeader";
import UserCard from "../../src/components/UserCard";
import { getAllProfiles, DiscoveryProfile } from "../../services/profileService";
import { useTheme } from "@/contexts/ThemeContext";
import { spacing } from "@/src/theme/spacing";
import { radius } from "@/src/theme/radius";
import Skeleton from "@/src/components/ui/Skeleton";
import EmptyState from "@/src/components/ui/EmptyState";

const { width } = Dimensions.get("window");

function ProfileCardSkeleton() {
  return (
    <View style={styles.skeletonWrapper}>
      <View style={styles.skeletonCard}>
        <Skeleton borderRadius={0} style={styles.skeletonImage} />
        <View style={styles.skeletonInfo}>
          <Skeleton width="55%" height={22} />
          <Skeleton width="35%" height={14} style={{ marginTop: spacing.sm }} />
        </View>
      </View>
    </View>
  );
}

export default function Home() {
  const { colors } = useTheme();
  const [users, setUsers] = useState<DiscoveryProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await getAllProfiles();
      setUsers(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadProfiles();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader />
        <View style={styles.skeletonList}>
          <ProfileCardSkeleton />
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <HomeHeader />
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load profiles"
          description={error}
          actionLabel="Try Again"
          onAction={loadProfiles}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <HomeHeader />
      <FlatList
        style={styles.list}
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <UserCard user={item} index={index} />}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No one new nearby"
            description="Check back soon, or widen your preferences to see more people."
            actionLabel="Refresh"
            onAction={loadProfiles}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  skeletonList: {
    flex: 1,
    alignItems: "center",
    paddingTop: spacing.sm,
  },
  skeletonWrapper: { alignItems: "center", marginVertical: spacing.sm },
  skeletonCard: {
    width: width * 0.88,
    height: 480,
    borderRadius: radius.xl,
    overflow: "hidden",
  },
  skeletonImage: { flex: 1 },
  skeletonInfo: { padding: spacing.lg },
});
