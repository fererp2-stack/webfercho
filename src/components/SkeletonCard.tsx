import React from "react";

export function SkeletonPromptCard() {
  return (
    <div
      className="rounded-2xl p-5 border shadow-sm animate-pulse flex flex-col justify-between h-[210px]"
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-main)",
      }}
    >
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </div>
        <div className="h-4.5 w-3/4 bg-zinc-300 dark:bg-zinc-700 rounded-md mb-3" />
        <div className="space-y-1.5 mb-4">
          <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-3 w-5/6 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-3 w-2/3 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </div>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="h-9 w-24 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
          <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonIdeaCard({ height = "h-64" }: { height?: string }) {
  return (
    <div
      className={`rounded-2xl overflow-hidden border shadow-sm animate-pulse mb-5 ${height}`}
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-main)",
      }}
    >
      <div className="w-full h-3/5 bg-zinc-200 dark:bg-zinc-800" />
      <div className="p-4 space-y-2.5">
        <div className="h-3 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-4 w-4/5 bg-zinc-300 dark:bg-zinc-700 rounded" />
        <div className="h-3 w-full bg-zinc-200 dark:bg-zinc-800 rounded" />
      </div>
    </div>
  );
}
