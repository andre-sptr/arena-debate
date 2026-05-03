/**
 * ConsensusPanel Component — Premium Design
 * 
 * Displays the final consensus with gradient border, animated entrance,
 * glassmorphism styling, and expandable content.
 */

"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Consensus } from "@/types";

/**
 * ConsensusPanel component props
 */
export interface ConsensusPanelProps {
  consensus: Consensus;
  defaultExpanded?: boolean;
  confidenceScore?: number;
  className?: string;
}

/**
 * ConsensusPanel component
 */
export const ConsensusPanel = React.forwardRef<HTMLDivElement, ConsensusPanelProps>(
  ({ consensus, defaultExpanded = true, confidenceScore, className }, ref) => {
    const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

    const toggleExpanded = () => {
      setIsExpanded((prev) => !prev);
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn("w-full", className)}
      >
        {/* Gradient border wrapper */}
        <div className="relative rounded-xl p-[1px] bg-gradient-to-br from-arena-gold/40 via-arena-violet/30 to-arena-cyan/40">
          <Card variant="elevated" className="rounded-[11px] overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 flex-1">
                  {/* Consensus Icon */}
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-arena-violet/10 border border-arena-violet/20 text-2xl">
                    ⚖️
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg sm:text-xl gradient-text-gold font-bold">
                      Final Consensus
                    </CardTitle>
                    
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge variant="mediator" size="sm">
                        <span className="mr-1">✓</span>
                        Agreed
                      </Badge>
                      
                      {confidenceScore !== undefined && (
                        <Badge 
                          variant={
                            confidenceScore >= 80 ? "success" : 
                            confidenceScore >= 60 ? "warning" : 
                            "secondary"
                          }
                          size="sm"
                        >
                          {confidenceScore}% Confidence
                        </Badge>
                      )}
                      
                      {consensus.key_points.length > 0 && (
                        <span className="text-xs text-gray-500">
                          {consensus.key_points.length} key point{consensus.key_points.length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                <button
                  onClick={toggleExpanded}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg hover:bg-white/[0.06] transition-colors"
                  aria-label={isExpanded ? "Collapse consensus" : "Expand consensus"}
                  aria-expanded={isExpanded}
                >
                  <motion.svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-gray-400"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </motion.svg>
                </button>
              </div>
            </CardHeader>

            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  style={{ overflow: "hidden" }}
                >
                  <CardContent className="pt-0 space-y-4">
                    {/* Consensus Content */}
                    <div className="rounded-lg bg-white/[0.03] border border-white/[0.06] p-4">
                      <div className="text-[15px] sm:text-base text-gray-300 leading-relaxed markdown-content">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {consensus.content}
                        </ReactMarkdown>
                      </div>
                    </div>

                    {/* Key Points */}
                    {consensus.key_points.length > 0 && (
                      <div>
                        <h4 className="text-base sm:text-sm font-semibold text-gray-200 mb-4 flex items-center gap-2">
                          <span className="text-arena-violet">✦</span>
                          Key Points
                        </h4>
                        <ul className="space-y-2">
                          {consensus.key_points.map((point, index) => (
                            <motion.li
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              className="flex items-start gap-3 text-[15px] sm:text-sm text-gray-300"
                            >
                              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-arena-violet/10 border border-arena-violet/20 text-[10px] font-bold text-arena-violet mt-0.5">
                                {index + 1}
                              </span>
                              <div className="flex-1 leading-relaxed markdown-content compact">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {point}
                                </ReactMarkdown>
                              </div>
                            </motion.li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </motion.div>
    );
  }
);

ConsensusPanel.displayName = "ConsensusPanel";

export default ConsensusPanel;

// Made with Bob