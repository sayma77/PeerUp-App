import { Feather } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const router = useRouter();

  return (
    <View className="w-full h-20 flex-row items-center justify-between px-4 border-b border-border bg-bg-light">
      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={() => setSidebarOpen(true)}
          className="p-2 rounded-lg border border-border">
          <Feather name="menu" size={20} color="#64748B" />
        </Pressable>
        <Pressable onPress={() => router.push("/")}>
          <Text className="text-2xl font-light text-text-primary">
            Peer<Text className="font-semibold text-primary">Up</Text>
          </Text>
        </Pressable>
      </View>

      <View className="flex-row items-center gap-3">
        <Link href="/chat" asChild>
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

        {user ? (
          <Link href="/profile" asChild>
            <Pressable className="flex-row items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-bg-medium">
              <View className="h-5 w-5 rounded bg-primary/10 items-center justify-center">
                <Text className="text-[10px] font-bold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <Text className="text-xs font-medium text-text-primary">
                Profile
              </Text>
            </Pressable>
          </Link>
        ) : (
          <Link href="/login" asChild>
            <Pressable className="px-4 py-1.5 rounded-lg border border-primary/20 bg-primary/5">
              <Text className="text-xs font-medium text-primary">Login</Text>
            </Pressable>
          </Link>
        )}
      </View>

      {/* Sidebar */}
      <Modal
        visible={sidebarOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setSidebarOpen(false)}>
        <Pressable
          className="flex-1 bg-black/40"
          onPress={() => setSidebarOpen(false)}>
          <Pressable
            className="w-[260px] h-full bg-bg-medium border-r border-border"
            onPress={(e) => e.stopPropagation()}>
            <View className="flex-row items-center justify-between px-5 py-5 border-b border-border">
              <Text className="text-xl font-light text-text-primary">
                Peer<Text className="font-semibold text-primary">Up</Text>
              </Text>
              <Pressable
                onPress={() => setSidebarOpen(false)}
                className="p-1.5">
                <Feather name="x" size={18} color="#64748B" />
              </Pressable>
            </View>

            <View className="py-4">
              <Text className="px-6 pb-2 text-[9px] font-black uppercase tracking-widest text-text-muted opacity-50">
                Navigation
              </Text>

              <SidebarLink
                href="/skills"
                icon="compass"
                label="Explore Skills"
                onPress={() => setSidebarOpen(false)}
              />
              <SidebarLink
                href="/resources"
                icon="book-open"
                label="Resources"
                onPress={() => setSidebarOpen(false)}
              />
              <SidebarLink
                href="/dashboard"
                icon="grid"
                label="Dashboard"
                onPress={() => setSidebarOpen(false)}
              />
              <SidebarLink
                href="/projects"
                icon="briefcase"
                label="Projects"
                onPress={() => setSidebarOpen(false)}
              />
            </View>

            {user && (
              <View className="px-4 py-6 border-t border-border mt-auto">
                <Pressable
                  onPress={() => {
                    setSidebarOpen(false);
                    // TODO: replace with real Firebase signOut() once auth is wired up
                    router.replace("/login");
                  }}
                  className="flex-row items-center gap-3 px-4 py-3 rounded-xl border border-rose-500/10 bg-rose-500/5">
                  <View className="h-8 w-8 rounded-lg bg-rose-500/10 items-center justify-center">
                    <Feather name="log-out" size={16} color="#f43f5e" />
                  </View>
                  <Text className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
                    Log Out
                  </Text>
                </Pressable>
              </View>
            )}
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

function SidebarLink({
  href,
  icon,
  label,
  onPress,
}: {
  href: any;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Link href={href} asChild>
      <Pressable
        onPress={onPress}
        className="flex-row items-center gap-3 px-5 py-3 mx-3 rounded-lg">
        <Feather name={icon} size={16} color="#64748B" />
        <Text className="text-[11px] font-bold uppercase tracking-widest text-text-muted">
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}
