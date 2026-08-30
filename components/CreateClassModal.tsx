import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useToast } from "../context/ToastContext";
import { CATEGORIES } from "../types/skills";

const PLATFORMS = ["Google Meet", "Zoom", "MS Teams", "Discord"] as const;

export interface CreateClassParams {
  title: string;
  topicTags: string[];
  scheduledAt: Date;
  maxCapacity: number;
  platform: (typeof PLATFORMS)[number];
  conferenceLink: string;
}

export default function CreateClassModal({
  visible,
  saving,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (params: CreateClassParams) => void;
}) {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  // Split into date + time instead of one freeform string — a real
  // Firestore Timestamp needs a real Date, and parsing arbitrary text
  // like "Aug 30, 2026, 7:00 PM" isn't reliable across devices.
  const [date, setDate] = useState(""); // YYYY-MM-DD
  const [time, setTime] = useState(""); // HH:MM, 24-hour
  const [maxCapacity, setMaxCapacity] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("Google Meet");
  const [conferenceLink, setConferenceLink] = useState("");

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const reset = () => {
    setTitle("");
    setSelectedTopics([]);
    setDate("");
    setTime("");
    setMaxCapacity("");
    setPlatform("Google Meet");
    setConferenceLink("");
  };

  const handleCreate = () => {
    if (
      !title.trim() ||
      selectedTopics.length === 0 ||
      !date.trim() ||
      !time.trim() ||
      !maxCapacity.trim() ||
      !conferenceLink.trim()
    ) {
      showToast("Please fill in all fields");
      return;
    }

    const dateMatch = /^\d{4}-\d{2}-\d{2}$/.test(date.trim());
    const timeMatch = /^\d{2}:\d{2}$/.test(time.trim());
    if (!dateMatch || !timeMatch) {
      showToast("Use YYYY-MM-DD for date and HH:MM (24hr) for time");
      return;
    }

    const scheduledAt = new Date(`${date.trim()}T${time.trim()}:00`);
    if (isNaN(scheduledAt.getTime())) {
      showToast("That date/time isn't valid");
      return;
    }

    const capacity = parseInt(maxCapacity, 10);
    if (isNaN(capacity) || capacity < 1) {
      showToast("Max capacity must be a positive number");
      return;
    }

    // Android's Linking.openURL needs a scheme to know which app handles
    // the link — "meet.google.com/xyz" fails silently-ish with an Intent
    // error, "https://meet.google.com/xyz" works. Normalize here so a
    // pasted link without http(s):// doesn't break Join later.
    const normalizedLink = /^https?:\/\//i.test(conferenceLink.trim())
      ? conferenceLink.trim()
      : `https://${conferenceLink.trim()}`;

    onSubmit({
      title: title.trim(),
      topicTags: selectedTopics,
      scheduledAt,
      maxCapacity: capacity,
      platform,
      conferenceLink: normalizedLink,
    });
    reset();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40 justify-end" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="bg-bg-light rounded-t-3xl border-t border-border max-h-[88%]">
          <View className="flex-row items-center justify-between px-6 py-5 border-b border-border">
            <Text className="text-lg font-semibold text-text-primary">
              Create a Live Class
            </Text>
            <Pressable onPress={onClose} className="p-1.5">
              <Feather name="x" size={18} color="#64748B" />
            </Pressable>
          </View>

          <ScrollView className="px-6 pt-6" contentContainerStyle={{ paddingBottom: 32 }}>
            <Field label="Class Title">
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. React Native Basics"
                placeholderTextColor="#64748B"
                className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
              />
            </Field>

            <Field label="Topic Tags">
              <View className="flex-row flex-wrap gap-2">
                {CATEGORIES.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => toggleTopic(t)}
                    className={`px-3.5 py-2 rounded-full border ${
                      selectedTopics.includes(t) ? "border-primary/30 bg-primary/10" : "border-border bg-bg-medium"
                    }`}>
                    <Text className={`text-xs font-medium ${selectedTopics.includes(t) ? "text-primary" : "text-text-muted"}`}>
                      {t}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <Field label="Date">
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD, e.g. 2026-08-30"
                placeholderTextColor="#64748B"
                className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
              />
            </Field>

            <Field label="Time (24-hour)">
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="HH:MM, e.g. 19:00"
                placeholderTextColor="#64748B"
                className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
              />
            </Field>

            <Field label="Max Capacity">
              <TextInput
                value={maxCapacity}
                onChangeText={setMaxCapacity}
                placeholder="e.g. 20"
                placeholderTextColor="#64748B"
                keyboardType="number-pad"
                className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
              />
            </Field>

            <Field label="Conferencing Platform">
              <View className="flex-row flex-wrap gap-2">
                {PLATFORMS.map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setPlatform(p)}
                    className={`px-3.5 py-2 rounded-full border ${
                      platform === p ? "border-primary/30 bg-primary/10" : "border-border bg-bg-medium"
                    }`}>
                    <Text className={`text-xs font-medium ${platform === p ? "text-primary" : "text-text-muted"}`}>
                      {p}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </Field>

            <Field label="Conferencing Link">
              <TextInput
                value={conferenceLink}
                onChangeText={setConferenceLink}
                placeholder="https://..."
                placeholderTextColor="#64748B"
                autoCapitalize="none"
                className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
              />
            </Field>

            <Pressable
              onPress={handleCreate}
              disabled={saving}
              className="mt-2 py-4 rounded-2xl bg-primary items-center">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                {saving ? "Creating..." : "Create Class"}
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="mb-6">
      <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 mb-2">
        {label}
      </Text>
      {children}
    </View>
  );
}