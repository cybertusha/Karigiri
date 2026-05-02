import type { AppRole } from "@/lib/roles";
import { supabase } from "@/integrations/supabase/client";

const PROFILE_KEY = "karigari-firebase-profile";
const profileKey = (uid: string) => `${PROFILE_KEY}:${uid}`;

export interface StoredProfile {
  uid: string;
  email: string | null;
  displayName: string;
  role: AppRole;
}

const isValidRole = (role: unknown): role is AppRole => role === "artisan" || role === "customer" || role === "admin";

export const readLocalProfile = (uid: string): StoredProfile | null => {
  try {
    const raw = localStorage.getItem(profileKey(uid));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredProfile>;
    if (!parsed.uid || !parsed.displayName || !isValidRole(parsed.role)) return null;
    return {
      uid: parsed.uid,
      email: parsed.email ?? null,
      displayName: parsed.displayName,
      role: parsed.role,
    };
  } catch {
    return null;
  }
};

export const writeLocalProfile = (profile: StoredProfile) => {
  localStorage.setItem(profileKey(profile.uid), JSON.stringify(profile));
};

export const getUserProfile = async (uid: string): Promise<StoredProfile | null> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id,display_name,role")
      .eq("id", uid)
      .maybeSingle();

    if (!error && data?.display_name && isValidRole((data as any).role)) {
      const profile: StoredProfile = {
        uid,
        email: null,
        displayName: data.display_name,
        role: (data as any).role as AppRole,
      };
      writeLocalProfile(profile);
      return profile;
    }
  } catch {
    // Supabase can be unavailable; local fallback keeps app usable.
  }
  return readLocalProfile(uid);
};

export const saveUserProfile = async (profile: StoredProfile): Promise<void> => {
  writeLocalProfile(profile);
  try {
    await supabase.from("profiles").upsert({
      id: profile.uid,
      display_name: profile.displayName,
      role: profile.role,
    } as any);
  } catch {
    // If Supabase policies/network block writes, keep local profile as source of truth for UX.
  }
};
