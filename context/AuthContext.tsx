import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { auth, db } from "../firebaseConfig";

type AuthContextValue = {
  user: User | null;
  initializing: boolean;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  initializing: true,
});

export function useAuth() {
  return useContext(AuthContext);
}

// Self-heals accounts that are signed in via Firebase Auth but somehow
// ended up with no matching users/{uid} doc (e.g. Firestore data cleared
// separately from Auth during testing, or a signup that partially failed).
// Safe to call on every auth state change — it's a no-op once the doc exists.
async function ensureUserProfile(firebaseUser: User) {
  const ref = doc(db, "users", firebaseUser.uid);
  try {
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        name: firebaseUser.email?.split("@")[0] ?? "New User",
        username: firebaseUser.uid.slice(0, 8),
        email: firebaseUser.email ?? "",
        avatar: "",
        intro: "",
        bio: "",
        rating: 0,
        reviewCount: 0,
        pinnedBadges: [],
        createdAt: serverTimestamp(),
      });
      console.log("Created missing users doc for", firebaseUser.uid);
    }
  } catch (err) {
    // Don't let this block sign-in — worst case, the app behaves as it
    // did before this fix and the user doc stays missing until retried.
    console.error("Failed to ensure user profile:", err);
  }
}

export function AuthProvider({children}: {children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const router = useRouter();

  // Tracks the previously-seen uid so we can tell "no session yet" apart
  // from "a different account just took over." undefined = not seen any
  // auth event yet; null = signed out; string = signed in as that uid.
  const previousUidRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await ensureUserProfile(firebaseUser);
      }

      const newUid = firebaseUser?.uid ?? null;
      const previousUid = previousUidRef.current;

      setUser(firebaseUser);
      if (initializing) setInitializing(false);

      // Any change of *identity* (including logout, and especially
      // switching to a different account while a user-scoped screen like
      // a chat thread is still mounted) bounces the app to a safe route.
      // Screens holding stale route params (old conversationId, old
      // profile id, etc.) would otherwise keep re-querying data that no
      // longer belongs to the now-current session, which Firestore rules
      // correctly reject as permission-denied.
      if (previousUid !== undefined && previousUid !== newUid) {
        router.replace(newUid ? "/" : "/(auth)/login");
      }

      previousUidRef.current = newUid;
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{user, initializing}}>
      {children}
    </AuthContext.Provider>
  );
}