import { Feather } from "@expo/vector-icons";
import { Link } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import CreateClassModal from "../../../components/CreateClassModal";
import Screen from "../../../components/Screen";
import { useAuth } from "../../../context/AuthContext";

type ClassStatus = "live" | "upcoming" | "completed";

interface LiveClass {
  id: string;
  title: string;
  topicTags: string[];
  mentor: string;
  startTime: string;
  maxCapacity: number;
  registered: number;
  platform: "Google Meet" | "Zoom" | "MS Teams" | "Discord";
  status: ClassStatus;
}

// TODO: replace with real classes fetched from Firestore (classes collection)
const MOCK_CLASSES: LiveClass[] = [
  {
    id: "c1",
    title: "React Native Basics: Building Your First Screen",
    topicTags: ["Technology"],
    mentor: "Arif Khan",
    startTime: "Live now",
    maxCapacity: 30,
    registered: 18,
    platform: "Google Meet",
    status: "live",
  },
  {
    id: "c2",
    title: "Intro to UI Design Systems",
    topicTags: ["Design"],
    mentor: "Priya Das",
    startTime: "Tomorrow, 7:00 PM",
    maxCapacity: 20,
    registered: 6,
    platform: "Zoom",
    status: "upcoming",
  },
  {
    id: "c3",
    title: "Guitar Chords for Beginners",
    topicTags: ["Music"],
    mentor: "Jamal Uddin",
    startTime: "Aug 31, 6:00 PM",
    maxCapacity: 15,
    registered: 15,
    platform: "Discord",
    status: "upcoming",
  },
  {
    id: "c4",
    title: "Pitch Deck Teardown",
    topicTags: ["Business"],
    mentor: "Rafi Islam",
    startTime: "Aug 20, 2026",
    maxCapacity: 25,
    registered: 22,
    platform: "MS Teams",
    status: "completed",
  },
];

const FILTERS: {key: ClassStatus; label: string}[] = [
  {key: "live", label: "Live Now"},
  {key: "upcoming", label: "Upcoming"},
  {key: "completed", label: "Past"},
];

const TOPICS = ["Technology", "Design", "Music", "Business", "Language"];

export default function LiveClassrooms() {
  const {user} = useAuth();
  const [statusFilter, setStatusFilter] = useState<ClassStatus>("live");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const filtered = MOCK_CLASSES.filter(
    (c) =>
      c.status === statusFilter &&
      (!topicFilter || c.topicTags.includes(topicFilter)),
  );

  return (
    <Screen user={user ? {name: user.email ?? "You"} : null}>
      <View className="flex-row items-center justify-between px-6 pt-8 pb-2">
        <Text className="text-3xl font-extralight text-text-primary mb-1">
          Live <Text className="italic text-primary">Classrooms</Text>
        </Text>
        {user && (
          <Pressable
            onPress={() => setCreateModalOpen(true)}
            className="w-10 h-10 rounded-full bg-primary/10 border border-primary/20 items-center justify-center">
            <Feather name="plus" size={18} color="#FFB300" />
          </Pressable>
        )}
      </View>

      {/* Status filter */}
      <View className="flex-row gap-2 px-6 mt-5">
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            onPress={() => setStatusFilter(f.key)}
            className={`flex-1 py-2.5 rounded-xl items-center ${
              statusFilter === f.key
                ? "bg-primary/15 border border-primary/30"
                : "bg-bg-medium border border-border"
            }`}>
            <Text
              className={`text-[11px] font-bold uppercase tracking-wider ${
                statusFilter === f.key ? "text-primary" : "text-text-muted"
              }`}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Topic filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{flexGrow: 0}}
        contentContainerStyle={{
          paddingHorizontal: 24,
          gap: 8,
          alignItems: "center",
        }}
        className="mt-4 h-11">
        <Pressable
          onPress={() => setTopicFilter(null)}
          className={`px-3.5 py-2 rounded-full border ${
            !topicFilter
              ? "border-primary/30 bg-primary/10"
              : "border-border bg-bg-medium"
          }`}>
          <Text
            className={`text-xs font-medium ${!topicFilter ? "text-primary" : "text-text-muted"}`}>
            All Topics
          </Text>
        </Pressable>
        {TOPICS.map((t) => (
          <Pressable
            key={t}
            onPress={() => setTopicFilter(t)}
            className={`px-3.5 py-2 rounded-full border ${
              topicFilter === t
                ? "border-primary/30 bg-primary/10"
                : "border-border bg-bg-medium"
            }`}>
            <Text
              className={`text-xs font-medium ${topicFilter === t ? "text-primary" : "text-text-muted"}`}>
              {t}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Class list */}
      <View className="px-6 mt-6 mb-14 gap-4">
        {filtered.length === 0 ? (
          <View className="items-center py-16">
            <Feather name="video-off" size={28} color="#64748B" />
            <Text className="text-sm text-text-muted mt-3">
              No classes here right now.
            </Text>
          </View>
        ) : (
          filtered.map((c) => <ClassCard key={c.id} liveClass={c} />)
        )}
      </View>

      <CreateClassModal
        visible={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
    </Screen>
  );
}

function ClassCard({liveClass}: {liveClass: LiveClass}) {
  const full = liveClass.registered >= liveClass.maxCapacity;

  return (
    <Link
      href={{pathname: "/(tabs)/classrooms/[id]", params: {id: liveClass.id}}}
      asChild>
      <Pressable className="bg-bg-medium border border-border rounded-2xl p-5">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row items-center gap-1.5">
            {liveClass.status === "live" && (
              <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
            )}
            <Text
              className={`text-[10px] font-bold uppercase tracking-widest ${
                liveClass.status === "live" ? "text-red-500" : "text-text-muted"
              }`}>
              {liveClass.status === "live" ? "Live" : liveClass.startTime}
            </Text>
          </View>
          <Text className="text-[10px] text-text-muted">
            {liveClass.platform}
          </Text>
        </View>

        <Text
          className="text-base font-semibold text-text-primary mb-1.5"
          numberOfLines={2}>
          {liveClass.title}
        </Text>
        <Text className="text-xs text-text-muted mb-3">
          by {liveClass.mentor}
        </Text>

        <View className="flex-row items-center justify-between">
          <View className="flex-row gap-1.5">
            {liveClass.topicTags.map((tag) => (
              <View key={tag} className="px-2 py-1 rounded-md bg-primary/10">
                <Text className="text-[9px] font-bold uppercase tracking-wider text-primary">
                  {tag}
                </Text>
              </View>
            ))}
          </View>
          <Text className="text-[10px] text-text-muted">
            {liveClass.registered}/{liveClass.maxCapacity}
            {full ? " · Full" : ""}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
