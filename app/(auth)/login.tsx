import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/");
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!email || !password) {
      return setError("Please enter both email and password.");
    }

    setSubmitting(true);
    try {
      // TODO: call Firebase Auth signInWithEmailAndPassword(email, password)
      router.replace("/dashboard");
    } catch (err) {
      setError("Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{flex: 1, backgroundColor: "#070A10"}}
      behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={{flexGrow: 1}}
        keyboardShouldPersistTaps="handled">
        <View className="px-5 pt-10">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-xl border border-border items-center justify-center">
            <Feather name="arrow-left" size={18} color="#64748B" />
          </Pressable>
        </View>

        <View className="flex-1 justify-center px-6 py-10">
          <View className="bg-bg-medium border border-border rounded-2xl p-8">
            <View className="mb-10 items-center">
              <Text className="text-4xl font-extralight text-text-primary mb-3">
                Welcome Back
              </Text>
              <Text className="text-[11px] font-bold uppercase tracking-[0.2em] text-text-muted">
                Continue your journey with{" "}
                <Text className="text-primary">PeerUp</Text>
              </Text>
            </View>

            {error && (
              <View className="border border-red-500/30 bg-red-500/10 p-3 rounded-lg mb-6">
                <Text className="text-red-300 text-sm">{error}</Text>
              </View>
            )}

            <View className="mb-5">
              <Text className="text-xs font-semibold uppercase tracking-wider mb-2 ml-1 text-text-muted">
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-bg-light text-text-primary rounded-xl px-5 py-3.5 text-sm border border-border"
              />
            </View>

            <View className="mb-2">
              <Text className="text-xs font-semibold uppercase tracking-wider mb-2 ml-1 text-text-muted">
                Password
              </Text>
              <View className="relative flex-row items-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  className="flex-1 bg-bg-light text-text-primary rounded-xl px-5 py-3.5 pr-12 text-sm border border-border"
                />
                <Pressable
                  onPress={() => setShowPassword((v) => !v)}
                  className="absolute right-4">
                  <Feather
                    name={showPassword ? "eye-off" : "eye"}
                    size={18}
                    color="#64748B"
                  />
                </Pressable>
              </View>
            </View>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              className="mt-8">
              <LinearGradient
                colors={["#D97706", "#F59E0B"]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                className="py-4 rounded-xl items-center">
                <Text className="text-white text-sm font-bold uppercase tracking-widest">
                  {submitting ? "Signing In..." : "Sign In"}
                </Text>
              </LinearGradient>
            </Pressable>

            <View className="mt-10 pt-6 border-t border-border">
              <Text className="text-center text-sm text-text-muted">
                New to the platform?{" "}
                <Link href="/(auth)/register" asChild>
                  <Text className="font-semibold text-primary">
                    Create an account →
                  </Text>
                </Link>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
