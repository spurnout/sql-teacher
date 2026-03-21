"use client";

import { useRef, useCallback, useState } from "react";
import Link from "next/link";
import {
  Database,
  Download,
  CheckCircle,
  ExternalLink,
  Linkedin,
  Share2,
  Copy,
  Check,
} from "lucide-react";

interface CapstoneEntry {
  readonly completedAt: string;
  readonly exerciseCount: number;
}

interface AssessmentScore {
  readonly phaseId: string;
  readonly entryScore: number | null;
  readonly exitScore: number | null;
}

interface Props {
  readonly certificateId: string;
  readonly username: string;
  readonly issuedAt: string;
  readonly totalXP: number;
  readonly level: string;
  readonly capstoneData: Record<string, CapstoneEntry>;
  readonly learningPath?: string | null;
  readonly assessmentScores?: readonly AssessmentScore[];
}

const CAPSTONE_TITLES: Record<string, string> = {
  "capstone-sales": "Sales Dashboard Architect",
  "capstone-retention": "User Retention Analyst",
  "capstone-db-health": "Database Health Inspector",
  "capstone-data-quality": "Data Quality Detective",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "sql.irolled20.com";

export default function CertificateClient({
  certificateId,
  username,
  issuedAt,
  totalXP,
  level,
  capstoneData,
  learningPath,
  assessmentScores,
}: Props) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleDownload = useCallback(async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(certRef.current, {
        quality: 1,
        pixelRatio: 2,
        backgroundColor: "#0a0a0f",
      });
      const link = document.createElement("a");
      link.download = `sql-teacher-certificate-${username}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to generate certificate image:", err);
      setDownloadError(true);
    } finally {
      setDownloading(false);
    }
  }, [username]);

  const handleCopyLink = useCallback(async () => {
    const url = `https://${SITE_URL}/certificate/${certificateId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [certificateId]);

  const handleLinkedIn = useCallback(() => {
    const certUrl = encodeURIComponent(
      `https://${SITE_URL}/certificate/${certificateId}`
    );
    const title = encodeURIComponent("SQL Proficiency Certificate");
    const issuer = encodeURIComponent("SQL Teacher");
    const url = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${title}&organizationName=${issuer}&certUrl=${certUrl}`;
    window.open(url, "_blank");
  }, [certificateId]);

  const issuedDate = new Date(issuedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Average assessment exit scores
  const avgExitScore =
    assessmentScores && assessmentScores.length > 0
      ? Math.round(
          assessmentScores
            .filter((s) => s.exitScore !== null)
            .reduce((sum, s) => sum + (s.exitScore ?? 0), 0) /
            Math.max(
              1,
              assessmentScores.filter((s) => s.exitScore !== null).length
            )
        )
      : null;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col items-center justify-center p-8">
      {/* Certificate card */}
      <div
        ref={certRef}
        className="w-full max-w-2xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#2a2a3a] rounded-2xl p-10 shadow-2xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Database className="w-6 h-6 text-emerald-400" />
            <span className="text-sm font-semibold tracking-widest text-[#888] uppercase">
              SQL Teacher
            </span>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            SQL Proficiency Certificate
          </h1>
          <p className="text-sm text-[#666] mt-2">This certifies that</p>
        </div>

        {/* Recipient */}
        <div className="text-center mb-8">
          <p className="text-2xl font-bold text-white mb-1">{username}</p>
          <p className="text-sm text-[#888]">
            has demonstrated proficiency in PostgreSQL by completing the full SQL
            Teacher curriculum and all capstone projects.
          </p>
          {learningPath && (
            <p className="text-xs text-emerald-400/70 mt-2 font-medium">
              Learning Path: {learningPath}
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className={`grid ${avgExitScore !== null ? "grid-cols-4" : "grid-cols-3"} gap-3 mb-8`}>
          <div className="text-center bg-[#15151f] rounded-lg py-3 px-2 border border-[#222]">
            <p className="text-[10px] text-[#666] uppercase tracking-wide mb-1">
              Level
            </p>
            <p className="text-lg font-bold text-white">{level}</p>
          </div>
          <div className="text-center bg-[#15151f] rounded-lg py-3 px-2 border border-[#222]">
            <p className="text-[10px] text-[#666] uppercase tracking-wide mb-1">
              Total XP
            </p>
            <p className="text-lg font-bold text-amber-400">{totalXP}</p>
          </div>
          {avgExitScore !== null && (
            <div className="text-center bg-[#15151f] rounded-lg py-3 px-2 border border-[#222]">
              <p className="text-[10px] text-[#666] uppercase tracking-wide mb-1">
                Avg Score
              </p>
              <p className="text-lg font-bold text-emerald-400">{avgExitScore}%</p>
            </div>
          )}
          <div className="text-center bg-[#15151f] rounded-lg py-3 px-2 border border-[#222]">
            <p className="text-[10px] text-[#666] uppercase tracking-wide mb-1">
              Issued
            </p>
            <p className="text-sm font-bold text-white">{issuedDate}</p>
          </div>
        </div>

        {/* Assessment Scores (if available) */}
        {assessmentScores && assessmentScores.length > 0 && (
          <div className="mb-8">
            <p className="text-xs text-[#666] uppercase tracking-wide mb-3 text-center">
              Assessment Scores
            </p>
            <div className="grid grid-cols-3 gap-2">
              {assessmentScores
                .filter((s) => s.exitScore !== null)
                .map((score) => (
                  <div
                    key={score.phaseId}
                    className="flex items-center gap-2 bg-[#15151f] rounded-lg px-3 py-2 border border-[#222]"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-medium text-[#999] truncate">
                        {score.phaseId.replace("phase-", "Phase ")}
                      </p>
                    </div>
                    <p
                      className={`text-sm font-bold ${
                        (score.exitScore ?? 0) >= 70
                          ? "text-emerald-400"
                          : "text-amber-400"
                      }`}
                    >
                      {score.exitScore}%
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Capstone completions */}
        <div className="mb-8">
          <p className="text-xs text-[#666] uppercase tracking-wide mb-3 text-center">
            Capstone Projects Completed
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(capstoneData).map(([capId, data]) => (
              <div
                key={capId}
                className="flex items-center gap-2 bg-[#15151f] rounded-lg px-3 py-2 border border-[#222]"
              >
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-white">
                    {CAPSTONE_TITLES[capId] ?? capId}
                  </p>
                  <p className="text-[10px] text-[#666]">
                    {data.exerciseCount} exercises
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center border-t border-[#222] pt-6">
          <p className="text-[10px] text-[#555] font-mono">
            Certificate ID: {certificateId}
          </p>
          <p className="text-[10px] text-[#555] mt-1">
            Verify at{" "}
            <span className="text-[#777]">
              https://{SITE_URL}/certificate/{certificateId.slice(0, 8)}...
            </span>
          </p>
        </div>
      </div>

      {/* Actions below card */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          {downloading ? "Generating..." : "Download PNG"}
        </button>

        <button
          onClick={handleLinkedIn}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0a66c2] text-white text-sm font-medium hover:bg-[#0952a5] transition-colors cursor-pointer"
        >
          <Linkedin className="w-4 h-4" />
          Add to LinkedIn
        </button>

        <button
          onClick={handleCopyLink}
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#333] text-sm text-[#888] hover:text-white hover:border-[#555] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-400" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Link
            </>
          )}
        </button>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#333] text-sm text-[#888] hover:text-white hover:border-[#555] transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Dashboard
        </Link>
      </div>

      {downloadError && (
        <p className="text-xs text-red-400 mt-2">
          Failed to generate image. Try again or use a screenshot instead.
        </p>
      )}
    </div>
  );
}
