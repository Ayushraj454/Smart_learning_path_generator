import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import type { ChatMessage, LearningPath } from '../lib/types';
import { Send, User, ChevronLeft, Sparkles, AlertCircle } from 'lucide-react';

interface Props {
  onBack: () => void;
}

export default function TutorChat({ onBack }: Props) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activePaths, setActivePaths] = useState<LearningPath[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const [msgRes, pathsRes] = await Promise.all([
        supabase
          .from('chat_messages')
          .select('*')
          .eq('user_id', profile.id)
          .order('created_at', { ascending: true })
          .limit(50),
        supabase
          .from('learning_paths')
          .select('*, subject:subjects(name)')
          .eq('user_id', profile.id)
          .eq('status', 'active'),
      ]);
      setMessages(msgRes.data ?? []);
      setActivePaths(pathsRes.data ?? []);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !profile || sending) return;
    const content = input.trim();
    setInput('');
    setError('');
    setSending(true);

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      user_id: profile.id,
      learning_path_id: null,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);

    await supabase.from('chat_messages').insert({
      user_id: profile.id,
      role: 'user',
      content,
    });

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tutor`;
      const headers = {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      };

      // Pass the user's active subject context
      const primaryPath = activePaths[0];
      const subjectName = primaryPath
        ? (primaryPath.subject as { name?: string })?.name
        : undefined;

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          user_id: profile.id,
          message: content,
          learning_path_id: primaryPath?.id,
          context: {
            knowledge_level: profile.knowledge_level,
            learning_style: profile.learning_style,
            subject_name: subjectName,
          },
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to get tutor response');
      }

      const data = await res.json();
      const response = data.response;

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        user_id: profile.id,
        learning_path_id: null,
        role: 'assistant',
        content: response,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      console.error('Tutor error:', err);
      setError('Failed to get a response. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const subjectLabel = activePaths[0]
    ? (activePaths[0].subject as { name?: string })?.name
    : null;

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-4 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2 ml-4">
            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="font-semibold text-white text-sm">AI Tutor</h1>
              <p className="text-xs text-emerald-400">
                {subjectLabel ? `Helping with ${subjectLabel}` : 'Always ready to help'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Start a conversation</h3>
              <p className="text-slate-400 text-sm mb-6">
                {subjectLabel
                  ? `Ask me anything about ${subjectLabel} or related topics`
                  : 'Ask me anything about your learning topics'}
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {getSuggestions(subjectLabel).map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => { setInput(suggestion); }}
                    className="px-3 py-1.5 bg-slate-800/80 border border-slate-700/50 rounded-full text-sm text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map(msg => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === 'user'
                      ? 'bg-emerald-500/20 text-emerald-50 rounded-br-md'
                      : 'bg-slate-800/80 text-slate-200 rounded-bl-md border border-slate-700/50'
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-slate-300" />
                  </div>
                )}
              </div>
            ))
          )}
          {sending && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/50 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-3 max-w-3xl mx-auto">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-slate-800/80 backdrop-blur-xl border-t border-slate-700/50 px-4 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Ask your tutor anything..."
            className="flex-1 px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all"
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={sending || !input.trim()}
            className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 transition-all shadow-lg shadow-emerald-500/25"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function getSuggestions(subject: string | null | undefined): string[] {
  if (!subject) {
    return [
      'Explain closures in JavaScript',
      'How do Python decorators work?',
      'What is the chain rule in calculus?',
      'Help me understand async/await',
    ];
  }
  const lower = subject.toLowerCase();
  if (lower.includes('javascript') || lower.includes('web')) {
    return [
      'Explain closures in JavaScript',
      'How does async/await work?',
      'What is the difference between let and const?',
      'How do I debug a TypeError?',
    ];
  }
  if (lower.includes('python')) {
    return [
      'How do Python decorators work?',
      'Explain list comprehensions',
      'What is the difference between __init__ and __new__?',
      'How do generators work?',
    ];
  }
  if (lower.includes('math') || lower.includes('physics')) {
    return [
      'Explain the chain rule in calculus',
      'How do I solve quadratic equations?',
      'What is standard deviation?',
      'Explain eigenvalues and eigenvectors',
    ];
  }
  if (lower.includes('data') || lower.includes('machine learning')) {
    return [
      'What is the difference between supervised and unsupervised learning?',
      'How does gradient descent work?',
      'Explain overfitting and how to prevent it',
      'What is a confusion matrix?',
    ];
  }
  return [
    'Explain the basics of this subject',
    'What are the key concepts I should know?',
    'Give me a practice exercise',
    'What are common mistakes to avoid?',
  ];
}
