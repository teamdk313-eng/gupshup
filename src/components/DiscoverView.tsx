import React, { useEffect, useRef, useState } from 'react';
import type { BlockedEntry, ContactUser } from '../types/gupshup';
import { filterPeopleDirectory } from '../utils/gupshupLogic';
import { Avatar } from './Avatar';

interface DiscoverViewProps {
  contacts: ContactUser[];
  blocked: BlockedEntry[];
  onStartChat: (contactId: string) => void;
  onOpenContactInfo: (contactId: string) => void;
  onOpenSearchPeople: () => void;
}

export const DiscoverView: React.FC<DiscoverViewProps> = ({
  contacts,
  blocked,
  onStartChat,
  onOpenContactInfo,
  onOpenSearchPeople,
}) => {
  const [query, setQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const blockedIds = new Set(blocked.map((b) => b.userId));
  const activePeople = contacts.filter((c) => !blockedIds.has(c.id));

  const filtered = query.trim() ? filterPeopleDirectory(activePeople, query) : [];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header Row */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-[28px] font-bold text-on-surface tracking-tight">
            People on Gupshup
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Find real Gupshup members by their unique public @username.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px] pointer-events-none">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search @username..."
              className="w-full h-11 pl-10 pr-14 rounded-xl bg-surface-container-lowest border border-outline-variant/25 text-sm text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-container/25 transition-all"
            />
            {query ? (
              <button
                type="button"
                aria-label="Clear filter"
                onClick={() => setQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            ) : (
              <span className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded bg-surface-container-low text-[10px] font-semibold text-on-surface-variant">
                ⌘K
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenSearchPeople}
            className="h-11 px-4 rounded-xl bg-surface-container-lowest border border-outline-variant/25 hover:bg-surface-container-low text-on-surface text-sm font-semibold flex items-center gap-1.5 shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px] text-primary">person_search</span>
            <span className="hidden sm:inline">Directory</span>
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 mb-6">
        <span className="px-3.5 py-1.5 rounded-lg bg-surface-container-low text-xs font-semibold text-on-surface-variant">
          Public member IDs
        </span>
        <span className="text-xs font-medium text-on-surface-variant hidden sm:inline">
          Showing {filtered.length} {filtered.length === 1 ? 'member' : 'members'}
        </span>
      </div>

      {/* People Grid */}
      {filtered.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-3xl p-10 text-center shadow-[0_1px_4px_rgba(11,28,48,0.04)] max-w-lg mx-auto my-8">
          <div className="w-14 h-14 rounded-2xl bg-primary-fixed text-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[28px]">person_off</span>
          </div>
          <h3 className="text-lg font-semibold text-on-surface">
            {query.trim() ? `No member ID found for “${query.trim()}”` : 'Search by username to find a member.'}
          </h3>
          <p className="text-sm text-on-surface-variant mt-1.5">
            Members are not listed publicly. Enter an exact or partial @username to find someone.
          </p>
          <div className="flex items-center justify-center gap-2.5 mt-5">
            <button
              type="button"
              onClick={() => {
                setQuery('');
              }}
              className="h-10 px-4 rounded-xl bg-primary-container text-on-primary text-sm font-semibold"
            >
              Clear Search
            </button>
            <button
              type="button"
              onClick={onOpenSearchPeople}
              className="h-10 px-4 rounded-xl bg-surface-container-low text-on-surface text-sm font-semibold"
            >
              Search Directory
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((person) => (
            <article
              key={person.id}
              className="bg-surface-container-lowest rounded-2xl p-5 shadow-[0_1px_4px_rgba(11,28,48,0.04)] hover:shadow-[0_8px_24px_rgba(11,28,48,0.06)] transition-all flex flex-col justify-between gap-4 border border-outline-variant/15"
            >
              <div className="flex items-start gap-3.5">
                <button
                  type="button"
                  onClick={() => onOpenContactInfo(person.id)}
                  aria-label={`View profile of ${person.name}`}
                  className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <Avatar
                    name={person.name}
                    initials={person.initials}
                    imageUrl={person.avatarUrl}
                    size="md"
                    showOnlineDot={false}
                    bgClass={person.avatarBgClass}
                    textClass={person.avatarTextClass}
                  />
                </button>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onOpenContactInfo(person.id)}
                    className="inline-flex items-center gap-1 text-base font-semibold text-on-surface hover:text-primary truncate text-left transition-colors"
                  >
                    @{person.username}
                    {person.verified && <span className="material-symbols-outlined text-[17px] text-sky-600" aria-label="Verified">verified</span>}
                  </button>
                  <p className="text-xs text-on-surface-variant mt-1">Gupshup member ID</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-2 border-t border-surface-container-low">
                <span className="text-xs font-medium text-on-surface-variant truncate">
                  Public username
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenContactInfo(person.id)}
                    className="h-9 px-3 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors"
                  >
                    Info
                  </button>
                  <button
                    type="button"
                    onClick={() => onStartChat(person.id)}
                    className="h-9 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                    <span>Message</span>
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};
