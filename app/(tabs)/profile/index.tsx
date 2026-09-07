// profile/index.tsx
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import ProfileView from "../../../components/ProfileView";
import Screen from "../../../components/Screen";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import {
  fetchCompletedSessions, fetchLearningSessions, fetchOfferedSkills,
  fetchProfileByUid, fetchReviews, updateProfile,
} from "../../../services/profileService";
import { CompletedSession, LearningSession, ProfileUser, Review, Skill } from "../../../types/profile";
import { ActivityIndicator, View } from "react-native";

export default function MyProfile() {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [offered, setOffered] = useState<Skill[]>([]);
  const [learning, setLearning] = useState<LearningSession[]>([]);
  const [completed, setCompleted] = useState<CompletedSession[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  // Refetches every time the Profile tab gains focus — not just once on
  // mount — so skills added from Dashboard ("My Skills" / "Share Your
  // Knowledge") show up here immediately when you switch tabs, instead
  // of needing an app reload.
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      let cancelled = false;

      // Only show the full-screen spinner on the very first load; a
      // refocus refresh happens quietly behind the existing content.
      if (!profileUser) setLoading(true);

      (async () => {
        try {
          const [profile, off, learn, comp, rev] = await Promise.all([
            fetchProfileByUid(user.uid),
            fetchOfferedSkills(user.uid),
            fetchLearningSessions(user.uid),
            fetchCompletedSessions(user.uid),
            fetchReviews(user.uid),
          ]);
          if (cancelled) return;
          setProfileUser(profile);
          setOffered(off);
          setLearning(learn);
          setCompleted(comp);
          setReviews(rev);
        } catch (e) {
          console.error("Failed to load profile", e);
          showToast("Couldn't load your profile", "error");
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [user]),
  );

  if (loading || !profileUser || !user) {
    return (
      <Screen>
        <View className="flex-1 items-center justify-center pt-20">
          <ActivityIndicator color="#FFB300" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen user={{ name: profileUser.name }}>
      <ProfileView
        profileUser={profileUser}
        uid={user.uid}
        isOwnProfile
        offeredSkills={offered}
        learningSessions={learning}
        completedSessions={completed}
        reviews={reviews}
        onSaveProfile={async (data) => {
          try {
            await updateProfile(user.uid, data);
            setProfileUser({ ...profileUser, ...data });
            showToast("Profile updated!");
          } catch (e) {
            console.error("Failed to save profile", e);
            showToast("Couldn't save changes", "error");
          }
        }}
      />
    </Screen>
  );
}