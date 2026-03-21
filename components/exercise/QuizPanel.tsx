"use client";

import Markdown from "react-markdown";
import { CheckCircle, XCircle } from "lucide-react";
import type { QuizOption } from "@/lib/exercises/types";

const OPTION_LABELS = ["A", "B", "C", "D"];

interface Props {
  readonly options: readonly QuizOption[];
  readonly explanation: string;
  readonly answeredOptionId: string | null;
  readonly onAnswer: (optionId: string, isCorrect: boolean) => void;
}

export default function QuizPanel({
  options,
  explanation,
  answeredOptionId,
  onAnswer,
}: Props) {
  const hasAnswered = answeredOptionId !== null;

  return (
    <div className="space-y-2.5">
      {options.map((option, idx) => {
        const label = OPTION_LABELS[idx] ?? String(idx + 1);
        const isSelected = answeredOptionId === option.id;
        const isAnsweredCorrect = hasAnswered && option.isCorrect;
        const isAnsweredWrong = hasAnswered && isSelected && !option.isCorrect;

        let className =
          "w-full text-left px-3 py-2.5 rounded-md border text-sm transition-all duration-150 flex items-start gap-2.5";

        if (!hasAnswered) {
          className +=
            " bg-[var(--accent)]/30 border-[var(--border)] hover:bg-[var(--accent)]/60 hover:border-[var(--border)]/80 cursor-pointer";
        } else if (isAnsweredCorrect) {
          className +=
            " bg-[var(--cta)]/10 border-[var(--cta)]/40 text-[var(--cta)] cursor-default";
        } else if (isAnsweredWrong) {
          className +=
            " bg-red-500/10 border-red-500/30 text-red-400 cursor-default";
        } else {
          className +=
            " bg-[var(--accent)]/10 border-[var(--border)]/40 text-[var(--muted-foreground)] opacity-60 cursor-default";
        }

        return (
          <button
            key={option.id}
            className={className}
            onClick={() => !hasAnswered && onAnswer(option.id, option.isCorrect)}
            disabled={hasAnswered}
          >
            <span
              className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold mt-0.5 ${
                isAnsweredCorrect
                  ? "border-[var(--cta)] text-[var(--cta)]"
                  : isAnsweredWrong
                    ? "border-red-500 text-red-400"
                    : "border-[var(--border)] text-[var(--muted-foreground)]"
              }`}
            >
              {hasAnswered && isAnsweredCorrect ? (
                <CheckCircle className="w-3.5 h-3.5" aria-hidden="true" />
              ) : hasAnswered && isAnsweredWrong ? (
                <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
              ) : (
                label
              )}
            </span>
            <span className="leading-relaxed">{option.text}</span>
          </button>
        );
      })}

      {hasAnswered && explanation && (
        <div className="mt-3 p-3 bg-[var(--accent)]/30 border border-[var(--border)]/60 rounded-md">
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1.5">
            Explanation
          </p>
          <div className="prose prose-sm prose-invert max-w-none [&_code]:text-blue-300 [&_code]:text-xs [&_strong]:text-[var(--foreground)] [&_p]:text-[var(--foreground)]/90 [&_p]:m-0">
            <Markdown>{explanation}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
