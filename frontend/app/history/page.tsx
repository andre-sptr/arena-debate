"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DebateTopicCard } from "@/components/debate/DebateTopicCard";
import { useDebateList } from "@/hooks/useDebateList";
import { api } from "@/lib/api";

export default function HistoryPage() {
  const router = useRouter();
  const { debates, isLoading, refetch } = useDebateList({
    initialPageSize: 1000,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const debatesPerPage = 9;

  // Pagination
  const totalPages = Math.ceil(debates.length / debatesPerPage);
  const startIndex = (currentPage - 1) * debatesPerPage;
  const endIndex = startIndex + debatesPerPage;
  const currentDebates = debates.slice(startIndex, endIndex);

  const handleDelete = async (debateId: string) => {
    if (!confirm("Are you sure you want to delete this debate?")) {
      return;
    }

    setDeletingId(debateId);
    try {
      await api.deleteDebate(debateId);
      await refetch();
      if (currentDebates.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    } catch (error) {
      console.error("Failed to delete debate:", error);
      alert("Failed to delete debate. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <Spinner size="xl" />
        <div className="text-center space-y-1">
          <p className="text-gray-300 font-medium">Loading debate history...</p>
          <p className="text-xs text-gray-500">Retrieving your debates</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-1 h-6 rounded-full bg-gradient-to-b from-arena-cyan to-arena-violet" />
            <h1 className="text-3xl sm:text-4xl font-bold text-white font-heading">
              Debate History
            </h1>
          </div>
          <p className="text-gray-500 pl-[19px]">
            {debates.length} {debates.length === 1 ? "debate" : "debates"} total
          </p>
        </div>
        <Button onClick={() => router.push("/")} variant="outline" size="sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          Home
        </Button>
      </motion.div>

      {/* Debates List */}
      {debates.length === 0 ? (
        <Card variant="glass" className="p-16 text-center">
          <div className="space-y-4">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/[0.04] flex items-center justify-center">
              <span className="text-4xl">📚</span>
            </div>
            <h2 className="text-2xl font-bold text-white font-heading">
              No debates yet
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Start your first debate to see it appear here
            </p>
            <Button onClick={() => router.push("/")} variant="primary" className="mt-4">
              Start a Debate
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {/* Debates Grid */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {currentDebates.map((debate, i) => (
              <motion.div
                key={debate.debate_id}
                className="relative group"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <DebateTopicCard debate={debate} />
                {/* Delete Button Overlay */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDelete(debate.debate_id);
                    }}
                    disabled={deletingId === debate.debate_id}
                    className="h-8 w-8 p-0"
                  >
                    {deletingId === debate.debate_id ? (
                      <Spinner size="sm" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    )}
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <Card variant="glass" className="p-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>

                <div className="flex items-center gap-1.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <Button
                        key={page}
                        variant={page === currentPage ? "primary" : "ghost"}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                        className="min-w-[36px] h-9"
                      >
                        {page}
                      </Button>
                    )
                  )}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>
              </div>

              <div className="text-center text-xs text-gray-500 mt-3">
                Page {currentPage} of {totalPages} • Showing {startIndex + 1}-
                {Math.min(endIndex, debates.length)} of {debates.length} debates
              </div>
            </Card>
          )}
        </>
      )}

      {/* Statistics Card */}
      {debates.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card variant="glass-strong" className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-1 h-5 rounded-full bg-gradient-to-b from-arena-gold to-arena-violet" />
              <h3 className="text-lg font-bold text-white font-heading">Statistics</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { value: debates.length, label: "Total Debates", color: "text-arena-cyan" },
                { value: debates.filter((d) => d.status === "completed").length, label: "Completed", color: "text-emerald-400" },
                { value: debates.filter((d) => d.status === "in_progress").length, label: "In Progress", color: "text-arena-violet" },
                { value: debates.reduce((sum, d) => sum + d.total_arguments, 0), label: "Total Arguments", color: "text-arena-gold" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="text-center p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]"
                >
                  <div className={`text-2xl sm:text-3xl font-bold font-heading ${stat.color}`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

// Made with Bob
