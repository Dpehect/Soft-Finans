import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from "firebase/auth";

import { auth } from "../lib/firebase";
import { api, setAccessTokenGetter, setRefreshHandler } from "../api/client";
import { setAccessTokenGetter as setFnoAccessTokenGetter } from "../fno/api/fnoApi";
import {
  assertLoginAllowed,
  clearLoginFailures,
  recordLoginFailure,
  validateEmail,
  validatePasswordStrength,
} from "../lib/authSecurity";

export type AuthRole = "admin" | "trader" | "viewer";

export type AuthUser = {
  id: string;
  email: string;
  role: AuthRole;
};

export type AuthContextValue = {
  user: AuthUser | null;
  firebaseUser: FirebaseUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (required: AuthRole) => boolean;
  resetPassword: (email: string) => Promise<void>;
};

/** Unauthenticated default — safe to use outside AuthProvider */
export const DEFAULT_AUTH_VALUE: AuthContextValue = {
  user: null,
  firebaseUser: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isInitializing: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  hasRole: () => false,
  resetPassword: async () => {},
};

const AuthContext = createContext<AuthContextValue>(DEFAULT_AUTH_VALUE);
/** Raw context ref for optional (non-throwing) usage outside AuthProvider */
export { AuthContext as AuthContextRef };

function firebaseUserToAuthUser(fbUser: FirebaseUser, role: AuthRole = "viewer"): AuthUser {
  return { id: fbUser.uid, email: fbUser.email ?? "", role };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Subscribe to Firebase auth state once on mount
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setFirebaseUser(fbUser);
      if (fbUser) {
        const token = await fbUser.getIdToken();
        setAccessToken(token);
        let cachedToken: string | null = token;
        const getter = () => cachedToken;
        setAccessTokenGetter(getter);
        setFnoAccessTokenGetter(getter);
        setRefreshHandler(async () => {
          const refreshed = await fbUser.getIdToken(true);
          cachedToken = refreshed;
          setAccessToken(refreshed);
          return refreshed;
        });
        try {
          const response = await api.get<{ id: string; email: string; role: AuthRole }>("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const role = response.data.role === "admin" ? "admin" : "viewer";
          setUser(firebaseUserToAuthUser(fbUser, role));
        } catch {
          setUser(firebaseUserToAuthUser(fbUser));
        }
      } else {
        setUser(null);
        setAccessToken(null);
        setAccessTokenGetter(null);
        setFnoAccessTokenGetter(null);
        setRefreshHandler(null);
      }
      setIsInitializing(false);
    });

    return () => {
      unsubscribe();
      setAccessTokenGetter(null);
      setFnoAccessTokenGetter(null);
      setRefreshHandler(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    assertLoginAllowed();
    const emailError = validateEmail(email);
    if (emailError) {
      throw new Error(emailError);
    }
    if (!password || password.length > 128) {
      throw new Error("Geçersiz şifre.");
    }

    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      clearLoginFailures();
    } catch (err) {
      recordLoginFailure();
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email: string, password: string) => {
    const emailError = validateEmail(email);
    if (emailError) {
      throw new Error(emailError);
    }
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.ok) {
      throw new Error(passwordCheck.errors[0] ?? "Şifre güvenlik gereksinimlerini karşılamıyor.");
    }

    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email.trim(), password);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    void signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const hasRole = useCallback(
    (required: AuthRole) => {
      if (!firebaseUser) return false;
      const ROLE_RANK: Record<AuthRole, number> = {
        viewer: 1,
        trader: 2,
        admin: 3,
      };
      return (ROLE_RANK[user?.role ?? "viewer"] ?? 0) >= (ROLE_RANK[required] ?? 99);
    },
    [firebaseUser, user],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      firebaseUser,
      accessToken,
      isAuthenticated: firebaseUser !== null,
      isLoading,
      isInitializing,
      login,
      register,
      logout,
      hasRole,
      resetPassword,
    }),
    [
      user,
      firebaseUser,
      accessToken,
      isLoading,
      isInitializing,
      login,
      register,
      logout,
      hasRole,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  return ctx ?? DEFAULT_AUTH_VALUE;
}
