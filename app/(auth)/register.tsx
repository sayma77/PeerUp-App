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

const EMAIL_REGEX = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

// TODO: replace with a real Firestore query once the users collection exists
async function checkUsernameAvailable(username: string): Promise<boolean> {
  return true;
}
// TODO: replace with a real Firestore query (or just let Firebase Auth handle duplicate emails)
async function checkEmailAvailable(email: string): Promise<boolean> {
  return true;
}

function validatePasswordValue(value: string): string | null {
  if (value.length < 8) return "At least 8 characters required.";
  if (!/[A-Z]/.test(value)) return "Must contain an uppercase letter.";
  if (!/[0-9]/.test(value)) return "Must contain a digit.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Must contain a special character.";
  return null;
}

export default function Register() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [usernameMsg, setUsernameMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [emailMsg, setEmailMsg] = useState<{text: string; ok: boolean} | null>(
    null,
  );
  const [passwordMsg, setPasswordMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push("/");
    }
  }

  async function handleUsernameChange(value: string) {
    setUsername(value);
    if (!value) return setUsernameMsg(null);
    if (/[A-Z\s]/.test(value)) {
      return setUsernameMsg({
        text: "Username must be lowercase with no spaces.",
        ok: false,
      });
    }
    const available = await checkUsernameAvailable(value);
    setUsernameMsg(
      available
        ? {text: "Username is available.", ok: true}
        : {text: "That username is already taken.", ok: false},
    );
  }

  async function handleEmailChange(value: string) {
    setEmail(value);
    if (!value) return setEmailMsg(null);
    if (!EMAIL_REGEX.test(value)) {
      return setEmailMsg({
        text: "Please enter a valid email address.",
        ok: false,
      });
    }
    const available = await checkEmailAvailable(value);
    setEmailMsg(
      available
        ? {text: "Email is available.", ok: true}
        : {text: "That email is already registered.", ok: false},
    );
  }

  function handlePasswordChange(value: string) {
    setPassword(value);
    if (!value) return setPasswordMsg(null);
    const error = validatePasswordValue(value);
    setPasswordMsg(
      error
        ? {text: error, ok: false}
        : {text: "Password looks good.", ok: true},
    );
  }

  async function handleSubmit() {
    setFormError(null);

    if (!name.trim()) return setFormError("Name is required.");
    if (!username || /[A-Z\s]/.test(username)) {
      return setFormError("Username must be lowercase with no spaces.");
    }
    if (!email || !EMAIL_REGEX.test(email)) {
      return setFormError("Please enter a valid email address.");
    }
    const passwordError = validatePasswordValue(password);
    if (passwordError) return setFormError(passwordError);
    if (password !== confirmPassword)
      return setFormError("Passwords do not match.");
    if (!agreeTerms)
      return setFormError("You must agree to the Terms of Service.");

    setSubmitting(true);
    try {
      // TODO: call Firebase Auth createUserWithEmailAndPassword(email, password),
      // then write { name, username, email } to the `users` collection in Firestore
      // using the returned uid as the document id.
      router.replace("/dashboard");
    } catch (err) {
      setFormError("Something went wrong creating your account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg-light"
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
            <View className="mb-8">
              <Text className="text-4xl font-extralight text-text-primary mb-2">
                Join Peer<Text className="font-medium text-primary">Up</Text>
              </Text>
              <Text className="text-sm font-medium uppercase tracking-wide text-text-muted">
                Start sharing your skills today
              </Text>
            </View>

            {formError && (
              <View className="border border-red-500/30 bg-red-500/10 p-3 rounded-lg mb-6">
                <Text className="text-red-300 text-sm">{formError}</Text>
              </View>
            )}

            <Field label="Name">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="John"
                placeholderTextColor="#64748B"
                className="bg-bg-light text-text-primary rounded-xl px-4 py-3 text-sm border border-border"
              />
            </Field>

            <Field label="Username">
              <View className="relative">
                <Text className="absolute left-4 top-3.5 text-sm text-text-muted z-10">
                  @
                </Text>
                <TextInput
                  value={username}
                  onChangeText={handleUsernameChange}
                  placeholder="johnsmith"
                  placeholderTextColor="#64748B"
                  autoCapitalize="none"
                  className="bg-bg-light text-text-primary rounded-xl pl-8 pr-4 py-3 text-sm border border-border"
                />
              </View>
              {usernameMsg && (
                <Text
                  className={`mt-1.5 ml-1 text-[11px] font-medium ${usernameMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {usernameMsg.text}
                </Text>
              )}
            </Field>

            <Field label="Email Address">
              <TextInput
                value={email}
                onChangeText={handleEmailChange}
                placeholder="you@example.com"
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                keyboardType="email-address"
                className="bg-bg-light text-text-primary rounded-xl px-4 py-3 text-sm border border-border"
              />
              {emailMsg && (
                <Text
                  className={`mt-1.5 ml-1 text-[11px] font-medium ${emailMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {emailMsg.text}
                </Text>
              )}
            </Field>

            <Field label="Create Password">
              <View className="relative flex-row items-center">
                <TextInput
                  value={password}
                  onChangeText={handlePasswordChange}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  className="flex-1 bg-bg-light text-text-primary rounded-xl px-4 py-3 pr-12 text-sm border border-border"
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
              {passwordMsg && (
                <Text
                  className={`mt-1.5 ml-1 text-[11px] font-medium ${passwordMsg.ok ? "text-emerald-400" : "text-red-400"}`}>
                  {passwordMsg.text}
                </Text>
              )}
            </Field>

            <Field label="Confirm Password">
              <View className="relative flex-row items-center">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showConfirmPassword}
                  className="flex-1 bg-bg-light text-text-primary rounded-xl px-4 py-3 pr-12 text-sm border border-border"
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  className="absolute right-4">
                  <Feather
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={18}
                    color="#64748B"
                  />
                </Pressable>
              </View>
            </Field>

            <Pressable
              onPress={() => setAgreeTerms((v) => !v)}
              className="flex-row items-start gap-3 pt-2 pb-2">
              <View
                className={`w-5 h-5 mt-0.5 rounded border items-center justify-center ${
                  agreeTerms
                    ? "bg-primary border-primary"
                    : "bg-bg-light border-border"
                }`}>
                {agreeTerms && <Feather name="check" size={12} color="white" />}
              </View>
              <Text className="flex-1 text-xs text-text-muted">
                I agree to PeerUp's{" "}
                <Text className="text-primary">Terms of Service</Text> and{" "}
                <Text className="text-primary">Privacy Policy</Text>
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              className="mt-6">
              <LinearGradient
                colors={["#D97706", "#F59E0B"]}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                className="py-4 rounded-xl items-center">
                <Text className="text-white text-sm font-bold uppercase tracking-widest">
                  {submitting ? "Creating Account..." : "Create Account"}
                </Text>
              </LinearGradient>
            </Pressable>

            <View className="mt-8 pt-6 border-t border-border">
              <Text className="text-center text-sm text-text-muted">
                Already have an account?{" "}
                <Link href="/(auth)/login" asChild>
                  <Text className="font-semibold text-primary">Sign In →</Text>
                </Link>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({label, children}: {label: string; children: React.ReactNode}) {
  return (
    <View className="mb-5">
      <Text className="text-xs font-semibold uppercase tracking-wider mb-2 ml-1 text-text-muted">
        {label}
      </Text>
      {children}
    </View>
  );
}
