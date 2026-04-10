"use client";

import { AlertTriangle, Inbox } from "lucide-react";

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-base-500/40 bg-base-800/85 p-10 text-center">
      <Inbox size={24} className="mb-3 text-base-400" />
      <p className="text-base-100">{title}</p>
      <p className="mt-1 text-sm text-base-400">{description}</p>
    </div>
  );
}

export function ErrorState({
  message,
  action,
}: {
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-rose-500/25 bg-rose-500/10 p-4 text-sm text-rose-200">
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} />
        <p>{message}</p>
      </div>
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  );
}

export function SkeletonState() {
  return (
    <div className="space-y-3">
      <div className="h-24 animate-pulse rounded-xl bg-base-700/60" />
      <div className="h-24 animate-pulse rounded-xl bg-base-700/60" />
    </div>
  );
}
