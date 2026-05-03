"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, formatAPIError } from "@/lib/api";
import type {
  Argument,
  Consensus,
  DebateStreamEvent,
  DebateStreamStatus,
} from "@/types";

const AGENT_ORDER = [
  "devils_advocate",
  "optimist",
  "data_analyst",
  "mediator",
];

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
  startStreamDebate: (topic: string, options?: StartStreamOptions) => Promise<void>;
  reset: () => void;
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
  const abortRef = useRef<AbortController | null>(null);
  const completedRef = useRef(false);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    completedRef.current = false;
    setCurrentRound(0);
    setArgumentsList([]);
    setActiveAgent(null);
    setConsensus(null);
    setStatus("idle");
    setError(null);
    setDebateId(null);
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

      setCurrentRound(0);
      setArgumentsList([]);
      setActiveAgent(null);
      setConsensus(null);
      setStatus("connecting");
      setError(null);
      setDebateId(options.debateId ?? null);

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
            setStatus("in_progress");
            break;
          case "argument":
            setArgumentsList((current) => [...current, event.data]);
            setActiveAgent(getNextAgent(event.data));
            setStatus("in_progress");
            break;
          case "round_end":
            setCurrentRound(event.round);
            setActiveAgent(null);
            if (event.round === 3) {
              setStatus("synthesizing");
            }
            break;
          case "consensus":
            setConsensus(event.data);
            setActiveAgent(null);
            setStatus("synthesizing");
            break;
          case "complete":
            completedRef.current = true;
            setDebateId(event.debate_id);
            setActiveAgent(null);
            setStatus("completed");
            break;
          case "error":
            setActiveAgent(null);
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
        setError(formatAPIError(err));
        setStatus("failed");
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    },
    []
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
    startStreamDebate,
    reset,
  };
}
