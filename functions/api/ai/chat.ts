interface ChatPreferences {
  persona?: 'girl_friendly' | 'good_friend';
  language?: 'auto' | 'urdu' | 'hindi' | 'roman_urdu';
  vibe?: 'fun' | 'calm' | 'learning';
}

interface Env {
  AI: { run(model: string, input: { messages: Array<{ role: string; content: string }>; max_tokens?: number; chat_template_kwargs?: { enable_thinking?: boolean } }): Promise<{ response?: string; choices?: Array<{ message?: { content?: string } }> }> };
  SUPABASE_URL: string;
  SUPABASE_PUBLISHABLE_KEY: string;
}

interface ChatRequest {
  messages?: Array<{ role: 'user' | 'assistant'; content: string }>;
  preferences?: ChatPreferences;
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const headers = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });

  const authorization = request.headers.get('Authorization') || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  if (!token) return json({ error: 'Please sign in to use Gupshup AI.' }, 401);

  try {
    const authCheck = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${token}` },
    });
    if (!authCheck.ok) return json({ error: 'Your session has expired. Please sign in again.' }, 401);

    const body = await request.json() as ChatRequest;
    if (!Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 16) {
      return json({ error: 'Send between 1 and 16 chat messages.' }, 400);
    }
    const messages = body.messages.map((item) => {
      if (!item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string') {
        throw new Error('Invalid chat message.');
      }
      const content = item.content.trim();
      if (!content || content.length > 3000) throw new Error('Each message must be between 1 and 3000 characters.');
      return { role: item.role, content };
    });
    if (messages[messages.length - 1].role !== 'user') return json({ error: 'Your latest message must be from you.' }, 400);

    const preferences = body.preferences || {};
    const persona = preferences.persona === 'girl_friendly' ? 'girl_friendly' : 'good_friend';
    const language = ['auto', 'urdu', 'hindi', 'roman_urdu'].includes(preferences.language || '')
      ? preferences.language!
      : 'auto';
    const vibe = ['fun', 'calm', 'learning'].includes(preferences.vibe || '')
      ? preferences.vibe!
      : 'calm';

    const languageInstruction = {
      auto: 'Match the language used by the user',
      urdu: 'Always reply in Urdu',
      hindi: 'Always reply in Hindi',
      roman_urdu: 'Always reply in Roman Urdu',
    }[language];
    const vibeInstruction = {
      fun: 'Keep the conversation light, cheerful, and humorous when appropriate',
      calm: 'Use a calm, kind, and reassuring tone',
      learning: 'Be curious, explain things clearly, and encourage learning',
    }[vibe];
    const personaInstruction = persona === 'girl_friendly'
      ? 'Use a friendly, cheerful, gentle feminine conversational style, like a platonic female friend. You are still clearly an AI, not a real girl. Never act as a girlfriend or romantic partner.'
      : 'Use the relaxed, honest, supportive tone of a good platonic friend. You are an AI assistant, not a real-life friend.';

    const result = await env.AI.run('@cf/google/gemma-4-26b-a4b-it', {
      messages: [
        {
          role: 'system',
          content: `You are Gupshup AI, a helpful assistant inside a messaging app. Keep all responses age-appropriate for teenagers. Never engage in romantic or girlfriend/boyfriend roleplay, sexual content, or dangerous activities. Be warm, friendly, playful when appropriate, and supportive without pretending to be a real person or creating emotional dependency. Never request passwords, authentication codes, or private account details. If uncertain, say so.\nPersona: ${personaInstruction}\nLanguage: ${languageInstruction}.\nConversation mood: ${vibeInstruction}. Reply naturally and conversationally.`,
        },
        ...messages,
      ],
      max_tokens: 700,
      chat_template_kwargs: { enable_thinking: false },
    });
    const candidate = typeof result?.response === 'string'
      ? result.response
      : result?.choices?.[0]?.message?.content;
    const reply = typeof candidate === 'string' ? candidate.trim() : '';
    if (!reply) return json({ error: 'AI could not prepare a reply. Please try again.' }, 502);
    return json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI request failed.';
    return json({ error: message }, 400);
  }
}
