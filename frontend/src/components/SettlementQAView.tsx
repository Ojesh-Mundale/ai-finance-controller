import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { api } from '../api/client';
import type { SettlementQAResponse } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  confidence?: number;
  sources?: string[];
  relatedTransactions?: string[];
}

const SUGGESTIONS = [
  'What is the total settlement amount today?',
  'Show unmatched transactions',
  'What is the cash position forecast?',
  'List all high severity exceptions',
];

export default function SettlementQAView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (question: string) => {
    if (!question.trim() || loading) return;
    const q = question.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res: SettlementQAResponse = await api.askSettlementQA({ question: q });
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: res.answer,
        confidence: res.confidence,
        sources: res.sources,
        relatedTransactions: res.relatedTransactions,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I could not process your question. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    send(input);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] animate-fade-in">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Settlement Q&A</h2>
        <p className="text-text-muted text-sm mt-0.5">Ask questions about settlements, reconciliations, and cash positions</p>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent-blue/10 flex items-center justify-center mb-4">
              <Bot className="w-8 h-8 text-accent-blue" />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-1">Settlement Assistant</h3>
            <p className="text-text-muted text-sm max-w-md">Ask anything about your financial data — settlements, reconciliations, exceptions, or cash flow predictions.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4 text-accent-blue" />
              </div>
            )}
            <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-accent-blue text-white rounded-br-md'
                : 'glass-card text-text-primary rounded-bl-md'
            }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.confidence != null && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs text-text-muted">Confidence:</span>
                  <div className="confidence-bar w-20">
                    <div className={`confidence-bar-fill ${msg.confidence >= 0.8 ? 'bg-accent-green' : msg.confidence >= 0.5 ? 'bg-accent-amber' : 'bg-accent-red'}`} style={{ width: `${msg.confidence * 100}%` }} />
                  </div>
                  <span className="text-xs text-text-secondary">{(msg.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-text-muted">Sources: </span>
                  <span className="text-xs text-accent-blue">{msg.sources.join(', ')}</span>
                </div>
              )}
              {msg.relatedTransactions && msg.relatedTransactions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {msg.relatedTransactions.map((ref, j) => (
                    <span key={j} className="inline-flex items-center rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-mono text-text-secondary">{ref}</span>
                  ))}
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0 mt-1">
                <User className="w-4 h-4 text-text-secondary" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/10 flex items-center justify-center shrink-0 mt-1">
              <Bot className="w-4 h-4 text-accent-blue" />
            </div>
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3">
              <LoadingSpinner size="sm" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggested questions */}
      {messages.length === 0 && !loading && (
        <div className="flex flex-wrap gap-2 mt-4">
          {SUGGESTIONS.map(s => (
            <button
              key={s}
              onClick={() => send(s)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-border-subtle rounded-full text-xs text-text-secondary hover:text-text-primary transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="flex gap-2 mt-4">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Ask a question about settlements..."
          disabled={loading}
          className="flex-1 bg-white/5 border border-border-subtle rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-3 bg-accent-blue hover:bg-accent-blue/80 disabled:opacity-40 rounded-xl text-white transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
