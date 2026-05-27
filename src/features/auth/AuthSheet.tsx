import { useEffect, useState } from "react";

type AuthSheetProps = {
  isConfigured: boolean;
  isOpen: boolean;
  requestedEmail: string;
  saveStateStatus: "idle" | "sending-link" | "check-email" | "saving" | "saved" | "error";
  saveMessage: string | null;
  onClose: () => void;
  onSubmit: (email: string) => Promise<void>;
};

export function AuthSheet(props: AuthSheetProps) {
  const { isConfigured, isOpen, requestedEmail, saveStateStatus, saveMessage, onClose, onSubmit } = props;
  const [email, setEmail] = useState(requestedEmail);

  useEffect(() => {
    setEmail(requestedEmail);
  }, [requestedEmail]);

  if (!isOpen) {
    return null;
  }

  const isBusy = saveStateStatus === "sending-link" || saveStateStatus === "saving";

  return (
    <div className="auth-sheet-backdrop" role="presentation" onClick={onClose}>
      <section
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
            disabled={!isConfigured || isBusy || email.trim().length === 0}
          >
            {saveStateStatus === "sending-link" ? "Sending Link" : "Send Magic Link"}
          </button>
        </form>

        <div className="auth-sheet-status" aria-live="polite">
          {!isConfigured ? <p>Supabase auth is not configured in this build yet.</p> : null}
          {saveMessage ? <p>{saveMessage}</p> : null}
          {saveStateStatus === "check-email" ? (
            <p>Check your inbox, open the link on this device, and the just-finished run will save automatically.</p>
          ) : null}
        </div>
      </section>
    </div>
  );
}
