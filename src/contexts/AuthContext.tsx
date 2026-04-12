"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  User,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// The app owner — always has access even if the allowlist doc doesn't exist yet
const OWNER_EMAIL = "chieyong@gmail.com";

// ─── Context type ─────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null;
  loading: boolean;
  accessDenied: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  accessDenied: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

// ─── Allowlist check ──────────────────────────────────────────────────────────

async function isEmailAllowed(email: string): Promise<boolean> {
  // Owner always has access
  if (email === OWNER_EMAIL) return true;

  try {
    const snap = await getDoc(doc(db, "config", "allowlist"));
    if (!snap.exists()) return false;
    const emails: string[] = snap.data()?.emails ?? [];
    return emails.includes(email);
  } catch {
    // If Firestore is unreachable, only allow the owner
    return false;
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,          setUser]          = useState<User | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [accessDenied,  setAccessDenied]  = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser?.email) {
        const allowed = await isEmailAllowed(firebaseUser.email);
        if (!allowed) {
          // Sign out immediately and show access denied
          await firebaseSignOut(auth);
          setUser(null);
          setAccessDenied(true);
          setLoading(false);
          return;
        }
      }
      setUser(firebaseUser);
      setAccessDenied(false);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const code = (err as { code?: string })?.code ?? "";
      if (
        code === "auth/cancelled-popup-request" ||
        code === "auth/popup-closed-by-user"
      ) {
        return;
      }
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setAccessDenied(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, accessDenied, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const useAuth = () => useContext(AuthContext);
