import React, { useEffect, useRef, useState } from 'react';

type ChatLine = { role: 'user' | 'assistant'; content: string; id: string };
type Persona = 'girl_friendly' | 'good_friend';
type Language = 'auto' | 'urdu' | 'hindi' | 'roman_urdu';
type Vibe = 'fun' | 'calm' | 'learning';

export const AIChatView: React.FC<{ accessToken: string; userName: string }> = ({ accessToken, userName }) => {
  const [persona, setPersona] = useState<Persona | ''>('');
  const [language, setLanguage] = useState<Language | ''>('');
  const [vibe, setVibe] = useState<Vibe | ''>('');
  const [setupComplete, setSetupComplete] = useState(false);
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
    if (!text || busy || !setupComplete) return;
    const next = [...messages, { role: 'user' as const, content: text, id: crypto.randomUUID() }];
    setMessages(next);
    setDraft('');
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          messages: next.slice(-16).map(({ role, content }) => ({ role, content })),
          preferences: { persona, language, vibe },
        }),
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

  const Choice = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button type="button" onClick={onClick} className={`rounded-xl border px-3 py-3 text-sm text-left transition-colors ${selected ? 'border-primary bg-primary-container/50 text-on-surface' : 'border-outline-variant/40 text-on-surface-variant hover:bg-surface-container'}`} aria-pressed={selected}>
      {children}
    </button>
  );

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

      {!setupComplete ? (
        <section className="flex-1 overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-4 sm:p-6">
          <div className="mx-auto max-w-xl">
            <div className="mb-5 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
                <span className="material-symbols-outlined text-3xl">tune</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface">اپنی AI چیٹ سیٹ کریں</h3>
              <p className="mt-2 text-sm text-on-surface-variant">السلام علیکم، {userName}! شروع کرنے سے پہلے یہ تین سوال منتخب کریں۔</p>
            </div>

            <div className="space-y-5">
              <div>
                <p className="mb-2 text-sm font-semibold text-on-surface">1. آپ کس انداز میں بات کرنا پسند کریں گے؟</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Choice selected={persona === 'girl_friendly'} onClick={() => setPersona('girl_friendly')}>
                    <span className="block font-semibold">🌸 دوستانہ لڑکی جیسا انداز</span>
                    <span className="mt-1 block text-xs opacity-80">نرم، خوش مزاج اور دوستانہ گفتگو</span>
                  </Choice>
                  <Choice selected={persona === 'good_friend'} onClick={() => setPersona('good_friend')}>
                    <span className="block font-semibold">🤝 اچھے دوست جیسا انداز</span>
                    <span className="mt-1 block text-xs opacity-80">سادہ، بے تکلف اور مددگار بات چیت</span>
                  </Choice>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-on-surface">2. کس زبان میں بات ہو؟</p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Choice selected={language === 'auto'} onClick={() => setLanguage('auto')}>خودکار</Choice>
                  <Choice selected={language === 'urdu'} onClick={() => setLanguage('urdu')}>اردو</Choice>
                  <Choice selected={language === 'hindi'} onClick={() => setLanguage('hindi')}>हिन्दी</Choice>
                  <Choice selected={language === 'roman_urdu'} onClick={() => setLanguage('roman_urdu')}>Roman Urdu</Choice>
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-semibold text-on-surface">3. گفتگو کا موڈ کیا ہو؟</p>
                <div className="grid grid-cols-3 gap-2">
                  <Choice selected={vibe === 'fun'} onClick={() => setVibe('fun')}>😄 مزاحیہ</Choice>
                  <Choice selected={vibe === 'calm'} onClick={() => setVibe('calm')}>🌿 پرسکون</Choice>
                  <Choice selected={vibe === 'learning'} onClick={() => setVibe('learning')}>📚 سیکھنے والا</Choice>
                </div>
              </div>
            </div>

            <button type="button" disabled={!persona || !language || !vibe} onClick={() => setSetupComplete(true)} className="mt-6 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-on-primary disabled:cursor-not-allowed disabled:opacity-40">چیٹ شروع کریں</button>
            <p className="mt-3 text-center text-xs text-on-surface-variant">یہ دوستانہ AI گفتگو ہے، حقیقی شخص یا رومانوی ساتھی نہیں۔</p>
          </div>
        </section>
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between gap-2 text-xs text-on-surface-variant">
            <span>{persona === 'girl_friendly' ? '🌸 دوستانہ انداز' : '🤝 اچھے دوست کا انداز'} · {vibe === 'fun' ? 'مزاحیہ' : vibe === 'calm' ? 'پرسکون' : 'سیکھنے والا'}</span>
            <button type="button" onClick={() => { setSetupComplete(false); setMessages([]); setError(null); }} className="underline">انداز تبدیل کریں</button>
          </div>
          <section className="flex-1 space-y-3 overflow-y-auto rounded-2xl border border-outline-variant/20 bg-surface-container-lowest p-3 sm:p-5" aria-live="polite">
            {messages.length === 0 && (
              <div className="mx-auto mt-10 max-w-md text-center">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary">
                  <span className="material-symbols-outlined text-3xl">forum</span>
                </div>
                <h3 className="text-lg font-semibold text-on-surface">السلام علیکم، {userName}!</h3>
                <p className="mt-2 text-sm text-on-surface-variant">مجھ سے سوال پوچھیں، کسی موضوع پر بات کریں یا کسی چیز کو سمجھنے میں مدد لیں۔</p>
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {['مجھے کوئی نئی چیز سکھاؤ', 'ایک دلچسپ کوئز شروع کرو', 'کوئی مزاحیہ بات سناؤ'].map((suggestion) => (
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
        </>
      )}
    </main>
  );
};
