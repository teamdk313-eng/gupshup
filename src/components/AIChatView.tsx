import React, { useEffect, useRef, useState } from 'react';

type SearchSource = { title: string; url: string; snippet: string };
type ChatLine = { role: 'user' | 'assistant'; content: string; id: string; sources?: SearchSource[] };
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
  const [searchWeb, setSearchWeb] = useState(true);
  const [searchNotice, setSearchNotice] = useState('');
  const [voiceMode, setVoiceMode] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState('');
  const recognitionRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const speak = (text: string) => {
    if (!('speechSynthesis' in window)) { setVoiceNotice('اس براؤزر میں آواز سنانے کی سہولت دستیاب نہیں۔'); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'urdu' ? 'ur-PK' : language === 'hindi' ? 'hi-IN' : language === 'roman_urdu' ? 'ur-PK' : (navigator.language || 'en-US');
    window.speechSynthesis.speak(utterance);
  };

  const submitText = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || busy || !setupComplete) return;
    const next = [...messages, { role: 'user' as const, content: text, id: crypto.randomUUID() }];
    setMessages(next); setDraft(''); setBusy(true); setError(null);
    try {
      const response = await fetch('/api/ai/chat', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ messages: next.slice(-16).map(({ role, content }) => ({ role, content })), preferences: { persona, language, vibe }, searchWeb }) });
      const data = await response.json().catch(() => ({})) as { reply?: string; error?: string; sources?: SearchSource[]; searchStatus?: string };
      if (!response.ok || !data.reply) throw new Error(data.error || 'AI is unavailable right now.');
      setMessages((current) => [...current, { role: 'assistant', content: data.reply!, id: crypto.randomUUID(), sources: data.sources || [] }]);
      setSearchNotice(data.searchStatus === 'not_configured' ? 'Web Search کو فعال کرنے کے لیے سرور پر سرچ کی API key درکار ہے۔' : data.searchStatus === 'failed' ? 'اس بار ویب سرچ دستیاب نہیں تھی؛ جواب AI کی عمومی معلومات پر مبنی ہے۔' : '');
      if (voiceMode) speak(data.reply);
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not send your message.'); }
    finally { setBusy(false); }
  };

  const startVoiceInput = () => {
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) { setVoiceNotice('اس براؤزر میں Voice Input دستیاب نہیں۔ Chrome میں مائیک استعمال کریں۔'); return; }
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const recognition = new Ctor();
    recognition.lang = language === 'urdu' ? 'ur-PK' : language === 'hindi' ? 'hi-IN' : language === 'roman_urdu' ? 'ur-PK' : (navigator.language || 'ur-PK');
    recognition.interimResults = true; recognition.continuous = false;
    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) if (event.results[i].isFinal) transcript += event.results[i][0].transcript;
      if (transcript.trim()) { setDraft(transcript.trim()); setListening(false); void submitText(transcript.trim()); }
    };
    recognition.onerror = () => { setListening(false); setVoiceNotice('مائیک دستیاب نہیں ہوا۔ مائیک کی اجازت چیک کریں۔'); };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition; setVoiceNotice('بولنا شروع کریں؛ آپ کی بات سن کر AI کو بھیج دی جائے گی۔'); setListening(true); recognition.start();
  };

  useEffect(() => () => { recognitionRef.current?.stop(); if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const send = (event: React.FormEvent) => { event.preventDefault(); void submitText(draft); };

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
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => { setVoiceMode((v) => !v); setVoiceNotice(''); if (voiceMode && 'speechSynthesis' in window) window.speechSynthesis.cancel(); }} className={"rounded-full border px-3 py-1.5 " + (voiceMode ? 'border-primary bg-primary-container/40 text-on-surface' : 'border-outline-variant/50')}>🔊 Voice {voiceMode ? 'ON' : 'OFF'}</button>
              <button type="button" onClick={() => setSearchWeb((value) => !value) className={"rounded-full border px-3 py-1.5 " + (searchWeb ? 'border-primary bg-primary-container/40 text-on-surface' : 'border-outline-variant/50')}>🌐 Web Search {searchWeb ? 'ON' : 'OFF'}</button>
              <button type="button" onClick={() => { setSetupComplete(false); setMessages([]); setError(null); }} className="underline">انداز تبدیل کریں</button>
            </div>
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
            {searchNotice && <p className="text-xs text-on-surface-variant" role="status">{searchNotice}</p>}
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className="max-w-[88%] animate-[gupshup-message-in_260ms_cubic-bezier(.2,.8,.2,1)_both]">
                  <div className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'rounded-br-md bg-primary text-on-primary' : 'rounded-bl-md bg-surface-container text-on-surface'}`}>{message.content}</div>
                  {message.role === 'assistant' && <button type="button" onClick={() => speak(message.content)} className="mt-1 px-2 py-1 text-xs text-primary hover:underline">🔈 جواب سنیں</button>}
                  {message.role === 'assistant' && !!message.sources?.length && <div className="mt-2 space-y-1 px-1"><p className="text-[11px] font-semibold text-on-surface-variant">Sources / ذرائع</p>{message.sources.map((source, index) => <a key={source.url + index} href={source.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-primary underline">[{index + 1}] {source.title}</a>)}</div>}
                </div>
              </div>
            ))}
            {busy && <div className="text-sm text-on-surface-variant">Gupshup AI is typing…</div>}
            {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
            <div ref={endRef} />
          </section>

          {(voiceNotice || voiceMode) && <p className="px-1 text-xs text-on-surface-variant" role="status">{voiceNotice || 'Voice mode آن ہے: جواب آواز میں سنایا جائے گا۔'}</p>}
          <form onSubmit={send} className="mt-3 flex items-end gap-2 rounded-2xl border border-outline-variant/30 bg-surface-container-lowest p-2">
            <button type="button" onClick={startVoiceInput} aria-label={listening ? 'Stop voice input' : 'Speak to AI'} className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${listening ? 'bg-error text-white animate-pulse' : 'bg-surface-container text-primary'}`}><span className="material-symbols-outlined">{listening ? 'stop' : 'mic'}</span></button>
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
