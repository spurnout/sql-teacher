import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import Link from "next/link";
import { Database, ArrowLeft, BookOpen, Zap, Award, BarChart3, Users, Palette } from "lucide-react";

export const dynamic = "force-dynamic";

function FaqItem({ question, children }: { question: string; children: React.ReactNode }) {
  return (
    <details className="group border border-[var(--border)] rounded-lg overflow-hidden">
      <summary className="flex items-center justify-between px-4 py-3 cursor-pointer bg-[var(--card)] hover:bg-[var(--accent)]/30 transition-colors text-sm font-medium">
        {question}
        <span className="text-[var(--muted-foreground)] group-open:rotate-180 transition-transform">
          ▾
        </span>
      </summary>
      <div className="px-4 py-3 text-sm text-[var(--muted-foreground)] leading-relaxed border-t border-[var(--border)]">
        {children}
      </div>
    </details>
  );
}

export default async function HelpPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav bar */}
      <nav className="flex items-center justify-between px-6 py-3 border-b border-[var(--border)] bg-[var(--card)]">
        <div className="flex items-center gap-3">
          <Database className="w-4 h-4 text-[var(--cta)]" aria-hidden="true" />
          <span className="font-semibold text-sm tracking-tight">SQL Teacher</span>
          <span className="text-[var(--border)] text-xs" aria-hidden="true">/</span>
          <span className="text-xs text-[var(--muted-foreground)]">Help &amp; FAQ</span>
        </div>
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          Back to dashboard
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        <div>
          <h1 className="text-2xl font-bold mb-1">Help &amp; FAQ</h1>
          <p className="text-sm text-[var(--muted-foreground)]">
            Everything you need to know about SQL Teacher.
          </p>
        </div>

        {/* Quick Start */}
        <section>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[var(--cta)]" />
            Quick Start
          </h2>
          <div className="grid gap-3">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 flex gap-4">
              <span className="text-lg font-bold text-[var(--cta)]">1</span>
              <div>
                <p className="text-sm font-medium">Choose a database theme</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Pick a theme that matches your style — serious business, sci-fi, fantasy, or even silly. Same SQL concepts, different flavor.
                </p>
              </div>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 flex gap-4">
              <span className="text-lg font-bold text-[var(--cta)]">2</span>
              <div>
                <p className="text-sm font-medium">Work through exercises</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Start with guided worked examples, then progress to scaffolded exercises, quizzes, and open challenges. Use hints when stuck.
                </p>
              </div>
            </div>
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 flex gap-4">
              <span className="text-lg font-bold text-[var(--cta)]">3</span>
              <div>
                <p className="text-sm font-medium">Earn your certificate</p>
                <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                  Complete all 9 phases and 4 capstone projects to earn your SQL Proficiency Certificate. Share it with your team or employer.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Exercises & Modes */}
        <section>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            Exercise Types
          </h2>
          <div className="space-y-2">
            <FaqItem question="What are the different exercise modes?">
              <ul className="space-y-2 list-disc pl-4">
                <li><strong>Worked Example</strong> — Step-by-step walkthrough. Read the SQL, understand the concept, then move on. No validation required.</li>
                <li><strong>Scaffolded</strong> — Starter SQL is provided with parts to fill in. Great for building confidence.</li>
                <li><strong>Open</strong> — Write your SQL from scratch. The most challenging mode.</li>
                <li><strong>Quiz</strong> — Multiple-choice questions testing your understanding of SQL concepts.</li>
              </ul>
            </FaqItem>
            <FaqItem question="How do hints work?">
              Each exercise has up to 3 hint levels. Level 1 gives a gentle nudge, level 2 provides more direction, and level 3 gives you most of the answer. Using fewer hints earns more XP.
            </FaqItem>
            <FaqItem question="What happens when I view a solution?">
              Viewing a solution unlocks a variation of the exercise — a slightly different version that tests the same concept. This way you still have to demonstrate understanding even after peeking.
            </FaqItem>
            <FaqItem question="Can I use the SQL sandbox?">
              Yes! The sandbox lets you run any SQL query against your chosen database theme. Use it to experiment, practice, or explore the schema freely.
            </FaqItem>
          </div>
        </section>

        {/* Gamification */}
        <section>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-[var(--primary)]" />
            XP, Levels &amp; Badges
          </h2>
          <div className="space-y-2">
            <FaqItem question="How does XP work?">
              You earn XP for completing exercises. The amount depends on difficulty and mode — open exercises earn more than worked examples. Bonus XP is awarded for first-attempt completions and active streaks.
            </FaqItem>
            <FaqItem question="What are the experience levels?">
              <ul className="space-y-1 list-disc pl-4">
                <li><strong>Novice</strong> — 0 XP</li>
                <li><strong>Apprentice</strong> — 100 XP</li>
                <li><strong>Intermediate</strong> — 300 XP</li>
                <li><strong>Advanced</strong> — 600 XP</li>
                <li><strong>Expert</strong> — 1,000 XP</li>
                <li><strong>Master</strong> — 1,500+ XP</li>
              </ul>
            </FaqItem>
            <FaqItem question="How do streaks work?">
              Complete at least one exercise per day to build a streak. Your streak counter increases each consecutive day you practice. Streak bonuses add up to 70% extra XP (10% per day, capped at 7 days).
            </FaqItem>
            <FaqItem question="How many badges can I earn?">
              There are 15 badges total: one for completing each of the 9 phases, plus special badges for your first query, passing all quizzes, completing exercises without hints, building a 7-day streak, finishing the full curriculum, and earning your certificate.
            </FaqItem>
          </div>
        </section>

        {/* Assessments & Capstones */}
        <section>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            Assessments &amp; Capstones
          </h2>
          <div className="space-y-2">
            <FaqItem question="What are assessments?">
              Each phase has entry and exit assessments. Entry assessments help gauge your starting knowledge. Exit assessments verify mastery — score 70% or higher to earn a concept mastery bonus.
            </FaqItem>
            <FaqItem question="What are capstone projects?">
              Four real-world projects that test everything you&apos;ve learned: Sales Dashboard, User Retention, Database Health, and Data Quality. Complete all 9 phases to unlock them, then finish all 4 to earn your certificate.
            </FaqItem>
            <FaqItem question="How does the certificate work?">
              After completing all 4 capstone projects, you can claim your SQL Proficiency Certificate from your dashboard. Each certificate has a unique ID and a public verification URL you can share.
            </FaqItem>
          </div>
        </section>

        {/* Teams */}
        <section>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            Teams &amp; Organizations
          </h2>
          <div className="space-y-2">
            <FaqItem question="Can I use this with my team?">
              Yes! Create an organization from the Team page. Invite members with role-specific invite codes. Managers and owners can view team analytics, track progress, and identify learning bottlenecks.
            </FaqItem>
            <FaqItem question="What are custom database themes?">
              Organizations can upload their own database schemas as custom themes. This lets your team practice SQL against data that looks like your actual production database.
            </FaqItem>
          </div>
        </section>

        {/* Themes */}
        <section>
          <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            Database Themes
          </h2>
          <div className="space-y-2">
            <FaqItem question="What are database themes?">
              Themes change the data you work with — same SQL concepts, different context. Choose from Serious (SaaS business data), Professional (enterprise), Silly (humorous), Sci-Fi, or Fantasy. You can switch themes anytime from Settings.
            </FaqItem>
            <FaqItem question="Do themes affect my progress?">
              No. Your progress, XP, badges, and streaks are shared across all themes. Switching themes only changes the database content you query against.
            </FaqItem>
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section>
          <h2 className="text-base font-semibold mb-4">Keyboard Shortcuts</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg overflow-hidden">
            <div className="grid grid-cols-2 gap-px bg-[var(--border)]">
              {[
                ["Ctrl/Cmd + Enter", "Run query"],
                ["Ctrl/Cmd + K", "Search exercises"],
                ["Ctrl/Cmd + S", "Submit answer"],
                ["Escape", "Close modals"],
              ].map(([shortcut, action]) => (
                <div key={shortcut} className="bg-[var(--card)] px-4 py-2.5 flex items-center justify-between">
                  <span className="text-xs text-[var(--muted-foreground)]">{action}</span>
                  <kbd className="text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--accent)] text-[var(--muted-foreground)]">
                    {shortcut}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="pb-8">
          <h2 className="text-base font-semibold mb-4">Need More Help?</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4">
            <p className="text-sm text-[var(--muted-foreground)]">
              Reach out to your team administrator for support with account issues, custom themes, or organization settings.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
