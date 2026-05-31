import { useEffect, useRef, useState } from "react";

type AuthSheetProps = {
  isConfigured: boolean;
  isOpen: boolean;
  requestedEmail: string;
  magicLinkCooldownUntilMs: number | null;
  saveStateStatus: "idle" | "sending-link" | "check-email" | "saving" | "saved" | "error";
  saveMessage: string | null;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
};

export function AuthSheet(props: AuthSheetProps) {
  const { isConfigured, isOpen, requestedEmail, magicLinkCooldownUntilMs, saveStateStatus, saveMessage, onClose, onSubmit } = props;
  const [email, setEmail] = useState(requestedEmail);
  const [cooldownRemainingSeconds, setCooldownRemainingSeconds] = useState(0);
  const sheetRef = useRef<HTMLElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setEmail(requestedEmail);
  }, [requestedEmail]);

  useEffect(() => {
    if (!isOpen || !magicLinkCooldownUntilMs) {
      setCooldownRemainingSeconds(0);
      return undefined;
    }

    const updateCooldown = () => {
      const remainingMs = magicLinkCooldownUntilMs - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setCooldownRemainingSeconds(remainingSeconds);
    };

    updateCooldown();
    const intervalId = window.setInterval(updateCooldown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isOpen, magicLinkCooldownUntilMs]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const focusTimer = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusableElements = sheetRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
      );

      if (!focusableElements || focusableElements.length === 0) {
        return;
      }

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey && activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable.focus();
        return;
      }

      if (!event.shiftKey && activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const isBusy = saveStateStatus === "sending-link" || saveStateStatus === "saving";
  const isCoolingDown = cooldownRemainingSeconds > 0;

  return (
    <div className="auth-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        ref={sheetRef}
        className="auth-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-sheet-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="auth-sheet-header">
          <div>
            <div className="eyebrow">Secure Save</div>
            <h2 id="auth-sheet-title">Create account to keep this run.</h2>
          </div>
          <button className="sheet-close" type="button" aria-label="Close save account sheet" onClick={onClose}>
            Close
          </button>
        </div>

        <p className="auth-sheet-copy">
          Use one email magic link. The run you just finished will save after you come back signed in.
        </p>

        <form
          className="auth-sheet-form"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(email);
          }}
        >
          <label className="auth-field">
            <span>Email</span>
            <input
              ref={emailInputRef}
              autoComplete="email"
              inputMode="email"
              name="email"
              placeholder="you@example.com"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>

          <button
            className="primary-cta auth-cta"
            type="submit"
            disabled={!isConfigured || isBusy || isCoolingDown || email.trim().length === 0}
          >
            {saveStateStatus === "sending-link"
              ? "Sending Link"
              : isCoolingDown
                ? `Retry in ${cooldownRemainingSeconds}s`
                : "Send Magic Link"}
          </button>
        </form>

        <div className="auth-sheet-status" aria-live="polite">
          {!isConfigured ? <p>Supabase auth is not configured in this build yet.</p> : null}
          {saveMessage ? <p>{saveMessage}</p> : null}
          {saveStateStatus === "check-email" ? (
            <p>Check your inbox, open the link on this device, and the just-finished run will save automatically.</p>
          ) : null}
          {isCoolingDown ? <p>For security and deliverability, please wait before sending another link.</p> : null}
        </div>
      </section>
    </div>
  );
}
