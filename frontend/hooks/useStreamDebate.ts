"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, formatAPIError } from "@/lib/api";
import type {
  Argument,
  Consensus,
  DebateStreamEvent,
  DebateStreamStatus,
  ThinkingStep,
} from "@/types";

const AGENT_ORDER = [
  "optimist_1",
  "optimist_2",
  "devil_1",
  "devil_2",
];

const AGENT_ROLES: Record<string, string> = {
  optimist_1: "The Visionary Architect",
  optimist_2: "The Pragmatic Idealist",
  devil_1: "The Logical Critic",
  devil_2: "The Risk Analyst",
};

interface StartStreamOptions {
  debateId?: string;
}

interface UseStreamDebateReturn {
  currentRound: number;
  arguments: Argument[];
  activeAgent: string | null;
  consensus: Consensus | null;
  status: DebateStreamStatus;
  error: string | null;
  debateId: string | null;
  pendingArgument: Argument | null;
  startStreamDebate: (topic: string, options?: StartStreamOptions) => Promise<void>;
  reset: () => void;
}

function getThinkingKey(agentName: string, roundNumber: number): string {
  return `${roundNumber}:${agentName}`;
}

function isDebateAgent(agentName: string): boolean {
  return AGENT_ORDER.includes(agentName);
}

function createPendingArgument(
  agentName: string,
  roundNumber: number,
  steps: ThinkingStep[] = []
): Argument {
  return {
    agent_name: agentName,
    agent_role: AGENT_ROLES[agentName] ?? "Debate Agent",
    content: "",
    round_number: roundNumber,
    thinking_steps: steps,
    thinking_active: true,
  };
}

function getNextAgent(argument: Argument): string | null {
  const currentIndex = AGENT_ORDER.indexOf(argument.agent_name);
  if (currentIndex >= 0 && currentIndex < AGENT_ORDER.length - 1) {
    return AGENT_ORDER[currentIndex + 1];
  }

  return null;
}

export function useStreamDebate(): UseStreamDebateReturn {
  const [currentRound, setCurrentRound] = useState(0);
  const [argumentsList, setArgumentsList] = useState<Argument[]>([]);
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [consensus, setConsensus] = useState<Consensus | null>(null);
  const [status, setStatus] = useState<DebateStreamStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [debateId, setDebateId] = useState<string | null>(null);
  const [pendingArgument, setPendingArgument] = useState<Argument | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const completedRef = useRef(false);
  const thinkingBufferRef = useRef<Record<string, ThinkingStep[]>>({});
  const activeThinkingKeyRef = useRef<string | null>(null);

  const clearThinkingBuffer = useCallback(() => {
    thinkingBufferRef.current = {};
    activeThinkingKeyRef.current = null;
    setPendingArgument(null);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    completedRef.current = false;
    thinkingBufferRef.current = {};
    activeThinkingKeyRef.current = null;
    setCurrentRound(0);
    setArgumentsList([]);
    setActiveAgent(null);
    setConsensus(null);
    setStatus("idle");
    setError(null);
    setDebateId(null);
    setPendingArgument(null);
  }, []);

  const startStreamDebate = useCallback(
    async (topic: string, options: StartStreamOptions = {}) => {
      const normalizedTopic = topic.trim();
      if (!normalizedTopic) {
        setError("Topic cannot be empty");
        setStatus("failed");
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      completedRef.current = false;
      thinkingBufferRef.current = {};
      activeThinkingKeyRef.current = null;

      setCurrentRound(0);
      setArgumentsList([]);
      setActiveAgent(null);
      setConsensus(null);
      setStatus("connecting");
      setError(null);
      setDebateId(options.debateId ?? null);
      setPendingArgument(null);

      const handleEvent = (event: DebateStreamEvent) => {
        switch (event.type) {
          case "round_start":
            setCurrentRound(event.round);
            setActiveAgent(AGENT_ORDER[0]);
            setStatus("in_progress");
            break;
          case "agent_start":
            setCurrentRound(event.round);
            setActiveAgent(event.agent_name);
            activeThinkingKeyRef.current = getThinkingKey(event.agent_name, event.round);
            thinkingBufferRef.current[activeThinkingKeyRef.current] = [];
            setPendingArgument(
              isDebateAgent(event.agent_name)
                ? createPendingArgument(event.agent_name, event.round)
                : null
            );
            setStatus("in_progress");
            break;
          case "thinking":
            setCurrentRound(event.round);
            setActiveAgent(event.agent_name);
            {
              const key = getThinkingKey(event.agent_name, event.round);
              const nextSteps = [...(thinkingBufferRef.current[key] ?? []), event];
              thinkingBufferRef.current[key] = nextSteps;
              activeThinkingKeyRef.current = key;
              if (isDebateAgent(event.agent_name)) {
                setPendingArgument(
                  createPendingArgument(event.agent_name, event.round, nextSteps)
                );
              }
            }
            setStatus("in_progress");
            break;
          case "argument":
            {
              const key = getThinkingKey(
                event.data.agent_name,
                event.data.round_number
              );
              const stepsForArgument = thinkingBufferRef.current[key] ?? [];
              delete thinkingBufferRef.current[key];
              activeThinkingKeyRef.current = null;
              setArgumentsList((current) => [
                ...current,
                {
                  ...event.data,
                  thinking_steps: stepsForArgument,
                  thinking_active: false,
                },
              ]);
              setPendingArgument(null);
            }
            setActiveAgent(getNextAgent(event.data));
            setStatus("in_progress");
            break;
          case "round_end":
            setCurrentRound(event.round);
            setActiveAgent(null);
            clearThinkingBuffer();
            if (event.round === 3) {
              setStatus("synthesizing");
            }
            break;
          case "consensus":
            setConsensus(event.data);
            setActiveAgent(null);
            clearThinkingBuffer();
            setStatus("synthesizing");
            break;
          case "complete":
            completedRef.current = true;
            setDebateId(event.debate_id);
            setActiveAgent(null);
            clearThinkingBuffer();
            setStatus("completed");
            break;
          case "error":
            setActiveAgent(null);
            clearThinkingBuffer();
            setError(event.message);
            setStatus("failed");
            break;
        }
      };

      try {
        await api.startDebateStream(normalizedTopic, handleEvent, {
          debateId: options.debateId,
          signal: controller.signal,
        });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }

        setActiveAgent(null);
        clearThinkingBuffer();
        setError(formatAPIError(err));
        setStatus("failed");
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    [clearThinkingBuffer]
  );

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  return {
    currentRound,
    arguments: argumentsList,
    activeAgent,
    consensus,
    status,
    error,
    debateId,
    pendingArgument,
    startStreamDebate,
    reset,
  };
}
