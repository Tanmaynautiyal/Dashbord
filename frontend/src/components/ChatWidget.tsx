import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Send, User, Maximize2, Minimize2, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Card, CardHeader, CardTitle, CardContent, Button } from '../ui';
import { chatService, type ChatMessage } from '../services/chatService';
import { useQueryClient } from '@tanstack/react-query';

interface ChatWidgetProps {
  /** When provided, the chat opens with this message pre-sent automatically */
  initialQuery?: string;
  /** When true, the fullscreen toggle is hidden (embedded inside another modal) */
  embedded?: boolean;
  /** Height class override (default h-[400px]) */
  heightClass?: string;
}

export default function ChatWidget({
  initialQuery,
  embedded = false,
  heightClass = 'h-[420px]',
}: ChatWidgetProps) {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [autoSentDone, setAutoSentDone] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load history on mount
  useEffect(() => {
    if (!initialQuery) {
      chatService.getHistory().then(setMessages).catch(console.error);
    }
  }, [initialQuery]);

  // Auto-send the initial query once on mount (for topic context)
  useEffect(() => {
    if (initialQuery && !autoSentDone) {
      setAutoSentDone(true);
      sendMessage(initialQuery);
    }
  }, [initialQuery, autoSentDone]);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!embedded) {
      document.body.style.overflow = fullscreen ? 'hidden' : '';
      if (fullscreen) inputRef.current?.focus();
    }
    return () => { if (!embedded) document.body.style.overflow = ''; };
  }, [fullscreen, embedded]);

  const sendMessage = async (text: string) => {
    const userContent = text.trim();
    if (!userContent) return;
    setInput('');
    setLoading(true);

    // Optimistically add the user message to UI
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sender: 'user',
      content: userContent,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const newMessages = await chatService.sendMessage(userContent);
      setMessages(prev => {
        const withoutTemp = prev.filter(m => m.id !== tempUserMsg.id);
        const existingIds = new Set(withoutTemp.map(m => m.id));
        return [...withoutTemp, ...newMessages.filter(m => !existingIds.has(m.id))];
      });
    } catch (error) {
      console.error(error);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'bot',
          content: '⚠️ Unable to reach DevAI Companion at this moment. Please try again.',
          created_at: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    sendMessage(input);
  };

  const inner = (
    <Card className={`glass-card flex flex-col border border-purple-500/25 shadow-xl transition-all duration-300 ${
      fullscreen ? 'w-full h-full max-w-4xl rounded-3xl' : embedded ? 'h-full rounded-2xl border-none shadow-none bg-transparent' : `${heightClass} rounded-3xl`
    }`}>
      {/* Header */}
      <CardHeader className={`py-3 px-5 border-b border-border/60 bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-transparent shrink-0 ${embedded ? 'rounded-t-2xl' : 'rounded-t-3xl'}`}>
        <div className="flex items-center justify-between">
          <span className="text-sm font-black flex items-center gap-2 text-foreground">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            DevAI Companion
          </span>
          {!embedded && (
            <button
              onClick={() => setFullscreen(f => !f)}
              className="p-1.5 rounded-xl hover:bg-purple-500/10 text-muted-foreground hover:text-purple-600 transition-colors cursor-pointer"
              title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 custom-scroll">
        {messages.length === 0 && !loading && (
          <div className="text-center text-muted-foreground text-xs sm:text-sm py-10 flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-1">
              <Bot className="w-6 h-6" />
            </div>
            <p className="font-bold text-foreground">How can I assist your coding today?</p>
            <p className="text-xs max-w-xs">{initialQuery ? 'Asking AI about this topic...' : 'Ask about frameworks, tool comparisons, or debugging tips!'}</p>
          </div>
        )}
        {messages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
              msg.sender === 'user'
                ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white'
                : 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
            }`}>
              {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs sm:text-sm leading-relaxed shadow-sm ${
              msg.sender === 'user'
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-tr-none'
                : 'bg-card border border-border/70 text-foreground rounded-tl-none'
            }`}>
              {msg.sender === 'user' ? (
                <span>{msg.content}</span>
              ) : (
                <div className="prose prose-sm dark:prose-invert max-w-none leading-relaxed text-xs sm:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="px-4 py-3 rounded-2xl bg-card border border-border/70 rounded-tl-none flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={endOfMessagesRef} />
      </CardContent>

      {/* Input */}
      <div className="p-3 border-t border-border/60 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask a question or request advice..."
            className="flex-1 bg-card rounded-2xl px-4 py-2.5 text-xs sm:text-sm border border-border/70 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-2xl shrink-0 h-10 w-10 shadow-md shadow-purple-500/25"
            disabled={!input.trim() || loading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </Card>
  );

  // Embedded mode — just render inline
  if (embedded) return inner;

  return (
    <>
      {!fullscreen && inner}

      <AnimatePresence>
        {fullscreen && (
          <motion.div
            className="widget-fullscreen-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={e => { if (e.target === e.currentTarget) setFullscreen(false); }}
          >
            <motion.div
              className="w-full h-full max-w-4xl"
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            >
              {inner}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
