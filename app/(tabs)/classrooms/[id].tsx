import { Feather } from "@expo/vector-icons";
import { Link, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Linking, Pressable, Text, TextInput, View } from "react-native";
import Screen from "../../../components/Screen";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";

interface Question {
  id: string;
  author: string;
  text: string;
  upvotes: number;
}

// TODO: replace with a real Firestore doc lookup by id
const MOCK_CLASS = {
  id: "c1",
  title: "React Native Basics: Building Your First Screen",
  topicTags: ["Technology"],
  mentor: "Arif Khan",
  isOwnClass: true, // TODO: derive from comparing mentor uid to logged-in uid
  startTime: "Live now",
  maxCapacity: 30,
  registered: 18,
  platform: "Google Meet" as const,
  conferenceLink: "https://meet.google.com/abc-defg-hij",
  status: "live" as "live" | "upcoming" | "completed",
  slidesUrl: "",
  repoUrl: "",
};

// TODO: replace with real questions fetched from Firestore, ordered by upvotes
const MOCK_QUESTIONS: Question[] = [
  { id: "q1", author: "Priya Das", text: "Will this cover navigation too?", upvotes: 4 },
  { id: "q2", author: "Jamal Uddin", text: "Any tips for state management as a beginner?", upvotes: 2 },
];

export default function ClassDetail() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [liveClass, setLiveClass] = useState(MOCK_CLASS); // TODO: fetch by id
  const [questions, setQuestions] = useState(MOCK_QUESTIONS);
  const [newQuestion, setNewQuestion] = useState("");
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  const upvote = (qid: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qid ? { ...q, upvotes: q.upvotes + 1 } : q))
    );
  };

  const submitQuestion = () => {
    if (!newQuestion.trim()) return;
    setQuestions((prev) => [
      { id: `q${prev.length + 1}`, author: user?.email ?? "You", text: newQuestion.trim(), upvotes: 0 },
      ...prev,
    ]);
    setNewQuestion("");
    // TODO: write to Firestore questions subcollection
  };

  const markCompleted = () => {
    setLiveClass((prev) => ({ ...prev, status: "completed" }));
    showToast("Class marked as completed");
    // TODO: update class doc status + attached resource links in Firestore
  };

  const submitReview = () => {
    if (rating === 0) {
      showToast("Please select a rating");
      return;
    }
    showToast("Review submitted!");
    // TODO: write review to Firestore, linked to mentor + class
  };

  return (
    <Screen user={user ? { name: user.email ?? "You" } : null}>
      <View className="px-6 pt-8">
        <View className="flex-row gap-1.5 mb-3">
          {liveClass.topicTags.map((tag) => (
            <View key={tag} className="px-2 py-1 rounded-md bg-primary/10">
              <Text className="text-[9px] font-bold uppercase tracking-wider text-primary">
                {tag}
              </Text>
            </View>
          ))}
        </View>

        <Text className="text-2xl font-semibold text-text-primary mb-2">
          {liveClass.title}
        </Text>
        <Text className="text-sm text-text-muted mb-6">
          by {liveClass.mentor} · {liveClass.startTime}
        </Text>

        {liveClass.status !== "completed" ? (
          <Pressable
            onPress={() => Linking.openURL(liveClass.conferenceLink)}
            className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-primary mb-3">
            <Feather name="video" size={16} color="white" />
            <Text className="text-white text-xs font-bold uppercase tracking-widest">
              Join Class · {liveClass.platform}
            </Text>
          </Pressable>
        ) : (
          <View className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-bg-medium border border-border mb-3">
            <Feather name="check-circle" size={16} color="#64748B" />
            <Text className="text-text-muted text-xs font-bold uppercase tracking-widest">
              Class Completed
            </Text>
          </View>
        )}

        <Text className="text-xs text-text-muted mb-8">
          {liveClass.registered}/{liveClass.maxCapacity} registered
        </Text>

        {/* Mentor controls */}
        {liveClass.isOwnClass && liveClass.status !== "completed" && (
          <View className="bg-bg-medium border border-border rounded-2xl p-5 mb-8">
            <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 mb-4">
              Mentor Controls
            </Text>
            <TextInput
              value={liveClass.slidesUrl}
              onChangeText={(v) => setLiveClass((prev) => ({ ...prev, slidesUrl: v }))}
              placeholder="Slides link (optional)"
              placeholderTextColor="#64748B"
              className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary mb-3"
            />
            <TextInput
              value={liveClass.repoUrl}
              onChangeText={(v) => setLiveClass((prev) => ({ ...prev, repoUrl: v }))}
              placeholder="GitHub repo link (optional)"
              placeholderTextColor="#64748B"
              className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary mb-4"
            />
            <Pressable
              onPress={markCompleted}
              className="py-3.5 rounded-xl bg-primary items-center">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                Mark as Completed
              </Text>
            </Pressable>
          </View>
        )}

        {/* Attached resources, once completed */}
        {liveClass.status === "completed" && (liveClass.slidesUrl || liveClass.repoUrl) && (
          <View className="bg-bg-medium border border-border rounded-2xl p-5 mb-8 gap-3">
            <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">
              Class Materials
            </Text>
            {liveClass.slidesUrl ? (
              <Pressable
                onPress={() => Linking.openURL(liveClass.slidesUrl)}
                className="flex-row items-center gap-2">
                <Feather name="file-text" size={14} color="#FFB300" />
                <Text className="text-xs text-primary">Presentation slides</Text>
              </Pressable>
            ) : null}
            {liveClass.repoUrl ? (
              <Pressable
                onPress={() => Linking.openURL(liveClass.repoUrl)}
                className="flex-row items-center gap-2">
                <Feather name="github" size={14} color="#FFB300" />
                <Text className="text-xs text-primary">GitHub repository</Text>
              </Pressable>
            ) : null}
            {/* More materials for this class live on the Resources tab */}
            <Link href="/(tabs)/resources" asChild>
              <Pressable className="flex-row items-center gap-2">
                <Feather name="book-open" size={14} color="#64748B" />
                <Text className="text-xs text-text-muted">See all shared resources</Text>
              </Pressable>
            </Link>
          </View>
        )}

        {/* Post-class review, for attendees */}
        {liveClass.status === "completed" && !liveClass.isOwnClass && (
          <View className="bg-bg-medium border border-border rounded-2xl p-5 mb-8">
            <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 mb-4">
              Rate This Class
            </Text>
            <View className="flex-row gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <Feather name="star" size={22} color={n <= rating ? "#FFB300" : "#64748B"} />
                </Pressable>
              ))}
            </View>
            <TextInput
              value={review}
              onChangeText={setReview}
              placeholder="How was the class?"
              placeholderTextColor="#64748B"
              multiline
              className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary mb-4 min-h-[80px]"
            />
            <Pressable onPress={submitReview} className="py-3.5 rounded-xl bg-primary items-center">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                Submit Review
              </Text>
            </Pressable>
          </View>
        )}

        {/* Discussion */}
        <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 mb-4">
          Discussion
        </Text>

        <View className="flex-row gap-2 mb-6">
          <TextInput
            value={newQuestion}
            onChangeText={setNewQuestion}
            placeholder="Ask a question..."
            placeholderTextColor="#64748B"
            className="flex-1 border border-border rounded-xl px-4 py-3 text-sm text-text-primary"
          />
          <Pressable
            onPress={submitQuestion}
            className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
            <Feather name="send" size={16} color="white" />
          </Pressable>
        </View>

        <View className="gap-3 mb-14">
          {questions
            .slice()
            .sort((a, b) => b.upvotes - a.upvotes)
            .map((q) => (
              <View
                key={q.id}
                className="flex-row items-center gap-3 bg-bg-medium border border-border rounded-xl p-4">
                <Pressable
                  onPress={() => upvote(q.id)}
                  className="items-center w-10">
                  <Feather name="chevron-up" size={16} color="#FFB300" />
                  <Text className="text-xs font-bold text-primary">{q.upvotes}</Text>
                </Pressable>
                <View className="flex-1">
                  <Text className="text-sm text-text-primary">{q.text}</Text>
                  <Text className="text-[10px] text-text-muted mt-1">— {q.author}</Text>
                </View>
              </View>
            ))}
        </View>
      </View>
    </Screen>
  );
}