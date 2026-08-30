import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Link } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import CreateClassModal from "../../../components/CreateClassModal";
import Screen from "../../../components/Screen";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { db } from "../../../firebaseConfig";
import {
  ClassPlatform,
  ClassStatus,
  createClass,
  fetchClasses,
  formatStartTime,
  LiveClass,
} from "../../../services/classesService";

const FILTERS: {key: ClassStatus; label: string}[] = [
  {key: "live", label: "Live Now"},
  {key: "upcoming", label: "Upcoming"},
  {key: "completed", label: "Past"},
];

// NOTE: kept separate from the Skills CATEGORIES list on purpose for now —
// class topics and skill categories are different domains ("Language" here
// vs "Languages" for skills). Worth deciding later whether these should be
// the same taxonomy; if so, same fix as before: one shared constant both
// import from.
const TOPICS = ["Tech", "Creative", "Languages", "Business", "Lifestyle"];

export default function LiveClassrooms() {
  const {user} = useAuth();
  const {showToast} = useToast();

  const [classes, setClasses] = useState<LiveClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [statusFilter, setStatusFilter] = useState<ClassStatus>("live");
  const [topicFilter, setTopicFilter] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Refetch on focus, same reasoning as the Skills tab — a newly created
  // class should show up without needing a full app reload.
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        setLoading(true);
        setLoadError(false);
        try {
          const data = await fetchClasses();
          if (!cancelled) setClasses(data);
        } catch (err) {
          console.error("Failed to load classes:", err);
          if (!cancelled) setLoadError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, []),
  );

  const filtered = classes.filter(
    (c) =>
      c.status === statusFilter &&
      (!topicFilter || c.topicTags.includes(topicFilter)),
  );

  async function handleCreateClass(params: {
    title: string;
    topicTags: string[];
    scheduledAt: Date;
    maxCapacity: number;
    platform: ClassPlatform;
    conferenceLink: string;
  }) {
    if (!user) return;
    setCreating(true);
    try {
      const meSnap = await getDoc(doc(db, "users", user.uid));
      const mentorName = meSnap.exists() ? meSnap.data().name : "You";

      await createClass({
        ...params,
        mentorId: user.uid,
        mentorName,
      });

      setCreateModalOpen(false);
      showToast("Class created!");

      // refresh the list immediately rather than waiting for next focus
      const data = await fetchClasses();
      setClasses(data);
    } catch (err) {
      console.error("Failed to create class:", err);
      showToast("Failed to create class", "error");
    } finally {
      setCreating(false);
    }
  }

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
        {loading ? (
          <View className="items-center py-16 gap-3">
            <ActivityIndicator color="#FFB300" />
            <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Loading Classes...
            </Text>
          </View>
        ) : loadError ? (
          <Text className="text-center text-sm text-red-400 py-10">
            Couldn't load classes. Pull to refresh or try again shortly.
          </Text>
        ) : filtered.length === 0 ? (
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
        saving={creating}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreateClass}
      />
    </Screen>
  );
}

function ClassCard({liveClass}: {liveClass: LiveClass}) {
  const full = liveClass.registeredCount >= liveClass.maxCapacity;

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
              {formatStartTime(liveClass)}
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
          by {liveClass.mentorName}
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
            {liveClass.registeredCount}/{liveClass.maxCapacity}
            {full ? " · Full" : ""}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
