import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Screen from "../../components/Screen";
import { useToast } from "../../context/ToastContext";
import { CATEGORIES, MentorDetail, SkillCard } from "../../types/skills";

const PAGE_SIZE = 2;

// TODO: replace with a real Firestore query on the `skills` collection
const MOCK_SKILLS: SkillCard[] = [
  {
    id: "s1",
    name: "React Native",
    category: "Technology",
    description: "Build cross-platform mobile apps with Expo.",
    mentorId: "m1",
    mentorName: "Arif Khan",
  },
  {
    id: "s2",
    name: "Guitar Basics",
    category: "Music",
    description: "Learn chords, strumming, and your first songs.",
    mentorId: "m2",
    mentorName: "Priya Das",
  },
  {
    id: "s3",
    name: "UI Design",
    category: "Design",
    description: "Design clean, usable interfaces with Figma.",
    mentorId: "m3",
    mentorName: "Nadia Islam",
  },
  {
    id: "s4",
    name: "Public Speaking",
    category: "Business",
    description: "Build confidence presenting to any audience.",
    mentorId: "m4",
    mentorName: "Jamal Uddin",
  },
];

// TODO: replace with a real Firestore fetch (users/{mentorId} + requests where requester==me & mentor==mentorId)
async function fetchMentorDetail(skill: SkillCard): Promise<MentorDetail> {
  await new Promise((r) => setTimeout(r, 400));
  return {
    id: skill.mentorId,
    name: skill.mentorName,
    username: skill.mentorName.toLowerCase().replace(/\s+/g, ""),
    intro: "Passionate about teaching and lifelong learning.",
    bio: "I've been mentoring on PeerUp for a while and love helping people pick up new skills.",
    rating: 4.6,
    reviewCount: 8,
    requestStatus: "none",
  };
}

// TODO: replace with a real Firebase Auth state check
const isLoggedIn = false;

export default function Skills() {
  const router = useRouter();
  const {showToast} = useToast();

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [modalSkill, setModalSkill] = useState<SkillCard | null>(null);
  const [mentor, setMentor] = useState<MentorDetail | null>(null);
  const [loadingMentor, setLoadingMentor] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);

  const filtered = useMemo(() => {
    const term = search.toLowerCase().trim();
    return MOCK_SKILLS.filter((skill) => {
      const matchesTerm =
        !term ||
        skill.name.toLowerCase().includes(term) ||
        skill.description.toLowerCase().includes(term);
      const matchesCategory = category === "All" || skill.category === category;
      return matchesTerm && matchesCategory;
    });
  }, [search, category]);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  async function openMentorModal(skill: SkillCard) {
    setModalSkill(skill);
    setLoadingMentor(true);
    setMentor(null);
    try {
      const detail = await fetchMentorDetail(skill);
      setMentor(detail);
    } finally {
      setLoadingMentor(false);
    }
  }

  function closeModal() {
    setModalSkill(null);
    setMentor(null);
  }

  async function handleRequest() {
    if (!isLoggedIn) {
      router.push("/(auth)/login");
      return;
    }
    if (!mentor || !modalSkill) return;

    setSendingRequest(true);
    try {
      // TODO: POST a new doc to the `requests` collection in Firestore
      await new Promise((r) => setTimeout(r, 400));
      setMentor({...mentor, requestStatus: "pending"});
      showToast(`Request sent to ${mentor.name}!`);
    } catch {
      showToast("Failed to send request", "error");
    } finally {
      setSendingRequest(false);
    }
  }

  return (
    <Screen>
      <View className="px-5 pt-6 pb-4">
        <Text className="text-3xl font-extralight text-text-primary mb-1">
          Discover <Text className="italic text-primary">Expertise</Text>
        </Text>

        <View className="relative">
          <Feather
            name="search"
            size={18}
            color="#64748B"
            style={{position: "absolute", left: 16, top: 16, zIndex: 1}}
          />
          <TextInput
            value={search}
            onChangeText={(v) => {
              setSearch(v);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search skills, languages, or tools..."
            placeholderTextColor="#64748B"
            className="bg-bg-medium border border-border rounded-2xl pl-12 pr-4 py-4 text-text-primary"
          />
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 mb-6"
        style={{flexGrow: 0}}
        contentContainerStyle={{alignItems: "flex-start"}}>
        <View className="flex-row gap-2">
          {["All", ...CATEGORIES].map((cat) => {
            const active = category === cat;
            return (
              <Pressable
                key={cat}
                onPress={() => {
                  setCategory(cat);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-4 py-2 rounded-xl border ${
                  active
                    ? "bg-primary/10 border-primary/20"
                    : "bg-bg-medium border-border"
                }`}>
                <Text
                  className={`text-[10px] font-bold uppercase tracking-widest ${active ? "text-primary" : "text-text-muted"}`}>
                  {cat === "All" ? "All Skills" : cat}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-5 gap-4">
        {visible.length === 0 ? (
          <Text className="text-center text-sm text-text-muted py-10">
            No skills match your search.
          </Text>
        ) : (
          visible.map((skill) => (
            <Pressable
              key={skill.id}
              onPress={() => openMentorModal(skill)}
              className="bg-bg-medium border border-border rounded-3xl p-6">
              <View className="flex-row items-start justify-between mb-5">
                <View className="w-12 h-12 rounded-2xl bg-bg-light border border-border items-center justify-center">
                  <Feather name="zap" size={20} color="#FFB300" />
                </View>
                <View className="px-2.5 py-1 border border-border bg-bg-light rounded-lg">
                  <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                    {skill.category}
                  </Text>
                </View>
              </View>

              <Text className="text-xl font-extralight text-text-primary mb-2">
                {skill.name}
              </Text>
              <Text className="text-sm text-text-muted mb-5" numberOfLines={2}>
                {skill.description}
              </Text>

              <View className="flex-row items-center justify-between pt-4 border-t border-border">
                <View className="flex-row items-center gap-2">
                  <View className="w-7 h-7 rounded-full bg-primary/20 items-center justify-center">
                    <Text className="text-[10px] font-bold text-primary">
                      {skill.mentorName.charAt(0)}
                    </Text>
                  </View>
                  <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {skill.mentorName}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-primary">
                    Explore
                  </Text>
                  <Feather name="arrow-right" size={13} color="#FFB300" />
                </View>
              </View>
            </Pressable>
          ))
        )}

        {hasMore && (
          <Pressable
            onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="self-center px-6 py-3 rounded-xl border border-border bg-bg-medium mb-4">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Load More
            </Text>
          </Pressable>
        )}
      </View>

      {/* Mentor Modal */}
      <Modal
        visible={!!modalSkill}
        transparent
        animationType="fade"
        onRequestClose={closeModal}>
        <View className="flex-1 bg-black/90 items-center justify-center px-5">
          <View className="w-full bg-bg-medium border border-border rounded-3xl overflow-hidden max-h-[85%]">
            <View className="p-6 border-b border-border flex-row items-start justify-between">
              <View className="flex-1 pr-3">
                <Text className="text-2xl font-extralight text-text-primary mb-1">
                  {modalSkill?.name}
                </Text>
                <Text className="text-xs italic text-text-muted">
                  "Knowledge increases by sharing but not by saving."
                </Text>
              </View>
              <Pressable onPress={closeModal}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView className="p-6" showsVerticalScrollIndicator={false}>
              {loadingMentor ? (
                <View className="items-center py-10 gap-3">
                  <ActivityIndicator color="#FFB300" />
                  <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Loading Mentor...
                  </Text>
                </View>
              ) : mentor ? (
                <View className="gap-5">
                  <Pressable
                    onPress={() => {
                      closeModal();
                      router.push(`/profile/${mentor.username}` as any);
                    }}
                    className="flex-row items-center gap-4">
                    <View className="w-14 h-14 rounded-2xl bg-bg-light border border-border items-center justify-center">
                      <Text className="text-xl font-light text-primary">
                        {mentor.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-light text-text-primary">
                        {mentor.name}
                      </Text>
                      {mentor.intro ? (
                        <Text className="text-sm text-text-muted mt-0.5">
                          {mentor.intro}
                        </Text>
                      ) : null}
                    </View>
                  </Pressable>

                  <View className="flex-row items-center gap-2 px-4 py-3.5 bg-bg-light border border-border rounded-2xl">
                    <Feather name="star" size={16} color="#FFB300" />
                    <Text className="text-sm text-text-primary">
                      {mentor.rating > 0
                        ? `${mentor.rating.toFixed(1)} `
                        : "Not yet rated"}
                      {mentor.rating > 0 && (
                        <Text className="text-text-muted">
                          ({mentor.reviewCount} review
                          {mentor.reviewCount !== 1 ? "s" : ""})
                        </Text>
                      )}
                    </Text>
                  </View>

                  {mentor.bio ? (
                    <View className="px-4 py-3.5 bg-bg-light border border-border rounded-2xl">
                      <Text className="text-sm leading-5 text-text-muted">
                        {mentor.bio}
                      </Text>
                    </View>
                  ) : null}

                  <View className="flex-row gap-3 mt-1 mb-4">
                    <Pressable
                      onPress={() => {
                        closeModal();
                        router.push({
                          pathname: "/chat/[conversationId]",
                          params: {conversationId: mentor.id},
                        } as any);
                      }}
                      className="flex-1 py-3 rounded-2xl border border-border items-center">
                      <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                        Message
                      </Text>
                    </Pressable>

                    <RequestButton
                      status={mentor.requestStatus}
                      sending={sendingRequest}
                      onPress={handleRequest}
                    />
                  </View>
                </View>
              ) : (
                <Text className="text-red-400 text-center py-10">
                  Error loading mentor details.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

function RequestButton({
  status,
  sending,
  onPress,
}: {
  status: MentorDetail["requestStatus"];
  sending: boolean;
  onPress: () => void;
}) {
  if (status === "pending") {
    return (
      <View className="flex-1 py-3 rounded-2xl bg-bg-light items-center">
        <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted">
          Requested
        </Text>
      </View>
    );
  }
  if (status === "accepted") {
    return (
      <View className="flex-1 py-3 rounded-2xl bg-primary/20 border border-primary/30 items-center">
        <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
          Pursuing
        </Text>
      </View>
    );
  }
  if (status === "completed") {
    return (
      <View className="flex-1 py-3 rounded-2xl bg-blue-400/20 border border-blue-400/30 items-center">
        <Text className="text-[9px] font-black uppercase tracking-widest text-blue-400">
          Completed
        </Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      disabled={sending}
      className="flex-1 py-3 rounded-2xl bg-primary items-center">
      <Text className="text-[9px] font-black uppercase tracking-widest text-bg-light">
        {sending ? "Sending..." : "Request Skill"}
      </Text>
    </Pressable>
  );
}
