import { useRef, useState } from 'react';
import { MessageSquare, Image as ImageIcon, Code, Mic, Paperclip, Send } from 'lucide-react';

interface FileEntry {
  name: string;
  type: 'image' | 'document';
  dataUrl: string;
  text?: string;
}

interface InputToolbarProps {
  mode: 'chat' | 'image' | 'code' | 'voice';
  setMode: (mode: 'chat' | 'image' | 'code' | 'voice') => void;
  onSend: (text: string, files: FileEntry[], imgOpts?: { style: string, size: string }) => void;
  busy: boolean;
}

export function InputToolbar({ mode, setMode, onSend, busy }: InputToolbarProps) {
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [imgStyle, setImgStyle] = useState('');
  const [imgSize, setImgSize] = useState('512x512');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    
    Array.from(fileList).forEach(file => {
      if (files.length >= 3) {
        alert('Maximum 3 files at once.');
        return;
      }
      const isImage = file.type.startsWith('image/');
      const reader = new FileReader();
      
      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        const entry: FileEntry = { name: file.name, type: isImage ? 'image' : 'document', dataUrl };
        if (!isImage) {
          const tr = new FileReader();
          tr.onload = (te) => {
             entry.text = (te.target?.result as string).substring(0, 8000);
             setFiles(prev => [...prev, entry]);
          };
          tr.onerror = () => {
             entry.text = '[Binary file - cannot read as text]';
             setFiles(prev => [...prev, entry]);
          };
          tr.readAsText(file);
        } else {
          setFiles(prev => [...prev, entry]);
        }
      };
      reader.readAsDataURL(file);
    });
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = text.trim();
    if ((!trimmed && files.length === 0) || busy) return;
    onSend(trimmed, [...files], mode === 'image' ? { style: imgStyle, size: imgSize } : undefined);
    setText('');
    setFiles([]);
    if (textRef.current) {
       textRef.current.style.height = 'auto';
    }
  };

  const ph = {
    chat: 'Ask anything... (Enter to send, Shift+Enter for new line)',
    image: 'Describe the image you want to generate...',
    code: 'Describe what code you want me to write...',
    voice: 'Type a message and I will speak the response aloud...'
  };

  return (
    <div className="input-area">
      <div className="input-wrap">
        <div className="input-box">
          <div className="input-toolbar">
            <button className={`tool-btn ${mode === 'chat' ? 'active' : ''}`} onClick={() => setMode('chat')}>
               <MessageSquare size={13} strokeWidth={2} /> Chat
            </button>
            <button className={`tool-btn ${mode === 'image' ? 'active' : ''}`} onClick={() => setMode('image')}>
               <ImageIcon size={13} strokeWidth={2} /> Image
            </button>
            <button className={`tool-btn ${mode === 'code' ? 'active' : ''}`} onClick={() => setMode('code')}>
               <Code size={13} strokeWidth={2} /> Code
            </button>
            <button className={`tool-btn ${mode === 'voice' ? 'active' : ''}`} onClick={() => setMode('voice')}>
               <Mic size={13} strokeWidth={2} /> Voice
            </button>
            <button className="attach-btn" onClick={() => fileInputRef.current?.click()} title="Attach image or document">
               <Paperclip size={13} strokeWidth={2} /> Attach
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: 'none' }} 
              accept="image/*,.pdf,.txt,.doc,.docx,.csv,.js,.py,.html,.css,.json,.md" 
              multiple 
              onChange={handleFiles} 
            />
          </div>

          <div className="file-preview">
             {files.map((f, i) => (
                <div key={i} className="file-chip">
                  <span style={{ fontSize: '.9rem' }}>{f.type === 'image' ? 'IMAGE' : 'DOC'}</span>
                  <span className="file-chip-name">{f.name}</span>
                  <button className="file-chip-rm" onClick={() => removeFile(i)}>x</button>
                </div>
             ))}
          </div>

          <div className={`img-opts ${mode === 'image' ? 'show' : ''}`}>
             <span className="img-label">Style:</span>
             <select className="img-select" value={imgStyle} onChange={e => setImgStyle(e.target.value)}>
                <option value="">Default</option>
                <option value="photorealistic, ultra detailed">Photorealistic</option>
                <option value="digital art, vibrant colors">Digital Art</option>
                <option value="anime style, studio ghibli">Anime</option>
                <option value="oil painting, impressionist">Oil Painting</option>
                <option value="watercolor, soft tones">Watercolor</option>
                <option value="3d render, octane render">3D Render</option>
                <option value="cinematic, dramatic lighting">Cinematic</option>
                <option value="dark fantasy, mystical">Dark Fantasy</option>
             </select>
             <span className="img-label">Size:</span>
             <select className="img-select" value={imgSize} onChange={e => setImgSize(e.target.value)}>
                <option value="512x512">Square</option>
                <option value="1024x512">Wide</option>
                <option value="512x1024">Tall</option>
                <option value="1024x1024">Large</option>
             </select>
          </div>

          <div className="input-row">
            <textarea 
              ref={textRef}
              id="chatInput" 
              placeholder={ph[mode]} 
              rows={1}
              value={text}
              onChange={(e) => {
                 setText(e.target.value);
                 e.target.style.height = 'auto';
                 e.target.style.height = Math.min(e.target.scrollHeight, 150) + 'px';
              }}
              onKeyDown={handleKeyDown}
            />
            <button className="btn-send" onClick={handleSend} disabled={busy || (!text.trim() && files.length === 0)} title="Send message">
              <Send size={15} color="var(--bg)" />
            </button>
          </div>
        </div>
        <div className="input-hint">DPR AI · Powered by Llama 3.3 &amp; Groq · Enter to send</div>
      </div>
    </div>
  );
}
