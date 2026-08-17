import { Feather } from "@expo/vector-icons";
import { useMemo, useState } from "react";
import {
  Alert,
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
  Project,
  STATUS_FILTERS
} from "../../types/projects";

const PAGE_SIZE = 2;

// TODO: replace with a real Firestore query on the `projects` collection
const MOCK_PROJECTS: Project[] = [
  {
    id: "p1",
    title: "Campus Marketplace App",
    description:
      "A React Native app for students to buy/sell used textbooks and gear on campus.",
    status: "open",
    creator: {id: "u1", name: "Sayma", username: "sayma"},
    members: [{id: "u1", name: "Sayma", username: "sayma"}],
    maxMembers: 4,
    skillsRequired: ["React Native", "Firebase", "UI Design"],
    joinRequests: [{userId: "u2", status: "declined"}],
  },
  {
    id: "p2",
    title: "Study Group Finder",
    description:
      "Match students into study groups based on course and availability.",
    status: "in-progress",
    creator: {id: "u3", name: "Arif Khan", username: "arifk"},
    members: [
      {id: "u3", name: "Arif Khan", username: "arifk"},
      {id: "u1", name: "Sayma", username: "sayma"},
    ],
    maxMembers: 3,
    skillsRequired: ["Node.js", "MongoDB"],
    joinRequests: [],
  },
  {
    id: "p3",
    title: "Alumni Mentorship Portal",
    description: "Connect current students with alumni mentors in their field.",
    status: "completed",
    creator: {id: "u4", name: "Priya Das", username: "priyad"},
    members: [
      {id: "u4", name: "Priya Das", username: "priyad"},
      {id: "u5", name: "Nadia Islam", username: "nadiai"},
    ],
    maxMembers: 2,
    skillsRequired: ["EJS", "Express"],
    joinRequests: [],
  },
];

export default function Projects() {
  const {showToast} = useToast();

  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "open" | "full" | "in-progress" | "completed"
  >("all");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Project | null>(null);
  const [joinTarget, setJoinTarget] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      const isFull = p.members.length >= p.maxMembers;
      const matchesSearch =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.skillsRequired.some((s) => s.toLowerCase().includes(q));

      let matchesStatus = true;
      if (statusFilter === "full") matchesStatus = isFull;
      else if (statusFilter === "open")
        matchesStatus = p.status === "open" && !isFull;
      else if (statusFilter !== "all")
        matchesStatus = p.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [projects, search, statusFilter]);

  const visible = filtered.slice(0, visibleCount);
  const canLoadMore = visibleCount < filtered.length;

  function handleDelete(project: Project) {
    Alert.alert(
      "Delete project?",
      `Are you sure you want to delete "${project.title}"?`,
      [
        {text: "Cancel", style: "cancel"},
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            // TODO: delete the project doc in Firestore
            setProjects((prev) => prev.filter((p) => p.id !== project.id));
            showToast("Project deleted", "success");
          },
        },
      ],
    );
  }

  function handleStart(project: Project) {
    // TODO: update status field in Firestore
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? {...p, status: "in-progress"} : p,
      ),
    );
  }

  function handleComplete(project: Project) {
    // TODO: update status field in Firestore
    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? {...p, status: "completed"} : p)),
    );
  }

  function handleConfirmJoin() {
    if (!joinTarget) return;
    // TODO: write a join request doc in Firestore
    setProjects((prev) =>
      prev.map((p) =>
        p.id === joinTarget.id
          ? {
              ...p,
              joinRequests: [
                ...p.joinRequests,
                {userId: CURRENT_USER_ID, status: "pending"},
              ],
            }
          : p,
      ),
    );
    showToast("Request sent", "success");
    setJoinTarget(null);
  }

  function handleCreate(data: {
    title: string;
    description: string;
    skills: string[];
    maxMembers: number;
  }) {
    // TODO: create the project doc in Firestore
    const newProject: Project = {
      id: `p${Date.now()}`,
      title: data.title,
      description: data.description,
      status: "open",
      creator: {id: CURRENT_USER_ID, name: "Sayma", username: "sayma"},
      members: [{id: CURRENT_USER_ID, name: "Sayma", username: "sayma"}],
      maxMembers: data.maxMembers,
      skillsRequired: data.skills,
      joinRequests: [],
    };
    setProjects((prev) => [newProject, ...prev]);
    setCreateOpen(false);
    showToast("Project created", "success");
  }

  function handleSaveEdit(data: {
    title: string;
    description: string;
    skills: string[];
    maxMembers: number;
  }) {
    if (!editing) return;
    // TODO: update the project doc in Firestore
    setProjects((prev) =>
      prev.map((p) =>
        p.id === editing.id
          ? {
              ...p,
              title: data.title,
              description: data.description,
              skillsRequired: data.skills,
              maxMembers: data.maxMembers,
            }
          : p,
      ),
    );
    setEditing(null);
    showToast("Project updated", "success");
  }

  return (
    <Screen user={null}>
      <View className="px-5 pt-8 pb-4">
        <Text className="text-4xl font-extralight text-text-primary">
          Collaborative <Text className="italic text-primary">Projects</Text>
        </Text>
        <Pressable
          onPress={() => setCreateOpen(true)}
          className="mt-6 py-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex-row items-center justify-center gap-2">
          <Feather name="plus" size={14} color="#FFB300" />
          <Text className="text-primary text-[10px] font-bold uppercase tracking-[0.2em]">
            Create Project
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
            placeholder="Search by title, description, skill..."
            placeholderTextColor="#475569"
            className="flex-1 px-3 py-3.5 text-text-primary text-sm"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color="#64748B" />
            </Pressable>
          )}
        </View>

        {/* Status filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 mb-2"
          style={{flexGrow: 0}}
          contentContainerStyle={{alignItems: "flex-start"}}>
          <View className="flex-row gap-2">
            {STATUS_FILTERS.map((f) => {
              const active = statusFilter === f.value;
              return (
                <Pressable
                  key={f.value}
                  onPress={() => {
                    setStatusFilter(f.value as any);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  className={`px-4 py-2 rounded-xl border ${
                    active
                      ? "bg-primary/10 border-primary/20"
                      : "bg-bg-medium border-border"
                  }`}>
                  <Text
                    className={`text-[10px] font-bold uppercase tracking-widest ${
                      active ? "text-primary" : "text-text-muted"
                    }`}>
                    {f.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Project list */}
      <View className="px-5 gap-5">
        {visible.length === 0 ? (
          <View className="items-center py-20">
            <View className="w-16 h-16 rounded-full border border-border items-center justify-center opacity-50 mb-4">
              <Feather name="folder" size={22} color="#64748B" />
            </View>
            <Text className="text-xl font-extralight text-text-primary mb-1">
              No projects found
            </Text>
            <Text className="text-sm text-text-muted">
              Try adjusting your search or filters.
            </Text>
          </View>
        ) : (
          visible.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onEdit={() => setEditing(project)}
              onDelete={() => handleDelete(project)}
              onStart={() => handleStart(project)}
              onComplete={() => handleComplete(project)}
              onJoin={() => setJoinTarget(project)}
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

      <CreateProjectModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <EditProjectModal
        project={editing}
        onClose={() => setEditing(null)}
        onSubmit={handleSaveEdit}
      />

      <JoinConfirmModal
        project={joinTarget}
        onCancel={() => setJoinTarget(null)}
        onConfirm={handleConfirmJoin}
      />
    </Screen>
  );
}

function ProjectCard({
  project,
  onEdit,
  onDelete,
  onStart,
  onComplete,
  onJoin,
}: {
  project: Project;
  onEdit: () => void;
  onDelete: () => void;
  onStart: () => void;
  onComplete: () => void;
  onJoin: () => void;
}) {
  const isFull = project.members.length >= project.maxMembers;
  const isCreator = project.creator.id === CURRENT_USER_ID;
  const isMember = project.members.some((m) => m.id === CURRENT_USER_ID);
  const myJoinRequest = project.joinRequests.find(
    (r) => r.userId === CURRENT_USER_ID,
  );

  const badge = isFull
    ? {text: "FULL", color: "#ef4444", border: "rgba(239, 68, 68, 0.3)"}
    : project.status === "in-progress"
      ? {
          text: "IN PROGRESS",
          color: "#fbbf24",
          border: "rgba(251, 191, 36, 0.3)",
        }
      : project.status === "completed"
        ? {text: "COMPLETED", color: "#94A3B8", border: "#334155"}
        : {text: "OPEN", color: "#FFB300", border: "#334155"};

  return (
    <View className="bg-bg-medium border border-border rounded-[2rem] p-6">
      <View className="flex-row items-start justify-between mb-5">
        <View
          className="px-3 py-1.5 border rounded-xl"
          style={{borderColor: badge.border}}>
          <Text
            className="text-[9px] font-black uppercase tracking-widest"
            style={{color: badge.color}}>
            {badge.text}
          </Text>
        </View>
        <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
          By {project.creator.name}
        </Text>
      </View>

      <Text className="text-2xl font-extralight text-text-primary mb-2">
        {project.title}
      </Text>
      <Text className="text-sm text-text-muted leading-5 mb-5">
        {project.description}
      </Text>

      <View className="flex-row flex-wrap gap-2 mb-6">
        {project.skillsRequired.map((skill) => (
          <View
            key={skill}
            className="px-3 py-1.5 bg-bg-light border border-border rounded-xl">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
              {skill}
            </Text>
          </View>
        ))}
      </View>

      <View className="pt-5 border-t border-border">
        <View className="flex-row items-center justify-between mb-3">
          <View className="flex-row -space-x-2">
            {project.members.slice(0, 3).map((m) => (
              <View
                key={m.id}
                className="w-8 h-8 rounded-full bg-primary/10 border-2 border-bg-medium items-center justify-center">
                <Text className="text-[10px] font-black text-primary">
                  {m.name.charAt(0)}
                </Text>
              </View>
            ))}
            {project.members.length > 3 && (
              <View className="w-8 h-8 rounded-full bg-bg-light border-2 border-bg-medium items-center justify-center">
                <Text className="text-[9px] font-black text-text-muted">
                  +{project.members.length - 3}
                </Text>
              </View>
            )}
          </View>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
            {project.members.length} / {project.maxMembers} Joined
          </Text>
        </View>

        <View className="w-full h-1.5 rounded-full bg-bg-light overflow-hidden mb-5">
          <View
            className="h-full bg-primary"
            style={{
              width: `${(project.members.length / project.maxMembers) * 100}%`,
            }}
          />
        </View>

        {isCreator ? (
          <View className="flex-row gap-2">
            <Pressable
              onPress={onEdit}
              className="flex-1 py-2.5 border border-primary/50 rounded-xl items-center">
              <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
                Edit
              </Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              className="flex-1 py-2.5 border rounded-xl items-center"
              style={{borderColor: "rgba(239, 68, 68, 0.3)"}}>
              <Text className="text-[9px] font-black uppercase tracking-widest text-red-500">
                Delete
              </Text>
            </Pressable>
            {project.status === "open" && (
              <Pressable
                onPress={onStart}
                className="flex-1 py-2.5 border rounded-xl items-center"
                style={{
                  borderColor: "rgba(251, 191, 36, 0.3)",
                  backgroundColor: "rgba(251, 191, 36, 0.1)",
                }}>
                <Text
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{color: "#fbbf24"}}>
                  Start
                </Text>
              </Pressable>
            )}
            {project.status === "in-progress" && (
              <Pressable
                onPress={onComplete}
                className="flex-1 py-2.5 border rounded-xl items-center"
                style={{
                  borderColor: "rgba(16, 185, 129, 0.3)",
                  backgroundColor: "rgba(16, 185, 129, 0.1)",
                }}>
                <Text
                  className="text-[9px] font-black uppercase tracking-widest"
                  style={{color: "#10b981"}}>
                  Complete
                </Text>
              </Pressable>
            )}
          </View>
        ) : isMember ? (
          <View className="py-3 rounded-2xl bg-primary/20 border border-primary/30 items-center">
            <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
              Joined
            </Text>
          </View>
        ) : isFull ? (
          <View className="py-3 rounded-2xl bg-bg-light border border-border items-center">
            <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted">
              Project Full
            </Text>
          </View>
        ) : myJoinRequest?.status === "pending" ? (
          <View className="py-3 rounded-2xl bg-bg-light border border-border items-center">
            <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted">
              Request Sent
            </Text>
          </View>
        ) : myJoinRequest?.status === "declined" ? (
          <View
            className="py-3 rounded-2xl border items-center"
            style={{
              borderColor: "rgba(239, 68, 68, 0.2)",
              backgroundColor: "rgba(239, 68, 68, 0.1)",
            }}>
            <Text className="text-[9px] font-black uppercase tracking-widest text-red-500">
              Declined
            </Text>
          </View>
        ) : (
          <Pressable
            onPress={onJoin}
            className="py-3 rounded-2xl bg-primary items-center">
            <Text className="text-[9px] font-black uppercase tracking-widest text-black">
              Join Project
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

function SkillTagInput({
  skills,
  onChange,
  placeholder,
}: {
  skills: string[];
  onChange: (skills: string[]) => void;
  placeholder: string;
}) {
  const [input, setInput] = useState("");

  function addSkill() {
    const skill = input.trim();
    if (!skill || skills.includes(skill)) return;
    onChange([...skills, skill]);
    setInput("");
  }

  return (
    <View>
      <View className="flex-row flex-wrap gap-2 mb-3">
        {skills.map((skill) => (
          <View
            key={skill}
            className="flex-row items-center gap-2 px-3 py-1.5 bg-primary/20 border border-primary/30 rounded-xl">
            <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
              {skill}
            </Text>
            <Pressable
              onPress={() => onChange(skills.filter((s) => s !== skill))}>
              <Feather name="x" size={12} color="#FFB300" />
            </Pressable>
          </View>
        ))}
      </View>
      <TextInput
        value={input}
        onChangeText={setInput}
        onSubmitEditing={addSkill}
        placeholder={placeholder}
        placeholderTextColor="#475569"
        className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm"
      />
    </View>
  );
}

function CreateProjectModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    skills: string[];
    maxMembers: number;
  }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [maxMembers, setMaxMembers] = useState("");
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setDescription("");
    setSkills([]);
    setMaxMembers("");
    setError("");
  }

  function handleSubmit() {
    const n = parseInt(maxMembers, 10);
    if (!title.trim() || !description.trim()) return;
    if (!n || n < 2 || n > 10) {
      setError("Members must be between 2 and 10");
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      skills,
      maxMembers: n,
    });
    reset();
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/90 items-center justify-center px-6"
        onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-bg-medium border border-border rounded-[2.5rem] p-8">
          <View className="flex-row items-start justify-between mb-6">
            <Text className="text-3xl font-extralight text-text-primary">
              Create Project
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <View className="gap-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Project Title"
              placeholderTextColor="#475569"
              className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Project Description"
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm min-h-[90px]"
            />
            <SkillTagInput
              skills={skills}
              onChange={setSkills}
              placeholder="Required Skills"
            />
            <View>
              <TextInput
                value={maxMembers}
                onChangeText={setMaxMembers}
                placeholder="Members Needed (2-10)"
                placeholderTextColor="#475569"
                keyboardType="number-pad"
                className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm"
              />
              {error !== "" && (
                <Text className="text-xs text-red-500 mt-2 px-1">{error}</Text>
              )}
            </View>

            <Pressable
              onPress={handleSubmit}
              className="py-4 rounded-2xl bg-primary items-center mt-2">
              <Text className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
                Launch Project
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function EditProjectModal({
  project,
  onClose,
  onSubmit,
}: {
  project: Project | null;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    skills: string[];
    maxMembers: number;
  }) => void;
}) {
  const [title, setTitle] = useState(project?.title ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [skills, setSkills] = useState<string[]>(project?.skillsRequired ?? []);
  const [maxMembers, setMaxMembers] = useState(
    project ? String(project.maxMembers) : "",
  );

  // reset local state whenever a different project is opened for editing
  useMemo(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description);
      setSkills(project.skillsRequired);
      setMaxMembers(String(project.maxMembers));
    }
  }, [project?.id]);

  if (!project) return null;

  function handleSubmit() {
    const n = parseInt(maxMembers, 10);
    if (!title.trim() || !description.trim() || !n) return;
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      skills,
      maxMembers: n,
    });
  }

  return (
    <Modal
      visible={!!project}
      animationType="fade"
      transparent
      onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/90 items-center justify-center px-6"
        onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-bg-medium border border-border rounded-[2.5rem] p-8">
          <View className="flex-row items-start justify-between mb-6">
            <Text className="text-3xl font-extralight text-text-primary">
              Edit Project
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={20} color="#64748B" />
            </Pressable>
          </View>

          <View className="gap-4">
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#475569"
              className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm"
            />
            <TextInput
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm min-h-[90px]"
            />
            <SkillTagInput
              skills={skills}
              onChange={setSkills}
              placeholder="Add another skill..."
            />
            <TextInput
              value={maxMembers}
              onChangeText={setMaxMembers}
              keyboardType="number-pad"
              className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm"
            />

            <Pressable
              onPress={handleSubmit}
              className="py-4 rounded-2xl bg-primary items-center mt-2">
              <Text className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
                Save Changes
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function JoinConfirmModal({
  project,
  onCancel,
  onConfirm,
}: {
  project: Project | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!project) return null;

  return (
    <Modal
      visible={!!project}
      animationType="fade"
      transparent
      onRequestClose={onCancel}>
      <Pressable
        className="flex-1 bg-black/90 items-center justify-center px-6"
        onPress={onCancel}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-bg-medium border border-border rounded-[2rem] p-7">
          <View className="w-14 h-14 rounded-2xl bg-bg-light border border-border items-center justify-center mb-5">
            <Feather name="users" size={24} color="#FFB300" />
          </View>
          <Text className="text-2xl font-extralight text-text-primary mb-2">
            Send Request?
          </Text>
          <Text className="text-sm text-text-muted leading-5 mb-7">
            Ask the creator to join{" "}
            <Text className="font-medium text-primary">{project.title}</Text>.
            They will review and approve your request.
          </Text>
          <View className="flex-row gap-3">
            <Pressable
              onPress={onCancel}
              className="flex-1 py-3 border border-border rounded-2xl items-center">
              <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              className="flex-1 py-3 bg-primary rounded-2xl items-center">
              <Text className="text-[9px] font-black uppercase tracking-widest text-black">
                Confirm
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
