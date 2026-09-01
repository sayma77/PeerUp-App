import { Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { AuthProvider, useAuth } from "../context/AuthContext";
import { ToastProvider } from "../context/ToastContext";
import "../global.css";

function RootLayoutNav() {
  const { initializing } = useAuth();

  if (initializing) {
    return (
      <View className="flex-1 items-center justify-center bg-bg-light">
        <ActivityIndicator color="#FFB300" />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#0A0E17" },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="(auth)/login" options={{ presentation: "card" }} />
      <Stack.Screen name="(auth)/register" options={{ presentation: "card" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ToastProvider>
  );
}