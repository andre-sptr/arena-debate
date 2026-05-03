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
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className={cn("w-full", className)}
      >
        <Card
          hoverable
          className={cn(
            "cursor-pointer transition-all duration-200",
            onView && "hover:scale-[1.02]"
          )}
          onClick={handleCardClick}
          role="article"
          aria-label={`Debate: ${debate.topic}`}
        >
          <CardHeader className="pb-3">
            {/* Status Badge */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <Badge variant={getStatusVariant(debate.status)} size="sm">
                <span className="mr-1">{statusInfo.icon}</span>
                {statusInfo.label}
              </Badge>
              
              {hasConsensus && (
                <Badge variant="mediator" size="sm">
                  <span className="mr-1">⚖️</span>
                  Consensus
                </Badge>
              )}
            </div>

            {/* Topic */}
            <CardTitle className="text-lg line-clamp-2">
              {debate.topic}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-0 pb-3">
            {/* Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {/* Created Date */}
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  Created
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatRelativeTime(debate.created_at)}
                </span>
              </div>

              {/* Arguments Count */}
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  Arguments
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {debate.total_arguments} {debate.total_arguments === 1 ? "argument" : "arguments"}
                </span>
              </div>

              {/* Rounds */}
              <div className="flex flex-col">
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  Rounds
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {debate.total_rounds} {debate.total_rounds === 1 ? "round" : "rounds"}
                </span>
              </div>

              {/* Completed Date (if applicable) */}
              {debate.completed_at && (
                <div className="flex flex-col">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">
                    Completed
                  </span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {formatRelativeTime(debate.completed_at)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>

          {/* Action Buttons */}
          {showActions && (
            <CardFooter className="pt-3 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2 w-full">
                {onView && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleViewClick}
                    className="flex-1"
                    aria-label={`View debate: ${debate.topic}`}
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
                      className="mr-1"
                    >
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    View Details
                  </Button>
                )}
                
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDeleteClick}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
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