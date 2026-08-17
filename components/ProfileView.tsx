import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import {
    Modal,
    Pressable,
    ScrollView,
    Text,
    TextInput,
    View,
} from "react-native";
import {
    CompletedSession,
    LearningSession,
    ProfileUser,
    Review,
    Skill,
} from "../types/profile";

const BADGE_LIMIT = 4;

type ProfileViewProps = {
  profileUser: ProfileUser;
  isOwnProfile: boolean;
  offeredSkills: Skill[];
  learningSessions: LearningSession[];
  completedSessions: CompletedSession[];
  reviews: Review[];
  onSaveProfile?: (data: {name: string; intro: string; bio: string}) => void;
};

export default function ProfileView({
  profileUser,
  isOwnProfile,
  offeredSkills,
  learningSessions,
  completedSessions,
  reviews,
  onSaveProfile,
}: ProfileViewProps) {
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(
    new Set(profileUser.pinnedBadges ?? []),
  );
  const [showAllBadges, setShowAllBadges] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const sortedSessions = [
    ...completedSessions.filter((s) => pinnedIds.has(s.id)),
    ...completedSessions.filter((s) => !pinnedIds.has(s.id)),
  ];
  const visibleSessions = showAllBadges
    ? sortedSessions
    : sortedSessions.slice(0, BADGE_LIMIT);
  const hasMore = sortedSessions.length > BADGE_LIMIT;

  function togglePin(id: string) {
    setPinnedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      // TODO: POST { pinnedBadges: [...next] } to Firestore (users/{uid})
      return next;
    });
  }

  return (
    <View className="px-5 pt-6 pb-10">
      {/* Header card */}
      <View className="bg-bg-medium border border-border rounded-3xl p-6 mb-8 items-center">
        <View className="relative mb-4">
          <View className="w-24 h-24 rounded-3xl bg-bg-light border border-border items-center justify-center">
            <Text className="text-3xl font-extralight text-primary">
              {profileUser.name.substring(0, 2).toUpperCase()}
            </Text>
          </View>
          {completedSessions.length > 0 && (
            <View className="absolute -top-2 -right-2 min-w-[26px] h-[26px] px-1 rounded-full bg-primary items-center justify-center border-2 border-bg-medium">
              <Text className="text-[10px] font-black text-bg-light">
                {completedSessions.length > 99
                  ? "99+"
                  : completedSessions.length}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-2xl font-extralight text-text-primary text-center">
          {profileUser.name}
        </Text>
        {!!profileUser.intro && (
          <Text className="italic text-sm text-text-muted text-center mt-1">
            {profileUser.intro}
          </Text>
        )}

        {isOwnProfile && (
          <Pressable
            onPress={() => setEditOpen(true)}
            className="mt-4 px-5 py-2.5 rounded-xl border border-primary/20 bg-primary/5 flex-row items-center gap-2">
            <Feather name="edit-2" size={13} color="#FFB300" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Edit Profile
            </Text>
          </Pressable>
        )}

        {completedSessions.length > 0 && (
          <View className="flex-row flex-wrap gap-2 mt-5 justify-center">
            {completedSessions.slice(0, 8).map((session) => (
              <View
                key={session.id}
                className="flex-row items-center gap-1.5 px-3 py-1 border border-primary/20 bg-primary/10 rounded-full">
                <Feather name="check-circle" size={11} color="#FFB300" />
                <Text className="text-[9px] font-bold uppercase tracking-wider text-primary">
                  {session.skill.name}
                </Text>
              </View>
            ))}
            {completedSessions.length > 8 && (
              <View className="px-3 py-1 border border-border bg-bg-light rounded-full">
                <Text className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
                  +{completedSessions.length - 8} more
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Earned Badges */}
      {completedSessions.length > 0 && (
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
              Earned Badges
            </Text>
            <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              {completedSessions.length} skill
              {completedSessions.length !== 1 ? "s" : ""} mastered
            </Text>
          </View>

          {isOwnProfile && (
            <Text className="text-[9px] uppercase tracking-widest text-center mb-4 text-text-muted">
              Tap a badge to pin it · pinned badges show first
            </Text>
          )}

          <View className="flex-row flex-wrap gap-3">
            {visibleSessions.map((session) => {
              const pinned = pinnedIds.has(session.id);
              return (
                <Pressable
                  key={session.id}
                  onPress={() => isOwnProfile && togglePin(session.id)}
                  className="bg-bg-medium border border-border rounded-2xl p-4 items-center"
                  style={{width: "47%"}}>
                  <View className="relative mb-3">
                    <View className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
                      <Feather name="award" size={18} color="#FFB300" />
                    </View>
                    {isOwnProfile && (
                      <View
                        className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-md items-center justify-center border ${
                          pinned
                            ? "bg-primary/20 border-primary/40"
                            : "bg-bg-light border-border"
                        }`}>
                        <Feather
                          name="bookmark"
                          size={10}
                          color={pinned ? "#FFB300" : "#64748B"}
                        />
                      </View>
                    )}
                  </View>
                  <Text
                    className="text-sm font-medium text-text-primary text-center"
                    numberOfLines={1}>
                    {session.skill.name}
                  </Text>
                  <Text className="text-[9px] font-bold uppercase tracking-widest text-primary/60 mt-1">
                    {session.skill.category}
                  </Text>
                  {session.mentor && (
                    <Text className="text-[9px] text-text-muted mt-2 pt-2 border-t border-border w-full text-center">
                      taught by {session.mentor.name}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>

          {hasMore && (
            <Pressable
              onPress={() => setShowAllBadges((v) => !v)}
              className="mt-4 self-center flex-row items-center gap-2 px-5 py-2.5 border border-border bg-bg-medium rounded-xl">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                {showAllBadges ? "Show less" : "View all"}
              </Text>
              <Feather
                name={showAllBadges ? "chevron-up" : "chevron-down"}
                size={14}
                color="#64748B"
              />
            </Pressable>
          )}
        </View>
      )}

      {/* Skills Offered / Currently Learning */}
      <View className="gap-6 mb-8">
        <View className="bg-bg-medium border border-border rounded-3xl p-6">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-5">
            Skills Offered
          </Text>
          {offeredSkills.length > 0 ? (
            <View className="gap-3">
              {offeredSkills.map((skill) => (
                <View
                  key={skill.id}
                  className="flex-row items-center justify-between p-3.5 rounded-xl bg-bg-light border border-border">
                  <Text className="text-text-primary font-light">
                    {skill.name}
                  </Text>
                  <View className="px-2 py-0.5 rounded-md bg-primary/10">
                    <Text className="text-[9px] font-bold uppercase text-primary">
                      {skill.category}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-text-muted">
              No skills offered yet.
            </Text>
          )}
        </View>

        <View className="bg-bg-medium border border-border rounded-3xl p-6">
          <Text className="text-[10px] font-bold uppercase tracking-widest text-primary/80 mb-5">
            Currently Learning
          </Text>
          {learningSessions.length > 0 ? (
            <View className="gap-3">
              {learningSessions.map((session) => (
                <View
                  key={session.id}
                  className="flex-row items-center justify-between p-3.5 rounded-xl bg-bg-light border border-border">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-primary" />
                    <Text className="text-text-primary font-light">
                      {session.skill.name}
                    </Text>
                  </View>
                  <View className="px-2 py-0.5 rounded-md bg-bg-medium">
                    <Text className="text-[9px] font-bold uppercase text-text-muted">
                      {session.skill.category}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <Text className="text-sm text-text-muted">
              No active learning sessions.
            </Text>
          )}
        </View>
      </View>

      {/* About Me */}
      <View className="bg-bg-medium border border-border rounded-3xl p-6 mb-8">
        <Text className="text-base font-light text-text-primary mb-4">
          About Me
        </Text>
        <Text className="text-sm leading-6 text-text-muted mb-5">
          {profileUser.bio || ""}
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {offeredSkills.map((skill) => (
            <View
              key={skill.id}
              className="px-3 py-1.5 border border-border bg-bg-light rounded-xl">
              <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                {skill.category}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reviews */}
      <View className="bg-bg-medium border border-border rounded-3xl p-6">
        <Text className="text-base font-light text-text-primary mb-6">
          Reviews{" "}
          <Text className="text-sm text-text-muted">({reviews.length})</Text>
        </Text>

        {reviews.length > 0 ? (
          <View className="gap-4">
            {reviews.map((review) => (
              <View
                key={review.id}
                className="p-5 rounded-2xl bg-bg-light border border-border">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-xl bg-bg-medium border border-border items-center justify-center">
                      <Text className="text-xs font-light text-primary">
                        {review.student.name.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-sm font-semibold text-text-primary">
                        {review.student.name}
                      </Text>
                      <Text className="text-[10px] font-bold uppercase tracking-widest text-primary/70 mt-0.5">
                        {review.skill.name}
                      </Text>
                      <View className="flex-row gap-1 mt-1.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <View
                            key={i}
                            className="w-1.5 h-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                i <= review.rating ? "#FFB300" : "#333",
                            }}
                          />
                        ))}
                      </View>
                    </View>
                  </View>
                  <Text className="text-[10px] font-bold uppercase text-text-muted">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                <Text className="text-sm leading-5 text-text-muted">
                  {review.comment}
                </Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-sm text-text-muted">No reviews yet.</Text>
        )}
      </View>

      {/* Edit Profile Modal */}
      {isOwnProfile && (
        <EditProfileModal
          visible={editOpen}
          profileUser={profileUser}
          onClose={() => setEditOpen(false)}
          onSave={(data) => {
            onSaveProfile?.(data);
            setEditOpen(false);
          }}
        />
      )}
    </View>
  );
}

function EditProfileModal({
  visible,
  profileUser,
  onClose,
  onSave,
}: {
  visible: boolean;
  profileUser: ProfileUser;
  onClose: () => void;
  onSave: (data: {name: string; intro: string; bio: string}) => void;
}) {
  const [name, setName] = useState(profileUser.name);
  const [intro, setIntro] = useState(profileUser.intro ?? "");
  const [bio, setBio] = useState(profileUser.bio ?? "");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <View className="flex-1 bg-black/90 items-center justify-center px-5">
        <ScrollView
          className="w-full max-h-[80%]"
          showsVerticalScrollIndicator={false}>
          <View className="bg-bg-medium border border-border rounded-3xl overflow-hidden">
            <View className="p-6 border-b border-border flex-row items-center justify-between">
              <Text className="text-xl font-extralight text-text-primary">
                Edit Profile
              </Text>
              <Pressable onPress={onClose}>
                <Feather name="x" size={20} color="#64748B" />
              </Pressable>
            </View>

            <View className="p-6 gap-5">
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest mb-2 text-text-muted">
                  Name
                </Text>
                <TextInput
                  value={name}
                  onChangeText={setName}
                  className="bg-bg-light border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest mb-2 text-text-muted">
                  Short Intro
                </Text>
                <TextInput
                  value={intro}
                  onChangeText={setIntro}
                  placeholder="e.g. Teaching code to learn design"
                  placeholderTextColor="#64748B"
                  className="bg-bg-light border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                />
              </View>
              <View>
                <Text className="text-[10px] font-bold uppercase tracking-widest mb-2 text-text-muted">
                  About Me
                </Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  placeholder="Tell others about yourself..."
                  placeholderTextColor="#64748B"
                  className="bg-bg-light border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
                  style={{textAlignVertical: "top"}}
                />
              </View>

              <Pressable
                onPress={() => onSave({name, intro, bio})}
                className="py-3.5 rounded-xl bg-primary/10 border border-primary/20 items-center">
                <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  Save Changes
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}
