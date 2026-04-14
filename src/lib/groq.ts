import type { Message } from './supabase';

const GROQ_KEY = import.meta.env.VITE_GROQ_KEY || '';
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function fetchGroqChat(messages: Message[], hasImages: boolean): Promise<string> {
  const model = hasImages ? 'llama-3.2-11b-vision-preview' : 'llama-3.3-70b-versatile';
  
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 4096,
      temperature: 0.7
    })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error ${res.status}`);
  }
  
  const data = await res.json();
  return data.choices[0].message.content;
}
