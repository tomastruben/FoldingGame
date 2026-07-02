"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, PanelLeftClose } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { ChatMessage } from "@/lib/types";
import { Message } from "./message";

interface Props {
  messages: ChatMessage[];
  streaming: boolean;
  suggestions: string[];
  onSend: (text: string) => void;
  onHide?: () => void;
}

export function ChatPanel({
  messages,
  streaming,
  suggestions,
  onSend,
  onHide,
}: Props) {
  const [value, setValue] = useState("");

  const submit = (text: string) => {
    const t = text.trim();
    if (!t || streaming) return;
    setValue("");
    onSend(t);
  };

  // Keep the example prompts available throughout the demo — they return after
  // each response instead of vanishing once the first one is used.
  const showSuggestions = !streaming;

  return (
    <div className="flex h-full flex-col bg-card/20">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h1 className="truncate text-sm font-semibold tracking-tight">
              Review copilot
            </h1>
            <Badge variant="secondary" className="text-[10px]">
              Round 3
            </Badge>
          </div>
          <p className="truncate text-xs text-muted-foreground">
            anti-IL-23 Fab · affinity maturation
          </p>
        </div>
        {onHide && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onHide}
            title="Hide copilot"
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <PanelLeftClose className="size-4" />
          </Button>
        )}
      </header>

      <MessageScrollerProvider autoScroll>
        <MessageScroller className="min-h-0 flex-1">
          <MessageScrollerViewport>
            <MessageScrollerContent className="px-4 py-5">
              {messages.map((m, i) => (
                <MessageScrollerItem
                  key={m.id}
                  messageId={m.id}
                  scrollAnchor={m.role === "user"}
                >
                  <Message
                    message={m}
                    streaming={streaming && i === messages.length - 1}
                  />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton />
        </MessageScroller>
      </MessageScrollerProvider>

      <div className="border-t border-border p-3">
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-2 flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {suggestions.map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, ease: [0.16, 1, 0.3, 1] }}
                  className="shrink-0"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 rounded-full font-normal text-muted-foreground"
                    onClick={() => submit(s)}
                  >
                    {s}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <InputGroup>
          <InputGroupTextarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(value);
              }
            }}
            placeholder={
              streaming
                ? "Copilot is working…"
                : "Ask the copilot to design, rank, or explain…"
            }
            disabled={streaming}
            className="max-h-32 min-h-9"
          />
          <InputGroupAddon align="block-end">
            <InputGroupButton
              size="icon-sm"
              variant="default"
              className="ml-auto bg-brand text-brand-foreground hover:bg-brand/90 disabled:opacity-40"
              disabled={streaming || !value.trim()}
              onClick={() => submit(value)}
            >
              <ArrowUp className="size-4" />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>

        <p className="mt-2 px-1 text-[10px] leading-relaxed text-muted-foreground/60">
          Scripted agent for the demo — same streamed tool-call loop as a live AI
          SDK model.
        </p>
      </div>
    </div>
  );
}
