import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { onAuthStateChanged, signOut as firebaseSignOut, type User as FirebaseUser } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";
import type { AppRole } from "@/lib/roles";
import { getUserProfile, saveUserProfile, type StoredProfile } from "@/lib/user-profile";

export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

interface AuthCtx {
  user: AppUser | null;
  session: null;
  profile: StoredProfile | null;
  roles: AppRole[];
  loading: boolean;
  isArtisan: boolean;
  signOut: () => Promise<void>;
  refreshRoles: () => Promise<void>;
  saveProfile: (input: { displayName: string; role: AppRole; email?: string | null }) => Promise<void>;
}

const Ctx = createContext<AuthCtx | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session] = useState<null>(null);
  const [user, setUser] = useState<AppUser | null>(null);
  const [profile, setProfile] = useState<StoredProfile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRolesSafe = async (fbUser: FirebaseUser | null) => {
    const uid = fbUser?.uid;
    if (!uid) {
      setProfile(null);
      setRoles([]);
      return;
    }
    const dbProfile = await getUserProfile(uid);
    if (dbProfile?.role) {
      setProfile(dbProfile);
      setRoles([dbProfile.role]);
      return;
    }
    setProfile(null);
    setRoles(["customer"]);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (fbUser) => {
      setUser(
        fbUser
          ? { id: fbUser.uid, email: fbUser.email, displayName: fbUser.displayName }
          : null,
      );
      setTimeout(() => loadRolesSafe(fbUser), 0);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => { await firebaseSignOut(firebaseAuth); };
  const refreshRoles = async () => { await loadRolesSafe(firebaseAuth.currentUser); };
  const saveProfile = async (input: { displayName: string; role: AppRole; email?: string | null }) => {
    const current = firebaseAuth.currentUser;
    if (!current) throw new Error("You must be signed in.");
    const nextProfile: StoredProfile = {
      uid: current.uid,
      email: input.email ?? current.email,
      displayName: input.displayName.trim(),
      role: input.role,
    };
    await saveUserProfile(nextProfile);
    setProfile(nextProfile);
    setUser((prev) => (prev ? { ...prev, displayName: nextProfile.displayName } : prev));
    setRoles([nextProfile.role]);
  };

  return (
    <Ctx.Provider value={{
      user, session, profile, roles, loading,
      isArtisan: roles.includes("artisan") || roles.includes("admin"),
      signOut, refreshRoles, saveProfile,
    }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth must be inside AuthProvider");
  return v;
}
