"use client";

import { Brain, CheckCircle2, Radio } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn, getAgentColor, getAgentDisplayName } from "@/lib/utils";
import type { ThinkingStep } from "@/types";

export interface ThinkingProcessPanelProps {
  activeStep: ThinkingStep | null;
  steps: ThinkingStep[];
  activeAgent: string | null;
  className?: string;
}

export function ThinkingProcessPanel({
  activeStep,
  steps,
  activeAgent,
  className,
}: ThinkingProcessPanelProps) {
  const currentAgent = activeStep?.agent_name ?? activeAgent;
  const agentColor = currentAgent ? getAgentColor(currentAgent) : "#22d3ee";
  const visibleSteps = steps.slice(-6).reverse();

  return (
    <Card variant="glass" className={cn("p-5", className)}>
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border"
            style={{
              borderColor: `${agentColor}30`,
              backgroundColor: `${agentColor}12`,
              color: agentColor,
            }}
          >
            <Brain className="h-5 w-5" aria-hidden="true" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-white font-heading">
                AI Thinking Process
              </h2>
              {activeStep && (
                <Badge variant="primary" size="sm">
                  {activeStep.phase}
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {activeStep
                ? `${getAgentDisplayName(activeStep.agent_name)}: ${activeStep.message}`
                : currentAgent
                  ? `${getAgentDisplayName(currentAgent)} is preparing the next step.`
                  : "Thinking steps will appear when the live debate starts."}
            </p>
          </div>
        </div>

        <div className="min-w-0 md:w-[42%]">
          <div className="space-y-2">
            {visibleSteps.length > 0 ? (
              visibleSteps.map((step, index) => {
                const color = getAgentColor(step.agent_name);
                return (
                  <div
                    key={`${step.agent_name}-${step.round}-${step.phase}-${index}`}
                    className="flex items-start gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-2"
                  >
                    {index === 0 && activeStep ? (
                      <Radio
                        className="mt-0.5 h-3.5 w-3.5 shrink-0"
                        style={{ color }}
                        aria-hidden="true"
                      />
                    ) : (
                      <CheckCircle2
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-500"
                        aria-hidden="true"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-300">
                        R{step.round} · {getAgentDisplayName(step.agent_name)} · {step.phase}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {step.message}
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] px-3 py-3 text-sm text-gray-500">
                Waiting for the first thinking signal.
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default ThinkingProcessPanel;
