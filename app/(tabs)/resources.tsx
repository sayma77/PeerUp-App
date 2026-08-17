import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Screen from "../../components/Screen";
import { useToast } from "../../context/ToastContext";
import {
  CURRENT_USER_ID,
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
    description: "A deep dive into hooks, context, and component patterns.",
    link: "https://react.dev",
    skillName: "React Native",
    level: "Beginner",
    addedBy: { id: "u1", name: "Sayma" },
  },
  {
    id: "r2",
    title: "Firestore Data Modeling",
    description: "How to structure collections and documents for real-time apps.",
    link: "https://firebase.google.com/docs/firestore",
    skillName: "Firebase",
    level: "Medium",
    addedBy: { id: "u3", name: "Arif Khan" },
  },
  {
    id: "r3",
    title: "Advanced MongoDB Aggregation",
    description: "Pipelines, indexes, and performance tuning for large datasets.",
    link: "https://www.mongodb.com/docs/manual/aggregation/",
    skillName: "MongoDB",
    level: "Hard",
    addedBy: { id: "u4", name: "Priya Das" },
  },
];

const levelColors: Record<ResourceLevel, { bg: string; text: string; border: string }> = {
  Beginner: { bg: "rgba(255,179,0,0.1)", text: "#FFB300", border: "rgba(255,179,0,0.2)" },
  Medium: { bg: "rgba(251,191,36,0.1)", text: "#fbbf24", border: "rgba(251,191,36,0.2)" },
  Hard: { bg: "rgba(239,68,68,0.1)", text: "#ef4444", border: "rgba(239,68,68,0.2)" },
};

export default function Resources() {
  const { showToast } = useToast();

  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState<string | null>(null);
  const [levelFilter, setLevelFilter] = useState<ResourceLevel | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [shareOpen, setShareOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources.filter((r) => {
      const matchesSearch =
        !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
      const matchesSkill = !skillFilter || r.skillName === skillFilter;
      const matchesLevel = !levelFilter || r.level === levelFilter;
      return matchesSearch && matchesSkill && matchesLevel;
    });
  }, [resources, search, skillFilter, levelFilter]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  function handleDelete(resource: Resource) {
    // TODO: delete the resource doc in Firestore
    setResources((prev) => prev.filter((r) => r.id !== resource.id));
    showToast("Resource deleted", "success");
  }

  function handlePublish(data: {
    title: string;
    description: string;
    link: string;
    skillName: string;
    level: ResourceLevel;
  }) {
    // TODO: create the resource doc in Firestore
    const newResource: Resource = {
      id: `r${Date.now()}`,
      title: data.title,
      description: data.description,
      link: data.link,
      skillName: data.skillName,
      level: data.level,
      addedBy: { id: CURRENT_USER_ID, name: "Sayma" },
    };
    setResources((prev) => [newResource, ...prev]);
    setShareOpen(false);
    showToast("Resource published", "success");
  }

  return (
    <Screen user={null}>
      <View className="px-5 pt-8 pb-4">
        <Text className="text-4xl font-extralight text-text-primary">
          Learning <Text className="italic text-primary">Resources</Text>
        </Text>

        <Pressable
          onPress={() => setShareOpen(true)}
          className="mt-6 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-center gap-2">
          <Feather name="plus" size={14} color="#FFB300" />
          <Text className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
            Share Resource
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

        {/* Dropdown Filters */}
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

      {/* Resource list */}
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
              onDelete={() => handleDelete(resource)}
            />
          ))
        )}

        {canLoadMore && (
          <Pressable
            onPress={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="py-3.5 rounded-2xl border border-border items-center mb-6">
            <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
              Load More
            </Text>
          </Pressable>
        )}
      </View>

      <ShareResourceModal
        visible={shareOpen}
        onClose={() => setShareOpen(false)}
        onSubmit={handlePublish}
      />
    </Screen>
  );
}

// ----------------------------------------------------
// NEW COMPONENT: Reusable Native-feeling Dropdown
// ----------------------------------------------------
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
        className="flex-row items-center justify-between px-4 py-3.5 bg-bg-medium border border-border rounded-2xl">
        <Text
          className={`text-sm ${
            value ? "text-text-primary" : "text-text-muted"
          }`}
          numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Feather name="chevron-down" size={16} color="#64748B" />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <Pressable
          className="flex-1 justify-end bg-black/70"
          onPress={() => setIsOpen(false)}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-bg-medium border-t border-border rounded-t-[2.5rem] p-6 pb-10 max-h-[70%] w-full">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-light text-text-primary">
                {placeholder}
              </Text>
              <Pressable onPress={() => setIsOpen(false)}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Option to clear filter */}
              <Pressable
                onPress={() => {
                  onSelect(null);
                  setIsOpen(false);
                }}
                className="py-4 border-b border-border flex-row justify-between items-center">
                <Text
                  className={`text-base ${
                    value === null ? "text-primary font-bold" : "text-text-primary"
                  }`}>
                  {placeholder.includes("Select") ? "Clear Selection" : `All (${placeholder.replace("All ", "")})`}
                </Text>
                {value === null && (
                  <Feather name="check" size={18} color="#FFB300" />
                )}
              </Pressable>

              {/* Mapped Options */}
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    setIsOpen(false);
                  }}
                  className="py-4 border-b border-border flex-row justify-between items-center">
                  <Text
                    className={`text-base ${
                      value === opt ? "text-primary font-bold" : "text-text-primary"
                    }`}>
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

function ResourceCard({
  resource,
  onDelete,
}: {
  resource: Resource;
  onDelete: () => void;
}) {
  const isOwner = resource.addedBy.id === CURRENT_USER_ID;
  const lc = levelColors[resource.level];

  return (
    <View className="bg-bg-medium border border-border rounded-[2rem] p-6">
      <View className="flex-row items-start justify-between mb-5">
        <View className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl">
          <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
            {resource.skillName}
          </Text>
        </View>
        <View
          className="px-3 py-1.5 border rounded-xl"
          style={{ backgroundColor: lc.bg, borderColor: lc.border }}>
          <Text className="text-[9px] font-bold uppercase tracking-widest" style={{ color: lc.text }}>
            {resource.level}
          </Text>
        </View>
      </View>

      <Text className="text-2xl font-extralight text-text-primary mb-2">{resource.title}</Text>
      <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
        By {resource.addedBy.name}
      </Text>
      <Text className="text-sm text-text-muted leading-5 mb-6">{resource.description}</Text>

      <View className="flex-row items-center justify-between pt-5 border-t border-border">
        <Pressable
          onPress={() => Linking.openURL(resource.link)}
          className="flex-row items-center gap-2">
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
  );
}

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
    if (!skillName || !level || !title.trim() || !link.trim() || !description.trim()) return;
    onSubmit({ title: title.trim(), description: description.trim(), link: link.trim(), skillName, level });
    reset();
  }

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/90 items-center justify-center px-6" onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-bg-medium border border-border rounded-[2.5rem] p-8 max-h-[85%]">
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
              
              {/* Dropdowns used in Modal Form! */}
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

              <Pressable onPress={handleSubmit} className="py-4 rounded-2xl bg-primary items-center mt-2">
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