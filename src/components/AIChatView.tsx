import React, { useEffect, useRef, useState } from 'react';

type ChatLine = { role: 'user' | 'assistant'; content: string; id: string };

export const AIChatView: React.FC<{ accessToken: string; userName: string }> = ({ accessToken, userName }) => {
  const [messages, setMessages] = useState<ChatLine[]>([]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text || busy) return;
    const next = [...messages, { role: 'user' as const, content: text, id: crypto.randomUUID() }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ messages: next.slice(-16).map(({ role, content }) => ({ role, content })) }),
      });
      const data = await response.json().catch(() => ({})) as { reply?: string; error?: string };
      if (!response.ok || !data.reply) throw new Error(data.error || 'AI is unavailable right now.');
      setMessages((current) => [...current, { role: 'assistant', content: data.reply!, id: crypto.randomUUID() }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your message.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex h-[calc(100dvh-8rem)] min-h-[420px] w-full max-w-4xl flex-col bg-surface px-3 py-4 sm:px-6 lg:h-[calc(100vh-5rem)]">
      <header className="mb-4 flex items-center gap-3 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
          <span className="material-symbols-outlined text-2xl">auto_awesome</span>
        </div>
        <div className="min-w-0">
          <h2 className="font-bold text-on-surface">Gupshup AI</h2>
          <p className="text-xs text-on-surface-variant">AI chat • powered by Cloudflare</p>
        </div>
        <span className="ml-auto rounded-full bg-surface-container px-3 py-1 text-xs text-on-surface-variant">Online</span>
      </header>

      <section className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-3 sm:p-5" aria-live="polite">
        {messages.length === 0 && (
          <div className="mx-auto mt-10 max-w-md text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
              <span className="material-symbols-outlined text-3xl">forum</span>
            </div>
            <h3 className="text-lg font-semibold text-on-surface">السلام علیکم، {userName}!</h3>
            <p className="mt-2 text-sm text-on-surface-variant">مجھ سے سوال پوچھیں، کسی موضوع پر بات کریں یا کسی چیز کو سمجھنے میں مدد لیں۔</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {['مجھے کوئی نئی چیز سکھاؤ', 'آج کے لیے ایک اچھی کتاب تجویز کرو', 'ایک دلچسپ کوئز شروع کرو'].map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => setDraft(suggestion)} className="rounded-full border border-outline-variant/40 px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container">{suggestion}</button>
              ))}
            </div>
          </div>
        )}
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md bg-surface-container text-on-surface'}`}>{message.content}</div>
          </div>
        ))}
        {busy && <div className="text-sm text-on-surface-variant">Gupshup AI is typing…</div>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div ref={endRef} />
      </section>

      <form onSubmit={send} className="mt-3 flex items-end gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-2">
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={1} maxLength={3000} placeholder="Message Gupshup AI…" className="max-h-32 min-h-11 flex-1 resize-y bg-transparent px-3 py-3 text-sm text-on-surface outline-none placeholder:text-on-surface-variant" />
        <button type="submit" disabled={!draft.trim() || busy} className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-50">
          <span className="material-symbols-outlined text-lg">send</span><span>Send</span>
        </button>
      </form>
      <p className="mt-2 px-1 text-center text-[11px] text-on-surface-variant">AI can make mistakes. Don’t share passwords or private account details.</p>
    </main>
  );
};
