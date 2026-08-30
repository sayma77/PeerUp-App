import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import ProfileView from "../../../components/ProfileView";
import Screen from "../../../components/Screen";
import { useAuth } from "../../../context/AuthContext";
import {
  fetchCompletedSessions,
  fetchLearningSessions,
  fetchOfferedSkills,
  fetchProfileByUsername,
  fetchReviews,
} from "../../../services/profileService";
import {
  CompletedSession,
  LearningSession,
  ProfileUser,
  Review,
  Skill,
} from "../../../types/profile";

export default function PublicProfile() {
  const {username} = useLocalSearchParams();
  const {user} = useAuth(); // the logged-in viewer, not the profile being viewed

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [offered, setOffered] = useState<Skill[]>([]);
  const [learning, setLearning] = useState<LearningSession[]>([]);
  const [completed, setCompleted] = useState<CompletedSession[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;

    (async () => {
      try {
        const profile = await fetchProfileByUsername(String(username));
        if (cancelled) return;
        if (!profile) {
          setNotFound(true);
          return;
        }
        const [off, learn, comp, rev] = await Promise.all([
          fetchOfferedSkills(profile.id),
          fetchLearningSessions(profile.id),
          fetchCompletedSessions(profile.id),
          fetchReviews(profile.id),
        ]);
        if (cancelled) return;
        setProfileUser(profile);
        setOffered(off);
        setLearning(learn);
        setCompleted(comp);
        setReviews(rev);
      } catch (e) {
        console.error("Failed to load public profile", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [username]);

  const viewerProp = user ? {name: user.email ?? "You"} : null;

  if (notFound) {
    return (
      <Screen user={viewerProp}>
        <View className="flex-1 items-center justify-center pt-20">
          <Text className="text-text-muted">User not found.</Text>
        </View>
      </Screen>
    );
  }

  if (loading || !profileUser) {
    return (
      <Screen user={viewerProp}>
        <View className="flex-1 items-center justify-center pt-20">
          <ActivityIndicator color="#FFB300" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen user={viewerProp}>
      <ProfileView
        profileUser={profileUser}
        uid={profileUser.id}
        isOwnProfile={false}
        offeredSkills={offered}
        learningSessions={learning}
        completedSessions={completed}
        reviews={reviews}
      />
    </Screen>
  );
}
