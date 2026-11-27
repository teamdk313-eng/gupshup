import React, { useEffect, useRef, useState } from 'react';
import type { BlockedEntry, ContactUser } from '../types/gupshup';
import { filterPeopleDirectory } from '../utils/gupshupLogic';
import { Avatar } from './Avatar';

interface SearchPeopleViewProps {
  contacts: ContactUser[];
  blocked: BlockedEntry[];
  recentSearches: string[];
  initialQuery?: string;
  onAddRecentSearch: (term: string) => void;
  onRemoveRecentSearch: (term: string) => void;
  onClearRecentSearches: () => void;
  onStartChat: (contactId: string) => void;
  onOpenContactInfo: (contactId: string) => void;
  onBack: () => void;
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
  const clean = query.trim().replace(/^@/, '');
  if (!clean) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(clean.toLowerCase());
  if (idx === -1) return <>{text}</>;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + clean.length);
  const after = text.slice(idx + clean.length);
  return (
    <>
      {before}
      <mark className="bg-primary-fixed text-primary font-semibold rounded px-0.5">{match}</mark>
      {after}
    </>
  );
}

export const SearchPeopleView: React.FC<SearchPeopleViewProps> = ({
  contacts,
  blocked,
  recentSearches,
  initialQuery = '',
  onAddRecentSearch,
  onRemoveRecentSearch,
  onClearRecentSearches,
  onStartChat,
  onOpenContactInfo,
  onBack,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (initialQuery) setQuery(initialQuery);
  }, [initialQuery]);

  const blockedIds = new Set(blocked.map((b) => b.userId));
  const searchable = contacts.filter((c) => !blockedIds.has(c.id));
  const trimmed = query.trim();
  const matches = trimmed ? filterPeopleDirectory(searchable, trimmed) : [];
  const suggestions = trimmed
    ? []
    : searchable.filter((c) => !dismissedIds.includes(c.id)).slice(0, 6);

  const handleSelectContact = (contact: ContactUser) => {
    onAddRecentSearch(contact.username);
    onStartChat(contact.id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Discover"
          className="w-10 h-10 rounded-full bg-surface-container-lowest border border-outline-variant/20 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-on-surface tracking-tight">
            Search People
          </h2>
          <p className="text-xs sm:text-sm text-on-surface-variant">
            Find Gupshup members using their unique public @username
          </p>
        </div>
      </div>

      {/* Prominent Search Input */}
      <div className="relative mb-5">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-primary text-[22px] pointer-events-none">
          search
        </span>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by @username..."
          className="w-full h-13 pl-12 pr-12 rounded-2xl bg-surface-container-lowest border border-outline-variant/30 shadow-xs text-[15px] text-on-surface placeholder:text-on-surface-variant outline-none focus:ring-2 focus:ring-primary-container/25 transition-all"
        />
        {query && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        )}
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Recent Searches
            </span>
            <button
              type="button"
              onClick={onClearRecentSearches}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Clear all
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {recentSearches.map((term) => (
              <div
                key={term}
                className="inline-flex items-center gap-1 pl-3 pr-1.5 py-1.5 rounded-full bg-surface-container-lowest border border-outline-variant/25 text-xs font-medium text-on-surface"
              >
                <button
                  type="button"
                  onClick={() => setQuery(term)}
                  className="hover:text-primary transition-colors"
                >
                  @{term.replace(/^@/, '')}
                </button>
                <button
                  type="button"
                  aria-label={`Remove ${term} from recent searches`}
                  onClick={() => onRemoveRecentSearch(term)}
                  className="w-5 h-5 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container"
                >
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results OR People You May Know */}
      {trimmed ? (
        matches.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-3xl p-10 text-center shadow-[0_1px_4px_rgba(11,28,48,0.04)]">
            <div className="w-14 h-14 rounded-2xl bg-surface-container-low text-on-surface-variant flex items-center justify-center mx-auto mb-3.5">
              <span className="material-symbols-outlined text-[28px]">search_off</span>
            </div>
            <h3 className="text-base font-semibold text-on-surface">
              No user found for &lsquo;{trimmed}&rsquo;
            </h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Check the spelling or try another @username.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-4 h-10 px-4 rounded-xl bg-primary-container text-on-primary text-sm font-semibold"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
              Results ({matches.length})
            </div>
            <div className="bg-surface-container-lowest rounded-2xl divide-y divide-surface-container-low shadow-[0_1px_4px_rgba(11,28,48,0.04)] overflow-hidden">
              {matches.map((person) => (
                <div
                  key={person.id}
                  className="p-4 flex items-center justify-between gap-3 hover:bg-surface-container-low/50 transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => onOpenContactInfo(person.id)}
                    className="flex items-center gap-3.5 min-w-0 text-left flex-1"
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
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        @<HighlightMatch text={person.username} query={trimmed} />
                      </p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        Public Gupshup ID
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectContact(person)}
                    className="h-9 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary text-xs font-semibold shrink-0 transition-colors"
                  >
                    Message
                  </button>
                </div>
              ))}
            </div>
          </div>
        )
      ) : (
        <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-outline-variant/15">
          <div className="text-sm font-semibold text-on-surface">Search for a username</div>
          <p className="text-xs text-on-surface-variant mt-1">Members only appear after you search by @username.</p>
        </div>

        {false && <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-on-surface">Gupshup member IDs</h3>
            <span className="text-xs text-on-surface-variant">Public usernames only</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {suggestions.map((person) => (
              <div
                key={person.id}
                className="bg-surface-container-lowest rounded-2xl p-4 shadow-[0_1px_4px_rgba(11,28,48,0.04)] border border-outline-variant/15 flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => onOpenContactInfo(person.id)}
                  className="flex items-center gap-3 min-w-0 text-left flex-1"
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
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-on-surface truncate">
                      @{person.username}
                    </div>
                    <div className="text-xs text-on-surface-variant truncate">
                      Public Gupshup ID
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    aria-label={`Dismiss ${person.name}`}
                    onClick={() => setDismissedIds((prev) => [...prev, person.id])}
                    className="w-8 h-8 rounded-lg text-on-surface-variant hover:bg-surface-container flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectContact(person)}
                    className="h-9 px-3.5 rounded-xl bg-primary-fixed hover:bg-primary-container text-primary hover:text-on-primary text-xs font-semibold transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>}
      )}
    </div>
  );
};
