import { useLocalSearchParams } from "expo-router";
import ProfileView from "../../../components/ProfileView";
import Screen from "../../../components/Screen";

// TODO: replace with a real Firestore query: users where username == params.username
const MOCK_PUBLIC_USER = {
  id: "u2",
  name: "Arif Khan",
  username: "arifkhan",
  intro: "Guitar teacher & backend developer",
  bio: "I've been playing guitar for 10 years and love helping beginners get started.",
  pinnedBadges: [],
};
const MOCK_OFFERED = [{id: "s4", name: "Guitar Basics", category: "Music"}];
const MOCK_LEARNING: any[] = [];
const MOCK_COMPLETED = [
  {
    id: "c2",
    skill: {id: "s5", name: "Node.js", category: "Technology"},
    mentor: {name: "Priya Das"},
  },
];
const MOCK_REVIEWS = [
  {
    id: "r2",
    student: {name: "Sayma"},
    skill: {name: "Guitar Basics"},
    rating: 5,
    comment: "Patient and encouraging teacher.",
    createdAt: new Date().toISOString(),
  },
];

export default function PublicProfile() {
  const {username} = useLocalSearchParams();

  return (
    <Screen>
      <ProfileView
        profileUser={{...MOCK_PUBLIC_USER, username: String(username)}}
        isOwnProfile={false}
        offeredSkills={MOCK_OFFERED}
        learningSessions={MOCK_LEARNING}
        completedSessions={MOCK_COMPLETED}
        reviews={MOCK_REVIEWS}
      />
    </Screen>
  );
}
