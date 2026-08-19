import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import OpenAI from 'openai';
import { MessageType } from '@prisma/client';

// Initialize the OpenAI client.
// By default, this connects to OpenAI, but you can easily point it to Groq 
// by setting OPENAI_BASE_URL="https://api.groq.com/openai/v1" in your .env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key', // Ensure it doesn't crash if env var is missing during build
  baseURL: process.env.OPENAI_BASE_URL,
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspaceId = (await params).id;
    const body = await request.json().catch(() => ({}));
    const userDraft = body.draft;
    
    // 1. Fetch the workspace and its memory
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { memory: true },
    });

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // 2. Fetch the message history for context
    const messages = await prisma.message.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });

    if (messages.length === 0) {
      return NextResponse.json({ error: 'No messages found to reply to.' }, { status: 400 });
    }

    // 3. Build the System Prompt from Workspace Memory
    let systemPrompt = `You are an AI Email Reply Assistant. Your job is to draft a professional, contextual reply to the most recent email in the conversation history provided.`;
    
    if (userDraft) {
      systemPrompt = `You are an AI Email Reply Assistant. Your job is to take the user's rough draft and polish it into a highly professional email reply that matches the context of the conversation history provided. 
      
User's Draft to polish: "${userDraft}"`;
    }
    
    if (workspace.memory && workspace.memory.summary) {
      const preferences = workspace.memory.summary as any;
      systemPrompt += `\n\nUser Preferences to follow strictly:`;
      if (preferences.tone) systemPrompt += `\n- Tone: ${preferences.tone}`;
      if (preferences.length) systemPrompt += `\n- Length: ${preferences.length}`;
      if (preferences.signature) systemPrompt += `\n- Signature: ${preferences.signature}`;
    }

    // 4. Format the chat history for the AI
    const aiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
    ];

    messages.forEach(msg => {
      // If the message is RECEIVED, it was from the client (user in AI terms)
      // If the message is SENT, it was from us (assistant in AI terms)
      aiMessages.push({
        role: msg.type === 'RECEIVED' ? 'user' : 'assistant',
        content: msg.content,
      });
    });

    // 5. Call the LLM
    const response = await openai.chat.completions.create({
      model: process.env.AI_MODEL || 'llama-3.1-8b-instant',
      messages: aiMessages,
      temperature: 0.7,
    });

    const generatedText = response.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('AI returned an empty response');
    }

    // 6. Return the generated reply directly to the frontend WITHOUT saving it
    return NextResponse.json({ content: generatedText }, { status: 200 });

  } catch (error: any) {
    console.error('Error generating AI reply:', error);
    return NextResponse.json(
      { error: 'Failed to generate reply', details: error.message },
      { status: 500 }
    );
  }
}
