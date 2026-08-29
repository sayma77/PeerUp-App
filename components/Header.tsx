import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { auth } from "../firebaseConfig";

type HeaderProps = {
  user?: {name: string} | null;
  unreadMessageCount?: number;
  notificationCount?: number;
};

export default function Header({
  user = null,
  unreadMessageCount = 0,
  notificationCount = 0,
}: HeaderProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const router = useRouter();

  return (
    <View className="w-full h-20 flex-row items-center justify-between px-4 border-b border-border bg-bg-light">
      <Pressable onPress={() => router.push("/")}>
        <Text className="text-2xl font-light text-text-primary">
          Peer<Text className="font-semibold text-primary">Up</Text>
        </Text>
      </Pressable>

      <View className="flex-row items-center gap-3">
        {user && (
          <Link href="/(tabs)/chat" asChild>
            <Pressable className="p-2 rounded-lg border border-border relative">
              <Feather name="message-circle" size={18} color="#64748B" />
              {unreadMessageCount > 0 && (
                <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
                  <Text className="text-white text-[9px] font-bold">
                    {unreadMessageCount}
                  </Text>
                </View>
              )}
            </Pressable>
          </Link>
        )}

        {user && (
          <Pressable
            onPress={() => setNotifOpen(true)}
            className="p-2 rounded-lg border border-border relative">
            <Feather name="bell" size={18} color="#64748B" />
            {notificationCount > 0 && (
              <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
                <Text className="text-white text-[9px] font-bold">
                  {notificationCount}
                </Text>
              </View>
            )}
          </Pressable>
        )}

        {user ? (
          <Pressable
            onPress={() => setProfileMenuOpen(true)}
            className="flex-row items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-bg-medium">
            <View className="h-5 w-5 rounded bg-primary/10 items-center justify-center">
              <Text className="text-[10px] font-bold text-primary">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <Text className="text-xs font-medium text-text-primary">
              Profile
            </Text>
          </Pressable>
        ) : (
          <Link href="/(auth)/login" asChild>
            <Pressable className="px-4 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
              <Text className="text-xs font-medium text-primary">Login</Text>
            </Pressable>
          </Link>
        )}
      </View>

      {/* Profile menu */}
      <Modal
        visible={profileMenuOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setProfileMenuOpen(false)}>
        <Pressable
          className="flex-1 bg-black/40 items-end pt-20 pr-4"
          onPress={() => setProfileMenuOpen(false)}>
          <Pressable
            className="w-48 bg-bg-medium border border-border rounded-2xl overflow-hidden"
            onPress={(e) => e.stopPropagation()}>
            <Link href="/(tabs)/profile" asChild>
              <Pressable
                onPress={() => setProfileMenuOpen(false)}
                className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                <Feather name="user" size={16} color="#64748B" />
                <Text className="text-xs font-medium text-text-primary">
                  Profile
                </Text>
              </Pressable>
            </Link>

            <Link href="/(tabs)/dashboard" asChild>
              <Pressable
                onPress={() => setProfileMenuOpen(false)}
                className="flex-row items-center gap-3 px-4 py-3 border-b border-border">
                <Feather name="grid" size={16} color="#64748B" />
                <Text className="text-xs font-medium text-text-primary">
                  Dashboard
                </Text>
              </Pressable>
            </Link>

            <Pressable
              onPress={async () => {
                setProfileMenuOpen(false);
                await signOut(auth);
                router.replace("/");
              }}
              className="flex-row items-center gap-3 px-4 py-3">
              <Feather name="log-out" size={16} color="#f43f5e" />
              <Text className="text-xs font-medium text-rose-500">Log Out</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Notifications */}
      <Modal
        visible={notifOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setNotifOpen(false)}>
        <Pressable
          className="flex-1 bg-black/40 items-end pt-20 pr-4"
          onPress={() => setNotifOpen(false)}>
          <Pressable
            className="w-80 max-h-96 bg-bg-medium border border-border rounded-2xl overflow-hidden"
            onPress={(e) => e.stopPropagation()}>
            <View className="px-5 py-4 border-b border-border flex-row items-center justify-between">
              <Text className="text-[10px] font-black uppercase tracking-widest text-primary">
                Notifications
              </Text>
              <Pressable onPress={() => setNotifOpen(false)}>
                <Feather name="x" size={16} color="#64748B" />
              </Pressable>
            </View>
            <View className="items-center justify-center py-10">
              <Text className="text-xs text-text-muted">All caught up!</Text>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
