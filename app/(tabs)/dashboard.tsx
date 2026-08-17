import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useState } from "react";
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
  CATEGORIES,
  IncomingRequest,
  MyProject,
  MySkill,
  OutgoingRequest,
  RequestStatus,
} from "../../types/dashboard";

// TODO: replace with real data from Firestore (users/{uid}, requests where mentor==uid, etc.)
const MOCK_USER = {name: "Sayma", rating: 4.7, reviewCount: 12};
const MOCK_INCOMING: IncomingRequest[] = [
  {
    id: "r1",
    skillName: "React Basics",
    requesterName: "Jamal Uddin",
    status: "pending",
  },
  {
    id: "r2",
    skillName: "Guitar Chords",
    requesterName: "Priya Das",
    status: "accepted",
  },
];
const MOCK_OUTGOING: OutgoingRequest[] = [
  {
    id: "o1",
    skillName: "Photography 101",
    mentorId: "m1",
    skillId: "s1",
    mentorName: "Arif Khan",
    status: "completed",
  },
];
const MOCK_SKILLS: MySkill[] = [
  {
    id: "s1",
    name: "React Native",
    category: "Technology",
    description: "Building mobile apps with Expo",
  },
];
const MOCK_PROJECTS: MyProject[] = [
  {
    id: "p1",
    title: "Campus Marketplace App",
    joinRequests: [
      {
        userId: "u9",
        username: "nadia",
        userName: "Nadia Islam",
        status: "pending",
      },
    ],
  },
];

type Tab = "overview" | "my-skills" | "requests" | "project-requests";

const TABS: {key: Tab; label: string; icon: keyof typeof Feather.glyphMap}[] = [
  {key: "overview", label: "Overview", icon: "grid"},
  {key: "my-skills", label: "My Skills", icon: "zap"},
  {key: "requests", label: "My Requests", icon: "send"},
  {key: "project-requests", label: "Project Requests", icon: "briefcase"},
];

export default function Dashboard() {
  const router = useRouter();
  const {showToast} = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [incoming, setIncoming] = useState(MOCK_INCOMING);
  const [outgoing, setOutgoing] = useState(MOCK_OUTGOING);
  const [skills, setSkills] = useState(MOCK_SKILLS);
  const [projects, setProjects] = useState(MOCK_PROJECTS);

  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [editSkillOpen, setEditSkillOpen] = useState<MySkill | null>(null);
  const [reviewOpen, setReviewOpen] = useState<OutgoingRequest | null>(null);

  const pendingProjectRequestCount = projects.reduce(
    (count, p) =>
      count + p.joinRequests.filter((r) => r.status === "pending").length,
    0,
  );

  async function updateIncomingStatus(id: string, status: RequestStatus) {
    // TODO: PATCH the request doc in Firestore
    if (status === "declined") {
      setIncoming((prev) => prev.filter((r) => r.id !== id));
      showToast("Request removed", "error");
      return;
    }
    setIncoming((prev) => prev.map((r) => (r.id === id ? {...r, status} : r)));
    showToast(`Request ${status}!`);
  }

  function handleDeleteSkill(skill: MySkill) {
    Alert.alert(
      "Remove Skill",
      `Are you sure you want to remove "${skill.name}" from your profile?`,
      [
        {text: "Cancel", style: "cancel"},
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            // TODO: DELETE the skill doc in Firestore
            setSkills((prev) => prev.filter((s) => s.id !== skill.id));
            showToast("Skill removed");
          },
        },
      ],
    );
  }

  function handleAcceptProjectRequest(projectId: string, userId: string) {
    // TODO: update joinRequest status in Firestore
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              joinRequests: p.joinRequests.map((r) =>
                r.userId === userId ? {...r, status: "accepted"} : r,
              ),
            }
          : p,
      ),
    );
    showToast("Request accepted!");
  }

  function handleDeclineProjectRequest(projectId: string, userId: string) {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === projectId
          ? {
              ...p,
              joinRequests: p.joinRequests.map((r) =>
                r.userId === userId ? {...r, status: "declined"} : r,
              ),
            }
          : p,
      ),
    );
    showToast("Request declined", "error");
  }

  return (
    <Screen user={MOCK_USER}>
      <View className="px-5 pt-6 pb-4">
        <Text className="text-3xl font-bold text-text-primary mb-1">
          Dashboard
        </Text>
      </View>

      {/* Tab pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="px-5 mb-6"
        style={{flexGrow: 0}}
        contentContainerStyle={{alignItems: "flex-start"}}>
        <View className="flex-row gap-2">
          {TABS.map((tab) => {
            const active = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                className={`flex-row items-center gap-2 px-4 py-2.5 rounded-xl border ${
                  active
                    ? "bg-primary/10 border-primary/20"
                    : "bg-bg-medium border-border"
                }`}>
                <Feather
                  name={tab.icon}
                  size={14}
                  color={active ? "#FFB300" : "#64748B"}
                />
                <Text
                  className={`text-xs font-bold ${active ? "text-primary" : "text-text-muted"}`}>
                  {tab.label}
                </Text>
                {tab.key === "project-requests" &&
                  pendingProjectRequestCount > 0 && (
                    <View className="bg-primary rounded-full min-w-[16px] h-4 px-1 items-center justify-center">
                      <Text className="text-[9px] font-black text-black">
                        {pendingProjectRequestCount}
                      </Text>
                    </View>
                  )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View className="px-5 gap-6">
        {activeTab === "overview" && (
          <OverviewTab
            user={MOCK_USER}
            incoming={incoming}
            outgoing={outgoing}
            onUpdateStatus={updateIncomingStatus}
          />
        )}

        {activeTab === "my-skills" && (
          <MySkillsTab
            skills={skills}
            onAdd={() => setAddSkillOpen(true)}
            onEdit={(skill) => setEditSkillOpen(skill)}
            onDelete={handleDeleteSkill}
          />
        )}

        {activeTab === "requests" && (
          <RequestsTab
            outgoing={outgoing}
            onReview={(req) => setReviewOpen(req)}
          />
        )}

        {activeTab === "project-requests" && (
          <ProjectRequestsTab
            projects={projects}
            onAccept={handleAcceptProjectRequest}
            onDecline={handleDeclineProjectRequest}
          />
        )}

        {/* Always-visible CTA cards */}
        <View className="gap-4 mb-6">
          <View className="bg-bg-medium border border-border rounded-3xl p-6">
            <Text className="text-lg font-light text-text-primary mb-2">
              Find a New Skill
            </Text>
            <Text className="text-sm text-text-muted mb-5">
              Explore thousands of skills and connect with expert peers.
            </Text>
            <Pressable onPress={() => router.push("/skills")}>
              <LinearGradient
                colors={["#D97706", "#F59E0B"]}
                className="py-3.5 rounded-xl items-center">
                <Text className="text-white text-[10px] font-bold uppercase tracking-widest">
                  Browse Skills
                </Text>
              </LinearGradient>
            </Pressable>
          </View>

          <View className="bg-bg-medium border border-border rounded-3xl p-6">
            <Text className="text-lg font-light text-text-primary mb-2">
              Share Your Knowledge
            </Text>
            <Text className="text-sm text-text-muted mb-5">
              List your expertise and help others grow their careers.
            </Text>
            <Pressable
              onPress={() => setAddSkillOpen(true)}
              className="py-3.5 rounded-xl border border-border bg-bg-light items-center">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
                Add To Profile
              </Text>
            </Pressable>
          </View>
        </View>
      </View>

      <AddSkillModal
        visible={addSkillOpen}
        onClose={() => setAddSkillOpen(false)}
        onSubmit={(skill) => {
          // TODO: POST to Firestore, use returned doc id
          setSkills((prev) => [...prev, {...skill, id: `s${Date.now()}`}]);
          setAddSkillOpen(false);
          showToast("Skill added to your profile!");
        }}
      />

      <EditSkillModal
        skill={editSkillOpen}
        onClose={() => setEditSkillOpen(null)}
        onSubmit={(updated) => {
          // TODO: update the skill doc in Firestore
          setSkills((prev) =>
            prev.map((s) => (s.id === updated.id ? updated : s)),
          );
          setEditSkillOpen(null);
          showToast("Skill updated!");
        }}
      />

      <ReviewModal
        request={reviewOpen}
        onClose={() => setReviewOpen(null)}
        onSubmit={() => {
          // TODO: POST review to Firestore
          setReviewOpen(null);
          showToast("Review submitted!");
        }}
      />
    </Screen>
  );
}

// ── Overview Tab ──────────────────────────────────────────

function OverviewTab({
  user,
  incoming,
  outgoing,
  onUpdateStatus,
}: {
  user: {name: string; rating: number; reviewCount: number};
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
  onUpdateStatus: (id: string, status: RequestStatus) => void;
}) {
  const pendingIncoming = incoming.filter((r) => r.status === "pending").length;
  const earnedSkills = outgoing.filter((r) => r.status === "completed").length;
  const inProgressSkills = outgoing.filter(
    (r) => r.status === "pending" || r.status === "accepted",
  ).length;
  const peopleHelped = incoming.filter((r) => r.status === "completed").length;

  return (
    <View className="gap-6">
      <View className="flex-row flex-wrap gap-4">
        <StatCard
          label="Pending Requests"
          value={pendingIncoming}
          icon="send"
          sub={
            pendingIncoming === 0
              ? "No pending requests"
              : `${pendingIncoming} awaiting your reply`
          }
        />
        <StatCard
          label="Skills Earned"
          value={earnedSkills}
          icon="check-circle"
          sub={`${inProgressSkills} in progress`}
          valueColor="#FFB300"
        />
        <StatCard
          label="People Helped"
          value={peopleHelped}
          icon="users"
          sub={
            peopleHelped === 0
              ? "Start teaching to see impact"
              : `${peopleHelped} ${peopleHelped === 1 ? "person" : "people"} taught`
          }
        />
        <StatCard
          label="Global Rating"
          value={user.rating.toFixed(1)}
          icon="star"
          sub={`${user.reviewCount} reviews`}
        />
      </View>

      <View className="bg-bg-medium border border-border rounded-2xl overflow-hidden">
        <View className="p-5 border-b border-border bg-bg-light">
          <Text className="text-base font-light text-text-primary">
            Recent Interactions
          </Text>
        </View>
        {incoming.length === 0 ? (
          <Text className="p-8 text-center text-sm italic text-text-muted">
            No one has requested a skill from you yet.
          </Text>
        ) : (
          incoming.map((req) => (
            <View
              key={req.id}
              className="p-5 border-b border-border last:border-0">
              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center gap-3 flex-1">
                  <View className="w-11 h-11 rounded-xl bg-bg-light border border-border items-center justify-center">
                    <Text className="text-xs font-light text-primary uppercase">
                      {req.requesterName.substring(0, 2)}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-text-primary">
                      {req.skillName}
                    </Text>
                    <Text className="text-xs text-text-muted mt-0.5">
                      Requested by {req.requesterName}
                    </Text>
                  </View>
                </View>
                <Text
                  className="text-[9px] font-bold uppercase"
                  style={{
                    color: req.status === "accepted" ? "#FFB300" : "#64748B",
                  }}>
                  {req.status}
                </Text>
              </View>

              <View className="flex-row gap-2">
                {req.status === "pending" && (
                  <>
                    <SmallButton
                      label="Accept"
                      onPress={() => onUpdateStatus(req.id, "accepted")}
                      filled
                    />
                    <SmallButton
                      label="Decline"
                      onPress={() => onUpdateStatus(req.id, "declined")}
                    />
                  </>
                )}
                {req.status === "accepted" && (
                  <SmallButton
                    label="Mark Completed"
                    onPress={() => onUpdateStatus(req.id, "completed")}
                    outline
                  />
                )}
                {req.status === "completed" && (
                  <Text className="text-[9px] font-bold uppercase text-text-muted">
                    Success!
                  </Text>
                )}
              </View>
            </View>
          ))
        )}
      </View>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  sub,
  valueColor = "#F8FAFC",
}: {
  label: string;
  value: string | number;
  icon: keyof typeof Feather.glyphMap;
  sub: string;
  valueColor?: string;
}) {
  return (
    <View className="bg-bg-medium border border-border rounded-2xl p-5 flex-1 min-w-[45%]">
      <View className="flex-row items-center justify-between mb-3">
        <Text
          className="text-[9px] font-bold uppercase tracking-widest text-text-muted flex-1"
          numberOfLines={1}>
          {label}
        </Text>
        <View className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 items-center justify-center">
          <Feather name={icon} size={14} color="#FFB300" />
        </View>
      </View>
      <Text className="text-2xl font-light" style={{color: valueColor}}>
        {value}
      </Text>
      <Text className="text-xs mt-1 text-text-muted">{sub}</Text>
    </View>
  );
}

function SmallButton({
  label,
  onPress,
  filled,
  outline,
}: {
  label: string;
  onPress: () => void;
  filled?: boolean;
  outline?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`px-3 py-1.5 rounded-lg ${
        filled
          ? "bg-primary"
          : outline
            ? "bg-primary/20 border border-primary/30"
            : "bg-bg-light"
      }`}>
      <Text
        className="text-[9px] font-bold uppercase"
        style={{color: filled ? "#0A0E17" : outline ? "#FFB300" : "#64748B"}}>
        {label}
      </Text>
    </Pressable>
  );
}

// ── My Skills Tab ──────────────────────────────────────────

function MySkillsTab({
  skills,
  onAdd,
  onEdit,
  onDelete,
}: {
  skills: MySkill[];
  onAdd: () => void;
  onEdit: (skill: MySkill) => void;
  onDelete: (skill: MySkill) => void;
}) {
  return (
    <View className="bg-bg-medium border border-border rounded-2xl overflow-hidden">
      <View className="p-5 border-b border-border bg-bg-light flex-row items-center justify-between">
        <View>
          <Text className="text-base font-light text-text-primary">
            My Skills
          </Text>
          <Text className="text-xs text-text-muted mt-0.5">
            {skills.length} skill{skills.length !== 1 ? "s" : ""} listed
          </Text>
        </View>
        <Pressable
          onPress={onAdd}
          className="w-8 h-8 rounded-lg bg-primary/10 items-center justify-center">
          <Feather name="plus" size={16} color="#FFB300" />
        </Pressable>
      </View>

      {skills.length === 0 ? (
        <View className="p-10 items-center">
          <Feather
            name="zap"
            size={32}
            color="#FFB300"
            style={{opacity: 0.2, marginBottom: 12}}
          />
          <Text className="text-sm italic text-text-muted">
            You haven't listed any skills yet.
          </Text>
        </View>
      ) : (
        skills.map((skill) => (
          <View
            key={skill.id}
            className="p-5 border-b border-border last:border-0 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
                <Feather name="zap" size={16} color="#FFB300" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-text-primary">
                  {skill.name}
                </Text>
                <View className="flex-row items-center gap-2 mt-1 flex-wrap">
                  <View className="bg-primary/10 rounded-full px-2 py-0.5">
                    <Text className="text-[9px] font-bold uppercase text-primary">
                      {skill.category}
                    </Text>
                  </View>
                  {skill.description ? (
                    <Text
                      className="text-xs text-text-muted flex-shrink"
                      numberOfLines={1}>
                      {skill.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
            <View className="flex-row gap-2 ml-2">
              <Pressable
                onPress={() => onEdit(skill)}
                className="p-2 rounded-lg bg-primary/10">
                <Feather name="edit-2" size={14} color="#FFB300" />
              </Pressable>
              <Pressable
                onPress={() => onDelete(skill)}
                className="p-2 rounded-lg bg-red-400/10">
                <Feather name="trash-2" size={14} color="#f87171" />
              </Pressable>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ── Requests Tab (outgoing) ──────────────────────────────────────────

function RequestsTab({
  outgoing,
  onReview,
}: {
  outgoing: OutgoingRequest[];
  onReview: (req: OutgoingRequest) => void;
}) {
  return (
    <View className="bg-bg-medium border border-border rounded-2xl overflow-hidden">
      <View className="p-5 border-b border-border bg-bg-light">
        <Text className="text-base font-light text-text-primary">
          My Sent Requests
        </Text>
        <Text className="text-xs text-text-muted mt-1">
          Track the status of skills you've asked to learn
        </Text>
      </View>

      {outgoing.length === 0 ? (
        <Text className="p-10 text-center text-text-muted">
          You haven't sent any requests yet.
        </Text>
      ) : (
        outgoing.map((req) => (
          <View
            key={req.id}
            className="p-5 border-b border-border last:border-0 flex-row items-center justify-between">
            <View className="flex-row items-center gap-3 flex-1">
              <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center">
                <Text className="text-xs font-bold text-primary">
                  {req.mentorName.charAt(0)}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-text-primary">
                  {req.skillName}
                </Text>
                <Text className="text-xs text-text-muted">
                  Mentor: {req.mentorName}
                </Text>
              </View>
            </View>
            <View className="items-end gap-2">
              {req.status === "completed" && (
                <SmallButton
                  label="Leave Review"
                  onPress={() => onReview(req)}
                  filled
                />
              )}
              <Text
                className="text-[10px] font-bold uppercase"
                style={{
                  color: req.status === "pending" ? "#eab308" : "#FFB300",
                }}>
                {req.status}
              </Text>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

// ── Project Requests Tab ──────────────────────────────────────────

function ProjectRequestsTab({
  projects,
  onAccept,
  onDecline,
}: {
  projects: MyProject[];
  onAccept: (projectId: string, userId: string) => void;
  onDecline: (projectId: string, userId: string) => void;
}) {
  const projectsWithRequests = projects.filter(
    (p) => p.joinRequests.length > 0,
  );

  return (
    <View className="bg-bg-medium border border-border rounded-2xl overflow-hidden">
      <View className="p-5 border-b border-border bg-bg-light">
        <Text className="text-base font-light text-text-primary">
          Project Join Requests
        </Text>
        <Text className="text-xs text-text-muted mt-1">
          Manage requests from people who want to join your projects
        </Text>
      </View>

      {projectsWithRequests.length === 0 ? (
        <Text className="p-8 text-center text-sm italic text-text-muted">
          No join requests for your projects yet.
        </Text>
      ) : (
        projectsWithRequests.map((project) =>
          project.joinRequests.map((jr) => (
            <View
              key={`${project.id}-${jr.userId}`}
              className="p-5 border-b border-border last:border-0">
              <View className="flex-row items-center justify-between">
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-text-primary">
                    {jr.userName}
                  </Text>
                  <Text className="text-xs text-text-muted mt-0.5">
                    Wants to join{" "}
                    <Text className="text-primary">{project.title}</Text>
                  </Text>
                </View>
                <View className="items-end gap-2">
                  {jr.status === "pending" && (
                    <View className="flex-row gap-2">
                      <SmallButton
                        label="Accept"
                        onPress={() => onAccept(project.id, jr.userId)}
                        filled
                      />
                      <SmallButton
                        label="Decline"
                        onPress={() => onDecline(project.id, jr.userId)}
                      />
                    </View>
                  )}
                  <Text
                    className="text-[9px] font-bold uppercase"
                    style={{
                      color:
                        jr.status === "pending"
                          ? "#eab308"
                          : jr.status === "accepted"
                            ? "#FFB300"
                            : "#f87171",
                    }}>
                    {jr.status}
                  </Text>
                </View>
              </View>
            </View>
          )),
        )
      )}
    </View>
  );
}

// ── Modals ──────────────────────────────────────────

function AddSkillModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (skill: Omit<MySkill, "id">) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");

  function reset() {
    setName("");
    setCategory(CATEGORIES[0]);
    setDescription("");
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 items-center justify-center px-5">
        <View className="w-full bg-bg-medium border border-border rounded-2xl overflow-hidden">
          <View className="p-5 border-b border-border flex-row items-center justify-between">
            <Text className="text-lg font-light text-text-primary">
              Share Your Expertise
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={18} color="#64748B" />
            </Pressable>
          </View>
          <View className="p-5 gap-4">
            <FormField label="Skill Name">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Advanced Photography"
                placeholderTextColor="#64748B"
                className="bg-bg-light border border-border rounded-xl px-4 py-3 text-text-primary text-sm"
              />
            </FormField>
            <FormField label="Category">
              <CategoryPicker value={category} onChange={setCategory} />
            </FormField>
            <FormField label="Description">
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#64748B"
                className="bg-bg-light border border-border rounded-xl px-4 py-3 text-text-primary text-sm"
                style={{textAlignVertical: "top"}}
              />
            </FormField>
            <Pressable
              onPress={() => {
                if (!name.trim()) return;
                onSubmit({name, category, description});
                reset();
              }}
              className="bg-primary py-3.5 rounded-xl items-center mt-2">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-bg-light">
                Confirm & Add
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditSkillModal({
  skill,
  onClose,
  onSubmit,
}: {
  skill: MySkill | null;
  onClose: () => void;
  onSubmit: (skill: MySkill) => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");

  // Sync fields whenever a new skill is opened
  if (skill && name === "" && skill.name !== "") {
    // simple one-time sync on open; fine for this scale of form
  }

  function openWith(s: MySkill) {
    setName(s.name);
    setCategory(s.category);
    setDescription(s.description ?? "");
  }

  return (
    <Modal
      visible={!!skill}
      transparent
      animationType="fade"
      onShow={() => skill && openWith(skill)}
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 items-center justify-center px-5">
        <View className="w-full bg-bg-medium border border-border rounded-2xl overflow-hidden">
          <View className="p-5 border-b border-border flex-row items-center justify-between">
            <Text className="text-lg font-light text-text-primary">
              Edit Skill
            </Text>
            <Pressable onPress={onClose}>
              <Feather name="x" size={18} color="#64748B" />
            </Pressable>
          </View>
          <View className="p-5 gap-4">
            <FormField label="Skill Name">
              <TextInput
                value={name}
                onChangeText={setName}
                placeholderTextColor="#64748B"
                className="bg-bg-light border border-border rounded-xl px-4 py-3 text-text-primary text-sm"
              />
            </FormField>
            <FormField label="Category">
              <CategoryPicker value={category} onChange={setCategory} />
            </FormField>
            <FormField label="Description">
              <TextInput
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                placeholderTextColor="#64748B"
                className="bg-bg-light border border-border rounded-xl px-4 py-3 text-text-primary text-sm"
                style={{textAlignVertical: "top"}}
              />
            </FormField>
            <View className="flex-row gap-3 mt-2">
              <Pressable
                onPress={onClose}
                className="flex-1 py-3.5 rounded-xl border border-border items-center">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Cancel
                </Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  if (!skill) return;
                  onSubmit({...skill, name, category, description});
                }}
                className="flex-1 bg-primary py-3.5 rounded-xl items-center">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-bg-light">
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function ReviewModal({
  request,
  onClose,
  onSubmit,
}: {
  request: OutgoingRequest | null;
  onClose: () => void;
  onSubmit: (rating: number, comment: string) => void;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  return (
    <Modal
      visible={!!request}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 items-center justify-center px-5">
        <View className="w-full bg-bg-medium border border-border rounded-2xl p-6">
          <Text className="text-lg font-light text-text-primary mb-1">
            Rate your Mentor
          </Text>
          {request && (
            <Text className="text-xs text-text-muted mb-5">
              How was your experience learning{" "}
              <Text className="text-primary">{request.skillName}</Text> with{" "}
              <Text className="text-primary">{request.mentorName}</Text>?
            </Text>
          )}

          <View className="flex-row gap-2 mb-5">
            {[1, 2, 3, 4, 5].map((num) => (
              <Pressable key={num} onPress={() => setRating(num)}>
                <Feather
                  name="star"
                  size={28}
                  color={num <= rating ? "#FFB300" : "#64748B"}
                />
              </Pressable>
            ))}
          </View>

          <FormField label="Your Feedback">
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              numberOfLines={3}
              placeholder="Share your thoughts..."
              placeholderTextColor="#64748B"
              className="bg-bg-light border border-border rounded-xl px-4 py-3 text-text-primary text-sm"
              style={{textAlignVertical: "top"}}
            />
          </FormField>

          <View className="flex-row gap-3 mt-4">
            <Pressable
              onPress={onClose}
              className="flex-1 py-3 rounded-xl border border-border items-center">
              <Text className="text-[10px] font-bold uppercase text-text-muted">
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (rating === 0 || !comment.trim()) return;
                onSubmit(rating, comment);
                setRating(0);
                setComment("");
              }}
              className="flex-1 bg-primary py-3 rounded-xl items-center">
              <Text className="text-[10px] font-bold uppercase text-bg-light">
                Submit Review
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text className="text-[10px] font-bold uppercase tracking-widest mb-2 text-text-muted">
        {label}
      </Text>
      {children}
    </View>
  );
}

function CategoryPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View className="flex-row gap-2">
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => onChange(cat)}
            className={`px-3 py-2 rounded-lg border ${
              value === cat
                ? "bg-primary/10 border-primary/30"
                : "bg-bg-light border-border"
            }`}>
            <Text
              className={`text-xs ${value === cat ? "text-primary" : "text-text-muted"}`}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
