import { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Screen from "../../../components/Screen";
import { Conversation } from "../../../types/chat";
import { useAuth } from "../../../context/AuthContext";
import { subscribeToConversations } from "../../../services/chatService";

export default function ChatList() {
  const router = useRouter();
  const { user } = useAuth();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) {
      setConversations([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToConversations(user.uid, (data) => {
      setConversations(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return conversations;
    return conversations.filter((c) => {
      const partnerId = c.participants.find((id) => id !== user?.uid);
      const partnerName = partnerId ? c.participantNames[partnerId] ?? "" : "";
      return partnerName.toLowerCase().includes(term);
    });
  }, [search, conversations, user]);

  return (
    <Screen scroll={false} hideFooter user={user ? { name: user.email ?? "You" } : null}>
      <View className="px-5 pt-6 pb-4">
        <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          Direct Messages
        </Text>
        <View className="relative">
          <Feather
            name="search"
            size={16}
            color="#64748B"
            style={{ position: "absolute", left: 14, top: 13, zIndex: 1 }}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Jump to..."
            placeholderTextColor="#64748B"
            className="bg-bg-medium border border-border rounded-xl pl-10 pr-4 py-3 text-text-primary text-sm"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#FFB300" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
          ListEmptyComponent={
            <Text className="text-center text-[10px] uppercase text-text-muted mt-10">
              No chats yet
            </Text>
          }
          renderItem={({ item }) => {
            const partnerId = item.participants.find((id) => id !== user?.uid) ?? "";
            const partnerName = item.participantNames[partnerId] ?? "Peer";
            const hasUnread = item.unreadCount > 0;

            return (
              <Pressable
                onPress={() => {
                  if (!user) {
                    router.push("/(auth)/login");
                  } else {
                    router.push({ pathname: "/chat/[conversationId]", params: { conversationId: item.id } });
                  }
                }}
                className="flex-row items-center gap-3 p-3 rounded-2xl mb-1"
              >
                <View className="w-11 h-11 rounded-xl bg-bg-dark border border-border items-center justify-center">
                  <Text className="text-sm font-light text-primary">
                    {partnerName.substring(0, 1).toUpperCase()}
                  </Text>
                </View>

                <View className="flex-1 min-w-0">
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-sm ${hasUnread ? "font-extrabold" : "font-bold"} text-text-primary`}
                      numberOfLines={1}
                    >
                      {partnerName}
                    </Text>
                    <View className="flex-row items-center gap-1.5">
                      {item.lastMessageAt && (
                        <Text className="text-[9px] font-light text-text-muted">
                          {new Date(item.lastMessageAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>
                      )}
                      {hasUnread && (
                        <View className="bg-primary rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
                          <Text className="text-[9px] font-bold text-bg-light">{item.unreadCount}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <Text
                    className={`text-xs mt-0.5 ${hasUnread ? "font-semibold text-text-primary" : "font-light text-text-muted"}`}
                    numberOfLines={1}
                  >
                    {item.lastMessage || "Start a conversation..."}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </Screen>
  );
}