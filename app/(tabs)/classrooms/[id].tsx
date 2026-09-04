import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Link, useLocalSearchParams } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import Screen from "../../../components/Screen";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../context/ToastContext";
import { db } from "../../../firebaseConfig";
import {
  fetchClassById,
  fetchQuestions,
  formatStartTime,
  LiveClass,
  markClassCompleted,
  Question,
  registerForClass,
  submitClassReview,
  submitQuestion,
  upvoteQuestion,
} from "../../../services/classesService";

// Defensive normalization for links saved before CreateClassModal started
// enforcing a scheme — "meet.google.com/xyz" fails on Android without
// http(s):// in front of it.
function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

export default function ClassDetail() {
  const {id} = useLocalSearchParams<{id: string}>();
  const {user} = useAuth();
  const {showToast} = useToast();

  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [submittingQuestion, setSubmittingQuestion] = useState(false);

  const [slidesUrlInput, setSlidesUrlInput] = useState("");
  const [repoUrlInput, setRepoUrlInput] = useState("");
  const [savingCompletion, setSavingCompletion] = useState(false);

  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  const [joining, setJoining] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (!id) return;
      let cancelled = false;
      (async () => {
        setLoading(true);
        setLoadError(false);
        try {
          const [classData, questionData] = await Promise.all([
            fetchClassById(id),
            fetchQuestions(id),
          ]);
          if (cancelled) return;
          setLiveClass(classData);
          setQuestions(questionData);
          if (classData) {
            setSlidesUrlInput(classData.slidesUrl);
            setRepoUrlInput(classData.repoUrl);
          }
        } catch (err) {
          console.error("Failed to load class:", err);
          if (!cancelled) setLoadError(true);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [id]),
  );

  const isOwnClass = !!user && !!liveClass && liveClass.mentorId === user.uid;

  async function handleJoin() {
    if (!liveClass) return;
    if (!user) {
      Linking.openURL(normalizeUrl(liveClass.conferenceLink));
      return;
    }
    if (isOwnClass) {
      Linking.openURL(normalizeUrl(liveClass.conferenceLink));
      return;
    }

    setJoining(true);
    try {
      const meSnap = await getDoc(doc(db, "users", user.uid));
      const userName = meSnap.exists() ? meSnap.data().name : "Someone";
      await registerForClass(liveClass.id, user.uid, userName);
      setLiveClass((prev) =>
        prev ? {...prev, registeredCount: prev.registeredCount + 1} : prev,
      );
      Linking.openURL(normalizeUrl(liveClass.conferenceLink));
    } catch (err: any) {
      showToast(err?.message ?? "Couldn't join class", "error");
    } finally {
      setJoining(false);
    }
  }

  async function upvote(qid: string) {
    if (!liveClass || !user) return;
    try {
      await upvoteQuestion(liveClass.id, qid, user.uid);
      setQuestions((prev) =>
        prev.map((q) => (q.id === qid ? {...q, upvotes: q.upvotes + 1} : q)),
      );
    } catch (err) {
      console.error("Failed to upvote:", err);
    }
  }

  async function handleSubmitQuestion() {
    if (!newQuestion.trim() || !liveClass || !user) return;
    setSubmittingQuestion(true);
    try {
      const meSnap = await getDoc(doc(db, "users", user.uid));
      const authorName = meSnap.exists() ? meSnap.data().name : "You";

      await submitQuestion(liveClass.id, {
        authorId: user.uid,
        authorName,
        text: newQuestion.trim(),
      });

      const refreshed = await fetchQuestions(liveClass.id);
      setQuestions(refreshed);
      setNewQuestion("");
    } catch (err) {
      console.error("Failed to submit question:", err);
      showToast("Failed to post question", "error");
    } finally {
      setSubmittingQuestion(false);
    }
  }

  async function handleMarkCompleted() {
    if (!liveClass) return;
    setSavingCompletion(true);
    try {
      await markClassCompleted(liveClass.id, {
        slidesUrl: slidesUrlInput,
        repoUrl: repoUrlInput,
      });
      setLiveClass((prev) =>
        prev
          ? {
              ...prev,
              status: "completed",
              slidesUrl: slidesUrlInput,
              repoUrl: repoUrlInput,
            }
          : prev,
      );
      showToast("Class marked as completed");
    } catch (err) {
      console.error("Failed to mark completed:", err);
      showToast("Failed to update class", "error");
    } finally {
      setSavingCompletion(false);
    }
  }

  async function handleSubmitReview() {
    if (!liveClass || !user) return;
    if (rating === 0) {
      showToast("Please select a rating");
      return;
    }
    setSubmittingReview(true);
    try {
      const meSnap = await getDoc(doc(db, "users", user.uid));
      const reviewerName = meSnap.exists() ? meSnap.data().name : "Someone";

      await submitClassReview(liveClass, {
        reviewerId: user.uid,
        reviewerName,
        rating,
        comment: review,
      });
      showToast("Review submitted!");
      setRating(0);
      setReview("");
    } catch (err) {
      console.error("Failed to submit review:", err);
      showToast("Failed to submit review", "error");
    } finally {
      setSubmittingReview(false);
    }
  }

  if (loading) {
    return (
      <Screen user={user ? {name: user.email ?? "You"} : null}>
        <View className="items-center py-24 gap-3">
          <ActivityIndicator color="#FFB300" />
          <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
            Loading Class...
          </Text>
        </View>
      </Screen>
    );
  }

  if (loadError || !liveClass) {
    return (
      <Screen user={user ? {name: user.email ?? "You"} : null}>
        <Text className="text-center text-red-400 py-24">
          Couldn't load this class.
        </Text>
      </Screen>
    );
  }

  return (
    <Screen user={user ? {name: user.email ?? "You"} : null}>
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
          by {liveClass.mentorName} · {formatStartTime(liveClass)}
        </Text>

        {liveClass.status !== "completed" ? (
          <Pressable
            onPress={handleJoin}
            disabled={joining}
            className="flex-row items-center justify-center gap-2 py-4 rounded-2xl bg-primary mb-3">
            <Feather name="video" size={16} color="white" />
            <Text className="text-white text-xs font-bold uppercase tracking-widest">
              {joining ? "Joining..." : `Join Class · ${liveClass.platform}`}
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
          {liveClass.registeredCount}/{liveClass.maxCapacity} registered
        </Text>

        {/* Mentor controls */}
        {isOwnClass && liveClass.status !== "completed" && (
          <View className="bg-bg-medium border border-border rounded-2xl p-5 mb-8">
            <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 mb-4">
              Mentor Controls
            </Text>
            <TextInput
              value={slidesUrlInput}
              onChangeText={setSlidesUrlInput}
              placeholder="Slides link (optional)"
              placeholderTextColor="#64748B"
              className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary mb-3"
            />
            <TextInput
              value={repoUrlInput}
              onChangeText={setRepoUrlInput}
              placeholder="GitHub repo link (optional)"
              placeholderTextColor="#64748B"
              className="border border-border rounded-xl px-4 py-3 text-sm text-text-primary mb-4"
            />
            <Pressable
              onPress={handleMarkCompleted}
              disabled={savingCompletion}
              className="py-3.5 rounded-xl bg-primary items-center">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                {savingCompletion ? "Saving..." : "Mark as Completed"}
              </Text>
            </Pressable>
          </View>
        )}

        {/* Attached resources, once completed */}
        {liveClass.status === "completed" &&
          (liveClass.slidesUrl || liveClass.repoUrl) && (
            <View className="bg-bg-medium border border-border rounded-2xl p-5 mb-8 gap-3">
              <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">
                Class Materials
              </Text>
              {liveClass.slidesUrl ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(normalizeUrl(liveClass.slidesUrl))
                  }
                  className="flex-row items-center gap-2">
                  <Feather name="file-text" size={14} color="#FFB300" />
                  <Text className="text-xs text-primary">
                    Presentation slides
                  </Text>
                </Pressable>
              ) : null}
              {liveClass.repoUrl ? (
                <Pressable
                  onPress={() =>
                    Linking.openURL(normalizeUrl(liveClass.repoUrl))
                  }
                  className="flex-row items-center gap-2">
                  <Feather name="github" size={14} color="#FFB300" />
                  <Text className="text-xs text-primary">
                    GitHub repository
                  </Text>
                </Pressable>
              ) : null}
              <Link href="/(tabs)/resources" asChild>
                <Pressable className="flex-row items-center gap-2">
                  <Feather name="book-open" size={14} color="#64748B" />
                  <Text className="text-xs text-text-muted">
                    See all shared resources
                  </Text>
                </Pressable>
              </Link>
            </View>
          )}

        {/* Post-class review, for attendees */}
        {liveClass.status === "completed" && !isOwnClass && (
          <View className="bg-bg-medium border border-border rounded-2xl p-5 mb-8">
            <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60 mb-4">
              Rate This Class
            </Text>
            <View className="flex-row gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable key={n} onPress={() => setRating(n)}>
                  <Feather
                    name="star"
                    size={22}
                    color={n <= rating ? "#FFB300" : "#64748B"}
                  />
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
            <Pressable
              onPress={handleSubmitReview}
              disabled={submittingReview}
              className="py-3.5 rounded-xl bg-primary items-center">
              <Text className="text-white text-xs font-bold uppercase tracking-widest">
                {submittingReview ? "Submitting..." : "Submit Review"}
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
            onPress={handleSubmitQuestion}
            disabled={submittingQuestion}
            className="w-12 h-12 rounded-xl bg-primary items-center justify-center">
            <Feather name="send" size={16} color="white" />
          </Pressable>
        </View>

        <View className="gap-3 mb-14">
          {questions.map((q) => (
            <View
              key={q.id}
              className="flex-row items-center gap-3 bg-bg-medium border border-border rounded-xl p-4">
              <Pressable
                onPress={() => upvote(q.id)}
                className="items-center w-10">
                <Feather name="chevron-up" size={16} color="#FFB300" />
                <Text className="text-xs font-bold text-primary">
                  {q.upvotes}
                </Text>
              </Pressable>
              <View className="flex-1">
                <Text className="text-sm text-text-primary">{q.text}</Text>
                <Text className="text-[10px] text-text-muted mt-1">
                  — {q.authorName}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
