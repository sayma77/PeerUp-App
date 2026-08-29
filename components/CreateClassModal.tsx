import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { useToast } from "../context/ToastContext";

const PLATFORMS = ["Google Meet", "Zoom", "MS Teams", "Discord"] as const;
const TOPICS = ["Technology", "Design", "Music", "Business", "Language", "Fitness", "Art", "Cooking"];

export default function CreateClassModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { showToast } = useToast();

  const [title, setTitle] = useState("");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [startTime, setStartTime] = useState("");
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
    setStartTime("");
    setMaxCapacity("");
    setPlatform("Google Meet");
    setConferenceLink("");
  };

  const handleCreate = () => {
    if (!title.trim() || selectedTopics.length === 0 || !startTime.trim() || !maxCapacity.trim() || !conferenceLink.trim()) {
      showToast("Please fill in all fields");
      return;
    }
    // TODO: write new class doc to Firestore (classes collection), mentor = current user
    showToast("Class created!");
    reset();
    onClose();
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
                {TOPICS.map((t) => (
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

            <Field label="Start Time">
              <TextInput
                value={startTime}
                onChangeText={setStartTime}
                placeholder="e.g. Aug 30, 2026, 7:00 PM"
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

            <Pressable onPress={handleCreate} className="mt-2 py-4 rounded-2xl bg-primary items-center">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                Create Class
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