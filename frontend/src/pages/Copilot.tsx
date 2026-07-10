import React, { useState } from 'react';
import { Sparkles, Sliders, Send, User } from 'lucide-react';

interface ChatMessage {
  sender: 'USER' | 'AI';
  text: string;
}

export default function Copilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { sender: 'AI', text: 'Hello, I am the PropX AI Copilot. I analyze customer conversations, score buying intents, and draft automated replies. How can I help you manage your real estate pipeline today?' },
  ]);

  const [inputVal, setInputVal] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('You are an enterprise real estate advisor at PropX. Qualify leads by analyzing their budget, timeline, and layout suitability.');
  const [temperature, setTemperature] = useState(0.7);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = inputVal;
    setMessages(prev => [...prev, { sender: 'USER', text: userMsg }]);
    setInputVal('');

    // Generate smart mock answers based on terms typed
    setTimeout(() => {
      let aiText = "I have qualified the requested logs. The analysis indicates active buying patterns.";
      if (userMsg.toLowerCase().includes('rashid') || userMsg.toLowerCase().includes('mansoori')) {
        aiText = "Rashid Al-Mansoori: AI Intent score HOT. Budget segment ₹4.5 Cr. Prefers 3 BHK penthouse layout configurations. Timeline immediate. Next action suggested: Send payment schedule sheet.";
      } else if (userMsg.toLowerCase().includes('emma') || userMsg.toLowerCase().includes('johnson')) {
        aiText = "Emma Johnson: AI Intent score WARM. Budget segment ₹1.2 Cr. Prefers 2 BHK flats. Timeline 3-6 months. Next action suggested: Follow up on tomorrow site visit confirmation.";
      } else if (userMsg.toLowerCase().includes('skyline') || userMsg.toLowerCase().includes('project')) {
        aiText = "Project Skyline analytics check: Average lead budget ₹4.5 Crores. High buyer demand detected for 3 BHK layouts (AI score 91%).";
      }

      setMessages(prev => [...prev, { sender: 'AI', text: aiText }]);
    }, 800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center space-x-2.5">
            <Sparkles className="text-primary animate-pulse" size={26} />
            <span>AI Copilot Console</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-semibold">
            Fine-tune system agents prompt triggers, model parameter adjustments, and playground chats.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Settings Panel */}
        <div className="rounded-2xl border bg-card p-5 shadow-sm space-y-4 h-fit text-left">
          <div className="flex items-center space-x-2 border-b pb-3 text-foreground font-bold">
            <Sliders size={16} className="text-primary" />
            <span>Agent Parameters</span>
          </div>

          <div className="space-y-4 text-xs font-semibold text-muted-foreground">
            {/* System Prompt */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">System Persona Prompt</label>
              <textarea
                value={systemPrompt}
                onChange={e => setSystemPrompt(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-xl bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent font-medium transition-all resize-none leading-normal"
              />
            </div>

            {/* Temperature Slider */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-[10px] uppercase font-black">
                <span>Creativity (Temp)</span>
                <span className="text-primary">{temperature}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={e => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-primary h-1.5 bg-muted rounded-lg appearance-none cursor-pointer"
              />
            </div>

            {/* Campaign Options */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-black tracking-wider text-muted-foreground block">Campaign Strategy</label>
              <select className="w-full border rounded-xl px-2.5 py-2 bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-primary font-bold">
                <option>Active Inbound Nurturing</option>
                <option>Outbound Lead Reactivation</option>
                <option>Site Visit Confirmation Flow</option>
              </select>
            </div>
          </div>
        </div>

        {/* Chat Playground Column */}
        <div className="lg:col-span-2 rounded-2xl border bg-card p-5 shadow-sm flex flex-col justify-between h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b pb-3.5 shrink-0 text-left">
            <div>
              <h3 className="text-sm font-bold text-foreground">Playground Console</h3>
              <p className="text-[9px] text-muted-foreground mt-0.5 font-bold">Inquire about Rashid, Emma, or Skyline demand patterns.</p>
            </div>
            <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wide bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span>Model: Claude 3.5 Sonnet</span>
            </span>
          </div>

          {/* Messages Feed list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left">
            {messages.map((msg, idx) => {
              const isAi = msg.sender === 'AI';
              return (
                <div key={idx} className={`flex items-start space-x-3 ${isAi ? 'justify-start' : 'justify-end'}`}>
                  {isAi && (
                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
                      <Sparkles size={13} className="animate-pulse" />
                    </div>
                  )}
                  <div className={`p-3 rounded-2xl text-[11px] font-medium leading-relaxed shadow-sm max-w-[75%] ${
                    isAi ? 'bg-muted/20 border text-foreground rounded-tl-none' : 'bg-primary text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                  {!isAi && (
                    <div className="w-7 h-7 rounded-full bg-indigo-500/15 text-indigo-600 flex items-center justify-center font-bold shrink-0">
                      <User size={13} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Input Form */}
          <form onSubmit={handleSend} className="pt-3 border-t flex items-center space-x-3 shrink-0">
            <input
              type="text"
              placeholder="Ask Copilot about leads scoring or projects status..."
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              className="flex-1 px-4 py-2.5 border rounded-full bg-background focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all text-xs font-semibold"
            />
            <button
              type="submit"
              className="p-3.5 rounded-full bg-primary text-white hover:bg-primary/95 transition-all shadow-md shrink-0 flex items-center justify-center"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
