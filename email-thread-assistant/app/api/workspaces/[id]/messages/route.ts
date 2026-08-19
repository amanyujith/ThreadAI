import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { MessageType } from '@prisma/client';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspaceId = (await params).id;
    const messages = await prisma.message.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const workspaceId = (await params).id;
    const body = await request.json();
    const { content, type, sender, isAiGenerated } = body;

    if (!content || !type) {
      return NextResponse.json({ error: 'Content and type are required' }, { status: 400 });
    }

    if (!Object.values(MessageType).includes(type)) {
      return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        content,
        type,
        sender,
        isAiGenerated: isAiGenerated || false,
        workspaceId,
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error('Error creating message:', error);
    return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
  }
}
