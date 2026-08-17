import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "./Footer";
import Header from "./Header";

type ScreenProps = {
  children: React.ReactNode;
  user?: {name: string} | null;
  hideFooter?: boolean;
  scroll?: boolean;
};

export default function Screen({
  children,
  user = null,
  hideFooter = true,
  scroll = true,
}: ScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-bg-light" edges={["top"]}>
      <Header user={user} />
      {scroll ? (
        <ScrollView className="flex-1" contentContainerStyle={{flexGrow: 1}}>
          {children}
          {!hideFooter && <Footer />}
        </ScrollView>
      ) : (
        <View className="flex-1">
          {children}
          {!hideFooter && <Footer />}
        </View>
      )}
    </SafeAreaView>
  );
}
