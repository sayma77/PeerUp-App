import { Feather } from "@expo/vector-icons";
import { CommonActions, type NavigationState } from "@react-navigation/native";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useAuth } from "../../context/AuthContext";

export default function TabsLayout() {
  const {user} = useAuth();

  return (
    <View style={{flex: 1, backgroundColor: "#0A0E17"}}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: "#FFB300",
          tabBarInactiveTintColor: "#64748B",
          tabBarStyle: {
            backgroundColor: "#111622",
            borderTopColor: "#1a1f2e",
          },
          tabBarLabelStyle: {fontSize: 10, fontWeight: "700"},
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: "Home",
            tabBarIcon: ({color, size}) => (
              <Feather name="home" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen
          name="skills"
          options={{
            title: "Skills",
            tabBarIcon: ({color, size}) => (
              <Feather name="zap" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen name="skills/[id]" options={{href: null}} />

        <Tabs.Screen
          name="classrooms"
          options={{
            title: "Classes",
            href: user ? undefined : null,
            tabBarIcon: ({color, size}) => (
              <Feather name="video" color={color} size={size} />
            ),
          }}
          listeners={({navigation}) => ({
            blur: () => {
              navigation.dispatch((state: NavigationState) => {
                const routes = state.routes.map((route) =>
                  route.name === "classrooms"
                    ? {...route, state: undefined}
                    : route,
                );
                return CommonActions.reset({...state, routes});
              });
            },
          })}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: "Projects",
            href: user ? undefined : null,
            tabBarIcon: ({color, size}) => (
              <Feather name="briefcase" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen name="projects/[id]" options={{href: null}} />
        <Tabs.Screen
          name="resources"
          options={{
            title: "Resources",
            href: user ? undefined : null,
            tabBarIcon: ({color, size}) => (
              <Feather name="book-open" color={color} size={size} />
            ),
          }}
        />
        <Tabs.Screen name="chat" options={{href: null}} />
        <Tabs.Screen name="profile/index" options={{href: null}} />
        <Tabs.Screen name="profile/[username]" options={{href: null}} />
        <Tabs.Screen name="notifications" options={{href: null}} />
        <Tabs.Screen name="dashboard" options={{href: null}} />
      </Tabs>
    </View>
  );
}
