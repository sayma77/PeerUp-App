import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  ImageBackground,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import Screen from "../../components/Screen";
import { useAuth } from "../../context/AuthContext";

const {width} = Dimensions.get("window");
const HAS_SEEN_TUTORIAL_KEY = "@peerup_has_seen_tutorial";

const TUTORIAL_SLIDES = [
  {
    id: "1",
    title: "Discover & Request Skills",
    subtitle:
      "Explore mentor profiles, chat directly, and request personalized skill sessions.",
    icon: "compass" as const,
  },
  {
    id: "2",
    title: "Join & Create Classes",
    subtitle:
      "Participate in live classes of your choice or host your own to teach others.",
    icon: "book-open" as const,
  },
  {
    id: "3",
    title: "Collaborate on Projects",
    subtitle:
      "List your project requirements or join active community builds to collaborate.",
    icon: "users" as const,
  },
  {
    id: "4",
    title: "AI & Community Resources",
    subtitle:
      "Upload learning resources or instantly generate AI-powered guides to publish.",
    icon: "cpu" as const,
  },
  {
    id: "5",
    title: "Earn Badges & Grow",
    subtitle:
      "Complete skills, unlock verified profile badges, and showcase your achievements.",
    icon: "award" as const,
  },
];

const TOP_MENTORS = [
  {id: "m1", name: "Arif Khan", skill: "React Native", rating: 4.9},
  {id: "m2", name: "Priya Das", skill: "UI Design", rating: 4.8},
  {id: "m3", name: "Sara Ahmed", skill: "Spanish", rating: 5.0},
  {id: "m4", name: "Rafi Islam", skill: "Business", rating: 4.7},
];

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
  const router = useRouter();

  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    async function checkTutorialStatus() {
      try {
        const hasSeen = await AsyncStorage.getItem(HAS_SEEN_TUTORIAL_KEY);
        if (!hasSeen && !user) {
          setShowTutorial(true);
        }
      } catch (error) {
        console.error("Failed to load tutorial status", error);
      } finally {
        setIsLoadingStorage(false);
      }
    }
    checkTutorialStatus();
  }, [user]);

  const completeTutorial = async () => {
    try {
      await AsyncStorage.setItem(HAS_SEEN_TUTORIAL_KEY, "true");
    } catch (error) {
      console.error("Failed to save tutorial status", error);
    }
    setShowTutorial(false);
    if (!user) {
      router.push("/(auth)/login" as any);
    }
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < TUTORIAL_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      completeTutorial();
    }
  };

  if (isLoadingStorage) {
    return (
      <Screen user={null}>
        <View
          style={{flex: 1}}
          className="bg-bg-dark justify-center items-center">
          <ActivityIndicator color="#FFB300" size="large" />
        </View>
      </Screen>
    );
  }

  // Tutorial View - Fullscreen without header or bottom navbar
  if (showTutorial && !user) {
    return (
      <View
        style={{flex: 1}}
        className="bg-bg-dark justify-between overflow-hidden">
        {/* Ambient Background Glow Effects */}
        <View className="absolute top-1/4 -left-20 w-72 h-72 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
        <View className="absolute bottom-1/4 -right-20 w-72 h-72 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        {/* Top Skip Bar (Independent of app header) */}
        <View className="flex-row justify-between items-center px-6 pt-12">
          <View className="flex-row items-center gap-2">
            <View className="w-2.5 h-2.5 rounded-full bg-primary" />
            <Text className="text-xs font-black tracking-widest text-text-primary uppercase opacity-90">
              PeerUp Guide
            </Text>
          </View>
          <Pressable
            onPress={completeTutorial}
            className="px-4 py-2 rounded-xl bg-bg-medium/80 border border-border/80 active:opacity-70">
            <Text className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Skip
            </Text>
          </Pressable>
        </View>

        {/* Tutorial Carousel */}
        <FlatList
          ref={flatListRef}
          data={TUTORIAL_SLIDES}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          keyExtractor={(item) => item.id}
          renderItem={({item}) => (
            <View style={{width}} className="px-8 justify-center items-center">
              {/* Glowing Feature Icon Box */}
              <View className="relative mb-8">
                <View className="absolute inset-0 rounded-3xl bg-primary/20 blur-xl scale-110" />
                <LinearGradient
                  colors={["rgba(255, 179, 0, 0.2)", "rgba(17, 22, 34, 0.8)"]}
                  className="w-28 h-28 rounded-3xl border border-primary/40 items-center justify-center shadow-2xl">
                  <Feather name={item.icon} size={44} color="#FFB300" />
                </LinearGradient>
              </View>

              {/* Title & Subtitle */}
              <Text className="text-3xl font-bold text-text-primary text-center mb-3 tracking-tight">
                {item.title}
              </Text>
              <Text className="text-base text-text-muted text-center leading-7 max-w-[300px]">
                {item.subtitle}
              </Text>
            </View>
          )}
        />

        {/* Bottom Action & Pagination */}
        <View className="px-8 pb-12 gap-8">
          {/* Pagination Dots */}
          <View className="flex-row justify-center items-center gap-2">
            {TUTORIAL_SLIDES.map((_, index) => (
              <View
                key={index}
                className={`h-2 rounded-full transition-all ${
                  currentIndex === index
                    ? "w-8 bg-primary shadow-sm shadow-primary"
                    : "w-2 bg-border"
                }`}
              />
            ))}
          </View>

          {/* Next / Get Started Gradient Button */}
          <Pressable
            onPress={handleNext}
            className="rounded-2xl overflow-hidden shadow-lg shadow-primary/20 active:opacity-90">
            <LinearGradient
              colors={["#D97706", "#FFB300"]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              className="py-4 items-center justify-center">
              <Text className="text-white text-xs font-black uppercase tracking-widest">
                {currentIndex === TUTORIAL_SLIDES.length - 1
                  ? "Get Started"
                  : "Continue"}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  // Regular Home View
  return (
    <Screen user={user ? {name: user.email ?? "You"} : null}>
      <View style={{flex: 1}}>
        <ImageBackground
          source={require("../../assets/images/background-texture.png")}
          resizeMode="cover"
          style={{flex: 1}}
          imageStyle={{opacity: 0.45}}>
          <ScrollView contentContainerStyle={{paddingBottom: 40}}>
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
                    href="/(auth)/login"
                    icon="log-in"
                    label="Login"
                    filled
                  />
                </>
              )}
            </View>

            <View className="mt-9 mb-10">
              <View className="flex-row items-center justify-between px-6 mb-3">
                <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted opacity-80">
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

            <View className="px-6 mb-14">
              <Link href={user ? "/(tabs)/dashboard" : "/(auth)/login"} asChild>
                <Pressable>
                  <LinearGradient
                    colors={["rgba(17, 22, 34, 0.9)", "rgba(10, 14, 23, 0.95)"]}
                    className="rounded-3xl p-7 border border-primary/30 overflow-hidden shadow-lg">
                    <View className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-primary/15 blur-md" />
                    <Feather
                      name="zap"
                      size={22}
                      color="#FFB300"
                      style={{marginBottom: 12}}
                    />
                    <Text className="text-xl font-semibold text-text-primary mb-1.5">
                      {user
                        ? "Have a skill to share?"
                        : "Ready to start trading knowledge?"}
                    </Text>
                    <Text className="text-sm text-text-muted leading-6 mb-5 max-w-[260px]">
                      {user
                        ? "List what you can teach and start trading with the community."
                        : "Log in or sign up to connect with mentors and peers."}
                    </Text>
                    <View className="flex-row items-center gap-2">
                      <Text className="text-xs font-bold text-primary uppercase tracking-widest">
                        {user ? "Add a skill" : "Log In Now"}
                      </Text>
                      <Feather name="arrow-right" size={14} color="#FFB300" />
                    </View>
                  </LinearGradient>
                </Pressable>
              </Link>
            </View>
          </ScrollView>
        </ImageBackground>
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
            className="py-4 rounded-2xl items-center gap-2 shadow-md">
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
      <Pressable className="flex-1 py-4 rounded-2xl border border-border bg-bg-medium/80 backdrop-blur-md items-center gap-2">
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
    <View className="w-44 bg-bg-medium/85 border border-border/80 rounded-2xl p-4 shadow-sm backdrop-blur-md">
      <View className="flex-row items-center justify-between mb-4">
        <View className="px-2 py-1 rounded-md bg-primary/15">
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
