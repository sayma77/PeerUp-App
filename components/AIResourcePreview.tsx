import { Feather } from "@expo/vector-icons";
import { useEffect, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import {
  AIResourceData,
  downloadAIResourceAsPDF,
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

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  const [previousResources, setPreviousResources] = useState<
    AIResourceData[]
  >([]);

  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [creatingPdf, setCreatingPdf] = useState(false);
  const [error, setError] = useState("");

  const isBusy = refining || creatingPdf;

  useEffect(() => {
    if (resource) {
      setCurrentResource(resource);
      setEditTitle(resource.title);
      setEditContent(resource.content);
      setPreviousResources([]);
      setInstruction("");
      setEditing(false);
      setError("");
    }
  }, [resource]);

  function handleClose() {
    if (isBusy) return;

    if (resource) {
      setCurrentResource(resource);
      setEditTitle(resource.title);
      setEditContent(resource.content);
    }

    setPreviousResources([]);
    setInstruction("");
    setEditing(false);
    setError("");

    onClose();
  }

  function startEditing() {
    if (!currentResource) return;

    setEditTitle(currentResource.title);
    setEditContent(currentResource.content);
    setEditing(true);
  }

  function saveEdits() {
    if (!currentResource) return;

    const updatedResource: AIResourceData = {
      ...currentResource,
      title: editTitle.trim() || currentResource.title,
      content: editContent,
    };

    setCurrentResource(updatedResource);
    setEditing(false);
  }

  async function handleRefine() {
    if (!currentResource || !instruction.trim() || isBusy) {
      return;
    }

    setError("");

    try {
      setRefining(true);

      const oldResource = currentResource;

      const refined = await refineAIResource({
        resource: oldResource,
        instruction: instruction.trim(),
      });

      setPreviousResources((previous) => [
        ...previous,
        oldResource,
      ]);

      setCurrentResource(refined);
      setEditTitle(refined.title);
      setEditContent(refined.content);
      setInstruction("");
      setEditing(false);
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
    if (previousResources.length === 0 || isBusy) {
      return;
    }

    const previous =
      previousResources[previousResources.length - 1];

    setCurrentResource(previous);
    setEditTitle(previous.title);
    setEditContent(previous.content);

    setPreviousResources((history) =>
      history.slice(0, -1),
    );

    setEditing(false);
    setError("");
  }

  async function handleDownloadPDF() {
    if (!currentResource || isBusy) return;

    try {
      setCreatingPdf(true);
      setError("");

      const finalResource: AIResourceData = {
        ...currentResource,
        title: editing
          ? editTitle.trim() || currentResource.title
          : currentResource.title,
        content: editing
          ? editContent
          : currentResource.content,
      };

      await downloadAIResourceAsPDF(finalResource);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Could not create the PDF. Please try again.",
      );
    } finally {
      setCreatingPdf(false);
    }
  }

  function handlePublish() {
    if (!currentResource || isBusy) return;

    const finalResource: AIResourceData = editing
      ? {
          ...currentResource,
          title: editTitle.trim() || currentResource.title,
          content: editContent,
        }
      : currentResource;

    onPublish(finalResource);

    // Close the separate preview after publishing.
    onClose();
  }

  if (!currentResource) {
    return null;
  }

  return (
   <Modal
  visible={visible}
  animationType="fade"
  transparent={false}
  onRequestClose={handleClose}
>
  <View className="flex-1 bg-bg-medium">
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled={true}
      contentContainerStyle={{ padding: 24 }}
    >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-3xl font-extralight text-text-primary">
                AI{" "}
                <Text className="text-primary">
                  Resource
                </Text>
              </Text>

              <Pressable
                onPress={handleClose}
                disabled={isBusy}
              >
                <Feather
                  name="x"
                  size={20}
                  color="#64748B"
                />
              </Pressable>
            </View>

            <Text className="text-sm italic text-text-muted mb-6">
              Review, edit, refine, and publish your resource.
            </Text>

            {/* =====================================================
                GENERATED RESOURCE PREVIEW
            ===================================================== */}
            <View>
              {/* AI badge + Edit */}
              <View className="flex-row items-center justify-between mb-5">
                <View className="px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl self-start flex-row items-center gap-1">
                  <Text className="text-[10px]">
                    ✨
                  </Text>

                  <Text className="text-[9px] font-black uppercase tracking-widest text-primary">
                    AI Generated
                  </Text>
                </View>

                <Pressable
                  onPress={
                    editing
                      ? saveEdits
                      : startEditing
                  }
                  disabled={isBusy}
                  className="flex-row items-center gap-1"
                >
                  <Feather
                    name={
                      editing
                        ? "check"
                        : "edit-2"
                    }
                    size={14}
                    color="#FFB300"
                  />

                  <Text className="text-[10px] font-black uppercase tracking-widest text-primary">
                    {editing ? "Done" : "Edit"}
                  </Text>
                </Pressable>
              </View>

              {/* Metadata */}
              <View className="flex-row flex-wrap gap-2 mb-5">
                <Tag label={currentResource.skill} />

                <Tag
                  label={currentResource.resourceType}
                />

                {currentResource.difficulty ? (
                  <Tag
                    label={currentResource.difficulty}
                  />
                ) : null}
              </View>

              {/* Title */}
              {editing ? (
                <TextInput
                  value={editTitle}
                  onChangeText={setEditTitle}
                  placeholder="Resource title"
                  placeholderTextColor="#475569"
                  className="text-2xl font-extralight text-text-primary mb-4 border-b border-border pb-2"
                />
              ) : (
                <Text className="text-2xl font-extralight text-text-primary mb-4">
                  {currentResource.title}
                </Text>
              )}

              {/* Topic */}
              <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
                Topic: {currentResource.topic}
              </Text>

              {/* Content */}
              {editing ? (
                <TextInput
                  value={editContent}
                  onChangeText={setEditContent}
                  multiline
                  textAlignVertical="top"
                  className="text-sm text-text-primary leading-6 min-h-[220px] bg-bg-light border border-border rounded-2xl p-4"
                />
              ) : (
                <View className="bg-bg-light border border-border rounded-2xl p-5">
                  <FormattedAIContent
                    content={currentResource.content}
                  />
                </View>
              )}

              {error ? (
                <View className="mt-4">
                  <ErrorBox message={error} />
                </View>
              ) : null}

              {/* =================================================
                  REFINE WITH AI
              ================================================= */}
              <View className="mt-6 gap-3">
                <View className="flex-row items-center justify-between">
                  <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted">
                    Refine with AI
                  </Text>

                  {previousResources.length > 0 ? (
                    <Pressable
                      onPress={handleUndo}
                      disabled={isBusy}
                      className="flex-row items-center gap-1"
                    >
                      <Feather
                        name="rotate-ccw"
                        size={12}
                        color="#64748B"
                      />

                      <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                        Undo
                      </Text>
                    </Pressable>
                  ) : null}
                </View>

                <View className="bg-bg-light border border-border rounded-2xl px-4">
                  <TextInput
                    value={instruction}
                    onChangeText={setInstruction}
                    placeholder="e.g. Make it shorter and add examples"
                    placeholderTextColor="#475569"
                    multiline
                    className="px-1 py-3.5 text-text-primary text-sm"
                  />
                </View>

                <Pressable
                  onPress={handleRefine}
                  disabled={
                    isBusy ||
                    !instruction.trim()
                  }
                  className="py-3.5 rounded-2xl bg-primary items-center flex-row justify-center gap-2 disabled:opacity-50"
                >
                  {refining ? (
                    <ActivityIndicator color="#000" />
                  ) : (
                    <Feather
                      name="zap"
                      size={14}
                      color="#000"
                    />
                  )}

                  <Text className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
                    {refining
                      ? "Refining..."
                      : "Refine with AI"}
                  </Text>
                </Pressable>
              </View>

              {/* =================================================
                  DOWNLOAD PDF
              ================================================= */}
              <Pressable
                onPress={handleDownloadPDF}
                disabled={isBusy}
                className="py-4 rounded-2xl bg-bg-light border border-border items-center flex-row justify-center gap-2 mt-4 disabled:opacity-50"
              >
                {creatingPdf ? (
                  <ActivityIndicator color="#FFB300" />
                ) : (
                  <Feather
                    name="download"
                    size={15}
                    color="#FFB300"
                  />
                )}

                <Text className="text-primary text-[10px] font-black uppercase tracking-[0.2em]">
                  {creatingPdf
                    ? "Creating PDF..."
                    : "Download PDF"}
                </Text>
              </Pressable>

              {/* =================================================
                  PUBLISH
              ================================================= */}
              <Pressable
                onPress={handlePublish}
                disabled={isBusy}
                className="py-4 rounded-2xl bg-primary items-center mt-4 disabled:opacity-50"
              >
                <Text className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
                  Publish Resource
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
    </Modal>
  );
}

// ================================================================
// FORMATTED AI CONTENT
// ================================================================

function renderInlineMarkdown(
  text: string,
): ReactNode[] {
  const parts = text.split(
    /(\*\*.*?\*\*|__.*?__|`.*?`)/g,
  );

  return parts.map((part, index) => {
    // Bold text
    if (
      (part.startsWith("**") &&
        part.endsWith("**")) ||
      (part.startsWith("__") &&
        part.endsWith("__"))
    ) {
      return (
        <Text
          key={index}
          className="font-bold text-primary"
        >
          {part.slice(2, -2)}
        </Text>
      );
    }

    // Inline code
    if (
      part.startsWith("`") &&
      part.endsWith("`")
    ) {
      return (
        <Text
          key={index}
          className="font-mono text-primary"
        >
          {part.slice(1, -1)}
        </Text>
      );
    }

    return (
      <Text key={index}>
        {part}
      </Text>
    );
  });
}

function FormattedAIContent({
  content,
}: {
  content: string;
}) {
  const lines = content
    .replace(/\r\n/g, "\n")
    .split("\n");

  const elements: ReactNode[] = [];

  let inCodeBlock = false;
  let codeLines: string[] = [];

  function flushCodeBlock() {
    if (codeLines.length === 0) return;

    elements.push(
      <View
        key={`code-${elements.length}`}
        className="my-3 overflow-hidden rounded-2xl border border-border bg-bg-dark"
      >
        <View className="flex-row items-center gap-2 border-b border-border px-4 py-3">
          <View className="h-2 w-2 rounded-full bg-primary" />

          <Text className="text-xs font-semibold text-text-secondary">
            Code
          </Text>
        </View>

        <Text className="px-4 py-4 font-mono text-sm leading-6 text-text-primary">
          {codeLines.join("\n")}
        </Text>
      </View>,
    );

    codeLines = [];
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    // ============================================================
    // Code block
    // ============================================================

    if (trimmed.startsWith("```")) {
      if (inCodeBlock) {
        inCodeBlock = false;
        flushCodeBlock();
      } else {
        inCodeBlock = true;
        codeLines = [];
      }

      return;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      return;
    }

    // ============================================================
    // Empty line
    // ============================================================

    if (!trimmed) {
      elements.push(
        <View
          key={`space-${index}`}
          className="h-2"
        />,
      );

      return;
    }

    // ============================================================
    // Markdown headings
    // ============================================================

    const headingMatch = trimmed.match(
      /^#{1,3}\s(.*)$/,
    );

    if (headingMatch) {
      elements.push(
        <View
          key={`heading-${index}`}
          className="my-3 flex-row items-start gap-3"
        >
          <View className="mt-1 h-6 w-1 rounded-full bg-primary" />

          <Text className="flex-1 text-base font-bold leading-6 text-text-primary">
            {renderInlineMarkdown(
              headingMatch[1],
            )}
          </Text>
        </View>,
      );

      return;
    }

    // ============================================================
    // Step headings
    // ============================================================

    const stepMatch = trimmed.match(
      /^(Step\s\d+)\s[:.-]?\s(.*)$/i,
    );

    if (stepMatch) {
      elements.push(
        <View
          key={`step-${index}`}
          className="my-3 flex-row items-center gap-3"
        >
          <View className="h-8 w-8 items-center justify-center rounded-xl bg-primary">
            <Text className="text-xs font-bold text-black">
              {stepMatch[1].replace(
                /[^0-9]/g,
                "",
              )}
            </Text>
          </View>

          <Text className="flex-1 text-base font-bold text-text-primary">
            {renderInlineMarkdown(
              stepMatch[2],
            )}
          </Text>
        </View>,
      );

      return;
    }

    // ============================================================
    // Numbered list
    // ============================================================

    const numberMatch = trimmed.match(
      /^(\d+)[.)]\s+(.*)$/,
    );

    if (numberMatch) {
      elements.push(
        <View
          key={`number-${index}`}
          className="my-1 flex-row items-start gap-3"
        >
          <View className="mt-0.5 h-6 w-6 items-center justify-center rounded-lg bg-primary">
            <Text className="text-xs font-bold text-black">
              {numberMatch[1]}
            </Text>
          </View>

          <Text className="flex-1 text-sm leading-6 text-text-primary">
            {renderInlineMarkdown(
              numberMatch[2],
            )}
          </Text>
        </View>,
      );

      return;
    }

    // ============================================================
    // Bullet list
    // ============================================================

    const bulletMatch = trimmed.match(
      /^[-*•]\s+(.*)$/,
    );

    if (bulletMatch) {
      elements.push(
        <View
          key={`bullet-${index}`}
          className="my-1 flex-row items-start gap-3"
        >
          <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />

          <Text className="flex-1 text-sm leading-6 text-text-primary">
            {renderInlineMarkdown(
              bulletMatch[1],
            )}
          </Text>
        </View>,
      );

      return;
    }

    // ============================================================
    // Important / Note / Tip / Warning
    // ============================================================

    const specialMatch = trimmed.match(
      /^(Important|Note|Tip|Warning)\s*:\s*(.*)$/i,
    );

    if (specialMatch) {
      elements.push(
        <View
          key={`special-${index}`}
          className="my-3 rounded-2xl border border-primary/30 bg-primary/10 p-4"
        >
          <View className="flex-row items-start gap-3">
            <Feather
              name="info"
              size={18}
              color="#FFB300"
            />

            <Text className="flex-1 text-sm leading-6 text-text-primary">
              <Text className="font-bold text-primary">
                {specialMatch[1]}:
              </Text>{" "}
              {renderInlineMarkdown(
                specialMatch[2],
              )}
            </Text>
          </View>
        </View>,
      );

      return;
    }

    // ============================================================
    // Horizontal rule
    // ============================================================

    if (/^[-*_]{3,}$/.test(trimmed)) {
      elements.push(
        <View
          key={`divider-${index}`}
          className="my-2 h-px bg-border"
        />,
      );

      return;
    }

    // ============================================================
    // Normal paragraph
    // ============================================================

    elements.push(
      <Text
        key={`paragraph-${index}`}
        className="my-2 text-sm leading-6 text-text-primary"
      >
        {renderInlineMarkdown(trimmed)}
      </Text>,
    );
  });

  // If AI forgot to close the code block
  if (inCodeBlock) {
    flushCodeBlock();
  }

  return <View>{elements}</View>;
}

// ================================================================
// ERROR BOX
// ================================================================

function ErrorBox({
  message,
}: {
  message: string;
}) {
  return (
    <View className="px-4 py-3 rounded-2xl bg-red-500/10 border border-red-500/20">
      <Text className="text-sm text-red-400">
        {message}
      </Text>
    </View>
  );
}

// ================================================================
// TAG
// ================================================================

function Tag({
  label,
}: {
  label: string;
}) {
  return (
    <View className="px-3 py-1.5 bg-bg-light border border-border rounded-xl">
      <Text className="text-[9px] font-black uppercase tracking-widest text-text-muted">
        {label}
      </Text>
    </View>
  );
}