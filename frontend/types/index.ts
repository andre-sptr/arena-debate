/**
 * Type Definitions for Debate AI Arena
 * 
 * These types match the backend API schemas and database models.
 * They provide type safety for API requests and responses.
 */

/**
 * Debate status enum matching backend DebateStatus
 */
export enum DebateStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed"
}

/**
 * Agent information
 */
export interface Agent {
  name: string;
  role: string;
  color?: string;
  emoji?: string;
}

/**
 * Argument from an agent in a debate round
 */
export interface Argument {
  agent_name: string;
  agent_role: string;
  content: string;
  round_number: number;
  timestamp?: string;
}

/**
 * Consensus reached at the end of a debate
 */
export interface Consensus {
  content: string;
  key_points: string[];
}

/**
 * Complete debate data with all arguments and consensus
 */
export interface Debate {
  debate_id: string;
  topic: string;
  status: DebateStatus | string;
  arguments: Argument[];
  consensus: Consensus | null;
  total_rounds: number;
  total_arguments: number;
  created_at: string;
  completed_at: string | null;
}

/**
 * Simplified debate info for history listing
 */
export interface HistoryItem {
  id: string;
  topic: string;
  status: string;
  created_at: string;
  total_arguments: number;
}

/**
 * Statistics about all debates
 */
export interface DebateStats {
  total_debates: number;
  total_arguments: number;
  debates_by_status: Record<string, number>;
  avg_arguments_per_debate: number;
}

/**
 * API Request Types
 */

/**
 * Request to start a new debate
 */
export interface StartDebateRequest {
  topic: string;
  debate_id?: string;
}

export type DebateStreamStatus =
  | "idle"
  | "connecting"
  | "in_progress"
  | "synthesizing"
  | "completed"
  | "failed";

export interface ThinkingStep {
  type: "thinking";
  agent_name: string;
  round: number;
  phase: string;
  message: string;
}

export type DebateStreamEvent =
  | {
      type: "round_start";
      round: number;
    }
  | {
      type: "agent_start";
      agent_name: string;
      round: number;
    }
  | {
      type: "argument";
      data: Argument;
    }
  | ThinkingStep
  | {
      type: "round_end";
      round: number;
    }
  | {
      type: "consensus";
      data: Consensus;
    }
  | {
      type: "complete";
      debate_id: string;
    }
  | {
      type: "error";
      message: string;
    };

/**
 * API Response Types
 */

/**
 * Response from starting a debate
 */
export type StartDebateResponse = Debate;

/**
 * Response from getting a debate by ID
 */
export type GetDebateResponse = Debate;

/**
 * Response from listing debates
 */
export type ListDebatesResponse = Debate[];

/**
 * Response from getting history
 */
export type GetHistoryResponse = HistoryItem[];

/**
 * Response from deleting a debate
 */
export interface DeleteDebateResponse {
  message: string;
  debate_id: string;
}

/**
 * Response from getting statistics
 */
export type GetStatsResponse = DebateStats;

/**
 * API Error Response
 */
export interface APIError {
  detail: string;
  status?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  skip?: number;
  limit?: number;
}

/**
 * Agent configuration for UI
 */
export interface AgentConfig {
  name: string;
  role: string;
  color: string;
  emoji: string;
  description?: string;
}

/**
 * Debate state for real-time updates
 */
export interface DebateState {
  debate_id: string;
  topic: string;
  status: DebateStatus;
  current_round: number;
  arguments: Argument[];
  consensus: Consensus | null;
}

// Made with Bob
