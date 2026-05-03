"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import {
  ArgumentCard,
  ConsensusPanel,
  DebateProgress,
} from "@/components/debate";
import { useDebate } from "@/hooks/useDebate";
import { DebateStatus } from "@/types";

interface DebateDetailPageProps {
  params: {
    id: string;
  };
}

export default function DebateDetailPage({ params }: DebateDetailPageProps) {
  const router = useRouter();
  const { debate, isLoading, error } = useDebate(params.id);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Spinner size="xl" />
        <div className="text-center space-y-1">
          <p className="text-gray-300 font-medium">Loading debate...</p>
          <p className="text-xs text-gray-500">Preparing the Arena</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !debate) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <Card variant="glass-strong" className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-3xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-bold text-white font-heading">
              {error || "Debate not found"}
            </h2>
            <p className="text-gray-400 max-w-sm mx-auto">
              The debate you're looking for doesn't exist or couldn't be loaded.
            </p>
            <Button onClick={() => router.push("/")} variant="primary" className="mt-4">
              ← Back to Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Group arguments by round
  const argumentsByRound: Record<number, typeof debate.arguments> = {};
  debate.arguments.forEach((arg) => {
    if (!argumentsByRound[arg.round_number]) {
      argumentsByRound[arg.round_number] = [];
    }
    argumentsByRound[arg.round_number].push(arg);
  });

  const rounds = Object.keys(argumentsByRound)
    .map(Number)
    .sort((a, b) => a - b);

  // Status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case DebateStatus.COMPLETED:
        return "success" as const;
      case DebateStatus.IN_PROGRESS:
        return "primary" as const;
      case DebateStatus.FAILED:
        return "destructive" as const;
      default:
        return "warning" as const;
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Section */}
      <motion.div
        className="space-y-4"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="mb-2 text-gray-400"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Back to Home
        </Button>

        <Card variant="glass-strong" className="p-6">
          <div className="space-y-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-white font-heading leading-tight">
                  {debate.topic}
                </h1>
                <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                  <span>
                    Created: {new Date(debate.created_at).toLocaleDateString()}
                  </span>
                  {debate.completed_at && (
                    <>
                      <span className="text-gray-700">•</span>
                      <span>
                        Completed:{" "}
                        {new Date(debate.completed_at).toLocaleDateString()}
                      </span>
                    </>
                  )}
                </div>
              </div>
              <Badge variant={getStatusColor(debate.status)} size="md">
                {debate.status.replace("_", " ").toUpperCase()}
              </Badge>
            </div>

            {/* Progress Bar */}
            <DebateProgress
              currentRound={debate.total_rounds}
              totalRounds={3}
              status={debate.status as DebateStatus}
            />

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/[0.06]">
              {[
                { value: debate.total_rounds, label: "Rounds", color: "text-arena-cyan" },
                { value: debate.total_arguments, label: "Arguments", color: "text-arena-violet" },
                { value: 4, label: "Agents", color: "text-arena-rose" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className={`text-2xl font-bold font-heading ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Arguments by Round */}
      {rounds.length > 0 && (
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-arena-cyan to-arena-violet" />
            <h2 className="text-2xl font-bold text-white font-heading">
              Debate Arguments
            </h2>
          </div>

          {rounds.map((roundNumber, ri) => (
            <motion.div
              key={roundNumber}
              className="space-y-4"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: ri * 0.1 }}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-arena-cyan/10 border border-arena-cyan/20">
                  <span className="text-lg font-bold font-heading text-arena-cyan">
                    {roundNumber}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-200">
                  Round {roundNumber}
                </h3>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {argumentsByRound[roundNumber].map((argument, index) => (
                  <ArgumentCard
                    key={`${roundNumber}-${argument.agent_name}-${index}`}
                    argument={argument}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Consensus Panel */}
      {debate.status === DebateStatus.COMPLETED && debate.consensus && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-arena-gold to-arena-violet" />
            <h2 className="text-2xl font-bold text-white font-heading">
              Final Consensus
            </h2>
          </div>
          <ConsensusPanel consensus={debate.consensus} />
        </div>
      )}

      {/* In Progress Message */}
      {debate.status === DebateStatus.IN_PROGRESS && (
        <Card variant="glass" className="p-8 text-center glow-cyan">
          <div className="space-y-4">
            <Spinner size="lg" className="mx-auto" />
            <h3 className="text-lg font-semibold text-white font-heading">
              Debate in Progress
            </h3>
            <p className="text-gray-400 max-w-md mx-auto">
              The AI agents are currently debating this topic. Check back soon
              for updates.
            </p>
          </div>
        </Card>
      )}

      {/* Failed State */}
      {debate.status === DebateStatus.FAILED && (
        <Card variant="glass" className="p-8 text-center">
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <span className="text-3xl">❌</span>
            </div>
            <h3 className="text-lg font-semibold text-white font-heading">
              Debate Failed
            </h3>
            <p className="text-gray-400">
              This debate encountered an error and could not be completed.
            </p>
          </div>
        </Card>
      )}

      {/* Empty Arguments State */}
      {rounds.length === 0 && debate.status === DebateStatus.PENDING && (
        <Card variant="glass" className="p-16 text-center">
          <div className="space-y-4">
            <Spinner size="xl" className="mx-auto" />
            <h3 className="text-xl font-semibold text-white font-heading">
              Debate Starting Soon
            </h3>
            <p className="text-gray-400">
              The debate has been created and will begin shortly.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Made with Bob
