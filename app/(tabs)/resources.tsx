import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore";

import { db } from "../../firebaseConfig";

import Screen from "../../components/Screen";
import AIResourceGenerator from "../../components/AIResourceGenerator";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  AIResourceData,
  downloadAIResourceAsPDF,
} from "../../services/resourceService";
import {
  LEVEL_OPTIONS,
  Resource,
  ResourceLevel,
  SKILL_OPTIONS,
} from "../../types/resources";

const PAGE_SIZE = 2;

// TODO: replace with a real Firestore query on the `resources` collection
const MOCK_RESOURCES: Resource[] = [
  {
    id: "r1",
    title: "The Complete React Guide",
    description:
      "A deep dive into hooks, context, and component patterns.",
    link: "https://react.dev",
    skillName: "React Native",
    level: "Beginner",
    addedBy: { id: "u1", name: "Sayma" },
  },
  {
    id: "r2",
    title: "Firestore Data Modeling",
    description:
      "How to structure collections and documents for real-time apps.",
    link: "https://firebase.google.com/docs/firestore",
    skillName: "Firebase",
    level: "Medium",
    addedBy: { id: "u3", name: "Arif Khan" },
  },
  {
    id: "r3",
    title: "Advanced MongoDB Aggregation",
    description:
      "Pipelines, indexes, and performance tuning for large datasets.",
    link: "https://www.mongodb.com/docs/manual/aggregation/",
    skillName: "MongoDB",
    level: "Hard",
    addedBy: { id: "u4", name: "Priya Das" },
  },
];

const levelColors: Record<
  ResourceLevel,
  { bg: string; text: string; border: string }
> = {
  Beginner: {
    bg: "rgba(255,179,0,0.1)",
    text: "#FFB300",
    border: "rgba(255,179,0,0.2)",
  },
  Medium: {
    bg: "rgba(251,191,36,0.1)",
    text: "#fbbf24",
    border: "rgba(251,191,36,0.2)",
  },
  Hard: {
    bg: "rgba(239,68,68,0.1)",
    text: "#ef4444",
    border: "rgba(239,68,68,0.2)",
  },
};

export default function Resources() {
  const router = useRouter();
  const { showToast } = useToast();
  const { user } = useAuth();
  const currentUserId = user?.uid || "anon";

  const [resources, setResources] = useState<Resource[]>([]);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<ResourceLevel | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [shareOpen, setShareOpen] = useState(false);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);

 useEffect(() => {
  async function loadResources() {
    try {
      const snapshot = await getDocs(collection(db, "resources"));

      // Sort Firestore resources by newest first
      const sortedDocs = [...snapshot.docs].sort((a, b) => {
        const aTime = a.data().createdAt?.toMillis?.() ?? 0;
        const bTime = b.data().createdAt?.toMillis?.() ?? 0;

        return bTime - aTime;
      });

      const firestoreResources: Resource[] = sortedDocs.map((item) => {
        const data = item.data();

        return {
          id: item.id,
          title: data.title,
          description: data.description,
          link: data.link ?? "",
          skillName: data.skillName,
          level: data.level,
          addedBy: {
            id: data.addedBy,
            name:
             data.addedBy === currentUserId
              ? user?.email?.split("@")[0] || "User"
             : "User",
           },
          content: data.content,
          isAIGenerated: data.isAIGenerated,
          resourceType: data.resourceType,
          topic: data.topic,
        };
      });

      // Your newly-created resources first
      const myResources = firestoreResources.filter(
        (resource) => resource.addedBy.id === currentUserId
      );

      // Seed resources after the mock resources
      const seedResources = firestoreResources.filter(
        (resource) => resource.addedBy.id !== currentUserId
      );

      // Exact order:
      // 1. Newly created resources
      // 2. Mock resources
      // 3. Seed resources
      setResources([
        ...myResources,
        ...MOCK_RESOURCES,
        ...seedResources,
      ]);
    } catch (error) {
      console.error("Failed to load resources:", error);
      showToast("Failed to load resources", "error");
    }
  }

  loadResources();
}, [currentUserId]);

  const filtered = resources.filter((r) => {
    const q = search.trim().toLowerCase();

    const matchesSearch =
      !q ||
      r.title.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q);

    const matchesSkill = !skillFilter || r.skillName === skillFilter;
    const matchesLevel = !levelFilter || r.level === levelFilter;

    return matchesSearch && matchesSkill && matchesLevel;
  });

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  async function handleDelete(resource: Resource) {
  try {
    await deleteDoc(doc(db, "resources", resource.id));

    setResources((prev) => prev.filter((r) => r.id !== resource.id));
    showToast("Resource deleted", "success");
  } catch (error) {
    console.error("Failed to delete resource:", error);
    showToast("Failed to delete resource", "error");
  }
}

async function handlePublish(data: {
  title: string;
  description: string;
  link: string;
  skillName: string;
  level: ResourceLevel;
}) {
  const currentName = user?.email?.split("@")[0] || "User";

  try {
    const docRef = await addDoc(collection(db, "resources"), {
      title: data.title,
      description: data.description,
      link: data.link,
      skillName: data.skillName,
      level: data.level,
      addedBy: currentUserId,
      createdAt: new Date(),
    });

    const newResource: Resource = {
      id: docRef.id,
      title: data.title,
      description: data.description,
      link: data.link,
      skillName: data.skillName,
      level: data.level,
      addedBy: {
        id: currentUserId,
        name: currentName,
      },
    };

    setResources((prev) => [newResource, ...prev]);
    setShareOpen(false);

    showToast("Resource published", "success");
  } catch (error) {
    console.error("Failed to publish resource:", error);
    showToast("Failed to publish resource", "error");
  }
}

 async function handlePublishAIResource(data: AIResourceData) {
  const currentName = user?.email?.split("@")[0] || "User";

  try {
    const docRef = await addDoc(collection(db, "resources"), {
      title: data.title,
      description: `${data.resourceType} · ${data.topic}`,
      link: "",
      skillName: data.skill,
      level: data.difficulty ?? "Beginner",
      addedBy: currentUserId,
      content: data.content,
      isAIGenerated: true,
      resourceType: data.resourceType,
      topic: data.topic,
      createdAt: new Date(),
    });

    const newResource: Resource = {
      id: docRef.id,
      title: data.title,
      description: `${data.resourceType} · ${data.topic}`,
      link: "",
      skillName: data.skill,
      level: data.difficulty ?? "Beginner",
      addedBy: {
        id: currentUserId,
        name: currentName,
      },
      content: data.content,
      isAIGenerated: true,
      resourceType: data.resourceType,
      topic: data.topic,
    };

    setResources((prev) => [newResource, ...prev]);
    setAiGeneratorOpen(false);

    showToast("AI resource published", "success");
  } catch (error) {
    console.error("Failed to publish AI resource:", error);
    showToast("Failed to publish AI resource", "error");
  }
}

  return (
    <Screen user={user ? { name: user.email ?? "You" } : null}>
      <View className="px-5 pt-8 pb-4">
        {/* Page Title */}
        <Text className="text-4xl font-extralight text-text-primary">
          Learning{" "}
          <Text className="italic text-primary">Resources</Text>
        </Text>

        {/* Share Resource */}
        <Pressable
          onPress={() => {
            if (!user) {
              router.push("/(auth)/login");
            } else {
              setShareOpen(true);
            }
          }}
          className="mt-6 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-center gap-2"
        >
          <Feather name="plus" size={14} color="#FFB300" />
          <Text className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
            Share Resource
          </Text>
        </Pressable>

        {/* Generate AI Resource */}
        <Pressable
          onPress={() => {
            if (!user) {
              router.push("/(auth)/login");
            } else {
              setAiGeneratorOpen(true);
            }
          }}
          className="mt-6 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-center gap-2"
        >
          <Feather name="zap" size={14} color="#FFB300" />
          <Text className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
            Generate AI Resource
          </Text>
        </Pressable>

        {/* Search */}
        <View className="mt-6 flex-row items-center bg-bg-medium border border-border rounded-2xl px-4">
          <Feather name="search" size={16} color="#64748B" />
          <TextInput
            value={search}
            onChangeText={(t) => {
              setSearch(t);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder="Search resources, tutorials, or guides..."
            placeholderTextColor="#475569"
            className="flex-1 px-3 py-3.5 text-text-primary text-sm"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#64748B" />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <View className="flex-row gap-3 mt-4">
          <Dropdown
            value={skillFilter}
            options={SKILL_OPTIONS}
            placeholder="All Skills"
            onSelect={(val) => {
              setSkillFilter(val);
              setVisibleCount(PAGE_SIZE);
            }}
          />
          <Dropdown
            value={levelFilter}
            options={LEVEL_OPTIONS as unknown as string[]}
            placeholder="All Levels"
            onSelect={(val) => {
              setLevelFilter(val as ResourceLevel | null);
              setVisibleCount(PAGE_SIZE);
            }}
          />
        </View>
      </View>

      {/* Resource List */}
      <View className="px-5 gap-5">
        {visible.length === 0 ? (
          <View className="items-center py-20">
            <View className="w-16 h-16 rounded-full border border-border items-center justify-center opacity-50 mb-4">
              <Feather name="search" size={22} color="#64748B" />
            </View>
            <Text className="text-xl font-extralight text-text-primary mb-1">
              No resources found
            </Text>
            <Text className="text-sm text-text-muted">
              Try adjusting your search terms or filters.
            </Text>
          </View>
        ) : (
          visible.map((resource) => (
            <ResourceCard
              key={resource.id}
              resource={resource}
              currentUserId={user?.uid}
              onDelete={() => handleDelete(resource)}
            />
          ))
        )}

        {canLoadMore && (
          <Pressable
            onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="py-3.5 rounded-2xl border border-border items-center mb-6"
          >
            <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Load More
            </Text>
          </Pressable>
        )}
      </View>

      {/* Existing Share Resource Modal */}
      <ShareResourceModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        onSubmit={handlePublish}
      />

      {/* AI Resource Generator */}
      <AIResourceGenerator
        visible={aiGeneratorOpen}
        onClose={() => setAiGeneratorOpen(false)}
        onGenerated={handlePublishAIResource}
      />
    </Screen>
  );
}

/* ============================================================
   DROPDOWN
============================================================ */

function Dropdown<T extends string>({
  label,
  options,
  value,
  onSelect,
  placeholder = "Select...",
}: {
  label?: string;
  options: readonly T[] | T[];
  value: T | null;
  onSelect: (val: T | null) => void;
  placeholder?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="flex-1">
      {label && (
        <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => setIsOpen(true)}
        className="flex-row items-center justify-between px-4 py-3.5 bg-bg-medium border border-border rounded-2xl"
      >
        <Text
          className={`text-sm ${
            value ? "text-text-primary" : "text-text-muted"
          }`}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color="#64748B" />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/70"
          onPress={() => setIsOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-bg-medium border-t border-border rounded-t-[2.5rem] p-6 pb-10 max-h-[70%] w-full"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-light text-text-primary">
                {placeholder}
              </Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable
                onPress={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="py-4 border-b border-border flex-row justify-between items-center"
              >
                <Text
                  className={`text-base ${
                    value === null
                      ? "text-primary font-bold"
                      : "text-text-primary"
                  }`}
                >
                  {placeholder.includes("Select")
                    ? "Clear Selection"
                    : `All (${placeholder.replace("All ", "")})`}
                </Text>
                {value === null && (
                  <Feather name="check" size={18} color="#FFB300" />
                )}
              </Pressable>

              {options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                  className="py-4 border-b border-border flex-row justify-between items-center"
                >
                  <Text
                    className={`text-base ${
                      value === opt
                        ? "text-primary font-bold"
                        : "text-text-primary"
                    }`}
                  >
                    {opt}
                  </Text>
                  {value === opt && (
                    <Feather name="check" size={18} color="#FFB300" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

/* ============================================================
   RESOURCE CARD
============================================================ */

function ResourceCard({
  resource,
  currentUserId,
  onDelete,
}: {
  resource: Resource;
  currentUserId?: string;
  onDelete: () => void;
}) {
  const [contentOpen, setContentOpen] = useState(false);

  const isOwner = currentUserId && resource.addedBy.id === currentUserId;
  const lc = levelColors[resource.level];
  const isAIResource = resource.isAIGenerated === true && !!resource.content;

  function handleExplore() {
    if (isAIResource) {
      setContentOpen(true);
      return;
    }

    if (!resource.link) {
      return;
    }

    Linking.openURL(resource.link);
  }

  return (
    <>
      <View className="bg-bg-medium border border-border rounded-[2rem] p-6">
        {/* Skill + Level */}
        <View className="flex-row items-start justify-between mb-5">
          <View className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
            <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
              {resource.skillName}
            </Text>
          </View>

          <View
            className="px-3 py-1.5 border rounded-xl"
            style={{
              backgroundColor: lc.bg,
              borderColor: lc.border,
            }}
          >
            <Text
              className="text-[9px] font-bold uppercase tracking-widest"
              style={{
                color: lc.text,
              }}
            >
              {resource.level}
            </Text>
          </View>
        </View>

        {/* AI Badge */}
        {isAIResource && (
          <View className="flex-row items-center mb-4">
            <View className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl flex-row items-center gap-1">
              <Text className="text-xs">✨</Text>
              <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
                AI Generated
              </Text>
            </View>
          </View>
        )}

        {/* Title */}
        <Text className="text-2xl font-extralight text-text-primary mb-2">
          {resource.title}
        </Text>

        {/* Author */}
        <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
          By {resource.addedBy.name}
        </Text>

        {/* Description */}
        <Text className="text-sm text-text-muted leading-5 mb-6">
          {resource.description}
        </Text>

        {/* Footer */}
        <View className="flex-row items-center justify-between pt-5 border-t border-border">
          <Pressable onPress={handleExplore} className="flex-row items-center gap-2">
            <Text className="text-[10px] font-black uppercase tracking-widest text-primary">
              Explore Resource
            </Text>
            <Feather name="arrow-right" size={14} color="#FFB300" />
          </Pressable>

          {isOwner && (
            <Pressable onPress={onDelete}>
              <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                Delete
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* AI Resource Reader */}
      {isAIResource && (
        <ResourceReaderModal
          visible={contentOpen}
          resource={resource}
          onClose={() => setContentOpen(false)}
        />
      )}
    </>
  );
}

/* ============================================================
   AI RESOURCE READER
============================================================ */

function ResourceReaderModal({
  visible,
  resource,
  onClose,
}: {
  visible: boolean;
  resource: Resource;
  onClose: () => void;
}) {
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  async function handleDownloadPDF() {
    try {
      setDownloadingPdf(true);

      await downloadAIResourceAsPDF({
        title: resource.title,
        skill: resource.skillName,
        topic: resource.topic || "",
        resourceType: (resource.resourceType || "AI Resource") as AIResourceData["resourceType"],
        difficulty: resource.level,
        content: resource.content || "",
        isAIGenerated: true,
      });
    } catch (error) {
      console.error("Failed to download PDF:", error);
    } finally {
      setDownloadingPdf(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/90">
        <View className="flex-1 mt-12 bg-bg-medium rounded-t-[2.5rem] border-t border-border">
          {/* Header */}
          <View className="px-6 pt-6 pb-5 border-b border-border">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <View className="flex-row items-center gap-2 mb-3">
                  <View className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl flex-row items-center gap-1">
                    <Text className="text-xs">✨</Text>
                    <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
                      AI Generated
                    </Text>
                  </View>
                </View>

                <Text className="text-3xl font-extralight text-text-primary leading-9">
                  {resource.title}
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                className="w-10 h-10 rounded-full bg-bg-light border border-border items-center justify-center"
              >
                <Feather name="x" size={20} color="#94A3B8" />
              </Pressable>
            </View>

            {/* Metadata */}
            <View className="flex-row flex-wrap gap-2 mt-4">
              <ReaderTag icon="book" label={resource.skillName} />

              {resource.resourceType && (
                <ReaderTag icon="file-text" label={resource.resourceType} />
              )}

              {resource.level && (
                <ReaderTag icon="bar-chart-2" label={resource.level} />
              )}
            </View>

            {resource.topic && (
              <View className="flex-row items-center mt-4">
                <Feather name="bookmark" size={13} color="#FFB300" />
                <Text className="text-xs text-text-muted ml-2">
                  Topic: <Text className="text-text-primary">{resource.topic}</Text>
                </Text>
              </View>
            )}
          </View>

          {/* Content */}
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 50,
            }}
            showsVerticalScrollIndicator={false}
          >
            {resource.content ? (
              <FormattedContent content={resource.content} />
            ) : (
              <Text className="text-text-muted">No content available.</Text>
            )}
          </ScrollView>

          <Pressable
            onPress={handleDownloadPDF}
            disabled={downloadingPdf}
            className="mx-6 mb-6 py-4 rounded-2xl border border-primary/30 bg-bg-light items-center"
          >
            <View className="flex-row items-center gap-2">
              <Feather name="download" size={14} color="#FFB300" />
              <Text className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                {downloadingPdf ? "Creating PDF..." : "Download as PDF"}
              </Text>
            </View>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

/* ============================================================
   READER TAG
============================================================ */

function ReaderTag({
  icon,
  label,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
}) {
  return (
    <View className="flex-row items-center px-3 py-2 rounded-xl bg-bg-light border border-border">
      <Feather name={icon} size={12} color="#FFB300" />
      <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted ml-2">
        {label}
      </Text>
    </View>
  );
}

/* ============================================================
   FORMATTED AI CONTENT
============================================================ */

function FormattedContent({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const elements: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeLines: string[] = [];

  function flushCodeBlock() {
    if (codeLines.length === 0) {
      return;
    }

    elements.push(
      <View
        key={`code-${elements.length}`}
        className="my-3 rounded-2xl bg-[#090D16] border border-border overflow-hidden"
      >
        <View className="px-4 py-2.5 bg-bg-light border-b border-border flex-row items-center gap-2">
          <View className="w-2 h-2 rounded-full bg-primary" />
          <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
            Code
          </Text>
        </View>
        <Text className="px-4 py-4 text-xs leading-5 text-[#CBD5E1] font-mono">
          {codeLines.join("\n")}
        </Text>
      </View>,
    );

    codeLines = [];
  }

  lines.forEach((rawLine, index) => {
    const line = rawLine.trim();

    /* Code blocks */
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        codeLines = [];
      }
      return;
    }

    if (inCodeBlock) {
      codeLines.push(rawLine);
      return;
    }

    /* Empty line */
    if (!line) {
      elements.push(<View key={`space-${index}`} className="h-2" />);
      return;
    }

    /* Markdown headings */
    if (
      line.startsWith("# ") ||
      line.startsWith("## ") ||
      line.startsWith("### ")
    ) {
      const heading = line.replace(/^#{1,3}\s*/, "");

      elements.push(
        <View key={`heading-${index}`} className="mt-5 mb-3">
          <View className="flex-row items-center">
            <View className="w-1 h-6 rounded-full bg-primary mr-3" />
            <Text className="flex-1 text-xl font-bold text-text-primary">
              {renderInlineMarkdown(heading)}
            </Text>
          </View>
        </View>,
      );
      return;
    }

    /* Step headings */
    const stepMatch = line.match(/^(Step\s*\d+)\s*[:.-]?\s*(.*)$/i);

    if (stepMatch) {
      elements.push(
        <View key={`step-${index}`} className="mt-5 mb-3">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-xl bg-primary items-center justify-center mr-3">
              <Text className="text-black text-[10px] font-black">
                {stepMatch[1].replace(/\s+/g, "").toUpperCase()}
              </Text>
            </View>
            <Text className="flex-1 text-lg font-bold text-text-primary">
              {renderInlineMarkdown(stepMatch[2])}
            </Text>
          </View>
        </View>,
      );
      return;
    }

    /* Numbered list */
    const numberedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);

    if (numberedMatch) {
      elements.push(
        <View key={`number-${index}`} className="flex-row items-start mb-3">
          <View className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/25 items-center justify-center mr-3 mt-0.5">
            <Text className="text-primary text-xs font-black">
              {numberedMatch[1]}
            </Text>
          </View>
          <Text className="flex-1 text-sm leading-6 text-text-primary">
            {renderInlineMarkdown(numberedMatch[2])}
          </Text>
        </View>,
      );
      return;
    }

    /* Bullet list */
    const bulletMatch = line.match(/^[-*•]\s+(.*)$/);

    if (bulletMatch) {
      elements.push(
        <View key={`bullet-${index}`} className="flex-row items-start mb-2.5">
          <View className="w-2 h-2 rounded-full bg-primary mt-2.5 mr-3" />
          <Text className="flex-1 text-sm leading-6 text-text-primary">
            {renderInlineMarkdown(bulletMatch[1])}
          </Text>
        </View>,
      );
      return;
    }

    /* Important / Note / Tip */
    const specialMatch = line.match(/^(Important|Note|Tip|Warning)\s*:\s*(.*)$/i);

    if (specialMatch) {
      elements.push(
        <View
          key={`special-${index}`}
          className="my-3 p-4 rounded-2xl bg-primary/10 border border-primary/20"
        >
          <View className="flex-row items-center mb-2">
            <Feather
              name={
                specialMatch[1].toLowerCase() === "warning"
                  ? "alert-triangle"
                  : "info"
              }
              size={14}
              color="#FFB300"
            />
            <Text className="ml-2 text-[10px] font-black uppercase tracking-widest text-primary">
              {specialMatch[1]}
            </Text>
          </View>
          <Text className="text-sm leading-6 text-text-primary">
            {renderInlineMarkdown(specialMatch[2])}
          </Text>
        </View>,
      );
      return;
    }

    /* Normal paragraph */
    elements.push(
      <Text key={`paragraph-${index}`} className="text-sm leading-6 text-text-primary mb-2">
        {renderInlineMarkdown(line)}
      </Text>,
    );
  });

  if (inCodeBlock) {
    flushCodeBlock();
  }

  return <View>{elements}</View>;
}

/* ============================================================
   INLINE MARKDOWN
============================================================ */

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|__.*?__|`.*?`)/g);

  return parts.map((part, index) => {
    if (!part) {
      return null;
    }

    /* Bold */
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={index} className="font-bold text-primary">
          {part.slice(2, -2)}
        </Text>
      );
    }

    /* Alternative bold */
    if (part.startsWith("__") && part.endsWith("__")) {
      return (
        <Text key={index} className="font-bold text-primary">
          {part.slice(2, -2)}
        </Text>
      );
    }

    /* Inline code */
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <Text key={index} className="text-primary font-mono">
          {part.slice(1, -1)}
        </Text>
      );
    }

    return <Text key={index}>{part}</Text>;
  });
}

/* ============================================================
   SHARE RESOURCE MODAL
============================================================ */

function ShareResourceModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    link: string;
    skillName: string;
    level: ResourceLevel;
  }) => void;
}) {
  const [skillName, setSkillName] = useState<string | null>(null);
  const [level, setLevel] = useState<ResourceLevel | null>(null);
  const [title, setTitle] = useState("");
  const [link, setLink] = useState("");
  const [description, setDescription] = useState("");

  function reset() {
    setSkillName(null);
    setLevel(null);
    setTitle("");
    setLink("");
    setDescription("");
  }

  function handleSubmit() {
    if (!skillName || !level || !title.trim() || !link.trim() || !description.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      description: description.trim(),
      link: link.trim(),
      skillName,
      level,
    });

    reset();
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/90 items-center justify-center px-6"
        onPress={onClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-bg-medium border border-border rounded-[2.5rem] p-8 max-h-[85%]"
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-3xl font-extralight text-text-primary">
                Share <Text className="text-primary">Resource</Text>
              </Text>
              <Pressable onPress={onClose}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <Text className="text-sm italic text-text-muted mb-6">
              "Knowledge is power. Sharing it is the premise of progress."
            </Text>

            <View className="gap-4">
              <View className="flex-row gap-3 z-10">
                <Dropdown
                  label="Skill"
                  value={skillName}
                  options={SKILL_OPTIONS}
                  placeholder="Select Skill"
                  onSelect={setSkillName}
                />
                <Dropdown
                  label="Level"
                  value={level}
                  options={LEVEL_OPTIONS as unknown as string[]}
                  placeholder="Select Level"
                  onSelect={(val) => setLevel(val as ResourceLevel | null)}
                />
              </View>

              <View>
                <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1 mt-2">
                  Title
                </Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. The Complete React Guide"
                  placeholderTextColor="#475569"
                  className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm"
                />
              </View>

              <View>
                <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">
                  Resource URL
                </Text>
                <TextInput
                  value={link}
                  onChangeText={setLink}
                  placeholder="https://..."
                  placeholderTextColor="#475569"
                  autoCapitalize="none"
                  keyboardType="url"
                  className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm"
                />
              </View>

              <View>
                <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">
                  Description
                </Text>
                <TextInput
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Briefly describe what people will learn..."
                  placeholderTextColor="#475569"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                  className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm min-h-[90px]"
                />
              </View>

              <Pressable
                onPress={handleSubmit}
                className="py-4 rounded-2xl bg-primary items-center mt-2"
              >
                <Text className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
                  Publish Resource
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
