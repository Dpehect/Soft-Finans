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
import { setAccessTokenGetter, setRefreshHandler } from "../api/client";
import { setAccessTokenGetter as setFnoAccessTokenGetter } from "../fno/api/fnoApi";

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
  register: (email: string, password: string, role?: AuthRole) => Promise<void>;
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

const ADMIN_EMAILS = [
  "gurlekyunusemre2@gmail.com",
  "admin@openterminal.local",
  "admin@softbridge.local",
];

function firebaseUserToAuthUser(fbUser: FirebaseUser): AuthUser {
  const email = (fbUser.email ?? "").toLowerCase();
  const isAdmin = ADMIN_EMAILS.includes(email);
  return {
    id: fbUser.uid,
    email: fbUser.email ?? "",
    role: isAdmin ? "admin" : "trader",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
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
      } else {
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
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will update state automatically
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, _role?: AuthRole) => {
      setIsLoading(true);
      try {
        await createUserWithEmailAndPassword(auth, email, password);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(() => {
    void signOut(auth);
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  }, []);

  const hasRole = useCallback(
    (required: AuthRole) => {
      if (!firebaseUser) return false;
      const user = firebaseUserToAuthUser(firebaseUser);
      const ROLE_RANK: Record<AuthRole, number> = {
        viewer: 1,
        trader: 2,
        admin: 3,
      };
      return (ROLE_RANK[user.role] ?? 0) >= (ROLE_RANK[required] ?? 99);
    },
    [firebaseUser],
  );

  const user = useMemo<AuthUser | null>(
    () => (firebaseUser ? firebaseUserToAuthUser(firebaseUser) : null),
    [firebaseUser],
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
