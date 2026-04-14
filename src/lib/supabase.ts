import { createClient } from '@supabase/supabase-js';

const SUPA_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPA_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase = createClient(SUPA_URL, SUPA_KEY);

export type Chat = {
  id: string;
  title: string;
  updated_at: string;
};

export type Message = {
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
};
