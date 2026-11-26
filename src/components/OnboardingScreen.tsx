import React, { useEffect, useState } from 'react';
import type { CurrentUserProfile } from '../types/gupshup';
import { normalizeUsernameInput, validateUsername } from '../utils/gupshupLogic';
import { Avatar } from './Avatar';

interface OnboardingScreenProps {
  user: CurrentUserProfile;
  directoryHandles: string[];
  onBack: () => void;
  onComplete: (username: string) => Promise<void>;
  onOpenPrivacy: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  user,
  directoryHandles,
  onBack,
  onComplete,
  onOpenPrivacy,
}) => {
  const [inputValue, setInputValue] = useState(user.username || '');
  const [isChecking, setIsChecking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const validation = validateUsername(inputValue, directoryHandles);

  useEffect(() => {
    if (inputValue.length < 3) {
      setIsChecking(false);
      return;
    }
    setIsChecking(true);
    const timer = window.setTimeout(() => {
      setIsChecking(false);
    }, 280);
    return () => window.clearTimeout(timer);
  }, [inputValue]);

  const canContinue = !isChecking && validation.status === 'available';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canContinue || isSaving) return;
    setIsSaving(true);
    setSubmitError(null);
    try {
      await onComplete(validation.normalized);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save this username. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="w-full min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="relative w-full max-w-[560px]">
        <div className="absolute -top-12 -left-10 w-72 h-72 bg-primary-fixed opacity-60 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute -bottom-10 -right-8 w-64 h-64 bg-secondary-fixed opacity-40 rounded-full blur-3xl pointer-events-none -z-10" />

        <form
          onSubmit={handleSubmit}
          className="w-full bg-surface-container-lowest rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-6"
        >
          {/* Step Header */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              aria-label="Go back"
              onClick={onBack}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-on-surface-variant font-semibold tracking-wider uppercase">
                Step 2 of 2
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-primary text-[11px] font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Almost there
              </div>
            </div>
            <button
              type="button"
              aria-label="Username help"
              onClick={() => setShowHelp((prev) => !prev)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-surface-container-low text-on-surface hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">help_outline</span>
            </button>
          </div>

          {showHelp && (
            <div className="p-3.5 rounded-xl bg-surface-container-low text-[13px] text-on-surface-variant">
              Pick a unique handle using 3–20 lowercase letters, numbers, dots (.) or underscores
              (_). People can search your @username to start a chat.
            </div>
          )}

          {/* Title */}
          <div className="flex flex-col text-center items-center gap-1.5">
            <h1 className="text-[28px] leading-[36px] font-bold text-on-surface tracking-tight">
              Choose your username
            </h1>
            <p className="text-sm text-on-surface-variant max-w-sm">
              This is how others will find you on Gupshup. You can easily change it anytime later.
            </p>
          </div>

          {/* Account Preview */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-low">
            <div className="flex items-center gap-3.5">
              <Avatar
                name={user.name}
                initials={user.initials}
                imageUrl={user.avatarDataUrl}
                size="xl"
                showOnlineDot={false}
              />
              <div className="flex flex-col text-left">
                <span className="text-lg font-semibold text-on-surface">{user.name}</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="material-symbols-outlined text-tertiary-container text-[16px] icon-filled">
                    verified
                  </span>
                  <span className="text-[11px] text-tertiary font-semibold tracking-wide">
                    {user.authMode === 'google' ? 'Google Account verified' : 'Profile ready'}
                  </span>
                </div>
                <span className="text-[11px] text-on-surface-variant mt-0.5">{user.email}</span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-on-surface-variant bg-surface-container rounded-full text-[11px] font-medium self-start sm:self-center">
              Linked
            </span>
          </div>

          {/* Username Input */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label
                htmlFor="onboarding-username-input"
                className="text-sm font-semibold text-on-surface flex items-center gap-1.5"
              >
                Choose Username
                <span className="text-primary text-[11px] font-bold tracking-wide uppercase px-1.5 py-0.5 rounded bg-primary-fixed">
                  Required
                </span>
              </label>
              <span className="text-[11px] text-on-surface-variant font-mono tabular-nums">
                {inputValue.length}/20
              </span>
            </div>

            <div className="relative flex items-center h-[52px] rounded-[14px] bg-surface-container-lowest border border-outline-variant/60 focus-within:border-primary-container focus-within:ring-2 focus-within:ring-primary-container/15 px-3.5 transition-all">
              <span className="text-lg font-semibold text-primary mr-1 select-none">@</span>
              <input
                id="onboarding-username-input"
                type="text"
                maxLength={20}
                spellCheck={false}
                placeholder="yourname"
                value={inputValue}
                onChange={(e) => setInputValue(normalizeUsernameInput(e.target.value))}
                className="w-full h-full bg-transparent text-base text-on-surface focus:outline-none placeholder:text-outline font-medium tracking-tight"
              />
              {isChecking ? (
                <div className="flex items-center justify-center w-8 h-8 text-primary">
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                </div>
              ) : validation.status === 'available' ? (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-tertiary-fixed-dim/20 text-tertiary-container">
                  <span className="material-symbols-outlined text-[20px] icon-filled">
                    check_circle
                  </span>
                </div>
              ) : validation.status === 'taken' ? (
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-error-container text-error">
                  <span className="material-symbols-outlined text-[20px] icon-filled">error</span>
                </div>
              ) : null}
            </div>

            <div className="flex items-center justify-between min-h-[22px] px-1">
              {isChecking ? (
                <div className="flex items-center gap-1.5 text-[13px] text-primary font-medium">
                  <span className="material-symbols-outlined text-[14px] animate-spin">
                    progress_activity
                  </span>
                  <span>Checking availability for @{inputValue}...</span>
                </div>
              ) : validation.status === 'available' ? (
                <div className="flex items-center gap-1.5 text-[13px] text-tertiary font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-tertiary-container" />
                  <span>{validation.message}</span>
                </div>
              ) : validation.status === 'taken' ? (
                <div className="flex items-center gap-1.5 text-[13px] text-error font-medium">
                  <span className="material-symbols-outlined text-[14px]">error</span>
                  <span>{validation.message}</span>
                </div>
              ) : (
                <div className="text-[13px] text-on-surface-variant font-medium">
                  {validation.message}
                </div>
              )}
              <span className="text-[11px] text-outline">Unique ID</span>
            </div>

            <p className="text-[11px] text-on-surface-variant px-1">
              3–20 characters. Lowercase letters, numbers, dot (.) and underscore (_) only.
            </p>
          </div>

          {submitError && (
            <p className="text-sm text-error font-medium" role="alert">{submitError}</p>
          )}

          <div className="p-3.5 rounded-xl bg-surface-container-low text-[13px] text-on-surface-variant">
            Your unique @username is the only profile detail shown in the Gupshup member directory.
            Your email address is not displayed to other members.
          </div>

          <div className="flex flex-col gap-3 mt-1">
            <button
              type="submit"
              disabled={!canContinue || isSaving}
              className="w-full h-12 rounded-[14px] bg-primary hover:bg-primary-container text-on-primary text-sm font-semibold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isSaving ? 'Saving username...' : 'Continue'}</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </form>

        <div className="flex items-center justify-between px-3 mt-4 text-on-surface-variant text-[11px]">
          <span>Gupshup Messaging</span>
          <button type="button" onClick={onOpenPrivacy} className="hover:text-primary transition-colors">
            Privacy Policy
          </button>
        </div>
      </div>
    </main>
  );
};
