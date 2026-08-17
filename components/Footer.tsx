import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";

const sections: {
  title: string;
  links: {label: string; href: string | null}[];
}[] = [
  {title: "Platform", links: [{label: "Browse Skills", href: "/skills"}]},
  {
    title: "Support",
    links: [
      {label: "Help Center", href: null},
      {label: "Community Rules", href: null},
    ],
  },
  {
    title: "Legal",
    links: [
      {label: "Privacy Policy", href: null},
      {label: "Terms of Service", href: null},
    ],
  },
];

export default function Footer() {
  return (
    <View className="border-t border-border bg-bg-light px-5 pt-10 pb-8">
      {/* Brand & Description remain full width at the top */}
      <Text className="text-2xl font-light text-text-primary mb-3">
        Peer<Text className="font-semibold text-primary">Up</Text>
      </Text>
      <Text className="text-sm text-text-muted leading-relaxed mb-8">
        The decentralized platform for human knowledge. Swap what you know for
        what you want to learn.
      </Text>

      {/* Wrapping the sections in a flex-row with wrap enabled */}
      <View className="flex-row flex-wrap">
        {sections.map((section) => (
          // Added 'w-1/2' to force each section to take up exactly 50% of the row width
          <View key={section.title} className="w-1/2 mb-6 pr-4">
            <Text className="text-sm font-bold text-text-primary mb-2">
              {section.title}
            </Text>
            {section.links.map((link) =>
              link.href ? (
                <Link key={link.label} href={link.href as any} asChild>
                  <Pressable className="py-1">
                    <Text className="text-sm text-text-muted">{link.label}</Text>
                  </Pressable>
                </Link>
              ) : (
                <Text key={link.label} className="text-sm text-text-muted py-1">
                  {link.label}
                </Text>
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}