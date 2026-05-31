import type { Session } from "@supabase/supabase-js";
import type { ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { PendingRunBridge, PersistedPlayerModel, PersistedRun, ProfileSummary } from "../../domain/persistence.ts";
import { getCurrentSession, onSupabaseAuthStateChange, requestMagicLink, signOutSupabase } from "../../lib/supabase/auth.ts";
import { isSupabaseConfigured } from "../../lib/supabase/client.ts";
import { clearPendingRunBridge, readPendingRunBridge, writePendingRunBridge } from "../../lib/supabase/pending-run.ts";
import { fetchPlayerModel, fetchProfileSummary, fetchRecentRuns, RECENT_RUN_LIMIT, saveCompletedRunForUser } from "../../lib/supabase/repositories.ts";

type SaveStateStatus = "idle" | "sending-link" | "check-email" | "saving" | "saved" | "error";
const MAGIC_LINK_COOLDOWN_MS = 60_000;

type SaveState = {
  status: SaveStateStatus;
  runKey: string | null;
  message: string | null;
};

type AuthContextValue = {
  isConfigured: boolean;
  isReady: boolean;
  session: Session | null;
  profile: ProfileSummary | null;
  playerModel: PersistedPlayerModel | null;
  recentRuns: PersistedRun[] | null;
  isAuthSheetOpen: boolean;
  requestedEmail: string;
  magicLinkCooldownUntilMs: number | null;
  saveState: SaveState;
  openSaveSheet: (run: PendingRunBridge) => void;
  closeAuthSheet: () => void;
  sendMagicLink: (email: string) => Promise<void>;
  persistCompletedRun: (run: PendingRunBridge) => Promise<void>;
  signOut: () => Promise<void>;
  resetSaveState: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === "object") {
    const message = "message" in error && typeof error.message === "string" ? error.message : null;
    const details = "details" in error && typeof error.details === "string" ? error.details : null;
    const hint = "hint" in error && typeof error.hint === "string" ? error.hint : null;
    const code = "code" in error && typeof error.code === "string" ? error.code : null;

    return [message, details, hint, code ? `(${code})` : null].filter(Boolean).join(" ");
  }

  return "Something interrupted the secure save flow.";
}

function isRateLimitError(error: unknown) {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes("rate limit") || message.includes("429");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ProfileSummary | null>(null);
  const [playerModel, setPlayerModel] = useState<PersistedPlayerModel | null>(null);
  const [recentRuns, setRecentRuns] = useState<PersistedRun[] | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isAuthSheetOpen, setIsAuthSheetOpen] = useState(false);
  const [requestedEmail, setRequestedEmail] = useState("");
  const [magicLinkCooldownUntilMs, setMagicLinkCooldownUntilMs] = useState<number | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    runKey: null,
    message: null
  });
  const pendingRunRef = useRef<PendingRunBridge | null>(null);
  const inFlightKeysRef = useRef(new Set<string>());
  const savedKeysRef = useRef(new Set<string>());

  const hydrateAccountData = useCallback(async (nextSession: Session | null) => {
    if (!nextSession?.user.id) {
      setProfile(null);
      setPlayerModel(null);
      setRecentRuns(null);
      return;
    }

    try {
      const [nextProfile, nextPlayerModel, nextRuns] = await Promise.all([
        fetchProfileSummary(nextSession.user.id),
        fetchPlayerModel(nextSession.user.id),
        fetchRecentRuns(nextSession.user.id)
      ]);
      setProfile(nextProfile);
      setPlayerModel(nextPlayerModel);
      setRecentRuns(nextRuns);
    } catch {
      setProfile(null);
      setPlayerModel(null);
      setRecentRuns([]);
    }
  }, []);

  const persistCompletedRun = useCallback(
    async (run: PendingRunBridge) => {
      if (!session?.user.id) {
        pendingRunRef.current = run;
        writePendingRunBridge(run);
        return;
      }

      if (savedKeysRef.current.has(run.localRunKey) || inFlightKeysRef.current.has(run.localRunKey)) {
        return;
      }

      inFlightKeysRef.current.add(run.localRunKey);
      setSaveState({
        status: "saving",
        runKey: run.localRunKey,
        message: "Securing this run to your account."
      });

      try {
        const saved = await saveCompletedRunForUser({
          userId: session.user.id,
          displayName: session.user.user_metadata.display_name ?? session.user.email ?? null,
          run
        });

        setProfile(saved.profile);
        setPlayerModel(saved.playerModel);
        setRecentRuns((currentRuns) => {
          const nextRuns = [saved.run, ...(currentRuns ?? []).filter((item) => item.id !== saved.run.id)];
          return nextRuns.slice(0, RECENT_RUN_LIMIT);
        });
        savedKeysRef.current.add(run.localRunKey);

        if (pendingRunRef.current?.localRunKey === run.localRunKey) {
          pendingRunRef.current = null;
          clearPendingRunBridge();
        }

        setSaveState({
          status: "saved",
          runKey: run.localRunKey,
          message: "Run secured."
        });
        setIsAuthSheetOpen(false);
      } catch (error) {
        setSaveState({
          status: "error",
          runKey: run.localRunKey,
          message: `Save failed: ${getErrorMessage(error)}`
        });
      } finally {
        inFlightKeysRef.current.delete(run.localRunKey);
      }
    },
    [session]
  );

  useEffect(() => {
    pendingRunRef.current = readPendingRunBridge();

    void getCurrentSession()
      .then((nextSession) => {
        setSession(nextSession);
        return hydrateAccountData(nextSession);
      })
      .finally(() => {
        setIsReady(true);
      });

    const unsubscribe = onSupabaseAuthStateChange((_, nextSession) => {
      setSession(nextSession);
      void hydrateAccountData(nextSession);
    });

    return unsubscribe;
  }, [hydrateAccountData]);

  useEffect(() => {
    if (!session?.user.id || !pendingRunRef.current) {
      return;
    }

    void persistCompletedRun(pendingRunRef.current);
  }, [persistCompletedRun, session]);

  const openSaveSheet = useCallback((run: PendingRunBridge) => {
    pendingRunRef.current = run;
    writePendingRunBridge(run);
    setRequestedEmail(session?.user.email ?? "");

    if (session?.user.id) {
      void persistCompletedRun(run);
      return;
    }

    setSaveState({
      status: "idle",
      runKey: run.localRunKey,
      message: null
    });
    setIsAuthSheetOpen(true);
  }, [persistCompletedRun, session]);

  const closeAuthSheet = useCallback(() => {
    setIsAuthSheetOpen(false);
  }, []);

  const sendMagicLink = useCallback(async (email: string) => {
    const trimmedEmail = email.trim();
    const now = Date.now();

    if (magicLinkCooldownUntilMs && magicLinkCooldownUntilMs > now) {
      const remainingSeconds = Math.max(1, Math.ceil((magicLinkCooldownUntilMs - now) / 1000));
      setSaveState((current) => ({
        status: "error",
        runKey: current.runKey,
        message: `Please wait ${remainingSeconds}s before requesting another magic link.`
      }));
      return;
    }

    setRequestedEmail(trimmedEmail);
    setSaveState((current) => ({
      status: "sending-link",
      runKey: current.runKey,
      message: "Sending your secure sign-in link."
    }));

    try {
      await requestMagicLink(trimmedEmail);
      setMagicLinkCooldownUntilMs(Date.now() + MAGIC_LINK_COOLDOWN_MS);
      setSaveState((current) => ({
        status: "check-email",
        runKey: current.runKey,
        message: `Magic link sent to ${trimmedEmail}.`
      }));
    } catch (error) {
      if (isRateLimitError(error)) {
        setMagicLinkCooldownUntilMs(Date.now() + MAGIC_LINK_COOLDOWN_MS);
      }

      setSaveState((current) => ({
        status: "error",
        runKey: current.runKey,
        message: isRateLimitError(error)
          ? "Too many requests. Please wait about 60 seconds and try again."
          : `Magic link failed: ${getErrorMessage(error)}`
      }));
    }
  }, [magicLinkCooldownUntilMs]);

  const signOut = useCallback(async () => {
    await signOutSupabase();
    setProfile(null);
    setPlayerModel(null);
    setRecentRuns(null);
    setSaveState({
      status: "idle",
      runKey: null,
      message: null
    });
  }, []);

  const resetSaveState = useCallback(() => {
    setSaveState((current) =>
      current.status === "idle" && current.runKey === null && current.message === null
        ? current
        : {
            status: "idle",
            runKey: null,
            message: null
          }
    );
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured(),
      isReady,
      session,
      profile,
      playerModel,
      recentRuns,
      isAuthSheetOpen,
      requestedEmail,
      magicLinkCooldownUntilMs,
      saveState,
      openSaveSheet,
      closeAuthSheet,
      sendMagicLink,
      persistCompletedRun,
      signOut,
      resetSaveState
    }),
    [closeAuthSheet, isAuthSheetOpen, isReady, magicLinkCooldownUntilMs, openSaveSheet, persistCompletedRun, playerModel, profile, recentRuns, requestedEmail, resetSaveState, saveState, session, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
