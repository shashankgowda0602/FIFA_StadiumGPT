/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Stadium, StadiumGPTMessage } from "../types.js";
import { 
  Bot, 
  Send, 
  Mic, 
  Volume2, 
  VolumeX, 
  ArrowRight, 
  Sparkles, 
  MessageSquare, 
  User, 
  Compass, 
  Maximize2 
} from "lucide-react";

interface ChatbotProps {
  stadium: Stadium;
}

export default function Chatbot({ stadium }: ChatbotProps) {
  const [messages, setMessages] = React.useState<StadiumGPTMessage[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [isListening, setIsListening] = React.useState(false);
  const [voiceEnabled, setVoiceEnabled] = React.useState(true);
  
  const chatEndRef = React.useRef<HTMLDivElement>(null);
  const speechUtteranceRef = React.useRef<SpeechSynthesisUtterance | null>(null);

  // Suggested questions based on context
  const suggestedPrompts = [
    "Which gate has the shortest queue?",
    "Show me where the medical center is.",
    "Do you have vegetarian food options?",
    "How crowded is the stadium right now?",
    "What announcements are active?"
  ];

  // Auto-load welcome message
  React.useEffect(() => {
    setMessages([
      {
        id: "welcome",
        sender: "ai",
        text: `### FIFA Stadium Assistant Online ⚽\n\nHello! I am **StadiumGPT**, your dedicated operational guide for **${stadium.name}** in ${stadium.city}.\n\nI have access to real-time gate wait times, medical stations, parking status, and active emergency bulletins.\n\n*How can I assist your matchday experience today?*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedPrompts: suggestedPrompts
      }
    ]);
    stopSpeaking();
  }, [stadium]);

  // Auto scroll to bottom
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const stopSpeaking = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const speakText = (text: string) => {
    if (!voiceEnabled || !window.speechSynthesis) return;
    
    stopSpeaking();

    // Clean markdown characters for pleasant speech synthesis
    const cleanText = text
      .replace(/###/g, "")
      .replace(/\*\*/g, "")
      .replace(/-\s/g, "")
      .replace(/👉/g, "")
      .replace(/⚠️/g, "Warning:")
      .substring(0, 300); // truncate for concise speech

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    speechUtteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: StadiumGPTMessage = {
      id: `msg-${Date.now()}-user`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue("");
    setIsLoading(true);
    stopSpeaking();

    try {
      const response = await fetch("/api/gemini/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          stadiumId: stadium.id,
          history: messages.slice(-6) // Pass short chat history for context
        })
      });

      if (!response.ok) {
        throw new Error("Chat proxy responded with failure code");
      }

      const data = await response.json();
      
      const aiMsg: StadiumGPTMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      speakText(data.text);
    } catch (err) {
      console.error("Error talking to StadiumGPT:", err);
      const errorMsg: StadiumGPTMessage = {
        id: `msg-${Date.now()}-error`,
        sender: "ai",
        text: "⚠️ **System Communication Issue:** I couldn't reach the stadium operational core. Please verify your GEMINI_API_KEY environment configuration in the Secrets tab.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Web Speech API Voice Recognition
  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not fully supported in your browser. Please try typing your question!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
      stopSpeaking();
    };

    recognition.onresult = (event: any) => {
      const speechToText = event.results[0][0].transcript;
      setInputValue(speechToText);
      setIsListening(false);
      // Auto-trigger message send for a fluid voice interface
      handleSendMessage(speechToText);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  // Elegant micro markdown renderer to keep formatting looking beautiful without third-party module bugs
  const renderMarkdownText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      
      // Match Header 3
      if (trimmed.startsWith("###")) {
        return (
          <h4 key={idx} className="text-sm font-bold text-white mt-3 mb-1.5 flex items-center gap-2 border-b border-white/5 pb-1 font-sans">
            <span className="w-1.5 h-3 bg-[#C5A059] rounded" />
            {trimmed.replace("###", "").trim()}
          </h4>
        );
      }

      // Match List bullets
      if (trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const itemText = trimmed.replace(/^[-*]\s*/, "").trim();
        // Check for bold terms inside lists e.g. **Term**: Details
        const boldParts = itemText.split("**");
        if (boldParts.length >= 3) {
          return (
            <li key={idx} className="ml-4 list-disc text-white/70 text-xs mb-1 leading-relaxed">
              <strong>{boldParts[1]}</strong>
              {boldParts.slice(2).join("")}
            </li>
          );
        }
        return (
          <li key={idx} className="ml-4 list-disc text-white/70 text-xs mb-1 leading-relaxed">
            {itemText}
          </li>
        );
      }

      // Check bold replacements **some bold text**
      const boldParts = trimmed.split("**");
      if (boldParts.length >= 3) {
        return (
          <p key={idx} className="text-white/70 text-xs leading-relaxed mb-2 font-normal">
            {boldParts.map((part, partIdx) => 
              partIdx % 2 === 1 ? <strong key={partIdx} className="text-[#C5A059] font-bold">{part}</strong> : part
            )}
          </p>
        );
      }

      // Regular blank line
      if (trimmed === "") {
        return <div key={idx} className="h-2" />;
      }

      return (
        <p key={idx} className="text-white/70 text-xs leading-relaxed mb-2 font-normal">
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div className="bg-[#14161E]/95 border border-white/10 rounded-xl p-5 backdrop-blur-md shadow-xl flex flex-col h-[520px]" id="chatbot-module-container">
      {/* Chat header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#A8823E] text-black shadow-lg">
            <Bot className="w-5 h-5 animate-pulse" />
          </span>
          <div>
            <h3 className="font-semibold text-white flex items-center gap-1.5 text-sm">
              StadiumGPT
              <span className="text-[9px] bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/20 px-1.5 py-0.5 rounded-full font-bold">RAG ENGINE</span>
            </h3>
            <p className="text-[10px] text-white/40">Intelligent Tournament & Fan Companion</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Output enable/disable */}
          <button
            onClick={() => {
              setVoiceEnabled(!voiceEnabled);
              if (voiceEnabled) stopSpeaking();
            }}
            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
              voiceEnabled 
                ? "bg-[#C5A059]/10 border-[#C5A059]/30 text-[#C5A059]" 
                : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
            }`}
            title={voiceEnabled ? "Voice Output Active" : "Voice Output Muted"}
          >
            {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Messages Scroll Box */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4 mb-4" id="chat-messages-box">
        {messages.map((msg) => {
          const isAi = msg.sender === "ai";
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isAi ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-1`}
              id={`chat-msg-${msg.id}`}
            >
              {isAi && (
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-bold shrink-0 text-xs">
                  AI
                </span>
              )}
              <div className="max-w-[85%] flex flex-col gap-1">
                <div className={`p-3.5 rounded-xl text-xs shadow-md ${
                  isAi 
                    ? "bg-black border border-white/10 text-white rounded-tl-none" 
                    : "bg-[#C5A059] text-black font-semibold rounded-tr-none shadow-[#C5A059]/5"
                }`}>
                  {isAi ? renderMarkdownText(msg.text) : <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>}
                </div>
                
                {/* Message Timestamp */}
                <span className={`text-[9px] text-white/30 font-mono ${!isAi && "text-right"}`}>
                  {msg.timestamp}
                </span>

                {/* Suggestions nested in welcome block */}
                {isAi && msg.suggestedPrompts && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5" id="chat-quick-suggestions">
                    {msg.suggestedPrompts.map((prompt, pidx) => (
                      <button
                        key={pidx}
                        id={`suggestion-tag-${pidx}`}
                        onClick={() => handleSendMessage(prompt)}
                        className="text-[10px] bg-black border border-white/10 hover:border-[#C5A059]/50 hover:bg-white/5 text-white/80 px-2.5 py-1.5 rounded-lg transition-colors text-left font-semibold cursor-pointer"
                      >
                        {prompt}
                        <ArrowRight className="w-2.5 h-2.5 inline-block ml-1 text-[#C5A059]" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {!isAi && (
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/5 text-white/60 border border-white/10 font-bold shrink-0 text-xs">
                  <User className="w-3.5 h-3.5" />
                </span>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-3 justify-start" id="chat-typing-indicator">
            <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/20 font-bold shrink-0 text-xs">
              AI
            </span>
            <div className="p-3.5 bg-black border border-white/10 rounded-xl rounded-tl-none flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 bg-[#C5A059] rounded-full animate-bounce" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Form Box */}
      <form
        id="chat-input-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage(inputValue);
        }}
        className="flex items-center gap-2 border-t border-white/5 pt-3 shrink-0"
      >
        {/* Mic Speech Button */}
        <button
          type="button"
          onClick={handleVoiceInput}
          className={`p-2.5 rounded-lg border transition-all cursor-pointer ${
            isListening 
              ? "bg-red-500/15 border-red-500 text-red-400 animate-pulse" 
              : "bg-black border border-white/10 text-white/40 hover:text-white hover:border-white/20"
          }`}
          title="Speech Recognition Voice Input"
        >
          <Mic className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={isListening ? "Listening closely... speak now" : "Ask about gate queues, vegetarian concessions, Clinic location..."}
          disabled={isLoading}
          className="flex-1 px-4 py-2.5 bg-black border border-white/10 rounded-lg text-white text-xs placeholder-white/30 focus:outline-none focus:border-[#C5A059]/50 focus:ring-1 focus:ring-[#C5A059]/30"
        />

        <button
          type="submit"
          disabled={!inputValue.trim() || isLoading}
          className="p-2.5 bg-[#C5A059] disabled:bg-white/5 text-black disabled:text-white/20 rounded-lg font-bold transition-all hover:bg-[#D8B775] flex items-center justify-center cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
