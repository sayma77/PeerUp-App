import {Feather} from "@expo/vector-icons";
import {useEffect, useState} from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  AIResourceData,
  refineAIResource,
} from "../services/resourceService";

type Props = {
  visible: boolean;
  resource: AIResourceData | null;
  onClose: () => void;
  onPublish: (resource: AIResourceData) => void;
};

export default function AIResourcePreview({
  visible,
  resource,
  onClose,
  onPublish,
}: Props) {
  const [currentResource, setCurrentResource] =
    useState<AIResourceData | null>(resource);

  const [previousResource, setPreviousResource] =
    useState<AIResourceData | null>(null);

  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState("");

  // Update the preview whenever a newly generated resource
  // is passed from the Resources screen.
  useEffect(() => {
    if (resource) {
      setCurrentResource(resource);
      setPreviousResource(null);
      setInstruction("");
      setError("");
    }
  }, [resource]);

  if (!currentResource) {
    return null;
  }

  async function handleRefine() {
    if (!instruction.trim()) {
      setError("Please tell AI what you want to modify.");
      return;
    }

    try {
      setError("");
      setRefining(true);

      const oldResource = currentResource;

      const updatedResource = await refineAIResource({
        resource: oldResource!,
        instruction: instruction.trim(),
      });

      setPreviousResource(oldResource);
      setCurrentResource(updatedResource);
      setInstruction("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Resource refinement failed.",
      );
    } finally {
      setRefining(false);
    }
  }

  function handleUndo() {
    if (!previousResource) return;

    setCurrentResource(previousResource);
    setPreviousResource(null);
    setError("");
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/90">
        <View className="flex-1 bg-bg-medium border border-border rounded-[2.5rem] mt-12 overflow-hidden">

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-6 pb-4 border-b border-border">
            <Text className="text-2xl font-extralight text-text-primary">
              AI Resource
            </Text>

            <Pressable
              onPress={onClose}
              disabled={refining}
            >
              <Feather
                name="x"
                size={20}
                color="#64748B"
              />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{padding: 24}}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >

            {/* AI identifier */}
            <View className="self-start flex-row items-center px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl mb-5">
              <Feather
                name="zap"
                size={11}
                color="#FFB300"
              />

              <Text className="ml-1 text-[9px] font-black uppercase tracking-widest text-primary">
                AI Generated
              </Text>
            </View>

            {/* Title */}
            <Text className="text-3xl font-extralight text-text-primary mb-5">
              {currentResource.title}
            </Text>

            {/* Metadata */}
            <View className="gap-3 mb-6">
              <MetadataRow
                label="Skill"
                value={currentResource.skill}
              />

              <MetadataRow
                label="Topic"
                value={currentResource.topic}
              />

              <MetadataRow
                label="Resource Type"
                value={currentResource.resourceType}
              />

              {currentResource.difficulty && (
                <MetadataRow
                  label="Difficulty"
                  value={currentResource.difficulty}
                />
              )}
            </View>

            {/* Content */}
            <View className="border-t border-border pt-6">
              <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-3">
                Resource Content
              </Text>

              <Text className="text-sm text-text-primary leading-6">
                {currentResource.content}
              </Text>
            </View>

            {/* Edit */}
            <Pressable
              onPress={() => {
                // Editing will be added in the next step.
              }}
              className="mt-6 py-3.5 rounded-2xl border border-border items-center"
            >
              <View className="flex-row items-center gap-2">
                <Feather
                  name="edit-2"
                  size={14}
                  color="#FFB300"
                />

                <Text className="text-[10px] font-black uppercase tracking-widest text-primary">
                  Edit Resource
                </Text>
              </View>
            </Pressable>

            {/* Refinement */}
            <View className="mt-6 pt-6 border-t border-border">
              <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2">
                Refine with AI
              </Text>

              <TextInput
                value={instruction}
                onChangeText={setInstruction}
                placeholder="Ask AI to modify this resource..."
                placeholderTextColor="#475569"
                multiline
                textAlignVertical="top"
                className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm min-h-[100px]"
              />

              {error ? (
                <View className="mt-3 px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
                  <Text className="text-sm text-red-400">
                    {error}
                  </Text>
                </View>
              ) : null}

              <Pressable
                onPress={handleRefine}
                disabled={refining}
                className={`mt-3 py-4 rounded-2xl items-center ${
                  refining ? "bg-primary/50" : "bg-primary"
                }`}
              >
                <View className="flex-row items-center gap-2">
                  <Feather
                    name="zap"
                    size={14}
                    color="#000"
                  />

                  <Text className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
                    {refining
                      ? "Refining..."
                      : "Refine with AI"}
                  </Text>
                </View>
              </Pressable>

              {/* Undo */}
              {previousResource && (
                <Pressable
                  onPress={handleUndo}
                  disabled={refining}
                  className="mt-3 py-3.5 rounded-2xl border border-border items-center"
                >
                  <View className="flex-row items-center gap-2">
                    <Feather
                      name="corner-up-left"
                      size={14}
                      color="#64748B"
                    />

                    <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                      Undo Latest Refinement
                    </Text>
                  </View>
                </Pressable>
              )}
            </View>

            {/* Final actions */}
            <View className="mt-6 pt-6 border-t border-border gap-3">
              <Pressable
                onPress={() => onPublish(currentResource)}
                className="py-4 rounded-2xl bg-primary items-center"
              >
                <Text className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
                  Publish Resource
                </Text>
              </Pressable>
            </View>

          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 rounded-2xl bg-bg-light border border-border">
      <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted">
        {label}
      </Text>

      <Text
        className="text-sm text-text-primary ml-4 flex-1 text-right"
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}