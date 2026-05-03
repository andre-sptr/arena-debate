/**
 * DebateTopicCard Component
 * 
 * Displays a debate topic card with metadata and action buttons.
 * Used in debate history/listing views. Clickable to navigate to debate detail.
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatDate, formatRelativeTime } from "@/lib/utils";
import type { Debate } from "@/types";

/**
 * DebateTopicCard component props
 */
export interface DebateTopicCardProps {
  /**
   * The debate data to display
   */
  debate: Debate;

  /**
   * Callback when view button is clicked
   */
  onView?: (debateId: string) => void;

  /**
   * Callback when delete button is clicked
   */
  onDelete?: (debateId: string) => void;

  /**
   * Whether to show action buttons
   * @default true
   */
  showActions?: boolean;

  /**
   * Index for staggered animation
   * @default 0
   */
  index?: number;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Status display configuration
 */
const statusConfig: Record<string, { icon: string; label: string }> = {
  pending: { icon: "⏳", label: "Pending" },
  in_progress: { icon: "🔄", label: "In Progress" },
  completed: { icon: "✓", label: "Completed" },
  failed: { icon: "✗", label: "Failed" },
};

/**
 * DebateTopicCard component
 * 
 * Displays a debate topic card with:
 * - Debate topic prominently
 * - Metadata (created date, status, argument count)
 * - Action buttons (view, delete)
 * - Clickable to navigate to debate detail
 * - Hover effects and animations
 * 
 * @example
 * ```tsx
 * <DebateTopicCard 
 *   debate={debateData}
 *   onView={(id) => router.push(`/debate/${id}`)}
 *   onDelete={(id) => handleDelete(id)}
 * />
 * ```
 */
export const DebateTopicCard = React.forwardRef<HTMLDivElement, DebateTopicCardProps>(
  (
    {
      debate,
      onView,
      onDelete,
      showActions = true,
      index = 0,
      className,
    },
    ref
  ) => {
    const statusInfo = statusConfig[debate.status.toLowerCase()] || statusConfig.pending;
    const hasConsensus = debate.consensus !== null;

    const handleCardClick = (e: React.MouseEvent) => {
      // Don't trigger if clicking on buttons
      if ((e.target as HTMLElement).closest("button")) {
        return;
      }
      onView?.(debate.debate_id);
    };

    const handleViewClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onView?.(debate.debate_id);
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete?.(debate.debate_id);
    };

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: index * 0.05 }}
        className={cn("w-full h-full", className)}
      >
        <Card
          variant="glass"
          hoverable
          className={cn(
            "group relative overflow-hidden flex flex-col h-full border-white/[0.08] hover:border-arena-cyan/30 transition-all duration-500"
          )}
          onClick={handleCardClick}
          role="article"
          aria-label={`Debate: ${debate.topic}`}
        >
          {/* Top Accent Gradient Bar */}
          <div
            className={cn(
              "absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r transition-all duration-500 group-hover:h-[4px]",
              debate.status === "completed" ? "from-emerald-500 via-arena-cyan to-arena-violet" :
                debate.status === "in_progress" ? "from-arena-cyan via-arena-violet to-arena-rose" :
                  "from-gray-500 to-gray-400"
            )}
          />

          {/* Background Decoration */}
          <div className="absolute -right-4 -top-8 w-24 h-24 bg-arena-violet/5 blur-3xl rounded-full group-hover:bg-arena-violet/10 transition-colors duration-500" />
          <div className="absolute -left-4 -bottom-8 w-24 h-24 bg-arena-cyan/5 blur-3xl rounded-full group-hover:bg-arena-cyan/10 transition-colors duration-500" />

          <CardHeader className="pb-4 relative z-10">
            <div className="flex items-center justify-between gap-2 mb-3">
              <Badge
                variant={getStatusVariant(debate.status)}
                size="sm"
                className="px-2 py-0.5 bg-white/[0.05] backdrop-blur-md border-white/[0.08]"
              >
                <span className="mr-1.5">{statusInfo.icon}</span>
                <span className="font-medium tracking-wide uppercase text-[10px]">
                  {statusInfo.label}
                </span>
              </Badge>

              {hasConsensus && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-arena-gold/10 border border-arena-gold/20 text-[10px] animate-pulse-glow" title="Consensus Reached">
                  ⚖️
                </div>
              )}
            </div>

            <CardTitle className="text-xl font-bold leading-snug line-clamp-2 text-white/90 group-hover:text-white transition-colors duration-300">
              {debate.topic}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0 pb-6 flex-grow relative z-10">
            <div className="space-y-4">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    Timeline
                  </p>
                  <div className="flex items-center gap-1.5 text-sm text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-arena-cyan/70">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>{formatRelativeTime(debate.created_at)}</span>
                  </div>
                </div>

                <div className="space-y-1 text-right">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">
                    Interaction
                  </p>
                  <div className="flex items-center justify-end gap-1.5 text-sm text-gray-300">
                    <span>{debate.total_arguments} Args</span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-arena-violet/70">
                      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Progress Indicator (Subtle) */}
              {debate.status === "in_progress" && (
                <div className="w-full h-1 bg-white/[0.05] rounded-full overflow-hidden mt-2">
                  <motion.div
                    className="h-full bg-gradient-to-r from-arena-cyan to-arena-violet"
                    initial={{ width: "30%" }}
                    animate={{ width: "70%" }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  />
                </div>
              )}
            </div>
          </CardContent>

          {showActions && (
            <CardFooter className="pt-4 border-t border-white/[0.06] bg-white/[0.01] mt-auto relative z-10">
              <div className="flex items-center gap-3 w-full">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleViewClick}
                  className="flex-1 bg-white/[0.03] hover:bg-white/[0.08] text-gray-300 hover:text-white border border-white/[0.05] group/btn transition-all duration-300"
                >
                  View Debate
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="ml-2 transition-transform duration-300 group-hover/btn:translate-x-1"
                  >
                    <path d="M5 12h14" />
                    <path d="m12 5 7 7-7 7" />
                  </svg>
                </Button>

                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="h-9 w-9 shrink-0 text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    aria-label={`Delete debate: ${debate.topic}`}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                    </svg>
                  </Button>
                )}
              </div>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    );
  }
);

DebateTopicCard.displayName = "DebateTopicCard";

export default DebateTopicCard;

// Made with Bob