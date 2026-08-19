"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GlassCard } from '@/components/ui/glass-card';
import { motion } from 'framer-motion';
import { Plus, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Workspace } from '@prisma/client';

export default function Dashboard() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    fetch('/api/workspaces')
      .then(res => res.json())
      .then(data => {
        setWorkspaces(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;
    
    setIsCreating(true);
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName }),
      });
      const data = await res.json();
      router.push(`/workspace/${data.id}`);
    } catch (err) {
      console.error(err);
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-12">
      {/* Header */}
      <div className="flex flex-col gap-4 max-w-2xl">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl md:text-5xl font-bold tracking-tight"
        >
          Supercharge your <br />
          <span className="text-gradient">Email Workflow</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground text-lg"
        >
          Create a workspace to drop in long email threads and let AI craft the perfect contextual reply for you.
        </motion.p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Create New Card */}
        <GlassCard glow className="border-primary/30 flex flex-col justify-center min-h-[220px]">
          <form onSubmit={handleCreate} className="flex flex-col h-full justify-between gap-4">
            <div>
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <Sparkles className="text-primary w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg mb-2">New Workspace</h3>
              <input 
                type="text" 
                placeholder="e.g. Acme Corp Project..."
                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                value={newWorkspaceName}
                onChange={e => setNewWorkspaceName(e.target.value)}
                disabled={isCreating}
              />
            </div>
            
            <button 
              type="submit"
              disabled={isCreating || !newWorkspaceName.trim()}
              className="w-full bg-primary hover:bg-primary/90 text-white font-medium rounded-lg py-2.5 text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              Create Workspace
            </button>
          </form>
        </GlassCard>

        {/* Existing Workspaces */}
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          workspaces.map((workspace, idx) => (
            <GlassCard 
              key={workspace.id} 
              className="group cursor-pointer min-h-[220px] flex flex-col justify-between"
              onClick={() => router.push(`/workspace/${workspace.id}`)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (idx + 1) }}
            >
              <div>
                <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                  {workspace.name}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {workspace.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="flex items-center text-sm text-muted-foreground font-medium group-hover:text-primary transition-colors">
                Open Workspace <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </div>
            </GlassCard>
          ))
        )}

      </div>
    </div>
  );
}
