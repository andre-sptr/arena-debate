/**
 * DebateProgress Component — Premium Design
 * 
 * Shows debate progress with glowing animated gradient bar and node markers.
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Badge, getStatusVariant } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { DebateStatus } from "@/types";

/**
 * DebateProgress component props
 */
export interface DebateProgressProps {
  currentRound: number;
  totalRounds: number;
  status: DebateStatus | string;
  className?: string;
}

/**
 * Status display labels
 */
const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  failed: "Failed",
};

/**
 * DebateProgress component
 */
export const DebateProgress = React.forwardRef<HTMLDivElement, DebateProgressProps>(
  ({ currentRound, totalRounds, status, className }, ref) => {
    const progressPercentage = (currentRound / totalRounds) * 100;
    const safeCurrentRound = Math.max(0, Math.min(currentRound, totalRounds));
    const safeProgress = Math.max(0, Math.min(progressPercentage, 100));

    return (
      <div
        ref={ref}
        className={cn(
          "w-full rounded-xl bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] p-4",
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-gray-200">
              Debate Progress
            </h3>
            <Badge variant={getStatusVariant(status)} size="sm">
              {statusLabels[status.toLowerCase()] || status}
            </Badge>
          </div>
          
          {/* Round Counter */}
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-gray-300">
              Round
            </span>
            <span className="flex h-6 min-w-[24px] items-center justify-center rounded-md bg-arena-cyan/10 border border-arena-cyan/20 px-2 text-sm font-bold text-arena-cyan">
              {safeCurrentRound}
            </span>
            <span className="text-sm text-gray-500">
              / {totalRounds}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative">
          {/* Background Track */}
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
            {/* Animated Progress Fill */}
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(185, 95%, 55%), hsl(265, 90%, 62%))",
                boxShadow: "0 0 12px hsla(185, 95%, 55%, 0.3)",
              }}
              initial={{ width: 0 }}
              animate={{ width: `${safeProgress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </div>

          {/* Round Markers */}
          <div className="flex justify-between mt-3 px-0.5">
            {Array.from({ length: totalRounds }, (_, index) => {
              const roundNumber = index + 1;
              const isCompleted = roundNumber < safeCurrentRound;
              const isCurrent = roundNumber === safeCurrentRound;
              const isPending = roundNumber > safeCurrentRound;

              return (
                <motion.div
                  key={roundNumber}
                  className="flex flex-col items-center gap-1.5"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                >
                  {/* Marker Node */}
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full transition-all duration-300",
                      isCompleted && "bg-arena-violet shadow-[0_0_8px_hsla(265,90%,62%,0.4)]",
                      isCurrent && "bg-arena-cyan shadow-[0_0_12px_hsla(185,95%,55%,0.4)] scale-125",
                      isPending && "bg-white/[0.1] border border-white/[0.15]"
                    )}
                  />
                  
                  {/* Round Label */}
                  <span
                    className={cn(
                      "text-xs font-medium transition-colors duration-300",
                      isCompleted && "text-arena-violet",
                      isCurrent && "text-arena-cyan font-bold",
                      isPending && "text-gray-600"
                    )}
                  >
                    R{roundNumber}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Progress Text */}
        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">
            {status === "completed" ? (
              <span className="font-medium text-emerald-400">
                ✓ All rounds completed
              </span>
            ) : status === "in_progress" ? (
              <span>
                Round {safeCurrentRound} of {totalRounds} in progress
              </span>
            ) : status === "failed" ? (
              <span className="font-medium text-red-400">
                ✗ Debate failed
              </span>
            ) : (
              <span>Waiting to start...</span>
            )}
          </p>
        </div>
      </div>
    );
  }
);

DebateProgress.displayName = "DebateProgress";

export default DebateProgress;

// Made with Bob