/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, ChevronRight, Send, ShieldCheck, User, Sparkles } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

// --- TypingMessages Component ---
const TypingMessages = () => {
  const messages = ["How do I register?", "Check your status.", "Find your booth."];
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const message = messages[currentMessageIndex];
    const typingSpeed = isDeleting ? 50 : 100;

    const timeout = setTimeout(() => {
      if (!isDeleting && currentText === message) {
        // Pause before deleting
        setTimeout(() => setIsDeleting(true), 2000);
      } else if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setCurrentMessageIndex((prev) => (prev + 1) % messages.length);
      } else {
        const nextText = isDeleting
          ? message.substring(0, currentText.length - 1)
          : message.substring(0, currentText.length + 1);
        setCurrentText(nextText);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, isDeleting, currentMessageIndex, messages]);

  return (
    <div className="absolute left-[48.5%] md:left-[47.5%] lg:left-[48.5%] -translate-x-1/2 bottom-[32%] z-30 w-[130px] flex flex-col items-start text-left">
      <div className="bg-[#E2E4D4]/40 p-2 rounded backdrop-blur-sm border border-black/5">
        <p className="font-nokia text-[#2A3616] text-[10px] sm:text-[12px] leading-tight break-words min-h-[1.5em] uppercase tracking-tighter">
          {currentText}
          <motion.span
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
            className="inline-block w-1 h-3 bg-[#2A3616] ml-1 align-middle opacity-80"
          />
        </p>
      </div>
    </div>
  );
};

// --- Navbar Component ---
const Navbar = () => {
  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
      <nav className="pointer-events-auto backdrop-blur-md rounded-full bg-transparent border border-black/10 px-8 py-3 flex items-center justify-between">
        <div className="font-instrument font-medium text-[20px] md:text-[24px] tracking-tight text-[#1a1a1a]">
          Election Assistant
        </div>
        
        <div className="hidden md:flex items-center gap-10">
          {["Dashboard", "Analysis", "Reports", "Settings"].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="font-sans text-[14px] text-[#1a1a1a] hover:opacity-50 transition-opacity"
            >
              {item}
            </a>
          ))}
        </div>

        <button className="group relative bg-[#0871E7] rounded-full px-6 py-2.5 text-white font-sans text-[14px] shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline-1 outline-[#0871E7] -outline-offset-1 overflow-hidden transition-all active:scale-95 cursor-pointer">
          <div className="absolute w-[80%] h-4 left-[10%] top-[1px] bg-gradient-to-b from-[#DEF0FC] to-transparent rounded-[12px] transition-transform duration-300 group-hover:scale-x-105" />
          <span className="relative z-10">Get Started</span>
        </button>
      </nav>
    </div>
  );
};

// --- Hero Component ---
const Hero = () => {
  return (
    <section className="relative min-h-screen bg-[#F3F4ED] flex flex-col items-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        >
          <source 
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260427_054418_a6d194f0-ac86-4df9-abe5-ded73e596d7c.mp4" 
            type="video/mp4" 
          />
        </video>
        <div className="absolute inset-0 bg-white/10 pointer-events-none" />
      </div>

      {/* Typing Messages on Phone Screen */}
      <TypingMessages />
    </section>
  );
};

// --- Election Assistant Chat Component ---
const ElectionAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I am your Election Process Education Assistant. How can I help you navigate the democratic process today?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    const userMsg = { role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    
    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMsg].map(m => ({ 
          role: m.role as 'user' | 'model', 
          parts: [{ text: m.content }] 
        })),
        config: {
          systemInstruction: `You are the dot. Election Process Education Assistant. 
          Your goal is to educate users about voting, registration, and electoral procedures with absolute precision and clarity.
          Maintain a professional, trustworthy, and non-partisan tone.
          If asked about specific political candidates or opinions, steer the conversation back to the mechanics of the process.
          Be concise but helpful. Use simple formatting (bullet points) if needed.
          Always emphasize the importance of verified sources.`
        }
      });
      
      const aiText = response.text || "I apologize, I encountered an error processing your request. Please try again.";
      setMessages(prev => [...prev, { role: 'assistant', content: aiText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Our systems are momentarily busy. Please ensure your query is related to the election process." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <motion.button 
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 z-50 bg-[#0871E7] text-white p-4 rounded-full shadow-[0_8px_30px_rgb(8,113,231,0.4)] border border-white/20 hover:bg-[#0658b4] transition-colors cursor-pointer flex items-center gap-2 group"
        aria-label="Election Assistant Chat"
      >
        <ShieldCheck size={24} className="group-hover:rotate-12 transition-transform" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 font-sans text-sm font-medium whitespace-nowrap">
          Election Guide
        </span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 20, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-24 right-8 z-50 w-[350px] sm:w-[420px] h-[600px] max-h-[80vh] bg-white rounded-[32px] shadow-[0_32px_64px_rgba(0,0,0,0.12)] border border-black/5 flex flex-col overflow-hidden outline-1 outline-black/5"
          >
            {/* Header */}
            <div className="bg-[#0871E7] p-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ShieldCheck size={120} />
              </div>
              <div className="relative z-10 flex items-center justify-between">
                <div>
                  <h3 className="font-instrument text-2xl leading-none font-medium">Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-[10px] tracking-widest uppercase opacity-70 font-sans">System Online</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors backdrop-blur-sm"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#F9F9F7]"
            >
              {messages.map((m, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={`flex items-start gap-3 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-black/5 ${
                    m.role === 'user' ? 'bg-[#0871E7] text-white' : 'bg-white text-[#1a1a1a] shadow-sm'
                  }`}>
                    {m.role === 'user' ? <User size={14} /> : <ShieldCheck size={14} />}
                  </div>
                  <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-sans leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-[#0871E7] text-white rounded-tr-none' 
                      : 'bg-white text-[#1a1a1a] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-black/5 rounded-tl-none'
                  }`}>
                    {m.content}
                  </div>
                </motion.div>
              ))}
              
              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-sm">
                    <Sparkles size={14} className="text-[#0871E7] animate-pulse" />
                  </div>
                  <div className="bg-white px-4 py-3 rounded-2xl text-[#1a1a1a]/40 flex gap-1 items-center border border-black/5">
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-current rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-current rounded-full" />
                    <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-current rounded-full" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Interface */}
            <div className="p-6 border-t border-black/5 bg-white">
              <div className="relative group">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask about registration or process..."
                  className="w-full bg-gray-50 rounded-2xl pl-4 pr-14 py-4 text-sm font-sans outline-none focus:ring-1 ring-[#0871E7]/20 border border-black/5 transition-all focus:bg-white"
                />
                <button 
                  disabled={!input.trim() || isTyping}
                  onClick={handleSend}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#0871E7] text-white p-2.5 rounded-xl hover:bg-[#0658b4] transition-all disabled:opacity-30 disabled:scale-95 group-focus-within:scale-105"
                >
                  <Send size={18} />
                </button>
              </div>
              <p className="text-[10px] text-center mt-4 text-[#1a1a1a]/30 font-sans tracking-wide">
                Grounded in official electoral procedures.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// --- Main App Component ---
export default function App() {
  return (
    <main className="relative w-full overflow-x-hidden selection:bg-[#0871E7]/20 selection:text-[#0871E7]">
      <Navbar />
      <Hero />
      
      {/* Election Education Section */}
      <section className="relative z-20 py-24 px-6 bg-white" id="philosophy">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="font-instrument text-[42px] md:text-[54px] leading-tight text-[#1a1a1a] mb-6">
              Empowering every <span className="italic">choice.</span>
            </h2>
            <p className="font-sans text-[16px] text-[#1a1a1a]/60 leading-relaxed mb-8">
              Democracy works best when we all understand our part. The Election Process Education Assistant simplifies complex electoral procedures into clear, actionable steps.
            </p>
            <div className="space-y-4">
              {[
                "Step-by-Step Registration Guide",
                "Personalized Voting Timelines",
                "Real-time Clarity on Rules & Ethics",
                "Interactive AI-Driven FAQ"
              ].map((feature, i) => (
                <div key={i} className="flex items-center gap-3 font-sans text-sm text-[#1a1a1a]">
                  <div className="w-5 h-5 rounded-full bg-[#0871E7] flex items-center justify-center text-white scale-75">
                    <ChevronRight size={14} strokeWidth={3} />
                  </div>
                  {feature}
                </div>
              ))}
            </div>
          </div>
          
          <div className="bg-[#F3F4ED] rounded-[40px] p-8 aspect-square flex flex-col justify-center border border-black/5 relative overflow-hidden">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-[#0871E7]/10 blur-[100px] rounded-full" />
             <div className="relative z-10 space-y-6">
               <div className="bg-white p-5 rounded-3xl shadow-sm border border-black/5 rotate-[-2deg] mr-8">
                 <p className="text-xs font-sans text-[#1a1a1a]/40 mb-1">Status</p>
                 <p className="text-sm font-sans font-medium text-[#1a1a1a]">Voter Registration Open</p>
               </div>
               <div className="bg-white p-5 rounded-3xl shadow-sm border border-black/5 rotate-[1deg] ml-8">
                 <p className="text-xs font-sans text-[#1a1a1a]/40 mb-1">Requirement</p>
                 <p className="text-sm font-sans font-medium text-[#1a1a1a]">Valid ID Verification Required</p>
               </div>
               <div className="bg-[#0871E7] p-5 rounded-3xl shadow-xl rotate-[-1deg] mr-4 text-white">
                 <p className="text-xs opacity-70 mb-1">Action</p>
                 <p className="text-sm font-medium">Chat with AI Guide</p>
               </div>
             </div>
          </div>
        </div>
      </section>

      {/* Trust & Tribe Section Placeholder */}
      <section className="bg-[#F3F4ED] py-24 px-6 border-t border-black/5">
        <div className="max-w-5xl mx-auto text-center">
            <h3 className="font-instrument text-[32px] md:text-[40px] text-[#1a1a1a] mb-12">Building a responsible tribe.</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                {[
                  { title: "Trust", desc: "Reliable electoral data sources." },
                  { title: "Access", desc: "Inclusive design for all voters." },
                  { title: "Clarity", desc: "No more confusing legal jargon." }
                ].map((item, i) => (
                  <div key={i} className="text-left p-6 bg-white rounded-3xl border border-black/5">
                    <p className="font-instrument text-2xl mb-2 text-[#1a1a1a]">{item.title}</p>
                    <p className="font-sans text-sm text-[#1a1a1a]/60 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
            </div>
        </div>
      </section>

      <footer className="py-12 px-6 flex flex-col items-center gap-4 border-t border-black/5">
        <div className="font-sans text-[10px] tracking-widest uppercase opacity-40">
          EST. 2024 — CONNECTION THROUGH STILLNESS
        </div>
        <div className="font-sans text-[10px] text-[#1a1a1a]/40">
          © 2026 dot. Education Project. All rights reserved. Built with precision.
        </div>
      </footer>

      <ElectionAssistant />
    </main>
  );
}
