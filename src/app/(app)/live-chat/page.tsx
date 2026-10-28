
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppData } from '@/hooks/use-app-data';
import type { ChatMessage } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Star } from 'lucide-react';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { initialData } from '@/lib/constants';

// Helper to format date as IST
const formatInIST = (dateString: string, formatString: string) => {
  try {
    const date = parseISO(dateString);
    return formatInTimeZone(date, 'Asia/Kolkata', formatString);
  } catch (e) {
    // Fallback for any invalid date strings
    return dateString;
  }
}

function FeedbackSection({ onFeedbackSubmit }: { onFeedbackSubmit: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);

  const handleSubmit = () => {
    if (rating > 0) {
      onFeedbackSubmit();
    }
  };

  return (
    <div className="bg-background rounded-lg p-4 mt-4 text-center border">
      <h3 className="font-semibold mb-2">Rate your experience</h3>
      <div className="flex justify-center gap-2 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              "h-8 w-8 cursor-pointer text-yellow-400 transition-all",
              (hoverRating || rating) >= star ? "fill-yellow-400" : ""
            )}
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
          />
        ))}
      </div>
      {rating > 0 && (
         <Button onClick={handleSubmit}>Submit Feedback</Button>
      )}
    </div>
  )
}

export default function LiveChatPage() {
  const router = useRouter();
  const { appData, setAppData } = useAppData();
  const [newMessage, setNewMessage] = useState('');
  const [isChatClosed, setIsChatClosed] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if the chat is already closed based on the last message
    const lastMessage = appData.chatMessages[appData.chatMessages.length - 1];
    if (lastMessage?.sender === 'system' && lastMessage.content.includes("ended")) {
      setIsChatClosed(true);
    }
  }, [appData.chatMessages]);


  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [appData.chatMessages, isChatClosed]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || isChatClosed) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
    };
    
    // Simulate agent response
    const agentResponse: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        sender: 'agent',
        content: "Thanks for reaching out. Please give me a moment to look into this.",
        timestamp: new Date(Date.now() + 2000).toISOString(),
    }
    
    // Simulate chat ending
    const closingMessage: ChatMessage = {
        id: `msg_${Date.now() + 2}`,
        sender: 'system',
        content: 'The chat has ended.',
        timestamp: new Date(Date.now() + 4000).toISOString(),
    }

    const updatedChatMessages = [...appData.chatMessages, userMessage];

    setAppData({
      ...appData,
      chatMessages: updatedChatMessages,
    });
    setNewMessage('');
    
    // Add agent response after a delay
    setTimeout(() => {
        const intermediateMessages = [...updatedChatMessages, agentResponse];
        setAppData(prev => ({ ...prev, chatMessages: intermediateMessages }));

        // Close chat after agent response
        setTimeout(() => {
            setAppData(prev => ({ ...prev, chatMessages: [...intermediateMessages, closingMessage] }));
            setIsChatClosed(true);
        }, 2000);

    }, 1500);

  };
  
  const handleFeedbackSubmit = () => {
    setFeedbackSubmitted(true);
    toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
    });
  };

  const handleStartNewChat = () => {
    setAppData({
      ...appData,
      chatMessages: initialData.chatMessages, // Reset to initial messages
    });
    setIsChatClosed(false);
    setFeedbackSubmitted(false);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-secondary">
      <header className="bg-primary text-primary-foreground p-4 flex items-center gap-4 sticky top-0 z-10">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 -ml-2 text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
          onClick={() => router.back()}
        >
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">Live Chat</h1>
      </header>

      <ScrollArea className="flex-1" viewportRef={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {appData.chatMessages.map((message) => (
            <div
              key={message.id}
              className={cn('flex items-end gap-2', {
                'justify-end': message.sender === 'user',
                'justify-start': message.sender === 'agent',
                'justify-center': message.sender === 'system',
              })}
            >
              {message.sender === 'system' ? (
                <div className="text-center text-xs text-muted-foreground bg-background rounded-full px-3 py-1 my-2">
                    {message.content}
                </div>
              ) : (
                <div className="max-w-[75%]">
                    <div
                    className={cn('p-3 rounded-lg', {
                        'bg-primary text-primary-foreground rounded-br-none': message.sender === 'user',
                        'bg-background text-foreground rounded-bl-none': message.sender === 'agent',
                    })}
                    >
                    <p className="text-sm">{message.content}</p>
                    </div>
                    <p className={cn("text-xs text-muted-foreground mt-1", {
                        'text-right': message.sender === 'user',
                        'text-left': message.sender === 'agent'
                    })}>
                        {formatInIST(message.timestamp, 'dd MMM, hh:mm a')}
                    </p>
                </div>
              )}
            </div>
          ))}
          {isChatClosed && !feedbackSubmitted && (
            <FeedbackSection onFeedbackSubmit={handleFeedbackSubmit} />
          )}
          {feedbackSubmitted && (
            <div className="text-center p-4">
                <p className="text-sm text-green-600 font-semibold p-4 bg-green-100 rounded-lg mb-4">
                    Thank you for your feedback!
                </p>
                <Button variant="outline" onClick={handleStartNewChat}>
                    Start New Chat
                </Button>
            </div>
          )}
        </div>
      </ScrollArea>

      <footer className="p-4 bg-background border-t sticky bottom-0">
        <div className="flex items-center gap-2">
          <Input
            placeholder={isChatClosed ? "Chat has ended" : "Start chat"}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            className="h-12"
            disabled={isChatClosed}
          />
          <Button size="icon" className="h-12 w-12 shrink-0 rounded-full" onClick={handleSendMessage} disabled={isChatClosed}>
            <Send />
          </Button>
        </div>
      </footer>
    </div>
  );
}
