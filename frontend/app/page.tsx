"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DebateTopicCard } from "@/components/debate/DebateTopicCard";
import { useDebateList } from "@/hooks/useDebateList";

const agents = [
  {
    emoji: "📊",
    name: "Data Analyst",
    trait: "Facts & Evidence",
    color: "from-blue-500/20 to-blue-600/5",
    borderColor: "border-blue-500/20",
    glowColor: "shadow-[0_0_20px_hsla(217,91%,60%,0.08)]",
    textColor: "text-blue-400",
  },
  {
    emoji: "😊",
    name: "Optimist",
    trait: "Positive Outlook",
    color: "from-emerald-500/20 to-emerald-600/5",
    borderColor: "border-emerald-500/20",
    glowColor: "shadow-[0_0_20px_hsla(160,84%,39%,0.08)]",
    textColor: "text-emerald-400",
  },
  {
    emoji: "😈",
    name: "Devil's Advocate",
    trait: "Critical Analysis",
    color: "from-red-500/20 to-red-600/5",
    borderColor: "border-red-500/20",
    glowColor: "shadow-[0_0_20px_hsla(0,84%,60%,0.08)]",
    textColor: "text-red-400",
  },
  {
    emoji: "⚖️",
    name: "Mediator",
    trait: "Balanced Synthesis",
    color: "from-purple-500/20 to-purple-600/5",
    borderColor: "border-purple-500/20",
    glowColor: "shadow-[0_0_20px_hsla(263,70%,50%,0.08)]",
    textColor: "text-purple-400",
  },
];

const suggestedTopics = [
  "Should AI be regulated by governments?",
  "Is remote work better than office work?",
  "Will AGI be achieved by 2030?",
  "Should social media have age restrictions?",
];

export default function HomePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [isStarting, setIsStarting] = useState(false);
  const { debates, isLoading: isLoadingDebates } = useDebateList();

  const handleStartDebate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    if (topic.trim().length < 10) {
      alert("Topik debat harus lebih dari 10 karakter!");
      return;
    }

    setIsStarting(true);
    const streamId =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `stream-${Date.now()}`;
    router.push(`/debate/stream/${streamId}?topic=${encodeURIComponent(topic.trim())}`);
  };

  const recentDebates = debates.slice(0, 6);

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center space-y-8 pt-8 sm:pt-12 pb-4 relative">
        {/* Decorative glow orbs */}
        <div className="glow-orb w-[400px] h-[400px] bg-arena-violet -top-20 left-1/2 -translate-x-1/2" />
        <div className="glow-orb w-[300px] h-[300px] bg-arena-cyan top-40 -right-20 opacity-10" />

        <motion.div
          className="space-y-4 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-xs text-gray-400 mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-arena-cyan animate-pulse" />
            Multi-Agent AI Debate Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold font-heading tracking-tight">
            <span className="text-white">Where AI Minds </span>
            <span className="gradient-text-hero">Collide</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Four specialized AI agents debate any topic through structured rounds,
            delivering deep analysis and consensus-driven conclusions.
          </p>
        </motion.div>

        {/* Start Debate Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Card variant="glass-strong" className="max-w-2xl mx-auto p-6 relative z-10">
            <form onSubmit={handleStartDebate} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="topic"
                  className="block text-sm font-medium text-gray-300"
                >
                  Enter a debate topic
                </label>
                <Input
                  id="topic"
                  type="text"
                  placeholder="e.g., Should AI be regulated by governments?"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  disabled={isStarting}
                  className="w-full h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={isStarting || !topic.trim()}
                variant="primary"
                size="lg"
                fullWidth
              >
                {isStarting ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Opening Stream...
                  </>
                ) : (
                  <>
                    <Play className="h-[18px] w-[18px]" aria-hidden="true" />
                    Start Debate
                  </>
                )}
              </Button>
            </form>

            {/* Suggested Topics */}
            <div className="mt-4 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-gray-500 mb-2">Try a topic:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedTopics.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTopic(t)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all duration-200"
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Agent Showcase */}
        <motion.div
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-4 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {agents.map((agent, i) => (
            <motion.div
              key={agent.name}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.08 }}
            >
              <Card
                variant="glass"
                hoverable
                className={`p-4 text-center space-y-3 ${agent.glowColor}`}
              >
                <div className={`w-14 h-14 mx-auto rounded-xl bg-gradient-to-br ${agent.color} border ${agent.borderColor} flex items-center justify-center`}>
                  <span className="text-2xl">{agent.emoji}</span>
                </div>
                <div>
                  <h3 className={`text-sm font-semibold ${agent.textColor}`}>
                    {agent.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">{agent.trait}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Recent Debates Section */}
      <section className="space-y-6 relative">
        <div className="glow-orb w-[300px] h-[300px] bg-arena-cyan -left-20 top-0 opacity-[0.03]" />

        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-arena-cyan to-arena-violet" />
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-heading">
              Recent Debates
            </h2>
          </div>
          {debates.length > 0 && (
            <Link href="/history">
              <Button variant="outline" size="sm">
                View All →
              </Button>
            </Link>
          )}
        </div>

        {isLoadingDebates ? (
          <div className="flex justify-center py-16">
            <Spinner size="lg" />
          </div>
        ) : recentDebates.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentDebates.map((debate, i) => (
              <motion.div
                key={debate.debate_id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <DebateTopicCard
                  debate={debate}
                  onView={(id) => router.push(`/debate/${id}`)}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <Card variant="glass" className="p-16 text-center">
            <div className="space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-white/[0.04] flex items-center justify-center">
                <span className="text-4xl">🎭</span>
              </div>
              <h3 className="text-xl font-semibold text-white font-heading">
                No debates yet
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Start your first debate by entering a topic above and watch AI agents discuss it
              </p>
            </div>
          </Card>
        )}
      </section>

      {/* Call to Action */}
      {debates.length > 5 && (
        <section className="text-center py-4">
          <Card variant="glass-strong" className="max-w-2xl mx-auto p-8">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold font-heading gradient-text-hero">
                Explore More Debates
              </h3>
              <p className="text-gray-400">
                View all your past debates and their conclusions
              </p>
              <Link href="/history">
                <Button variant="primary" size="lg" className="mt-4">
                  Go to History →
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      )}
    </div>
  );
}
