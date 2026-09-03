import { Feather } from "@expo/vector-icons";
import { useState, type ReactNode } from "react";
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
  AIResourceDifficulty,
  AIResourceType,
  generateAIResource,
  refineAIResource,
  downloadAIResourceAsPDF,
} from "../services/resourceService";

import { SKILL_OPTIONS } from "../types/resources";

type Props = {
  visible: boolean;
  onClose: () => void;
  onGenerated: (resource: AIResourceData) => void;
};

const RESOURCE_TYPES: AIResourceType[] = [
  "Guide",
  "Cheat Sheet",
  "Exercise Set",
  "Quiz",
  "Roadmap",
  "Study Notes",
  "Tutorial",
  "Interview Questions",
  "Practice Problems",
  "Summary",
];

const DIFFICULTIES: AIResourceDifficulty[] = [
  "Beginner",
  "Medium",
  "Hard",
];

export default function AIResourceGenerator({
  visible,
  onClose,
  onGenerated,
}: Props) {
  // =========================
  // Generation form
  // =========================
  const [skill, setSkill] = useState<string | null>(null);
  const [topic, setTopic] = useState("");
  const [resourceType, setResourceType] =
    useState<AIResourceType | null>(null);
  const [difficulty, setDifficulty] =
    useState<AIResourceDifficulty | null>(null);

  // =========================
  // Generated resource
  // =========================
  const [resource, setResource] =
    useState<AIResourceData | null>(null);

  // =========================
  // Editing
  // =========================
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");

  // =========================
  // Refinement / undo
  // =========================
  const [previousResources, setPreviousResources] =
    useState<AIResourceData[]>([]);
  const [instruction, setInstruction] = useState("");

  // =========================
  // UI state
  // =========================
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [creatingPdf, setCreatingPdf] = useState(false);
  const [error, setError] = useState("");

  const isBusy = loading || refining || creatingPdf;

  function reset() {
    setSkill(null);
    setTopic("");
    setResourceType(null);
    setDifficulty(null);
    setResource(null);
    setEditing(false);
    setEditTitle("");
    setEditContent("");
    setPreviousResources([]);
    setInstruction("");
    setError("");
    setLoading(false);
    setRefining(false);
    setCreatingPdf(false);
  }

  function handleClose() {
    if (isBusy) return;
    reset();
    onClose();
  }

  // =========================
  // Generate
  // =========================
  async function handleGenerate() {
    setError("");

    if (!skill) {
      setError("Please select a skill.");
      return;
    }

    if (!topic.trim()) {
      setError("Please enter a topic.");
      return;
    }

    if (!resourceType) {
      setError("Please select a resource type.");
      return;
    }

    try {
      setLoading(true);

      const generated = await generateAIResource({
        skill,
        topic: topic.trim(),
        resourceType,
        difficulty: difficulty ?? undefined,
      });

      // Stay inside this modal and show the generated resource.
      setResource(generated);
      setEditTitle(generated.title);
      setEditContent(generated.content);
      setPreviousResources([]);
      setInstruction("");
      setEditing(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Resource generation failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // Editing
  // =========================
  function startEditing() {
    if (!resource) return;

    setEditTitle(resource.title);
    setEditContent(resource.content);
    setEditing(true);
  }

  function saveEdits() {
    if (!resource) return;

    const updatedResource: AIResourceData = {
      ...resource,
      title: editTitle.trim() || resource.title,
      content: editContent,
    };

    setResource(updatedResource);
    setEditing(false);
  }

  // =========================
  // Refine with AI
  // =========================
  async function handleRefine() {
    if (!resource || !instruction.trim() || isBusy) {
      return;
    }

    setError("");

    try {
      setRefining(true);

      const currentResource = resource;

      const refined = await refineAIResource({
        resource: currentResource,
        instruction: instruction.trim(),
      });

      // Keep the current version so Undo can restore it.
      setPreviousResources((previous) => [
        ...previous,
        currentResource,
      ]);

      setResource(refined);
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

  // =========================
  // Undo
  // =========================
  function handleUndo() {
    if (previousResources.length === 0 || isBusy) {
      return;
    }

    const previous =
      previousResources[previousResources.length - 1];

    setResource(previous);
    setEditTitle(previous.title);
    setEditContent(previous.content);

    setPreviousResources((history) =>
      history.slice(0, -1),
    );

    setEditing(false);
    setError("");
  }

  // =========================
  // Download PDF
  // =========================
  async function handleDownloadPDF() {
    if (!resource || isBusy) return;

    try {
      setCreatingPdf(true);
      setError("");

      const finalResource: AIResourceData = {
        ...resource,
        title: editing
          ? editTitle.trim() || resource.title
          : resource.title,
        content: editing
          ? editContent
          : resource.content,
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

  // =========================
  // Publish
  // =========================
  function handlePublish() {
    if (!resource || isBusy) return;

    // If the user is currently editing,
    // publish the edited version.
    const finalResource: AIResourceData = editing
      ? {
          ...resource,
          title: editTitle.trim() || resource.title,
          content: editContent,
        }
      : resource;

    onGenerated(finalResource);
    reset();
  }

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
    >
      <Pressable
        className="flex-1 bg-black/90 items-center justify-center px-6"
        onPress={handleClose}
      >
        <Pressable
          onPress={(e) => e.stopPropagation()}
          className="w-full bg-bg-medium border border-border rounded-[2.5rem] p-8 max-h-[88%]"
        >
          <ScrollView
            
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled={true}
            contentContainerStyle={{ padding: 10 }}
          >
            {/* Header */}
            <View className="flex-row items-start justify-between mb-2">
              <Text className="text-3xl font-extralight text-text-primary">
                {resource ? (
                  <>
                    AI{" "}
                    <Text className="text-primary">
                      Resource
                    </Text>
                  </>
                ) : (
                  <>
                    Generate{" "}
                    <Text className="text-primary">
                      with AI
                    </Text>
                  </>
                )}
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
              {resource
                ? "Review, edit, refine, and publish your resource."
                : "Create a learning resource with Gemini."}
            </Text>

            {/* =====================================================
                GENERATION FORM
            ===================================================== */}

            {!resource ? (
              <View className="gap-4">
                <OptionPicker
                  label="Skill"
                  value={skill}
                  options={SKILL_OPTIONS as string[]}
                  placeholder="Select Skill"
                  onSelect={setSkill}
                />

                <View>
                  <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">
                    Topic
                  </Text>

                  <TextInput
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="e.g. React Native Navigation"
                    placeholderTextColor="#475569"
                    className="w-full px-5 py-4 rounded-2xl bg-bg-light border border-border text-text-primary text-sm"
                  />
                </View>

                <OptionPicker
                  label="Resource Type"
                  value={resourceType}
                  options={RESOURCE_TYPES}
                  placeholder="Select Resource Type"
                  onSelect={(value) =>
                    setResourceType(
                      value as AIResourceType | null,
                    )
                  }
                />

                <OptionPicker
                  label="Difficulty (Optional)"
                  value={difficulty}
                  options={DIFFICULTIES}
                  placeholder="Select Difficulty"
                  onSelect={(value) =>
                    setDifficulty(
                      value as AIResourceDifficulty | null,
                    )
                  }
                />

                {error ? (
                  <ErrorBox message={error} />
                ) : null}

                <Pressable
                  onPress={handleGenerate}
                  disabled={isBusy}
                  className={`py-4 rounded-2xl items-center mt-2 ${
                    isBusy
                      ? "bg-primary/50"
                      : "bg-primary"
                  }`}
                >
                  <View className="flex-row items-center gap-2">
                    {isBusy ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Feather
                        name="zap"
                        size={14}
                        color="#000"
                      />
                    )}

                    <Text className="text-black text-[10px] font-black uppercase tracking-[0.2em]">
                      {isBusy
                        ? "Generating..."
                        : "Generate Resource"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            ) : (
              /* =====================================================
                 GENERATED RESOURCE PREVIEW
              ===================================================== */

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
                  <Tag label={resource.skill} />

                  <Tag label={resource.resourceType} />

                  {resource.difficulty ? (
                    <Tag label={resource.difficulty} />
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
                    {resource.title}
                  </Text>
                )}

                {/* Topic */}
                <Text className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-4">
                  Topic: {resource.topic}
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
                      content={resource.content}
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
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ================================================================
// FORMATTED AI CONTENT
// Same structured style as Explore Resource
// ================================================================

function renderInlineMarkdown(
  text: string,
): ReactNode[] {
  const parts = text.split(
    /(\*\*.*?\*\*|__.*?__|`.*?`)/g,
  );

  return parts.map((part, index) => {
    // Bold text: **text** or __text__
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

    // Inline code: `code`
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
    // # Heading
    // ## Heading
    // ### Heading
    // ============================================================

    const headingMatch = trimmed.match(
      /^#{1,3}\s*(.*)$/,
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
    // Step 1: ...
    // Step 2 - ...
    // ============================================================

    const stepMatch = trimmed.match(
      /^(Step\s*\d+)\s*[:.-]?\s*(.*)$/i,
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
    // 1. item
    // 2. item
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
    // item
    // * item
    // • item
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

// ================================================================
// OPTION PICKER
// ================================================================

function OptionPicker({
  label,
  value,
  options,
  placeholder,
  onSelect,
}: {
  label: string;
  value: string | null;
  options: string[];
  placeholder: string;
  onSelect: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <View>
      <Text className="text-[10px] font-black uppercase tracking-widest text-text-muted mb-2 px-1">
        {label}
      </Text>

      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center justify-between px-4 py-3.5 bg-bg-medium border border-border rounded-2xl"
      >
        <Text
          className={`text-sm ${
            value
              ? "text-text-primary"
              : "text-text-muted"
          }`}
          numberOfLines={1}
        >
          {value || placeholder}
        </Text>

        <Feather
          name="chevron-down"
          size={16}
          color="#64748B"
        />
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable
          className="flex-1 justify-end bg-black/70"
          onPress={() => setOpen(false)}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            className="bg-bg-medium border-t border-border rounded-t-[2.5rem] p-6 pb-10 max-h-[70%]"
          >
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-light text-text-primary">
                {placeholder}
              </Text>

              <Pressable
                onPress={() => setOpen(false)}
              >
                <Feather
                  name="x"
                  size={20}
                  color="#64748B"
                />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
            >
              <Pressable
                onPress={() => {
                  onSelect(null);
                  setOpen(false);
                }}
                className="py-4 border-b border-border flex-row justify-between items-center"
              >
                <Text
                  className={`text-base ${
                    value === null
                      ? "text-primary font-bold"
                      : "text-text-primary"
                  }`}
                >
                  None
                </Text>

                {value === null && (
                  <Feather
                    name="check"
                    size={18}
                    color="#FFB300"
                  />
                )}
              </Pressable>

              {options.map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    onSelect(option);
                    setOpen(false);
                  }}
                  className="py-4 border-b border-border flex-row justify-between items-center"
                >
                  <Text
                    className={`text-base ${
                      value === option
                        ? "text-primary font-bold"
                        : "text-text-primary"
                    }`}
                  >
                    {option}
                  </Text>

                  {value === option && (
                    <Feather
                      name="check"
                      size={18}
                      color="#FFB300"
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}