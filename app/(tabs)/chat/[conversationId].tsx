import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebaseConfig";
import { useAuth } from "../../../context/AuthContext";
import { Message } from "../../../types/chat";
import {
  subscribeToMessages,
  sendMessage,
  markConversationRead,
} from "../../../services/chatService";

export default function ChatThread() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const listRef = useRef<FlatList>(null);

  const [participantNames, setParticipantNames] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const partnerId = Object.keys(participantNames).find((id) => id !== user?.uid) ?? "";
  const partnerName = participantNames[partnerId] ?? "Peer";
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  // Live conversation doc — gives us participant names for the header.
  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = onSnapshot(doc(db, "conversations", conversationId), (snap) => {
      const data = snap.data();
      if (data?.participantNames) setParticipantNames(data.participantNames);
    });
    return unsubscribe;
  }, [conversationId]);

  // Live messages
  useEffect(() => {
    if (!conversationId) return;
    setLoading(true);
    const unsubscribe = subscribeToMessages(conversationId, (data) => {
      setMessages(data);
      setLoading(false);
    });
    return unsubscribe;
  }, [conversationId]);

  // Mark as read once we know the partner's id and messages have loaded
  useEffect(() => {
    if (!user || !conversationId || !partnerId) return;
    markConversationRead(conversationId, user.uid, partnerId).catch((err) =>
      console.error("Failed to mark conversation read:", err)
    );
  }, [user, conversationId, partnerId, messages.length]);

  // Manual keyboard tracking — needed because edge-to-edge mode on Android
  // blocks both windowSoftInputMode:resize and KeyboardAvoidingView from working.
  useEffect(() => {
    const showEvt = Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const hideEvt = Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";

    const showSub = Keyboard.addListener(showEvt, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener(hideEvt, () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || !user || !conversationId || !partnerId) return;

    setInput("");
    try {
      await sendMessage({ conversationId, senderId: user.uid, partnerId, text });
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (err) {
      console.error("Failed to send message:", err);
      setInput(text); // restore so the draft isn't lost
    }
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-bg-light">
        <Text className="text-sm text-text-muted">Log in to view this conversation.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-bg-light" edges={["top"]} style={{ backgroundColor: "#000000" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-4 py-3 border-b border-border bg-bg-medium flex-row items-center gap-3">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) router.back();
            else router.replace("/chat");
          }}
          className="p-1">
          <Feather name="arrow-left" size={20} color="#64748B" />
        </Pressable>
        <View className="w-8 h-8 rounded-lg bg-bg-dark border border-border items-center justify-center">
          <Text className="text-xs font-bold text-primary">{partnerInitial}</Text>
        </View>
        <Text className="text-sm font-bold text-text-primary">{partnerName}</Text>
      </View>

      <View className="flex-1" style={{ marginBottom: keyboardHeight }}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#FFB300" />
          </View>
        ) : messages.length === 0 ? (
          <View className="flex-1 items-center justify-center opacity-30">
            <Feather name="message-circle" size={44} color="#64748B" />
            <Text className="text-sm font-light tracking-widest uppercase text-text-primary mt-4">
              No messages yet
            </Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16, gap: 16 }}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              const isMe = item.senderId === user.uid;
              return (
                <View
                  className={`flex-row items-end gap-2 max-w-[80%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>
                  <View
                    className={`w-7 h-7 rounded-lg border border-border items-center justify-center ${
                      isMe ? "bg-bg-dark" : "bg-primary-dark"
                    }`}>
                    <Text className="text-[9px] font-bold text-primary">{isMe ? "ME" : partnerInitial}</Text>
                  </View>
                  <View className={isMe ? "items-end" : "items-start"}>
                    <View
                      className="px-3 py-2"
                      style={{
                        backgroundColor: isMe ? "#D97706" : "#070A10",
                        borderRadius: 16,
                        borderTopRightRadius: isMe ? 0 : 16,
                        borderTopLeftRadius: isMe ? 16 : 0,
                      }}>
                      <Text className="text-sm leading-5" style={{ color: isMe ? "#000" : "#FFB300" }}>
                        {item.text}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 px-1 mt-1">
                      <Text className="text-[10px] uppercase text-text-muted">
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>
                      {isMe && (
                        <Feather name={item.read ? "check-circle" : "check"} size={11} color="#FFB300" />
                      )}
                    </View>
                  </View>
                </View>
              );
            }}
          />
        )}

        <View className="p-2">
          <View className="flex-row items-center gap-2 p-2 pl-4 rounded-2xl bg-bg-medium border border-border">
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder={`Message ${partnerName}...`}
              placeholderTextColor="#64748B"
              className="flex-1 text-sm text-text-primary py-2"
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable onPress={handleSend} className="p-3 rounded-xl bg-primary/10">
              <Feather name="send" size={18} color="#FFB300" />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}