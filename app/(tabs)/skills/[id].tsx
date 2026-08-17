import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function SkillDetail() {
  const {id} = useLocalSearchParams();
  return (
    <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
      <Text>Skill detail screen (id: {id})</Text>
    </View>
  );
}
