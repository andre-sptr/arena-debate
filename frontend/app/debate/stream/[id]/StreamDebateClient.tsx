"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Radio,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import {
  AgentAvatar,
  ArgumentCard,
  ConsensusPanel,
  DebateProgress,
} from "@/components/debate";
import { useStreamDebate } from "@/hooks/useStreamDebate";
import { DebateStatus } from "@/types";

interface StreamDebateClientProps {
  streamId: string;
  topic: string;
}

const agents = [
  {
    name: "optimist_1",
    displayName: "Nova",
    role: "The Visionary Architect",
  },
  {
    name: "optimist_2",
    displayName: "Forge",
    role: "The Pragmatic Idealist",
  },
  {
    name: "devil_1",
    displayName: "Silas",
    role: "The Logical Critic",
  },
  {
    name: "devil_2",
    displayName: "Vance",
    role: "The Risk Analyst",
  },
  {
    name: "judge",
    displayName: "Andre",
    role: "The Consensus Arbiter",
  },
];

const statusLabels: Record<string, string> = {
  idle: "Idle",
  connecting: "Connecting",
  in_progress: "Live",
  synthesizing: "Synthesizing",
  completed: "Completed",
  failed: "Failed",
};

export default function StreamDebateClient({
  streamId,
  topic,
}: StreamDebateClientProps) {
  const router = useRouter();
  const {
    currentRound,
    arguments: debateArguments,
    activeAgent,
    consensus,
    status,
    error,
    debateId,
    pendingArgument,
    startStreamDebate,
  } = useStreamDebate();

  useEffect(() => {
    if (!topic) {
      return;
    }

    void startStreamDebate(topic, { debateId: streamId });
  }, [startStreamDebate, streamId, topic]);

  const argumentsByRound = useMemo(() => {
    return debateArguments.reduce<Record<number, typeof debateArguments>>(
      (grouped, argument) => {
        if (!grouped[argument.round_number]) {
          grouped[argument.round_number] = [];
        }
        grouped[argument.round_number].push(argument);
        return grouped;
      },
      {}
    );
  }, [debateArguments]);

  const visibleArgumentsByRound = useMemo(() => {
    if (!pendingArgument) {
      return argumentsByRound;
    }

    return {
      ...argumentsByRound,
      [pendingArgument.round_number]: [
        ...(argumentsByRound[pendingArgument.round_number] ?? []),
        pendingArgument,
      ],
    };
  }, [argumentsByRound, pendingArgument]);

  const visibleRounds = useMemo(
    () =>
      Object.keys(visibleArgumentsByRound)
        .map(Number)
        .sort((a, b) => a - b),
    [visibleArgumentsByRound]
  );

  const progressStatus =
    status === "completed"
      ? DebateStatus.COMPLETED
      : status === "failed"
        ? DebateStatus.FAILED
        : status === "idle"
          ? DebateStatus.PENDING
          : DebateStatus.IN_PROGRESS;

  const progressRound =
    status === "completed" || status === "synthesizing"
      ? currentRound
      : Math.max(currentRound, status === "connecting" ? 0 : 1);

  const activeAgentLabel =
    agents.find((agent) => agent.name === activeAgent)?.displayName ?? activeAgent;

  const emptyArgumentsTitle =
    status === "connecting"
      ? "Connecting to stream"
      : activeAgentLabel
        ? `Generating ${activeAgentLabel}'s argument`
        : currentRound > 0
          ? `Starting round ${currentRound}`
          : "Waiting for first argument";

  const emptyArgumentsDescription =
    status === "connecting"
      ? "Opening the live response from the backend."
      : activeAgentLabel
        ? "The first card will appear as soon as this response completes."
        : "The first agent will appear as soon as generation completes.";

  if (!topic) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card variant="glass-strong" className="p-8 text-center">
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
              <AlertTriangle className="h-7 w-7" aria-hidden="true" />
            </div>
            <h1 className="text-2xl font-bold text-white font-heading">
              Stream topic missing
            </h1>
            <p className="text-gray-400">
              Start a new debate from the home page to open a live stream.
            </p>
            <Button variant="primary" onClick={() => router.push("/")}>
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="self-start text-gray-400"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to Home
        </Button>

        <div className="inline-flex items-center gap-2 self-start rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-sm text-gray-300 sm:self-auto">
          {status === "completed" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
          ) : status === "failed" ? (
            <AlertTriangle className="h-4 w-4 text-red-400" aria-hidden="true" />
          ) : (
            <Radio className="h-4 w-4 text-arena-cyan" aria-hidden="true" />
          )}
          <span>{statusLabels[status]}</span>
        </div>
      </div>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
      >
        <Card variant="glass-strong" className="p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-arena-cyan">Live Debate</p>
              <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading leading-tight">
                {topic}
              </h1>
              <p className="text-sm text-gray-500">
                Stream ID: {streamId}
              </p>
            </div>

            <DebateProgress
              currentRound={progressRound}
              totalRounds={7}
              status={progressStatus}
            />

            <div className="grid grid-cols-3 gap-4 border-t border-white/[0.06] pt-4">
              <div className="text-center">
                <div className="text-2xl font-bold font-heading text-arena-cyan">
                  {progressRound}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">Round</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-heading text-arena-violet">
                  {debateArguments.length}
                </div>
                <div className="mt-0.5 text-xs text-gray-500">Arguments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold font-heading text-arena-rose">
                  5
                </div>
                <div className="mt-0.5 text-xs text-gray-500">Agents</div>
              </div>
            </div>
          </div>
        </Card>
      </motion.section>

      <Card variant="glass" className="p-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-2 py-4"
            >
              <AgentAvatar
                agentName={agent.name}
                active={activeAgent === agent.name}
                displayName={agent.displayName}
                showName
                size="md"
              />
              <p className="mt-2 text-center text-xs text-gray-500">
                {agent.role}
              </p>
            </div>
          ))}
        </div>
      </Card>

      {error && (
        <Card variant="glass-strong" className="border-red-500/20 p-6">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-300">
              <AlertTriangle className="h-5 w-5" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-white font-heading">
                Stream failed
              </h2>
              <p className="text-sm text-gray-400">{error}</p>
            </div>
          </div>
        </Card>
      )}

      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-6 w-1 rounded-full bg-gradient-to-b from-arena-cyan to-arena-violet" />
          <h2 className="text-2xl font-bold text-white font-heading">
            Live Arguments
          </h2>
        </div>

        {visibleRounds.length === 0 && status !== "failed" ? (
          <Card variant="glass" className="p-10 text-center">
            <div className="space-y-4">
              <Spinner size="lg" className="mx-auto" />
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-white font-heading">
                  {emptyArgumentsTitle}
                </h3>
                <p className="text-sm text-gray-500">
                  {emptyArgumentsDescription}
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="space-y-8">
            {visibleRounds.map((roundNumber, roundIndex) => (
              <motion.div
                key={roundNumber}
                className="space-y-4"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: roundIndex * 0.06 }}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-arena-cyan/20 bg-arena-cyan/10">
                    <span className="text-lg font-bold text-arena-cyan font-heading">
                      {roundNumber}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-200">
                    Round {roundNumber}
                  </h3>
                  <div className="h-px flex-1 bg-white/[0.06]" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {visibleArgumentsByRound[roundNumber].map((argument, index) => (
                    <ArgumentCard
                      key={`${roundNumber}-${argument.agent_name}-${index}-${argument.thinking_active ? "thinking" : "final"}`}
                      argument={argument}
                      index={index}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {status === "synthesizing" && !consensus && (
        <Card variant="glass" className="p-8 text-center glow-violet">
          <div className="space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <h2 className="text-lg font-semibold text-white font-heading">
              Synthesizing consensus
            </h2>
            <p className="text-sm text-gray-500">
              The mediator is combining every perspective into a final conclusion.
            </p>
          </div>
        </Card>
      )}

      {consensus && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 rounded-full bg-gradient-to-b from-arena-gold to-arena-violet" />
            <h2 className="text-2xl font-bold text-white font-heading">
              Final Consensus
            </h2>
          </div>
          <ConsensusPanel consensus={consensus} />
        </section>
      )}

      {status === "completed" && (
        <Card variant="glass-strong" className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white font-heading">
                Debate saved
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Open the full debate record to review every round later.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => router.push(`/debate/${debateId ?? streamId}`)}
            >
              Open Detail
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
