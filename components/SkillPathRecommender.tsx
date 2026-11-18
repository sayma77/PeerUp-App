// components/SkillPathRecommender.tsx
//
// "What should I learn next?" widget. Nothing runs automatically — the
// AI call only fires when the user taps the button. Pulls the signed-in
// user's completed sessions, in-progress sessions, and offered skills,
// then asks the AI Skill Path Recommender for one next skill plus a
// short natural-language reason (e.g. "Since you know Web Development
// and UI/UX, try React next").
//
// Drop this in anywhere a logged-in user is shown their own dashboard —
// it's self-contained and fetches its own data from `uid`, but only
// when asked to.

import {Feather} from "@expo/vector-icons";
import {useRouter} from "expo-router";
import {useCallback, useState} from "react";
import {ActivityIndicator, Pressable, Text, View} from "react-native";
import {
  fetchCompletedSessions,
  fetchLearningSessions,
  fetchOfferedSkills,
} from "../services/profileService";
import {recommendNextSkill} from "../services/skillPathService";
import {SkillPathRecommendation} from "../types/skillPath";

type Props = {
  uid: string;
};

type LoadState = "idle" | "loading" | "ready" | "empty-history" | "error";

export default function SkillPathRecommender({uid}: Props) {
  const router = useRouter();

  const [state, setState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recommendation, setRecommendation] =
    useState<SkillPathRecommendation | null>(null);

  const generate = useCallback(async () => {
    setErrorMessage(null);
    setState("loading");

    try {
      const [completed, learning, offered] = await Promise.all([
        fetchCompletedSessions(uid),
        fetchLearningSessions(uid),
        fetchOfferedSkills(uid),
      ]);

      const completedSkills = completed.map((s) => ({
        name: s.skill.name,
        category: s.skill.category,
      }));
      const learningSkills = learning.map((s) => ({
        name: s.skill.name,
        category: s.skill.category,
      }));
      const offeredSkills = offered.map((s) => ({
        name: s.name,
        category: s.category,
      }));

      const anyHistory =
        completedSkills.length > 0 ||
        learningSkills.length > 0 ||
        offeredSkills.length > 0;

      if (!anyHistory) {
        setState("empty-history");
        return;
      }

      const result = await recommendNextSkill({
        completedSkills,
        learningSkills,
        offeredSkills,
      });

      setRecommendation(result);
      setState("ready");
    } catch (err: any) {
      console.error("Failed to generate skill path recommendation:", err);
      setErrorMessage(
        err?.message || "Couldn't generate a recommendation right now.",
      );
      setState("error");
    }
  }, [uid]);

  function exploreSkill(skillName: string) {
    router.push({
      pathname: "/(tabs)/skills",
      params: {q: skillName},
    } as any);
  }

  return (
    <View className="bg-bg-medium border border-border rounded-3xl p-6">
      <View className="flex-row items-center justify-between mb-1">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
            <Feather name="compass" size={15} color="#FFB300" />
          </View>
          <Text className="text-[10px] font-bold uppercase tracking-widest text-primary/80">
            What to learn next
          </Text>
        </View>

        {state === "ready" && recommendation && (
          <Pressable
            onPress={generate}
            hitSlop={8}
            className="w-7 h-7 rounded-lg items-center justify-center bg-bg-light border border-border">
            <Feather name="refresh-cw" size={12} color="#64748B" />
          </Pressable>
        )}
      </View>

      {/* Nothing has been requested yet — just an inviting prompt + button. */}
      {state === "idle" && (
        <View className="py-4 gap-4">
          <Text className="text-sm text-text-muted leading-5">
            Not sure what to learn next? We'll look at your learning
            history and suggest one skill worth trying.
          </Text>
          <Pressable
            onPress={generate}
            className="self-start px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 flex-row items-center gap-2">
            <Feather name="zap" size={13} color="#FFB300" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
              What should I learn next?
            </Text>
          </Pressable>
        </View>
      )}

      {state === "loading" && (
        <View className="py-6 items-center gap-2">
          <ActivityIndicator color="#FFB300" />
          <Text className="text-[11px] text-text-muted">
            Looking at your learning history…
          </Text>
        </View>
      )}

      {state === "empty-history" && (
        <View className="py-4 gap-3">
          <Text className="text-sm text-text-muted leading-5">
            Complete a session or add a skill you offer, and we'll suggest a
            smart next skill to learn based on your history.
          </Text>
          <Pressable
            onPress={generate}
            className="self-start px-4 py-2 rounded-xl border border-border bg-bg-light">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              Check Again
            </Text>
          </Pressable>
        </View>
      )}

      {state === "error" && (
        <View className="py-2 gap-3">
          <Text className="text-sm text-text-muted leading-5">
            {errorMessage}
          </Text>
          <Pressable
            onPress={generate}
            className="self-start px-4 py-2 rounded-xl border border-primary/20 bg-primary/5">
            <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Try Again
            </Text>
          </Pressable>
        </View>
      )}

      {state === "ready" && recommendation && (
        <View className="mt-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-xl font-extralight text-text-primary">
              {recommendation.skill}
            </Text>
            <View className="px-2.5 py-1 rounded-lg bg-bg-light border border-border">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
                {recommendation.category}
              </Text>
            </View>
          </View>

          <Text className="text-sm leading-5 text-text-muted mb-4">
            {recommendation.explanation}
          </Text>

          <View className="flex-row items-center gap-2 mb-4">
            <Text className="text-[9px] font-bold uppercase tracking-widest text-text-muted">
              Confidence
            </Text>
            <View className="flex-row gap-1">
              {(["low", "medium", "high"] as const).map((level, i) => {
                const levelIndex = {low: 0, medium: 1, high: 2}[
                  recommendation.confidence
                ];
                return (
                  <View
                    key={level}
                    className="w-4 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        i <= levelIndex ? "#FFB300" : "#333",
                    }}
                  />
                );
              })}
            </View>
          </View>

          <Pressable
            onPress={() => exploreSkill(recommendation.skill)}
            className="py-3 rounded-xl bg-primary/10 border border-primary/20 items-center flex-row justify-center gap-2 mb-4">
            <Feather name="arrow-right-circle" size={14} color="#FFB300" />
            <Text className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Find a mentor for {recommendation.skill}
            </Text>
          </Pressable>

          {recommendation.alternatives.length > 0 && (
            <View className="pt-4 border-t border-border">
              <Text className="text-[9px] font-bold uppercase tracking-widest text-text-muted mb-2.5">
                Or consider
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {recommendation.alternatives.map((alt) => (
                  <Pressable
                    key={alt.skill}
                    onPress={() => exploreSkill(alt.skill)}
                    className="px-3 py-1.5 border border-border bg-bg-light rounded-xl">
                    <Text className="text-[11px] text-text-primary">
                      {alt.skill}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          )}
        </View>
      )}
    </View>
  );
}