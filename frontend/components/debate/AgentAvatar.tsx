/**
 * AgentAvatar Component — Premium Design
 * 
 * Animated agent avatar with glowing ring, pulsing aura, and ripple effects.
 */

"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn, getAgentColor, getAgentEmoji } from "@/lib/utils";

/**
 * Avatar size variants
 */
export type AvatarSize = "sm" | "md" | "lg";

/**
 * AgentAvatar component props
 */
export interface AgentAvatarProps {
  agentName: string;
  active?: boolean;
  size?: AvatarSize;
  displayName?: string;
  showName?: boolean;
  className?: string;
}

/**
 * Size configuration mapping
 */
const sizeConfig: Record<AvatarSize, {
  container: string;
  emoji: string;
  name: string;
  ring: string;
}> = {
  sm: {
    container: "h-10 w-10",
    emoji: "text-xl",
    name: "text-xs",
    ring: "h-12 w-12",
  },
  md: {
    container: "h-14 w-14",
    emoji: "text-3xl",
    name: "text-sm",
    ring: "h-16 w-16",
  },
  lg: {
    container: "h-20 w-20",
    emoji: "text-4xl",
    name: "text-base",
    ring: "h-24 w-24",
  },
};

/**
 * AgentAvatar component
 */
export const AgentAvatar = React.forwardRef<HTMLDivElement, AgentAvatarProps>(
  (
    {
      agentName,
      active = false,
      size = "md",
      displayName,
      showName = true,
      className,
    },
    ref
  ) => {
    const agentColor = getAgentColor(agentName);
    const agentEmoji = getAgentEmoji(agentName);
    const config = sizeConfig[size];

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center gap-2", className)}
      >
        {/* Avatar Container */}
        <div className="relative flex items-center justify-center">
          {/* Glowing ring (active) */}
          {active && (
            <motion.div
              className={cn("absolute rounded-full", config.ring)}
              style={{
                border: `2px solid ${agentColor}40`,
                boxShadow: `0 0 20px ${agentColor}20`,
              }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            />
          )}

          {/* Main avatar */}
          <motion.div
            className={cn(
              "relative flex items-center justify-center rounded-full transition-all duration-200",
              config.container
            )}
            style={{
              backgroundColor: `${agentColor}15`,
              border: `1.5px solid ${agentColor}30`,
              boxShadow: active ? `0 0 24px ${agentColor}20` : "none",
            }}
            animate={
              active
                ? { scale: [1, 1.04, 1] }
                : { scale: 1 }
            }
            transition={{
              repeat: active ? Infinity : 0,
              duration: 2,
              ease: "easeInOut",
            }}
            role="img"
            aria-label={`${displayName || agentName} avatar`}
          >
            {/* Emoji */}
            <span className={cn(config.emoji)} aria-hidden="true">
              {agentEmoji}
            </span>

            {/* Active Indicator Dot */}
            {active && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full"
                style={{
                  backgroundColor: agentColor,
                  boxShadow: `0 0 8px ${agentColor}60`,
                }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <motion.div
                  className="h-full w-full rounded-full"
                  style={{ backgroundColor: agentColor }}
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Agent Name */}
        {showName && displayName && (
          <div className="text-center">
            <p
              className={cn(
                "font-medium text-gray-200 truncate max-w-[120px]",
                config.name
              )}
            >
              {displayName}
            </p>
            {active && (
              <motion.p
                className="text-xs text-gray-500 mt-0.5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                Speaking...
              </motion.p>
            )}
          </div>
        )}
      </div>
    );
  }
);

AgentAvatar.displayName = "AgentAvatar";

export default AgentAvatar;

// Made with Bob