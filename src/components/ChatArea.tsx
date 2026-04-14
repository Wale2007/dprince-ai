import { MessageBubble } from './MessageBubble';
import type { Message } from '../lib/supabase';

interface ChatAreaProps {
  messages: Message[];
  userName?: string;
  userPhoto?: string;
  onCopy: (text: string) => void;
  onSpeak: (text: string) => void;
  onQuickSelect: (text: string) => void;
}

export function ChatArea({ 
  messages, userName, userPhoto, onCopy, onSpeak, onQuickSelect 
}: ChatAreaProps) {

  if (messages.length === 0) {
    return (
      <div className="chat-area" id="chatArea">
        <div className="welcome" id="welcomeEl">
          <div className="welcome-logo">DPR AI</div>
          <div className="welcome-sub">Your intelligent assistant for chat, code, images and voice</div>
          <div className="suggestion-grid">
            <div className="suggestion-card sug-card" onClick={() => onQuickSelect('What are the latest trends in Web3 security and blockchain in 2025?')}>
              <div className="sug-icon">⛓️</div>
              <div className="sug-title">Latest Web3 Trends</div>
              <div className="sug-desc">Up-to-date blockchain & security insights</div>
            </div>
            <div className="suggestion-card sug-card" onClick={() => onQuickSelect('Write a Solidity smart contract for a basic ERC-20 token with security best practices')}>
              <div className="sug-icon">📝</div>
              <div className="sug-title">Write Smart Contract</div>
              <div className="sug-desc">Solidity code with security best practices</div>
            </div>
            <div className="suggestion-card sug-card" onClick={() => onQuickSelect('[MODE:IMAGE]a futuristic African city with neon lights at night, digital art')}>
              <div className="sug-icon">🎨</div>
              <div className="sug-title">Generate an Image</div>
              <div className="sug-desc">Create images from text descriptions</div>
            </div>
            <div className="suggestion-card sug-card" onClick={() => onQuickSelect('Write a professional cover letter for a Web3 security specialist role')}>
              <div className="sug-icon">✍️</div>
              <div className="sug-title">Write for Me</div>
              <div className="sug-desc">Letters, essays, bios and more</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area" id="chatArea">
      {messages.map((m, i) => (
         <MessageBubble 
           key={i}
           role={m.role}
           content={m.content}
           userName={userName}
           userPhoto={userPhoto}
           onCopy={onCopy}
           onSpeak={onSpeak}
         />
      ))}
    </div>
  );
}
