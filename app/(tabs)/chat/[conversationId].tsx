import { Feather } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Message } from "../../../types/chat";

const CURRENT_USER_ID = "me";

// TODO: replace with a real Firestore fetch for this conversation's partner + initial messages
const MOCK_PARTNER_NAME: Record<string, string> = {
  c1: "Arif Khan",
  c2: "Priya Das",
  c3: "Nadia Islam",
};

const MOCK_MESSAGES: Record<string, Message[]> = {
  c1: [
    {
      id: "m1",
      senderId: "m1",
      text: "Hey! Are you free for a session this weekend?",
      createdAt: new Date(Date.now() - 3600_000).toISOString(),
      read: false,
    },
  ],
  c2: [
    {
      id: "m2",
      senderId: "me",
      text: "Thanks for the guitar lesson today!",
      createdAt: new Date(Date.now() - 86400_000).toISOString(),
      read: true,
    },
    {
      id: "m3",
      senderId: "m2",
      text: "Anytime! You're picking it up fast.",
      createdAt: new Date(Date.now() - 82800_000).toISOString(),
      read: true,
    },
  ],
  c3: [],
};

export default function ChatThread() {
  const {conversationId} = useLocalSearchParams<{conversationId: string}>();
  const router = useRouter();
  const listRef = useRef<FlatList>(null);

  const partnerName = MOCK_PARTNER_NAME[conversationId] ?? "Peer";
  const partnerInitial = partnerName.charAt(0).toUpperCase();

  const [messages, setMessages] = useState<Message[]>(
    MOCK_MESSAGES[conversationId] ?? [],
  );
  const [input, setInput] = useState("");
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  // TODO: replace this whole effect with a Firestore onSnapshot listener on
  // conversations/{conversationId}/messages ordered by createdAt, calling setMessages
  // with the live snapshot data instead of managing local state manually.
  useEffect(() => {
    setMessages(MOCK_MESSAGES[conversationId] ?? []);
  }, [conversationId]);

  // Manual keyboard tracking — needed because edge-to-edge mode on Android
  // blocks both windowSoftInputMode:resize and KeyboardAvoidingView from working.
  useEffect(() => {
    const showEvt =
      Platform.OS === "android" ? "keyboardDidShow" : "keyboardWillShow";
    const hideEvt =
      Platform.OS === "android" ? "keyboardDidHide" : "keyboardWillHide";

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

  function handleSend() {
    const text = input.trim();
    if (!text) return;

    // TODO: addDoc to conversations/{conversationId}/messages in Firestore instead of local state
    const newMessage: Message = {
      id: `local-${Date.now()}`,
      senderId: CURRENT_USER_ID,
      text,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setTimeout(() => listRef.current?.scrollToEnd({animated: true}), 50);
  }

  return (
    <SafeAreaView
      className="flex-1 bg-bg-light"
      edges={["top"]}
      style={{backgroundColor: "#000000"}}>
      <Stack.Screen options={{headerShown: false}} />

      {/* Thread header */}
      <View className="px-4 py-3 border-b border-border bg-bg-medium flex-row items-center gap-3">
        <Pressable
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/chat");
            }
          }}
          className="p-1">
          <Feather name="arrow-left" size={20} color="#64748B" />
        </Pressable>
        <View className="w-8 h-8 rounded-lg bg-bg-dark border border-border items-center justify-center">
          <Text className="text-xs font-bold text-primary">
            {partnerInitial}
          </Text>
        </View>
        <Text className="text-sm font-bold text-text-primary">
          {partnerName}
        </Text>
      </View>

      <View className="flex-1" style={{marginBottom: keyboardHeight}}>
        {messages.length === 0 ? (
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
            contentContainerStyle={{padding: 16, gap: 16}}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({animated: false})
            }
            renderItem={({item}) => {
              const isMe = item.senderId === CURRENT_USER_ID;
              return (
                <View
                  className={`flex-row items-end gap-2 max-w-[80%] ${isMe ? "self-end flex-row-reverse" : "self-start"}`}>
                  <View
                    className={`w-7 h-7 rounded-lg border border-border items-center justify-center ${
                      isMe ? "bg-bg-dark" : "bg-primary-dark"
                    }`}>
                    <Text className="text-[9px] font-bold text-primary">
                      {isMe ? "ME" : partnerInitial}
                    </Text>
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
                      <Text
                        className="text-sm leading-5"
                        style={{color: isMe ? "#000" : "#FFB300"}}>
                        {item.text}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1.5 px-1 mt-1">
                      <Text className="text-[10px] uppercase text-text-muted">
                        {new Date(item.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {isMe && (
                        <Feather name="check" size={11} color="#FFB300" />
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
            <Pressable
              onPress={handleSend}
              className="p-3 rounded-xl bg-primary/10">
              <Feather name="send" size={18} color="#FFB300" />
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
