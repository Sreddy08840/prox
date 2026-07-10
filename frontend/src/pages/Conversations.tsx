import React, { useState } from 'react';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

interface Chat {
  id: string;
  leadName: string;
  avatarInitials: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  score: 'HOT' | 'WARM' | 'COLD';
  messages: { sender: 'LEAD' | 'AGENT' | 'AI'; text: string; time: string }[];
}

export default function Conversations() {
  const [chats, setChats] = useState<Chat[]>([
    {
      id: '1',
      leadName: 'Rashid Al-Mansoori',
      avatarInitials: 'RA',
      lastMessage: 'I would like to see the floor plan of the 3 BHK penthouse.',
      time: '5m ago',
      unread: true,
      score: 'HOT',
      messages: [
        { sender: 'LEAD', text: 'Hi, I saw the Project Skyline brochures.', time: '2:10 PM' },
        { sender: 'AGENT', text: 'Hello Rashid! Thanks for showing interest. Which configurations are you looking for?', time: '2:12 PM' },
        { sender: 'LEAD', text: 'I would like to see the floor plan of the 3 BHK penthouse.', time: '2:15 PM' },
      ],
    },
    {
      id: '2',
      leadName: 'Emma Johnson',
      avatarInitials: 'EJ',
      lastMessage: 'Is the site visit confirmed for tomorrow?',
      time: '15m ago',
      unread: false,
      score: 'WARM',
      messages: [
        { sender: 'LEAD', text: 'I am interested in buying a flat in Green Valley.', time: '1:30 PM' },
        { sender: 'AI', text: 'Hello Emma, I can help you book a site visit or send pricing sheets. Let me know your availability.', time: '1:31 PM' },
        { sender: 'LEAD', text: 'Is the site visit confirmed for tomorrow?', time: '1:45 PM' },
      ],
    },
    {
      id: '3',
      leadName: 'Ahmed Hassan',
      avatarInitials: 'AH',
      lastMessage: 'Sent the documents for financing pre-approval.',
      time: '2h ago',
      unread: false,
      score: 'HOT',
      messages: [
        { sender: 'AGENT', text: 'Hello Ahmed, did you manage to clear the financing check?', time: '11:00 AM' },
        { sender: 'LEAD', text: 'Yes, sent the documents for financing pre-approval.', time: '11:30 AM' },
      ],
    },
  ]);

  const [activeChatId, setActiveChatId] = useState('1');
  const [typedMessage, setTypedMessage] = useState('');

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const updatedChats = chats.map(c => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          lastMessage: typedMessage,
          time: 'Just now',
          messages: [
            ...c.messages,
            { sender: 'AGENT' as const, text: typedMessage, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ],
        };
      }
      return c;
    });

    setChats(updatedChats);
    setTypedMessage('');
  };

  return (
    <div className="rounded-2xl border bg-card shadow-sm h-[calc(100vh-140px)] overflow-hidden flex flex-col md:flex-row text-xs animate-in fade-in duration-300">
      {/* Chats List Sidebar */}
      <div className="w-full md:w-80 border-r flex flex-col justify-between shrink-0 bg-muted/5">
        <div className="p-4 border-b space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-foreground flex items-center space-x-2">
              <MessageSquare size={16} className="text-primary" />
              <span>Conversations</span>
            </h2>
            <span className="bg-primary/10 text-primary border border-primary/20 text-[9px] font-black px-1.5 py-0.5 rounded-md">
              WhatsApp Active
            </span>
          </div>
        </div>

        {/* List items */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {chats.map(chat => {
            const isActive = chat.id === activeChatId;
            return (
              <div
                key={chat.id}
                onClick={() => {
                  setActiveChatId(chat.id);
                  chat.unread = false;
                }}
                className={`p-3.5 flex items-start space-x-3 cursor-pointer transition-colors relative ${
                  isActive ? 'bg-primary/5 border-l-2 border-primary' : 'hover:bg-muted/10'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black shrink-0 relative">
                  {chat.avatarInitials}
                  {chat.unread && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
                  )}
                </div>

                <div className="flex-1 min-w-0 text-left space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-foreground truncate">{chat.leadName}</span>
                    <span className="text-[9px] text-muted-foreground font-semibold shrink-0">{chat.time}</span>
                  </div>
                  <p className="text-muted-foreground font-medium truncate max-w-[170px] leading-tight">
                    {chat.lastMessage}
                  </p>
                  <div className="pt-1.5 flex items-center space-x-1.5">
                    <span className={`px-1.5 py-0.2 rounded text-[7px] font-black uppercase tracking-wider ${
                      chat.score === 'HOT' ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' :
                      chat.score === 'WARM' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                      'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                    }`}>
                      {chat.score}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Chat Conversation Feed */}
      <div className="flex-1 flex flex-col justify-between bg-card text-left">
        {/* Active Chat Header */}
        <div className="px-5 py-4 border-b flex items-center justify-between bg-muted/5 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black">
              {activeChat.avatarInitials}
            </div>
            <div>
              <h3 className="font-extrabold text-foreground text-sm">{activeChat.leadName}</h3>
              <p className="text-[9px] text-emerald-500 font-bold flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
                <span>Live WhatsApp Session</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide bg-violet-500/10 text-violet-500 border border-violet-500/20">
              <Sparkles size={11} className="animate-pulse" />
              <span>AI Lead Copilot Engaged</span>
            </span>
          </div>
        </div>

        {/* Message Feed bubbles */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {activeChat.messages.map((msg, idx) => {
            const isLead = msg.sender === 'LEAD';
            const isAI = msg.sender === 'AI';
            return (
              <div
                key={idx}
                className={`flex flex-col ${
                  isLead ? 'items-start' : 'items-end'
                }`}
              >
                <div
                  className={`max-w-[70%] p-3.5 rounded-2xl text-[11px] font-semibold leading-relaxed shadow-sm relative ${
                    isLead
                      ? 'bg-muted/20 border text-foreground rounded-tl-none'
                      : isAI
                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-none'
                      : 'bg-primary text-white rounded-tr-none'
                  }`}
                >
                  {isAI && (
                    <div className="flex items-center space-x-1.5 text-[8px] uppercase tracking-wider font-extrabold text-white/80 mb-1 border-b border-white/10 pb-1.5">
                      <Sparkles size={10} className="animate-pulse" />
                      <span>PropX AI Assistant</span>
                    </div>
                  )}
                  <p>{msg.text}</p>
                </div>
                <span className="text-[9px] text-muted-foreground mt-1 font-bold px-1">{msg.time}</span>
              </div>
            );
          })}
        </div>

        {/* Text Area Form Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center space-x-3 shrink-0 bg-muted/5">
          <input
            type="text"
            placeholder="Type a WhatsApp response..."
            value={typedMessage}
            onChange={e => setTypedMessage(e.target.value)}
            className="flex-1 px-4 py-2.5 border rounded-full bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all font-semibold"
          />
          <button
            type="submit"
            className="p-3.5 rounded-full bg-primary text-white hover:bg-primary/95 transition-all shadow-md shrink-0 flex items-center justify-center"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </div>
  );
}
