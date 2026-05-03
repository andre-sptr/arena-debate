/**
 * ArgumentCard Component — Premium Glassmorphism
 * 
 * Displays a single argument from an agent with glassmorphism styling,
 * gradient accent bars, and enhanced animations.
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
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
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-2xl transition-transform duration-200 group-hover:scale-105"
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
                    <h3 className="font-semibold text-white truncate">
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
            {/* Argument Content */}
            <div
              className="pl-4 border-l-2"
              style={{ borderColor: `${agentColor}20` }}
            >
              <div className="text-sm text-gray-300 leading-relaxed markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {argument.content}
                </ReactMarkdown>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }
);

ArgumentCard.displayName = "ArgumentCard";

export default ArgumentCard;

// Made with Bob