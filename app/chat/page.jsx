"use client";

import { useRef, useEffect } from "react";
import { useChat } from "ai/react";
import {
  Send,
  Bot,
  User,
  FileText,
  Sparkles,
  ArrowLeft,
  Copy,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function ChatInterface() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    setInput,
  } = useChat({
    api: "/api/chat",
  });

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const copyToClipboard = (content) => {
    navigator.clipboard.writeText(content);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <div className="border-b border-white/20 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Upload
            </Button>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">AI File Assistant</h1>
                <p className="text-sm text-gray-500">Ask anything about your document</p>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            <FileText className="w-3 h-3 mr-1" />
            Document Loaded
          </Badge>
        </div>
      </div>

      {/* Chat Body */}
      <div className="max-w-4xl mx-auto p-4 h-[calc(100vh-120px)] flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-4 mb-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex items-start space-x-3",
                msg.role === "user" ? "flex-row-reverse space-x-reverse" : ""
              )}
            >
              <Avatar className="w-8 h-8">
                <AvatarFallback
                  className={cn(
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  )}
                >
                  {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </AvatarFallback>
              </Avatar>

              <div
                className={cn(
                  "max-w-[80%] group",
                  msg.role === "user" ? "flex flex-col items-end" : "flex flex-col items-start"
                )}
              >
                <Card
                  className={cn(
                    "border-0 shadow-lg",
                    msg.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                      : "bg-white/90 backdrop-blur-sm"
                  )}
                >
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </CardContent>
                </Card>

                {msg.role === "assistant" && (
                  <div className="flex items-center space-x-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
                      onClick={() => copyToClipboard(msg.content)}
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-green-600">
                      <ThumbsUp className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-red-600">
                      <ThumbsDown className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-end space-x-4">
                <Textarea
                  placeholder="Ask a question about your document..."
                  value={input}
                  onChange={handleInputChange}
                  className="min-h-[60px] max-h-32 resize-none border-0 focus:ring-0 bg-transparent text-base placeholder:text-gray-400"
                  disabled={isLoading}
                />
                <Button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 h-12 px-6"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 mt-4 justify-center">
          {[
            "Summarize the document",
            "What are the key points?",
            "Explain the main concepts",
            "Find important quotes",
          ].map((s) => (
            <Button
              key={s}
              variant="outline"
              size="sm"
              onClick={() => setInput(s)}
              className="text-xs bg-white/50 border-gray-200 hover:bg-white/80 hover:border-blue-300 transition-all duration-200"
              disabled={isLoading}
            >
              {s}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
