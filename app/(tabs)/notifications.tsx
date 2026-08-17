import { useEffect, useState } from "react";
import { View, Text, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Screen from "../../components/Screen";
import { AppNotification } from "../../types/notifications";

// TODO: replace with a real Firestore query — notifications where userId == currentUserId,
// ordered by createdAt desc. Use onSnapshot for live updates.
const MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    message: "Arif Khan accepted your request to learn Guitar Basics",
    link: "/chat/c1",
    read: false,
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
  },
  {
    id: "n2",
    message: "Nadia Islam wants to join your project 'Campus Marketplace App'",
    link: "/(tabs)",
    read: false,
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
  },
  {
    id: "n3",
    message: "Priya Das left you a review",
    link: "/(tabs)/profile",
    read: true,
    createdAt: new Date(Date.now() - 86400_000).toISOString(),
  },
];

export default function Notifications() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<AppNotification[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    // TODO: replace with a Firestore batch update marking all of the current
    // user's notifications as read (mirrors the old POST /api/notifications/read call)
    markAllRead();
  }, []);

  async function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <Screen scroll={false} hideFooter>
      <View className="px-5 pt-6 pb-4">
        <Text className="text-3xl font-semibold text-text-primary">Notifications</Text>
      </View>

      {notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <Feather name="bell" size={48} color="#64748B" style={{ marginBottom: 16, opacity: 0.4 }} />
          <Text className="text-sm text-text-muted">No notifications yet</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 10 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => router.push(item.link as any)}
              className="relative p-4 rounded-xl border-l-4 bg-bg-medium border border-border"
              style={{ borderLeftColor: item.read ? "#334155" : "#FFB300" }}
            >
              {!item.read && (
                <View className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary" />
              )}
              <Text className={`text-sm font-medium pr-4 ${item.read ? "text-text-muted" : "text-text-primary"}`}>
                {item.message}
              </Text>
              <Text className="text-xs text-text-muted mt-1.5">
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </Pressable>
          )}
        />
      )}
    </Screen>
  );
}