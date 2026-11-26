import React, { useState } from 'react';

interface WelcomeScreenProps {
  onGoogleSignIn: () => Promise<void>;
  onDemoSignIn: () => void;
  onOpenPrivacy: () => void;
  authError?: string | null;
  isAuthResolving?: boolean;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onGoogleSignIn,
  onDemoSignIn,
  onOpenPrivacy,
  authError = null,
  isAuthResolving = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const combinedError = errorMsg ?? authError;
  const busy = isLoading || isAuthResolving;

  const handleGoogleClick = async () => {
    if (busy) return;
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await onGoogleSignIn();
    } catch (err) {
      const msg =
        err instanceof Error && err.message
          ? err.message
          : 'Sign-in failed. Please try again.';
      setErrorMsg(msg);
      setIsLoading(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-surface flex items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-[1440px] mx-auto lg:min-h-[820px] grid grid-cols-1 lg:grid-cols-12 rounded-2xl overflow-hidden shadow-xl bg-surface-container-lowest">
        {/* Left Hero Column (Desktop showcase + Mobile compact preview) */}
        <div className="lg:col-span-7 relative p-6 lg:p-8 flex flex-col justify-between overflow-hidden bg-gradient-to-br from-surface-container-low via-surface-variant/40 to-secondary-container/20">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-primary-container/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-80 h-80 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none" />

          {/* Top Brand Bar */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-11 h-11 rounded-2xl bg-primary-container flex items-center justify-center text-on-primary shadow-md">
                <span className="material-symbols-outlined text-[24px] icon-filled">forum</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-on-background tracking-tight">Gupshup</span>
                <span className="text-[11px] uppercase tracking-wider text-secondary font-semibold bg-secondary-container/50 px-2 py-0.5 rounded-full">
                  v2.0
                </span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-lowest/85 backdrop-blur-md shadow-sm">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <span className="text-[11px] text-on-surface-variant font-medium">
                1-to-1 instant messaging
              </span>
            </div>
          </div>

          {/* Center Floating Conversational Showcase */}
          <div className="relative z-10 my-6 lg:my-auto py-4 flex flex-col items-center justify-center">
            <div className="w-full max-w-[500px] relative">
              <div className="w-fit max-w-[85%] mb-2.5 p-3.5 rounded-2xl rounded-tl-sm bg-surface-container-lowest/95 backdrop-blur-md shadow-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full bg-secondary" />
                  <span className="text-[11px] text-secondary font-semibold">Sara Malik</span>
                  <span className="text-[11px] text-outline">10:41 AM</span>
                </div>
                <p className="text-sm text-on-surface">
                  Hey! Did you see the new designs for the Gupshup workspace?
                </p>
              </div>

              <div className="ml-auto w-fit max-w-[85%] mb-3 p-3.5 rounded-2xl rounded-tr-sm bg-primary-container text-on-primary shadow-md">
                <p className="text-sm">
                  Working on them right now! Finishing up the Drive media sync.
                </p>
                <div className="flex items-center justify-end gap-1 mt-1 text-on-primary-container">
                  <span className="text-[11px] opacity-90">10:42 AM</span>
                  <span className="material-symbols-outlined text-[14px]">done_all</span>
                </div>
              </div>

              <div className="relative -mt-1 sm:-ml-4 w-64 sm:w-72 rounded-2xl p-2 bg-surface-container-lowest/95 backdrop-blur-md shadow-lg">
                <div className="relative w-full h-32 rounded-xl overflow-hidden bg-surface-container">
                  <img
                    src="/src/assets/images/roadmap_desk_1795617788460.jpg"
                    alt="Workspace roadmap preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-inverse-surface/80 via-transparent to-transparent flex items-end p-2.5">
                    <span className="text-[11px] text-inverse-on-surface font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">photo_camera</span>
                      roadmap-v2.jpg
                    </span>
                  </div>
                </div>
              </div>

              <div className="ml-auto -mt-5 sm:-mr-2 w-64 sm:w-72 p-3 rounded-2xl rounded-br-sm bg-surface-container-lowest/95 backdrop-blur-lg shadow-lg flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-secondary text-on-secondary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px] icon-filled">
                    play_arrow
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-on-surface">Voice Note</span>
                    <span className="text-[11px] text-outline">0:14</span>
                  </div>
                  <div className="flex items-center gap-[3px] h-4">
                    {[8, 14, 18, 10, 16, 12, 18, 14, 8, 12, 6, 14, 8].map((h, i) => (
                      <span
                        key={i}
                        style={{ height: `${h}px` }}
                        className={`w-[3px] rounded-full ${
                          i < 8 ? 'bg-secondary' : 'bg-outline-variant'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Feature Highlights */}
          <div className="relative z-10 pt-2 hidden sm:grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-surface-container-lowest/70 backdrop-blur-sm">
              <div className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[18px]">bolt</span>
                Instant Sync
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                1-to-1 text, voice & photos
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-lowest/70 backdrop-blur-sm">
              <div className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-secondary text-[18px]">
                  add_to_drive
                </span>
                Drive Ready
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Share & save media to Drive
              </p>
            </div>
            <div className="p-3 rounded-xl bg-surface-container-lowest/70 backdrop-blur-sm">
              <div className="text-sm font-semibold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-tertiary text-[18px]">shield</span>
                Safe Controls
              </div>
              <p className="text-[11px] text-on-surface-variant mt-0.5">
                Block, report & privacy tools
              </p>
            </div>
          </div>
        </div>

        {/* Right Sign-In Column */}
        <div className="lg:col-span-5 p-6 sm:p-10 flex flex-col justify-center items-center bg-surface-container-lowest">
          <div className="w-full max-w-[420px] flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary flex items-center justify-center shadow-lg">
                <span className="material-symbols-outlined text-[28px] icon-filled">
                  chat_bubble
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-low">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span className="text-[11px] text-on-surface-variant font-medium">
                  Ready to connect
                </span>
              </div>
            </div>

            <h1 className="text-[28px] leading-[36px] font-bold text-on-background tracking-tight mb-2">
              Talk to anyone, instantly.
            </h1>
            <p className="text-base text-on-surface-variant mb-7 leading-relaxed">
              Sign in, pick a username and start chatting with people who joined Gupshup. Text,
              voice notes and photos.
            </p>

            {combinedError && (
              <div className="mb-4 p-3.5 rounded-xl bg-error-container text-on-error-container flex items-center justify-between gap-2 shadow-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="material-symbols-outlined text-[20px] text-error shrink-0">
                    error
                  </span>
                  <span className="text-[13px] font-medium">{combinedError}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  className="text-[11px] font-bold text-error uppercase tracking-wider px-2.5 py-1 rounded hover:bg-surface-container-lowest/60 shrink-0"
                >
                  Retry
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleClick}
                className="w-full h-12 rounded-[14px] bg-surface-container-lowest border border-outline-variant/60 shadow-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-3 px-6 active:scale-[0.99] disabled:opacity-70"
              >
                {busy ? (
                  <span className="material-symbols-outlined text-[20px] text-primary animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                )}
                <span className="text-sm font-semibold text-on-surface">
                  {isAuthResolving
                    ? 'Completing sign-in...'
                    : isLoading
                      ? 'Redirecting to Google...'
                      : 'Continue with Google'}
                </span>
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={onDemoSignIn}
                className="w-full h-12 rounded-[14px] bg-primary-container hover:bg-primary text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition-colors disabled:opacity-60"
              >
                <span>Quick Start as Ali Raza (@ali_raza)</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            </div>

            <p className="text-[13px] text-outline text-center mt-5 leading-relaxed">
              By continuing you agree to our{' '}
              <button
                type="button"
                onClick={() => setShowTermsModal(true)}
                className="text-primary hover:underline font-medium"
              >
                Terms
              </button>{' '}
              and{' '}
              <button
                type="button"
                onClick={onOpenPrivacy}
                className="text-primary hover:underline font-medium"
              >
                Privacy Policy
              </button>
              .
            </p>

            <div className="mt-6 p-3.5 rounded-xl bg-surface-container-low flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">
                verified_user
              </span>
              <span className="text-[13px] text-on-surface-variant font-medium">
                Google Drive sharing requires your explicit permission
              </span>
            </div>
          </div>
        </div>
      </div>

      {showTermsModal && (
        <div
          className="fixed inset-0 z-50 bg-on-surface/45 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-surface-container-lowest rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-on-surface">Gupshup Terms of Use</h2>
              <button
                type="button"
                onClick={() => setShowTermsModal(false)}
                className="w-9 h-9 rounded-full bg-surface-container-low flex items-center justify-center text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Gupshup is a respectful 1-to-1 messaging space. Do not send spam, harassment, or
              impersonate others. You control who can message you with built-in blocking and
              reporting tools, and you can delete your account anytime in Settings.
            </p>
            <button
              type="button"
              onClick={() => setShowTermsModal(false)}
              className="h-11 rounded-[14px] bg-primary-container text-on-primary text-sm font-semibold"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </main>
  );
};
