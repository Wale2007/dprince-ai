import { useEffect, useRef } from 'react';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface MessageBubbleProps {
  role: 'user' | 'assistant' | 'system';
  content: string | any[];
  userPhoto?: string;
  userName?: string;
  onCopy?: (text: string) => void;
  onSpeak?: (text: string) => void;
}

export function MessageBubble({ role, content, userPhoto, userName, onCopy, onSpeak }: MessageBubbleProps) {
  const isAI = role === 'assistant' || role === 'system';
  const contentRef = useRef<HTMLDivElement>(null);
  
  const av = isAI ? 'DP' : (userName?.charAt(0).toUpperCase() || 'U');

  useEffect(() => {
    if (contentRef.current) {
      if (isAI && typeof content === 'string') {
        const blocks = contentRef.current.querySelectorAll('pre code');
        blocks.forEach((block) => {
          try {
            hljs.highlightElement(block as HTMLElement);
          } catch {}
          
          const pre = block.parentElement;
          if (pre && !pre.querySelector('.code-copy')) {
            const cb = document.createElement('button');
            cb.className = 'code-copy';
            cb.textContent = 'Copy';
            cb.onclick = () => {
              navigator.clipboard.writeText(block.textContent || '');
              cb.textContent = 'Copied!';
              setTimeout(() => cb.textContent = 'Copy', 2000);
            };
            pre.appendChild(cb);
          }
        });
      }
    }
  }, [content, isAI]);

  // Handle typing dots
  if (content === '[TYPING_DOTS]') {
    return (
      <div className="message ai">
        <div className="msg-av">DP</div>
        <div className="msg-bubble">
          <div className="typing-dots">
            <div className="t-dot"></div>
            <div className="t-dot"></div>
            <div className="t-dot"></div>
          </div>
        </div>
      </div>
    );
  }

  // Handle generated images markup natively instead of raw strings if possible
  if (isAI && typeof content === 'string' && content.startsWith('<div class="img-loading-wrap"')) {
    return (
      <div className="message ai">
         <div className="msg-av">DP</div>
         <div className="msg-bubble" dangerouslySetInnerHTML={{__html: content}} />
      </div>
    )
  }

  let htmlContent = '';
  // Convert text into displayable format
  if (typeof content === 'string') {
    if (isAI) {
      try {
        htmlContent = marked.parse(content, { breaks: true }) as string;
      } catch {
        htmlContent = `<p>${content}</p>`;
      }
    } else {
      htmlContent = `<p>${content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`;
    }
  } else if (Array.isArray(content) && role === 'user') {
    // Handling multimodal content (images + text)
    const textPart = content.find(c => c.type === 'text')?.text || '';
    const imgParts = content.filter(c => c.type === 'image_url');
    htmlContent = imgParts.map(img => `<img src="${img.image_url.url}" class="msg-file-img" alt="Attachment">`).join('');
    if (textPart) {
      htmlContent += `<p>${textPart.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`;
    }
  }

  const safeRaw = typeof content === 'string' ? content : (Array.isArray(content) ? content.find(c=>c.type==='text')?.text || '' : '');

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAI && contentRef.current) {
      const r = contentRef.current.getBoundingClientRect();
      contentRef.current.style.backgroundImage = `radial-gradient(220px circle at ${e.clientX - r.left}px ${e.clientY - r.top}px,rgba(0,230,118,0.07),transparent 60%),none`;
      contentRef.current.style.background = 'var(--surface)';
    }
  };

  const handleMouseLeave = () => {
    if (isAI && contentRef.current) {
      contentRef.current.style.backgroundImage = '';
    }
  };

  return (
    <div className={`message ${isAI ? 'ai' : 'user'} fade-up-anim`}>
      <div className="msg-av" style={!isAI && userPhoto ? { background: `url(${userPhoto}) center/cover` } : {}}>
        {!isAI && userPhoto ? '' : av}
      </div>
      <div className="msg-bubble">
        <div 
          className="msg-content" 
          ref={contentRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          dangerouslySetInnerHTML={{ __html: htmlContent }} 
        />
        {isAI && (
          <div className="msg-actions">
            <button className="msg-act-btn" onClick={() => onCopy && onCopy(safeRaw)}>Copy</button>
            <button className="msg-act-btn" onClick={() => onSpeak && onSpeak(safeRaw)}>Speak</button>
          </div>
        )}
      </div>
    </div>
  );
}
