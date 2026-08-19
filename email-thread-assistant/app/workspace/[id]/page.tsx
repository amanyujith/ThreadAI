"use client";

import { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChatBubble } from '@/components/ui/chat-bubble';
import { GlassCard } from '@/components/ui/glass-card';
import { MessageType } from '@prisma/client';
import { Sparkles, ArrowLeft, Loader2, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WorkspaceChat({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  
  const [messages, setMessages] = useState<any[]>([]);
  const [workspace, setWorkspace] = useState<any>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [pendingAiDraft, setPendingAiDraft] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/workspaces/${id}/messages`);
      const data = await res.json();
      setMessages(data);
      scrollToBottom();
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    // Fetch Workspace Info
    fetch(`/api/workspaces/${id}`)
      .then(res => res.json())
      .then(data => setWorkspace(data))
      .catch(console.error);

    fetchMessages();
  }, [id]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handlePasteEmail = async (type: MessageType) => {
    if (!inputValue.trim()) return;

    setIsSending(true);
    try {
      await fetch(`/api/workspaces/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: inputValue,
          type: type,
        }),
      });
      setInputValue('');
      await fetchMessages();
    } catch (error) {
      console.error('Failed to save message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleGenerateReply = async (draft?: string) => {
    setIsGenerating(true);
    try {
      const res = await fetch(`/api/workspaces/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft ? { draft } : {}),
      });
      const data = await res.json();
      setPendingAiDraft(data.content);
      if (draft) setInputValue('');
      scrollToBottom();
    } catch (error) {
      console.error('Failed to generate reply:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!pendingAiDraft) return;
    setIsSending(true);
    try {
      await fetch(`/api/workspaces/${id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: pendingAiDraft,
          type: MessageType.SENT,
          isAiGenerated: true,
        }),
      });
      setPendingAiDraft(null);
      await fetchMessages();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSending(false);
    }
  };

  if (!workspace) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push('/')}
            className="w-10 h-10 rounded-full glass-panel flex items-center justify-center hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">{workspace.name}</h1>
            <p className="text-sm text-muted-foreground">Workspace</p>
          </div>
        </div>
        
        <button 
          onClick={() => handleGenerateReply()}
          disabled={isGenerating || messages.length === 0}
          className="bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white px-6 py-2.5 rounded-full font-medium transition-all shadow-lg shadow-primary/20 flex items-center gap-2 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {isGenerating ? 'Drafting...' : 'Generate from Scratch'}
        </button>
      </div>

      {/* Chat Area */}
      <GlassCard className="flex-1 flex flex-col mb-6 overflow-hidden p-0 relative border-white/5">
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-50">
              <Sparkles className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">No messages yet</h3>
              <p className="text-sm">Paste an incoming email thread below to give the AI context, then click Generate AI Reply.</p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <ChatBubble key={msg.id || idx} message={msg} />
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </GlassCard>

      {/* Input Area */}
      {pendingAiDraft !== null ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 mb-1 text-primary">
            <Sparkles className="w-4 h-4" />
            <span className="font-semibold text-sm">Review AI Draft</span>
          </div>
          <textarea
            value={pendingAiDraft}
            onChange={(e) => setPendingAiDraft(e.target.value)}
            className="w-full glass-panel border-primary/30 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary transition-colors resize-none min-h-[150px] shadow-lg shadow-primary/5"
          />
          <div className="flex justify-end gap-3">
            <button 
              onClick={() => setPendingAiDraft(null)}
              className="px-5 py-2 hover:bg-white/5 rounded-lg text-sm font-medium transition-colors"
            >
              Discard
            </button>
            <button 
              onClick={handleSaveDraft}
              disabled={isSending || !pendingAiDraft.trim()}
              className="px-6 py-2 bg-gradient-to-r from-primary to-accent hover:opacity-90 text-white rounded-lg flex items-center justify-center transition-all disabled:opacity-50 text-sm font-medium shadow-lg shadow-primary/20"
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm & Save'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Paste historical emails to build context... OR type a rough draft here for the AI to polish."
            className="w-full glass-panel border-white/10 rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-primary/50 transition-colors resize-none min-h-[100px]"
          />
          
          <div className="flex justify-between items-center gap-4">
            <div className="flex gap-2">
              <button 
                type="button"
                onClick={() => handlePasteEmail(MessageType.RECEIVED)}
                disabled={isSending || !inputValue.trim()}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-white/10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 text-xs font-medium gap-2"
              >
                {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowDownLeft className="w-3 h-3 text-primary" />}
                Add Received Email
              </button>
              <button 
                type="button"
                onClick={() => handlePasteEmail(MessageType.SENT)}
                disabled={isSending || !inputValue.trim()}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-white/10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 text-xs font-medium gap-2"
              >
                {isSending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowUpRight className="w-3 h-3 text-accent" />}
                Add Sent Email
              </button>
            </div>

            <button 
              type="button"
              onClick={() => handleGenerateReply(inputValue)}
              disabled={isGenerating || !inputValue.trim()}
              className="px-5 py-2 bg-gradient-to-r from-primary/90 to-accent/90 hover:opacity-100 text-white border border-white/10 rounded-lg flex items-center justify-center transition-colors disabled:opacity-50 text-xs font-medium gap-2 shadow-lg shadow-primary/20"
            >
              {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
              Polish My Draft
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
