import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Screen from "../components/Screen";

// TEMPORARY: replace with real Firebase Auth state once auth is wired up
const user: {name: string} | null = null;

export default function Home() {
  return (
    <Screen user={user}>
      {/* Hero */}
      <LinearGradient
        colors={["#0A0E17", "#111622", "#0A0E17"]}
        className="px-8 pt-24 pb-16 items-center">
        <Text className="text-4xl font-extralight text-center leading-[48px] text-[#f5fff9]">
          Learn Skills
        </Text>
        <Text className="text-4xl font-semibold text-center leading-[48px] text-primary mt-1">
          Share Yours
        </Text>

        <Text className="text-[15px] text-center mt-8 leading-7 text-[rgba(245,255,249,0.78)] max-w-[300px]">
          Everyone has something to teach.{"\n"}Everyone has something to learn.
        </Text>

        <View className="mt-12 w-full gap-4">
          {user ? (
            <Link href="/dashboard" asChild>
              <Pressable>
                <LinearGradient
                  colors={["#D97706", "#F59E0B"]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  className="py-4 rounded-2xl items-center">
                  <Text className="text-white text-xs font-bold uppercase tracking-widest">
                    Dashboard
                  </Text>
                </LinearGradient>
              </Pressable>
            </Link>
          ) : (
            <Link href="/(auth)/register" asChild>
              <Pressable>
                <LinearGradient
                  colors={["#D97706", "#F59E0B"]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  className="py-4 rounded-2xl items-center">
                  <Text className="text-white text-xs font-bold uppercase tracking-widest">
                    Start Learning
                  </Text>
                </LinearGradient>
              </Pressable>
            </Link>
          )}

          <Link href="/skills" asChild>
            <Pressable className="py-4 rounded-2xl border border-[rgba(255,255,255,0.25)] bg-[rgba(255,255,255,0.06)] items-center">
              <Text className="text-[#f5fff9] text-xs font-bold uppercase tracking-widest">
                Browse Skills
              </Text>
            </Pressable>
          </Link>
        </View>
      </LinearGradient>

      {/* Feature cards */}
      <View className="px-6 mt-14 gap-5">
        <FeatureCard
          icon="repeat"
          title="Skill Exchange"
          description="Trade your expertise directly. Teach what you know, learn what you need. Knowledge sharing without the price tag."
        />
        <FeatureCard
          icon="users"
          title="Verified Community"
          description="Connect with real people passionate about teaching. Build meaningful relationships through shared growth."
        />
        <FeatureCard
          icon="zap"
          title="Flexible Learning"
          description="Learn at your own pace. Schedule sessions that work for you. Online or in-person, the choice is yours."
        />
      </View>

      {/* How it works */}
      <View className="mt-20 px-6">
        <Text className="text-2xl font-light text-center text-text-primary mb-12">
          How PeerUp works
        </Text>

        <View className="gap-14">
          <Step
            number={1}
            title="List Your Skill"
            description="Create a profile detailing what you can teach and what you want to learn in return."
          />
          <Step
            number={2}
            title="Find a Match"
            description="Browse users who have the expertise you need and are looking for the skills you offer."
          />
          <Step
            number={3}
            title="Swap Knowledge"
            description="Connect via messages to start your mutual learning journey today."
          />
        </View>
      </View>

      {/* Before / After comparison */}
      <View className="mt-20 px-6 mb-16">
        <Text className="text-2xl font-light text-center text-text-primary mb-3">
          The PeerUp Transformation
        </Text>
        <Text className="text-sm text-center text-text-muted mb-12 leading-6 max-w-[300px] self-center">
          Stop paying for expensive courses. Join a community where learning is
          shared, not sold.
        </Text>

        <View className="gap-8">
          <ComparisonPair
            before="Paying expensive hourly rates for a tutor to explain complex topics."
            after="Trading an hour of your existing skills for an hour of expert help."
          />
          <ComparisonPair
            before="Taking generic, pre-recorded online courses with no feedback."
            after="Live, 1-on-1 personalized sessions tailored exactly to your current goal."
          />
        </View>
      </View>
    </Screen>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View className="bg-bg-medium border border-border rounded-3xl p-7">
      <View className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/10 items-center justify-center mb-5">
        <Feather name={icon} size={22} color="#FFB300" />
      </View>
      <Text className="text-lg font-semibold text-text-primary mb-2.5">
        {title}
      </Text>
      <Text className="text-sm leading-6 text-text-muted">{description}</Text>
    </View>
  );
}

function Step({
  number,
  title,
  description,
}: {
  number: number;
  title: string;
  description: string;
}) {
  return (
    <View className="items-center">
      <LinearGradient
        colors={["#D97706", "#FFB300"]}
        className="w-20 h-20 rounded-2xl items-center justify-center mb-5">
        <Text className="text-white text-2xl font-bold">{number}</Text>
      </LinearGradient>
      <Text className="text-lg font-semibold text-text-primary mb-2">
        {title}
      </Text>
      <Text className="text-sm text-center text-text-muted leading-6 max-w-[280px]">
        {description}
      </Text>
    </View>
  );
}

function ComparisonPair({before, after}: {before: string; after: string}) {
  return (
    <View className="gap-4">
      <View className="bg-bg-medium border border-border rounded-2xl p-6 flex-row gap-4 items-start">
        <View className="w-10 h-10 rounded-xl bg-red-500/10 items-center justify-center">
          <Feather name="x" size={18} color="#ef4444" />
        </View>
        <Text className="flex-1 text-sm text-text-primary leading-6">
          {before}
        </Text>
      </View>

      <View className="items-center py-1">
        <Feather name="arrow-down" size={20} color="#FFB300" />
      </View>

      <View className="bg-bg-light border border-primary/20 rounded-2xl p-6 flex-row gap-4 items-start">
        <LinearGradient
          colors={["#D97706", "#FFB300"]}
          className="w-10 h-10 rounded-xl items-center justify-center">
          <Feather name="check" size={18} color="white" />
        </LinearGradient>
        <Text className="flex-1 text-sm font-medium text-text-primary leading-6">
          {after}
        </Text>
      </View>
    </View>
  );
}
