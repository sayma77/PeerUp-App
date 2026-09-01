import { useEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Footer from "./Footer";
import Header from "./Header";
import { useAuth } from "../context/AuthContext";
import { subscribeToUnreadMessageCount } from "../services/chatService";

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
  const { user: authUser } = useAuth();
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  useEffect(() => {
    if (!authUser) {
      setUnreadMessageCount(0);
      return;
    }
    const unsubscribe = subscribeToUnreadMessageCount(authUser.uid, setUnreadMessageCount);
    return unsubscribe;
  }, [authUser]);

  return (
    <SafeAreaView className="flex-1 bg-bg-light" edges={["top"]}>
      <Header user={user} unreadMessageCount={unreadMessageCount} />
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
