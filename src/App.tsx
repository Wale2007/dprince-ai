import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import type { Chat, Message } from './lib/supabase';
import { fetchGroqChat } from './lib/groq';
import { generateImageUrl } from './lib/image-gen';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { InputToolbar } from './components/InputToolbar';
import { MatrixRain } from './components/MatrixRain';
import { Menu } from 'lucide-react';
import type { User } from '@supabase/supabase-js';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [mode, setMode] = useState<'chat' | 'image' | 'code' | 'voice'>('chat');
  const [incog, setIncog] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoadingUser(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user && !incog) {
      loadChats();
    }
  }, [user, incog]);

  const loadChats = async () => {
    if (!user || incog) return;
    const { data } = await supabase
      .from('dp_chats')
      .select('id,title,updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setChats(data);
  };

  const handleSelectChat = async (id: string) => {
    setActiveChatId(id);
    setIncog(false);
    const { data } = await supabase
      .from('dp_messages')
      .select('role,content')
      .eq('chat_id', id)
      .order('created_at', { ascending: true });
    
    if (data) {
      setMessages(data.map(m => ({ role: m.role as 'user'|'assistant', content: m.content })));
    }
    setIsSidebarOpen(false);
    requestAnimationFrame(scrollBot);
  };

  const handleDeleteChat = async (id: string) => {
    await supabase.from('dp_messages').delete().eq('chat_id', id);
    await supabase.from('dp_chats').delete().eq('id', id);
    if (activeChatId === id) {
      setActiveChatId(null);
      setMessages([]);
    }
    setChats(c => c.filter(x => x.id !== id));
    showToast('Chat deleted.');
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setIncog(false);
    setIsSidebarOpen(false);
  };

  const handleToggleIncog = () => {
    setIncog(!incog);
    setActiveChatId(null);
    setMessages([]);
    setIsSidebarOpen(false);
    showToast(!incog ? 'Incognito on. Nothing will be saved.' : 'Incognito off.');
  };

  const scrollBot = () => {
    const el = document.getElementById('chatArea');
    if (el) el.scrollTop = el.scrollHeight;
  };

  const saveToDb = async (userMsg: string, aiMsg: string, newChatIdState?: string) => {
    if (incog || !user) return newChatIdState || activeChatId;
    let targetChatId = newChatIdState || activeChatId;
    
    try {
      if (!targetChatId) {
        const title = userMsg.substring(0, 55) + (userMsg.length > 55 ? '...' : '');
        const { data, error } = await supabase
          .from('dp_chats')
          .insert({ user_id: user.id, title, updated_at: new Date().toISOString() })
          .select('id')
          .single();
        if (!error && data) {
          targetChatId = data.id;
          setActiveChatId(targetChatId);
        }
      } else {
        await supabase
          .from('dp_chats')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', targetChatId);
      }
      if (targetChatId) {
         await supabase.from('dp_messages').insert([
           { chat_id: targetChatId, role: 'user', content: userMsg },
           { chat_id: targetChatId, role: 'assistant', content: aiMsg }
         ]);
      }
      loadChats();
    } catch {
       // db error ignored
    }
    return targetChatId;
  };

  const speakText = (text: string) => {
    if (!window.speechSynthesis) {
      showToast('Voice not supported in this browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const clean = text.replace(/[#*`_~\[\]>]/g, '').substring(0, 1000);
    const utt = new SpeechSynthesisUtterance(clean);
    utt.rate = 1.0; utt.pitch = 1.05; utt.volume = 1;
    const vs = window.speechSynthesis.getVoices();
    const v = vs.find(v => v.name.toLowerCase().includes('google') && v.lang.startsWith('en')) || vs.find(v => v.lang.startsWith('en'));
    if (v) utt.voice = v;
    window.speechSynthesis.speak(utt);
    showToast('Speaking...');
  };

  const handleSend = async (text: string, files: any[], imgOpts?: { style: string, size: string }) => {
    if (busy) return;
    setBusy(true);

    if (mode === 'image' && files.length === 0) {
      // Handle Image Generation
      const { imgUrl, seed } = generateImageUrl(text, imgOpts?.style, imgOpts?.size);
      
      const newMessages = [...messages, { role: 'user', content: `Generate image: ${text}` } as Message];
      setMessages(newMessages);
      requestAnimationFrame(scrollBot);

      // We fake the loading behavior
      const loadingMsg: Message = { role: 'assistant', content: '[TYPING_DOTS]' };
      setMessages([...newMessages, loadingMsg]);

      setTimeout(async () => {
        const finalMsg: Message = { 
          role: 'assistant', 
          content: `<div class="img-loading-wrap" id="ip_${seed}"><div class="img-spin"></div>Generating...</div>
                    <img src="${imgUrl}" 
                         onload="this.previousSibling.style.display='none';this.style.display='block'" 
                         onerror="this.previousSibling.innerHTML='Failed to load image. Check your network or project settings.';this.previousSibling.querySelector('.img-spin').style.display='none';"
                         style="display:none;max-width:100%;border-radius:var(--radius);border:1px solid var(--bdr);margin-top:8px;cursor:zoom-in;max-height:420px;object-fit:contain;" 
                         alt="${text}">
                    <div style="margin-top:8px;font-family:var(--mono);font-size:.65rem;color:var(--muted)">Prompt: ${text}</div>` 
        };
        setMessages(m => {
          const arr = [...m];
          arr[arr.length - 1] = finalMsg;
          return arr;
        });
        await saveToDb(`Generate image: ${text}`, '[Image generated]');
        setBusy(false);
        requestAnimationFrame(scrollBot);
      }, 500);
      return;
    }

    // Prepare message Content for Groq
    const isImageAttached = files.some(f => f.type === 'image');
    let dbUserMsg = text + (files.length ? ` [+${files.length} file(s)]` : '');
    
    let textPart = text || '';
    if (files.filter(f=>f.type === 'document').length) {
      textPart += '\n\n' + files.filter(f=>f.type==='document').map(f => `[File: ${f.name}]\n${f.text}`).join('\n\n');
    }
    if (!textPart && isImageAttached) textPart = 'Please analyse this image.';

    const newSystemPrompt: Message = {
      role: 'system',
      content: mode === 'code' 
        ? `You are DPR AI, an expert programmer. Write clean code with markdown blocks.`
        : mode === 'voice' 
        ? `You are DPR AI, a voice assistant. Keep responses concise, no markdown.`
        : `You are DPR AI, a highly capable AI assistant. Help with anything. Use markdown formatting.`
    };

    let userContent: string | any[] = textPart;
    if (isImageAttached) {
      userContent = [{ type: 'text', text: textPart }];
      files.filter(f=>f.type==='image').forEach(f => {
        (userContent as any[]).push({ type: 'image_url', image_url: { url: f.dataUrl } });
      });
    }

    const newUserMsg: Message = { role: 'user', content: userContent };
    const latestMessages = [...messages, newUserMsg];
    setMessages([...latestMessages, { role: 'assistant', content: '[TYPING_DOTS]' }]);
    requestAnimationFrame(scrollBot);

    try {
      const msgsForApi = [newSystemPrompt, ...latestMessages.slice(-12)];
      const aiResponse = await fetchGroqChat(msgsForApi, isImageAttached);
      
      setMessages([...latestMessages, { role: 'assistant', content: aiResponse }]);
      
      if (mode === 'voice') speakText(aiResponse);
      const newTargetId = await saveToDb(dbUserMsg, aiResponse);
      if (newTargetId && !activeChatId) setActiveChatId(newTargetId);

    } catch (e: any) {
      setMessages([...latestMessages, { role: 'assistant', content: `Sorry, I encountered an error: **${e.message}**\n\nPlease try again.` }]);
      showToast('Connection error. Please try again.');
    }
    setBusy(false);
    requestAnimationFrame(scrollBot);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleQuickSelect = (q: string) => {
    if (q.startsWith('[MODE:IMAGE]')) {
      setMode('image');
      // Setting text might be tricky without a ref to InputToolbar state, 
      // but for now let's just trigger it or rely on the user to see the mode change.
      // In a real app we'd share this state.
      showToast('Switched to Image Mode');
    } else {
      handleSend(q, []);
    }
  };

  useEffect(() => {
    if (mode === 'image') {
      const input = document.getElementById('chatInput') as HTMLTextAreaElement;
      if (input && !input.value) {
        input.value = 'a futuristic African city with neon lights at night, digital art';
      }
    }
  }, [mode]);

  if (loadingUser) {
    return (
      <div id="appLoading">
        <div className="load-logo">DPR AI</div>
        <div className="load-spinner"></div>
        <div className="load-sub">Initialising...</div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  const activeChat = chats.find(c => c.id === activeChatId);

  return (
    <div id="app" className="show">
      <Sidebar 
        user={user}
        chats={chats}
        activeChatId={activeChatId}
        isOpen={isSidebarOpen}
        isIncognito={incog}
        onSelectChat={handleSelectChat}
        onDeleteChat={handleDeleteChat}
        onNewChat={handleNewChat}
        onToggleIncog={handleToggleIncog}
        onSignOut={async () => await supabase.auth.signOut()}
        onClose={() => setIsSidebarOpen(false)}
      />
      
      <div className="main">
        <div className="topbar">
          <div className="topbar-left">
            <button className="btn-sb-toggle" style={{ display: 'flex' }} onClick={() => setIsSidebarOpen(true)}>
              <Menu size={16} strokeWidth={2} />
            </button>
            <div className="topbar-title">{activeChat?.title || (incog ? 'Incognito Chat' : 'DPR AI')}</div>
            {incog && (
              <div className="incog-pill">
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="1" y1="1" x2="23" y2="23"/><circle cx="12" cy="12" r="3"/></svg>
                Incognito
              </div>
            )}
          </div>
          <div className="mode-tabs">
            {['chat', 'image', 'code', 'voice'].map((m) => (
              <button 
                key={m} 
                className={`mode-tab ${mode === m ? 'active' : ''}`} 
                onClick={() => setMode(m as any)}
              >
                {m.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <ChatArea 
           messages={messages}
           userName={user.user_metadata?.full_name || user.email?.split('@')[0]}
           userPhoto={user.user_metadata?.avatar_url}
           onCopy={(t) => { navigator.clipboard.writeText(t); showToast('Copied!'); }}
           onSpeak={speakText}
           onQuickSelect={handleQuickSelect}
        />

        <InputToolbar 
           mode={mode}
           setMode={setMode}
           onSend={handleSend}
           busy={busy}
        />
      </div>

      {lightboxImg && (
        <div className="lightbox show" onClick={() => setLightboxImg(null)}>
          <img src={lightboxImg} alt="Lightbox" />
        </div>
      )}
      
      {toast && <div className="toast show">{toast}</div>}

      <MatrixRain />
    </div>
  );
}
