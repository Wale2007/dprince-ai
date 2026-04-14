import { LogOut, Plus, MessageSquare, Ghost, X } from 'lucide-react';
import type { Chat } from '../lib/supabase';
import type { User } from '@supabase/supabase-js';

interface SidebarProps {
  user: User | null;
  chats: Chat[];
  activeChatId: string | null;
  isOpen: boolean;
  isIncognito: boolean;
  onSelectChat: (id: string) => void;
  onDeleteChat: (id: string) => void;
  onNewChat: () => void;
  onToggleIncog: () => void;
  onSignOut: () => void;
  onClose: () => void;
}

export function Sidebar({
  user, chats, activeChatId, isOpen, isIncognito,
  onSelectChat, onDeleteChat, onNewChat, onToggleIncog, onSignOut, onClose
}: SidebarProps) {
  
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  const userPhoto = user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';

  return (
    <>
      <div className={`sb-overlay ${isOpen ? 'show' : ''}`} onClick={onClose}></div>
      <div className={`sidebar ${isOpen ? 'open' : ''}`} id="sidebar">
        <div className="sb-head">
          <div className="sb-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" style={{ width: 22, height: 22, borderRadius: 5 }} alt="Logo" />
            DPR AI
          </div>
          <button className="sb-btn sb-btn-new" onClick={onNewChat}>
            <Plus size={13} strokeWidth={2.5} />
            New Chat
          </button>
          <button className="sb-btn sb-btn-incog" onClick={onToggleIncog}>
            <Ghost size={13} strokeWidth={2} />
            {isIncognito ? 'Exit Incognito' : 'Incognito Chat'}
          </button>
        </div>
        <div className="sb-section">Recent Chats</div>
        <div className="chat-list" id="chatList">
          {chats.length === 0 ? (
            <div style={{ padding: '18px 10px', color: 'var(--dim)', fontSize: '.78rem', textAlign: 'center', fontFamily: 'var(--mono)' }}>
              No chats yet
            </div>
          ) : (
            chats.map(c => (
              <div 
                key={c.id} 
                className={`chat-item ${c.id === activeChatId ? 'active' : ''}`} 
                onClick={() => onSelectChat(c.id)}
              >
                <MessageSquare size={14} style={{ flexShrink: 0 }} />
                <span className="chat-item-txt">{c.title || 'Untitled'}</span>
                <button 
                  className="chat-del" 
                  onClick={(e) => { e.stopPropagation(); onDeleteChat(c.id); }}
                >
                  <X size={12} />
                </button>
              </div>
            ))
          )}
        </div>
        <div className="sb-foot">
          <div className="user-row">
            <div className="user-av" id="userAv">
              {userPhoto ? <img src={userPhoto} alt={userName} /> : userName.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-email">{user?.email || ''}</div>
            </div>
            <button className="btn-signout" onClick={onSignOut} title="Sign out">
              <LogOut size={14} strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
