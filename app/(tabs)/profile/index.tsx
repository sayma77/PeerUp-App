import ProfileView from "../../../components/ProfileView";
import Screen from "../../../components/Screen";
import { useToast } from "../../../context/ToastContext";

// TODO: replace all of this with real data fetched from Firestore for the logged-in user
const MOCK_PROFILE_USER = {
  id: "me",
  name: "Sayma",
  username: "sayma",
  intro: "Teaching React Native to learn UI design",
  bio: "CSE student passionate about mobile development and design systems.",
  pinnedBadges: [],
};
const MOCK_OFFERED = [{id: "s1", name: "React Native", category: "Technology"}];
const MOCK_LEARNING = [
  {id: "l1", skill: {id: "s2", name: "UI Design", category: "Design"}},
];
const MOCK_COMPLETED = [
  {
    id: "c1",
    skill: {id: "s3", name: "Guitar Basics", category: "Music"},
    mentor: {name: "Arif Khan"},
  },
];
const MOCK_REVIEWS = [
  {
    id: "r1",
    student: {name: "Jamal Uddin"},
    skill: {name: "React Native"},
    rating: 5,
    comment: "Explained everything really clearly, great mentor!",
    createdAt: new Date().toISOString(),
  },
];

export default function MyProfile() {
  const {showToast} = useToast();

  return (
    <Screen user={{name: MOCK_PROFILE_USER.name}}>
      <ProfileView
        profileUser={MOCK_PROFILE_USER}
        isOwnProfile
        offeredSkills={MOCK_OFFERED}
        learningSessions={MOCK_LEARNING}
        completedSessions={MOCK_COMPLETED}
        reviews={MOCK_REVIEWS}
        onSaveProfile={(data) => {
          // TODO: update the users/{uid} doc in Firestore with data
          showToast("Profile updated!");
        }}
      />
    </Screen>
  );
}
