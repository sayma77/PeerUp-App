import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import Screen from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";

// TODO: replace with real top-rated mentors fetched from Firestore
const TOP_MENTORS = [
  {id: "m1", name: "Arif Khan", skill: "React Native", rating: 4.9},
  {id: "m2", name: "Priya Das", skill: "UI Design", rating: 4.8},
  {id: "m3", name: "Sara Ahmed", skill: "Spanish", rating: 5.0},
  {id: "m4", name: "Rafi Islam", skill: "Business", rating: 4.7},
];

// TODO: replace with real skills fetched from Firestore, ordered by recency or relevance
const FEATURED_SKILLS = [
  {
    id: "s1",
    name: "React Native",
    category: "Technology",
    mentor: "Arif Khan",
    rating: 4.9,
  },
  {
    id: "s2",
    name: "UI Design",
    category: "Design",
    mentor: "Priya Das",
    rating: 4.8,
  },
  {
    id: "s3",
    name: "Guitar Basics",
    category: "Music",
    mentor: "Jamal Uddin",
    rating: 4.7,
  },
  {
    id: "s4",
    name: "Spanish Conversation",
    category: "Language",
    mentor: "Sara Ahmed",
    rating: 5.0,
  },
  {
    id: "s5",
    name: "Pitch Decks",
    category: "Business",
    mentor: "Rafi Islam",
    rating: 4.6,
  },
];

export default function Home() {
  const {user} = useAuth();

  return (
    <Screen user={user ? {name: user.email ?? "You"} : null}>
      <View className="px-6 pt-8 pb-2">
        {user ? (
          <>
            <Text className="text-2xl font-light text-text-primary">
              Hey{" "}
              <Text className="font-semibold text-primary">
                {user.email?.split("@")[0] ?? "there"}
              </Text>{" "}
              👋
            </Text>
            <Text className="text-sm text-text-muted mt-1">
              Ready to learn something new today?
            </Text>
          </>
        ) : (
          <>
            <Text className="text-3xl font-extralight text-text-primary leading-tight">
              Learn Skills.
            </Text>
            <Text className="text-3xl font-semibold text-primary leading-tight">
              Share Yours.
            </Text>
          </>
        )}
      </View>

      {/* Quick actions */}
      <View className="flex-row gap-3 px-6 mt-6">
        {user ? (
          <>
            <QuickAction
              href="/(tabs)/skills"
              icon="search"
              label="Find a Skill"
            />
            <QuickAction
              href="/(tabs)/dashboard"
              icon="grid"
              label="My Dashboard"
            />
          </>
        ) : (
          <>
            <QuickAction
              href="/(tabs)/skills"
              icon="compass"
              label="Browse Skills"
            />
            <QuickAction
              href="/(auth)/register"
              icon="user-plus"
              label="Get Started"
              filled
            />
          </>
        )}
      </View>


      {/* Popular skills */}
      <View className="mt-9 mb-10">
        <View className="flex-row items-center justify-between px-6 mb-3">
          <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-60">
            Popular Right Now
          </Text>
          <Link href="/(tabs)/skills" asChild>
            <Pressable>
              <Text className="text-[10px] font-bold text-primary uppercase tracking-widest">
                See all
              </Text>
            </Pressable>
          </Link>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: 24, gap: 12}}>
          {FEATURED_SKILLS.map((skill) => (
            <SkillCard key={skill.id} {...skill} />
          ))}
        </ScrollView>
      </View>

      {/* Bottom CTA */}
      <View className="px-6 mb-14">
        <Link href={user ? "/(tabs)/dashboard" : "/(auth)/register"} asChild>
          <Pressable>
            <LinearGradient
              colors={["#111622", "#0A0E17"]}
              className="rounded-3xl p-7 border border-primary/20 overflow-hidden">
              <View className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-primary/10" />
              <Feather
                name="zap"
                size={22}
                color="#FFB300"
                style={{marginBottom: 12}}
              />
              <Text className="text-xl font-semibold text-text-primary mb-1.5">
                {user
                  ? "Have a skill to share?"
                  : "Skills grow when they're shared"}
              </Text>
              <Text className="text-sm text-text-muted leading-6 mb-5 max-w-[260px]">
                {user
                  ? "List what you can teach and start trading with the community."
                  : "Join and start trading knowledge with people learning what you know."}
              </Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-xs font-bold text-primary uppercase tracking-widest">
                  {user ? "Add a skill" : "Join PeerUp"}
                </Text>
                <Feather name="arrow-right" size={14} color="#FFB300" />
              </View>
            </LinearGradient>
          </Pressable>
        </Link>
      </View>
    </Screen>
  );
}

function QuickAction({
  href,
  icon,
  label,
  filled = false,
}: {
  href: any;
  icon: keyof typeof Feather.glyphMap;
  label: string;
  filled?: boolean;
}) {
  if (filled) {
    return (
      <Link href={href} asChild>
        <Pressable className="flex-1">
          <LinearGradient
            colors={["#D97706", "#FFB300"]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            className="py-4 rounded-2xl items-center gap-2">
            <Feather name={icon} size={18} color="white" />
            <Text className="text-white text-[11px] font-bold uppercase tracking-widest">
              {label}
            </Text>
          </LinearGradient>
        </Pressable>
      </Link>
    );
  }

  return (
    <Link href={href} asChild>
      <Pressable className="flex-1 py-4 rounded-2xl border border-border bg-bg-medium items-center gap-2">
        <Feather name={icon} size={18} color="#FFB300" />
        <Text className="text-text-primary text-[11px] font-bold uppercase tracking-widest">
          {label}
        </Text>
      </Pressable>
    </Link>
  );
}

function SkillCard({
  name,
  category,
  mentor,
  rating,
}: {
  name: string;
  category: string;
  mentor: string;
  rating: number;
}) {
  return (
    <View className="w-44 bg-bg-medium border border-border rounded-2xl p-4">
      <View className="flex-row items-center justify-between mb-4">
        <View className="px-2 py-1 rounded-md bg-primary/10">
          <Text className="text-[9px] font-bold uppercase tracking-wider text-primary">
            {category}
          </Text>
        </View>
        <View className="flex-row items-center gap-1">
          <Feather name="star" size={11} color="#FFB300" />
          <Text className="text-[10px] font-semibold text-text-muted">
            {rating.toFixed(1)}
          </Text>
        </View>
      </View>
      <Text
        className="text-sm font-semibold text-text-primary mb-1"
        numberOfLines={1}>
        {name}
      </Text>
      <Text className="text-xs text-text-muted" numberOfLines={1}>
        by {mentor}
      </Text>
    </View>
  );
}
