import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList } from "react-native";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import Screen from "../../../components/Screen";
import { Conversation } from "../../../types/chat";

// TODO: replace with a real Firestore query — conversations where participants array-contains currentUserId,
// ordered by lastMessageAt. Use onSnapshot for live updates instead of a one-time fetch.
const CURRENT_USER_ID = "me";
const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: "c1",
    partnerId: "m1",
    partnerName: "Arif Khan",
    messages: [
      { id: "m1", senderId: "m1", text: "Hey! Are you free for a session this weekend?", createdAt: new Date(Date.now() - 3600_000).toISOString(), read: false },
    ],
  },
  {
    id: "c2",
    partnerId: "m2",
    partnerName: "Priya Das",
    messages: [
      { id: "m2", senderId: "me", text: "Thanks for the guitar lesson today!", createdAt: new Date(Date.now() - 86400_000).toISOString(), read: true },
    ],
  },
  {
    id: "c3",
    partnerId: "m3",
    partnerName: "Nadia Islam",
    messages: [],
  },
];

export default function ChatList() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return MOCK_CONVERSATIONS;
    return MOCK_CONVERSATIONS.filter((c) => c.partnerName.toLowerCase().includes(term));
  }, [search]);

  return (
    <Screen scroll={false} hideFooter>
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
          const lastMsg = item.messages[item.messages.length - 1] ?? null;
          const unreadCount = item.messages.filter((m) => m.senderId !== CURRENT_USER_ID && !m.read).length;
          const hasUnread = unreadCount > 0;

          return (
            <Pressable
              onPress={() =>
                router.push({ pathname: "/chat/[conversationId]", params: { conversationId: item.id } })
              }
              className="flex-row items-center gap-3 p-3 rounded-2xl mb-1"
            >
              <View className="w-11 h-11 rounded-xl bg-bg-dark border border-border items-center justify-center">
                <Text className="text-sm font-light text-primary">
                  {item.partnerName.substring(0, 1).toUpperCase()}
                </Text>
              </View>

              <View className="flex-1 min-w-0">
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`text-sm ${hasUnread ? "font-extrabold" : "font-bold"} text-text-primary`}
                    numberOfLines={1}
                  >
                    {item.partnerName}
                  </Text>
                  <View className="flex-row items-center gap-1.5">
                    {lastMsg && (
                      <Text className="text-[9px] font-light text-text-muted">
                        {new Date(lastMsg.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    )}
                    {hasUnread && (
                      <View className="bg-primary rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
                        <Text className="text-[9px] font-bold text-bg-light">{unreadCount}</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text
                  className={`text-xs mt-0.5 ${hasUnread ? "font-semibold text-text-primary" : "font-light text-text-muted"}`}
                  numberOfLines={1}
                >
                  {lastMsg ? lastMsg.text : "Start a conversation..."}
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
    </Screen>
  );
}