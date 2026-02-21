import { auth, db } from "@/firebaseConfig";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  User
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: User | null;
  role: "admin" | "user" | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [loading, setLoading] = useState(true);

  const ADMIN_EMAIL = "de8685@hotmail.com";

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setRole(userSnap.data().role);
        }
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const toAuthError = (error: unknown, action: "login" | "register") => {
    if (typeof error === "object" && error !== null) {
      const errorCode = "code" in error ? String(error.code) : "";
      const errorMessage = "message" in error ? String(error.message) : "";

      if (errorCode === "auth/operation-not-allowed") {
        return new Error(
          "Email/Password sign-in is disabled in Firebase Console. Enable it under Authentication > Sign-in method."
        );
      }

      if (errorMessage) {
        return new Error(errorMessage);
      }
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(`Unknown ${action} error`);
  };

  const register = async (email: string, password: string) => {
    console.log("[AuthContext] register() start", { email });
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      const newUser = userCredential.user;
      const role = email === ADMIN_EMAIL ? "admin" : "user";

      console.log("[AuthContext] register() firebase auth success", {
        uid: newUser.uid
      });

      await setDoc(doc(db, "users", newUser.uid), {
        email,
        role
      });

      console.log("[AuthContext] register() firestore setDoc success", {
        uid: newUser.uid,
        role
      });
    } catch (error) {
      console.error("[AuthContext] register() failed", error);
      throw toAuthError(error, "register");
    }
  };

  const login = async (email: string, password: string) => {
    console.log("[AuthContext] login() start", { email });
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("[AuthContext] login() success", { email });
    } catch (error) {
      console.error("[AuthContext] login() failed", error);
      throw toAuthError(error, "login");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
