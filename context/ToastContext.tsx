import { Feather } from "@expo/vector-icons";
import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Animated, Text, View } from "react-native";

type ToastType = "success" | "error" | "info";

type ToastContextValue = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

const ICONS: Record<ToastType, keyof typeof Feather.glyphMap> = {
  success: "check-circle",
  error: "x-circle",
  info: "info",
};

const COLORS: Record<ToastType, string> = {
  success: "#22c55e",
  error: "#ef4444",
  info: "#FFB300",
};

export function ToastProvider({children}: {children: React.ReactNode}) {
  const [toast, setToast] = useState<{message: string; type: ToastType} | null>(
    null,
  );
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback(
    (message: string, type: ToastType = "info") => {
      setToast({message, type});
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 100,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => setToast(null));
      }, 3000);
    },
    [translateY, opacity],
  );

  return (
    <ToastContext.Provider value={{showToast}}>
      {children}
      {toast && (
        <Animated.View
          style={{
            transform: [{translateY}],
            opacity,
            position: "absolute",
            bottom: 40,
            left: 20,
            right: 20,
          }}>
          <View className="flex-row items-center gap-3 bg-bg-medium border border-border rounded-2xl p-4">
            <Feather
              name={ICONS[toast.type]}
              size={20}
              color={COLORS[toast.type]}
            />
            <View className="flex-1">
              <Text className="text-sm font-medium text-text-primary">
                {toast.message}
              </Text>
              <Text className="text-[10px] uppercase tracking-widest font-bold text-text-muted">
                {toast.type}
              </Text>
            </View>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}
