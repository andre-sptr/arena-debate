/**
 * ArgumentCard Component — Premium Glassmorphism
 * 
 * Displays a single argument from an agent with glassmorphism styling,
 * gradient accent bars, and enhanced animations.
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Brain, CheckCircle2, ChevronDown, Radio } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { Badge, getAgentVariant } from "@/components/ui/badge";
import { cn, getAgentColor, getAgentEmoji, getAgentDisplayName, formatDate } from "@/lib/utils";
import type { Argument } from "@/types";

/**
 * ArgumentCard component props
 */
export interface ArgumentCardProps {
  argument: Argument;
  index?: number;
  className?: string;
}

/**
 * ArgumentCard component
 */
export const ArgumentCard = React.forwardRef<HTMLDivElement, ArgumentCardProps>(
  ({ argument, index = 0, className }, ref) => {
    const agentColor = getAgentColor(argument.agent_name);
    const agentEmoji = getAgentEmoji(argument.agent_name);
    const agentVariant = getAgentVariant(argument.agent_name);
    const hasThinking = Boolean(argument.thinking_steps?.length);
    const [thinkingOpen, setThinkingOpen] = React.useState(
      Boolean(argument.thinking_active)
    );

    React.useEffect(() => {
      setThinkingOpen(Boolean(argument.thinking_active));
    }, [argument.thinking_active, argument.agent_name, argument.round_number]);

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4, delay: index * 0.1 }}
        className={cn("w-full", className)}
      >
        <Card variant="glass" className="overflow-hidden group">
          {/* Agent Color Accent Bar */}
          <div
            className="h-0.5"
            style={{
              background: `linear-gradient(90deg, ${agentColor}, ${agentColor}60, transparent)`,
            }}
            aria-hidden="true"
          />
          
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              {/* Agent Info */}
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="flex h-12 w-12 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl text-3xl sm:text-2xl transition-transform duration-200 group-hover:scale-105"
                  style={{
                    backgroundColor: `${agentColor}12`,
                    border: `1px solid ${agentColor}25`,
                  }}
                  role="img"
                  aria-label={`${argument.agent_role} avatar`}
                >
                  {agentEmoji}
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold sm:font-semibold text-[17px] sm:text-base text-white truncate">
                      {getAgentDisplayName(argument.agent_name)}
                    </h3>
                    <Badge variant={agentVariant} size="sm">
                      Round {argument.round_number}
                    </Badge>
                  </div>
                  
                  {argument.timestamp && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatDate(argument.timestamp)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            {hasThinking && (
              <div className="mb-4 overflow-hidden rounded-lg border border-white/[0.07] bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => setThinkingOpen((open) => !open)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-white/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                  aria-expanded={thinkingOpen}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Brain
                      className="h-4 w-4 shrink-0"
                      style={{ color: agentColor }}
                      aria-hidden="true"
                    />
                    <span className="text-sm font-medium text-gray-200">
                      Thinking process
                    </span>
                    {argument.thinking_active && (
                      <Badge variant="primary" size="sm">
                        Thinking
                      </Badge>
                    )}
                  </span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-gray-400 transition-transform",
                      thinkingOpen && "rotate-180"
                    )}
                    aria-hidden="true"
                  />
                </button>

                {thinkingOpen && (
                  <div className="space-y-2 border-t border-white/[0.06] px-3 py-3">
                    {argument.thinking_steps?.map((step, stepIndex) => {
                      const isLatest =
                        argument.thinking_active &&
                        stepIndex === (argument.thinking_steps?.length ?? 0) - 1;

                      return (
                        <div
                          key={`${step.agent_name}-${step.round}-${step.phase}-${stepIndex}`}
                          className="flex items-start gap-2"
                        >
                          {isLatest ? (
                            <Radio
                              className="mt-0.5 h-3.5 w-3.5 shrink-0"
                              style={{ color: agentColor }}
                              aria-hidden="true"
                            />
                          ) : (
                            <CheckCircle2
                              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500"
                              aria-hidden="true"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-medium capitalize text-gray-300">
                              {step.phase}
                            </p>
                            <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                              {step.message}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Argument Content */}
            {!argument.thinking_active && (
              <div
                className="pl-3 sm:pl-4 border-l-2"
                style={{ borderColor: `${agentColor}20` }}
              >
                <div className="text-[15px] sm:text-base text-gray-300 leading-relaxed markdown-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {argument.content}
                  </ReactMarkdown>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

ArgumentCard.displayName = "ArgumentCard";

export default ArgumentCard;

// Made with Bob
