import React from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { Sparkles, User } from 'lucide-react';
import { MessageType } from '@prisma/client';

interface ChatBubbleProps {
  message: {
    id: string;
    content: string;
    type: MessageType;
    isAiGenerated: boolean;
    createdAt: string | Date;
  };
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isAI = message.isAiGenerated;
  const isSent = message.type === 'SENT';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex w-full ${isSent ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`flex max-w-[80%] gap-3 ${isSent ? 'flex-row-reverse' : 'flex-row'}`}>
        
        {/* Avatar */}
        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
          isAI 
            ? 'bg-gradient-to-tr from-primary to-accent shadow-lg shadow-primary/20' 
            : 'bg-secondary border border-white/10'
        }`}>
          {isAI ? <Sparkles className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-muted-foreground" />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isSent ? 'items-end' : 'items-start'}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-muted-foreground">
              {isAI ? 'ThreadAI' : 'Client'}
            </span>
            <span className="text-[10px] text-muted-foreground/70">
              {format(new Date(message.createdAt), 'h:mm a')}
            </span>
          </div>

          <div className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isSent
              ? 'bg-primary/10 border border-primary/20 text-foreground rounded-tr-sm'
              : 'glass-panel rounded-tl-sm'
          }`}>
            {message.content}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
