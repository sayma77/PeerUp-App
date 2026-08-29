import { Stack } from "expo-router";

export default function ClassroomsLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: "#0A0E17"},
      }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="[id]" options={{presentation: "card"}} />
    </Stack>
  );
}
