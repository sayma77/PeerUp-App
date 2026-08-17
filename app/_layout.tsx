// app/_layout.tsx
import { Stack } from "expo-router";
import { ToastProvider } from "../context/ToastContext";
import "../global.css";

export default function RootLayout() {
  // TEMPORARY: hardcode this for now — we'll wire up real auth state later
  const isLoggedIn = false;

  return (
    <ToastProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: "#0A0E17"},
        }}>
        <Stack.Screen name="index" />
        {isLoggedIn ? (
          <Stack.Screen name="(tabs)" />
        ) : (
          <Stack.Screen name="(auth)" />
        )}
        <Stack.Screen
          name="chat/[conversationId]"
          options={{
            presentation: "card",
            contentStyle: {backgroundColor: "#0A0E17"},
            animation: "none",
          }}
        />
      </Stack>
    </ToastProvider>
  );
}
