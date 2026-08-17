import { useLocalSearchParams } from "expo-router";
import { Text, View } from "react-native";

export default function ProjectDetail() {
  const {id} = useLocalSearchParams();
  return (
    <View style={{flex: 1, alignItems: "center", justifyContent: "center"}}>
      <Text>Project detail screen (id: {id})</Text>
    </View>
  );
}
