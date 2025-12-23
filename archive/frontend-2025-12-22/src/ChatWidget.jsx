import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import axios from 'axios';

const ADMIN_KEY = process.env.REACT_APP_ADMIN_KEY || null;

const makeSessionId = () => {
  let id = sessionStorage.getItem('kenmark_session_id');
  if (!id) {
    id = 's_' + Math.random().toString(36).slice(2, 10);
    sessionStorage.setItem('kenmark_session_id', id);
  }
  return id;
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const cached = sessionStorage.getItem('kenmark_messages');
      return cached ? JSON.parse(cached) : [{ role: 'bot', text: 'Hello! I am the Kenmark AI. How can I help you today?' }];
    } catch (e) {
      return [{ role: 'bot', text: 'Hello! I am the Kenmark AI. How can I help you today?' }];
    }
  });
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDark, setIsDark] = useState(() => localStorage.getItem('kenmark_dark') === '1');
  const messagesEndRef = useRef(null);
  const sessionId = useRef(makeSessionId());

  useEffect(() => {
    sessionStorage.setItem('kenmark_messages', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('kenmark_dark', isDark ? '1' : '0');
  }, [isDark]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post((process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000') + '/chat', {
        message: userMessage,
        session_id: sessionId.current,
      });

      const botText = response.data?.response || 'Sorry, something went wrong.';
      setMessages((prev) => [...prev, { role: 'bot', text: botText }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages((prev) => [...prev, { role: 'bot', text: "Sorry, I am having trouble connecting to the server." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const uploadKnowledge = async (file) => {
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      await axios.post((process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000') + '/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data', 'x-admin-key': ADMIN_KEY }
      });
      alert('Uploaded and reloaded knowledge file.');
    } catch (e) {
      alert('Upload failed. Check console.');
      console.error(e);
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
          className="bg-gray-800 text-white p-4 rounded-full shadow-lg hover:shadow-2xl transition-all"
          title="Chat with Kenmark"
        >
          <MessageCircle size={26} className="text-purple-400" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="w-96 bg-white dark:bg-gray-900 rounded-lg shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700 h-[520px]">
          {/* Header */}
          <div className="bg-gray-900 dark:bg-gray-800 p-3 flex justify-between items-center text-white">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-600 to-purple-400 rounded-full flex items-center justify-center text-white font-bold">K</div>
              <div>
                <h3 className="font-semibold">Kenmark Support</h3>
                <div className="text-xs text-gray-300">AI-powered, knowledge-grounded answers</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-300">Dark</label>
              <input type="checkbox" checked={isDark} onChange={(e) => setIsDark(e.target.checked)} />
              <button onClick={() => setIsOpen(false)} className="p-1 rounded hover:bg-gray-700">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] p-3 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-purple-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-gray-700 border text-gray-800 dark:text-gray-100 rounded-bl-none shadow-sm'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start items-center">
                <div className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
                  <span className="typing-dots">
                    <span /> <span /> <span />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask about Kenmark..."
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 dark:bg-gray-800 dark:text-white"
            />
            <button
              onClick={sendMessage}
              disabled={isLoading}
              className="bg-purple-600 text-white p-2 rounded-md hover:bg-purple-700 disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        .typing-dots span{display:inline-block;width:6px;height:6px;margin:0 2px;background:#6b21a8;border-radius:50%;animation:typing 1s infinite}
        .typing-dots span:nth-child(2){animation-delay:0.15s}
        .typing-dots span:nth-child(3){animation-delay:0.3s}
        @keyframes typing{0%{opacity:0.2;transform:translateY(-2px)}50%{opacity:1;transform:translateY(0)}100%{opacity:0.2;transform:translateY(-2px)}}
      `}</style>

    </div>
  );
};

export default ChatWidget;