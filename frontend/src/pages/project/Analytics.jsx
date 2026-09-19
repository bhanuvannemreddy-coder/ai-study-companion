import {
  Activity,
  AlertCircle,
  ArrowLeft,
  BarChart3,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCw,
  Target,
  Trophy,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router-dom";

import api from "../../api/client";
import ProjectNav from "../../components/layout/ProjectNav";

function Analytics() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);

  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, [projectId]);

  async function loadAnalytics({ background = false } = {}) {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [projectResponse, analyticsResponse] = await Promise.all([
        api.get(`/api/projects/${projectId}`),

        api.get(`/api/projects/${projectId}/analytics`),
      ]);

      setProject(projectResponse.data);

      setAnalytics(analyticsResponse.data);
    } catch (requestError) {
      console.error("Failed to load analytics:", requestError);

      setError(
        requestError.response?.data?.detail ||
          "Unable to load project analytics.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const summary = analytics?.summary || {};

  const quizPerformance = analytics?.quiz_performance || [];

  const conceptTrends = analytics?.concept_trends || [];

  const recentActivity = analytics?.recent_activity || [];

  const strongestConcepts = [...conceptTrends]
    .sort((a, b) => Number(b.mastery_score || 0) - Number(a.mastery_score || 0))
    .slice(0, 3);

  const attentionConcepts = [...conceptTrends]
    .sort((a, b) => Number(a.mastery_score || 0) - Number(b.mastery_score || 0))
    .slice(0, 3);

  const quizAverage = Number(summary.average_quiz_score || 0);

  const latestQuiz = quizPerformance.length
    ? quizPerformance[quizPerformance.length - 1]
    : null;

  const previousQuiz =
    quizPerformance.length > 1
      ? quizPerformance[quizPerformance.length - 2]
      : null;

  const quizChange =
    latestQuiz && previousQuiz
      ? Number(latestQuiz.score_percent || 0) -
        Number(previousQuiz.score_percent || 0)
      : null;

  const activityBreakdown = useMemo(() => {
    const counts = {};

    recentActivity.forEach((activity) => {
      const type = activity.type || "other";

      counts[type] = (counts[type] || 0) + 1;
    });

    return counts;
  }, [recentActivity]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading analytics...
        </div>
      </div>
    );
  }

  if (!project || !analytics) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />

          <p className="mt-4 text-sm text-slate-500">
            {error || "Analytics could not be loaded."}
          </p>

          <Link
            to="/home"
            className="mt-5 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div className="flex items-center justify-between gap-4">
          <Link
            to={`/projects/${projectId}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to project
          </Link>

          <button
            type="button"
            onClick={() =>
              loadAnalytics({
                background: true,
              })
            }
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        <header className="mt-8">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10 ring-1 ring-indigo-400/10">
              <BarChart3 className="h-6 w-6 text-indigo-400" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-indigo-400">
                {project.name}
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Learning Analytics
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                A project-level view of your study activity, assessment
                performance, and concept progress.
              </p>
            </div>
          </div>
        </header>

        {/* ================================================= */}
        {/* PROJECT NAV */}
        {/* ================================================= */}

        <div className="mt-8">
          <ProjectNav projectId={projectId} />
        </div>

        {/* ================================================= */}
        {/* ERROR */}
        {/* ================================================= */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />

            <span>{error}</span>
          </div>
        )}

        {/* ================================================= */}
        {/* TOP METRICS */}
        {/* ================================================= */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Target}
            label="Overall mastery"
            value={`${Math.round(Number(summary.overall_mastery || 0))}%`}
            note={
              summary.concepts_tracked
                ? `${summary.concepts_tracked} concepts tracked`
                : "No mastery evidence yet"
            }
          />

          <MetricCard
            icon={Trophy}
            label="Average quiz score"
            value={`${Math.round(quizAverage)}%`}
            note={
              summary.completed_quizzes
                ? `${summary.completed_quizzes} completed`
                : "No completed quizzes yet"
            }
          />

          <MetricCard
            icon={FileText}
            label="Learning materials"
            value={summary.materials_total || 0}
            note={`${summary.materials_ready || 0} ready`}
          />

          <MetricCard
            icon={Activity}
            label="Questions answered"
            value={summary.questions_answered || 0}
            note={`${summary.quiz_attempts || 0} quiz attempts`}
          />
        </section>

        {/* ================================================= */}
        {/* INSIGHT ROW */}
        {/* ================================================= */}

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          <InsightCard
            icon={TrendingUp}
            iconClass="text-emerald-400"
            title="Strongest concepts"
            value={
              strongestConcepts.length
                ? strongestConcepts.map((item) => item.concept).join(", ")
                : "No concept evidence yet"
            }
            description={
              strongestConcepts.length
                ? "Highest current mastery estimates."
                : "Complete assessments to build concept evidence."
            }
          />

          <InsightCard
            icon={TrendingDown}
            iconClass="text-amber-400"
            title="Concepts to review"
            value={
              attentionConcepts.length
                ? attentionConcepts.map((item) => item.concept).join(", ")
                : "No concepts flagged"
            }
            description={
              attentionConcepts.length
                ? "These concepts currently have lower mastery estimates."
                : "There is not enough evidence to identify review areas."
            }
          />

          <InsightCard
            icon={BarChart3}
            iconClass="text-indigo-400"
            title="Latest quiz"
            value={
              latestQuiz
                ? `${Math.round(Number(latestQuiz.score_percent || 0))}%`
                : "—"
            }
            description={
              quizChange === null
                ? "No previous quiz available for comparison."
                : quizChange > 0
                  ? `Up ${Math.round(
                      quizChange,
                    )} percentage points from the previous quiz.`
                  : quizChange < 0
                    ? `Down ${Math.abs(
                        Math.round(quizChange),
                      )} percentage points from the previous quiz.`
                    : "Same score as the previous quiz."
            }
          />
        </section>

        {/* ================================================= */}
        {/* MAIN ANALYTICS */}
        {/* ================================================= */}

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <QuizPerformance items={quizPerformance} />

          <ConceptOverview concepts={conceptTrends} />
        </section>

        {/* ================================================= */}
        {/* ACTIVITY SUMMARY */}
        {/* ================================================= */}

        <section className="mt-8">
          <ActivitySummary
            activityBreakdown={activityBreakdown}
            total={recentActivity.length}
          />
        </section>

        {/* ================================================= */}
        {/* RECENT ACTIVITY */}
        {/* ================================================= */}

        <section className="mt-6 pb-10">
          <ActivityPanel activities={recentActivity} />
        </section>
      </main>
    </div>
  );
}

/* ========================================================= */
/* METRIC CARD */
/* ========================================================= */

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
          <Icon className="h-4 w-4 text-indigo-400" />
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-600">{note}</p>
    </div>
  );
}

/* ========================================================= */
/* INSIGHT CARD */
/* ========================================================= */

function InsightCard({ icon: Icon, iconClass, title, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950">
          <Icon className={`h-4 w-4 ${iconClass}`} />
        </div>

        <p className="text-sm font-semibold text-slate-300">{title}</p>
      </div>

      <p className="mt-4 text-sm font-medium leading-6 text-slate-200">
        {value}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>
    </div>
  );
}

/* ========================================================= */
/* QUIZ PERFORMANCE */
/* ========================================================= */

function QuizPerformance({ items }) {
  const recentItems = [...items].reverse().slice(0, 6);

  const highestScore = items.length
    ? Math.max(...items.map((item) => Number(item.score_percent || 0)))
    : 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-500/10">
          <BarChart3 className="h-4 w-4 text-violet-400" />
        </div>

        <div>
          <h2 className="text-sm font-semibold">Assessment performance</h2>

          <p className="mt-1 text-xs text-slate-600">
            Recent completed quizzes
          </p>
        </div>
      </div>

      {items.length === 0 ? (
        <EmptyAnalytics
          icon={Trophy}
          text="Complete a quiz to start building an assessment history."
        />
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <SmallMetric
              label="Highest score"
              value={`${Math.round(highestScore)}%`}
            />

            <SmallMetric label="Quizzes" value={items.length} />
          </div>

          <div className="mt-6 space-y-4">
            {recentItems.map((item, index) => {
              const score = Number(item.score_percent || 0);

              return (
                <div key={item.attempt_id || index}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">
                      Quiz {items.length - index}
                    </span>

                    <span className="font-semibold text-slate-200">
                      {Math.round(score)}%
                    </span>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, score))}%`,
                      }}
                    />
                  </div>

                  <p className="mt-1 text-xs text-slate-600">
                    {item.question_count} questions
                  </p>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

/* ========================================================= */
/* CONCEPT OVERVIEW */
/* ========================================================= */

function ConceptOverview({ concepts }) {
  const sorted = [...concepts].sort(
    (a, b) => Number(a.mastery_score || 0) - Number(b.mastery_score || 0),
  );

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
          <TrendingUp className="h-4 w-4 text-emerald-400" />
        </div>

        <div>
          <h2 className="text-sm font-semibold">Concept trends</h2>

          <p className="mt-1 text-xs text-slate-600">
            Current mastery evidence by concept
          </p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyAnalytics
          icon={Target}
          text="Complete a quiz to create concept-level mastery evidence."
        />
      ) : (
        <div className="mt-5 space-y-4">
          {sorted.map((concept) => {
            const score = Number(concept.mastery_score || 0);

            return (
              <div key={concept.concept}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm text-slate-300">
                    {concept.concept}
                  </span>

                  <span className="shrink-0 text-xs font-semibold text-slate-400">
                    {Math.round(score)}%
                  </span>
                </div>

                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                    style={{
                      width: `${Math.min(100, Math.max(0, score))}%`,
                    }}
                  />
                </div>

                <div className="mt-1 flex items-center justify-between text-xs">
                  <span className="text-slate-600">
                    {concept.evidence_count || 0} evidence
                  </span>

                  <span className={getTrendClass(concept.trend)}>
                    {formatTrend(concept.trend)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ========================================================= */
/* ACTIVITY SUMMARY */
/* ========================================================= */

function ActivitySummary({ activityBreakdown, total }) {
  const materialCount = activityBreakdown.material || 0;

  const quizCount = activityBreakdown.quiz || 0;

  const assessmentCount = activityBreakdown.assessment || 0;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-200">
            Activity overview
          </h2>

          <p className="mt-1 text-xs text-slate-600">
            Recent events recorded for this project
          </p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
          <Activity className="h-4 w-4 text-sky-400" />
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ActivityStat
          label="Total recent events"
          value={total}
          icon={<Activity className="h-4 w-4" />}
        />

        <ActivityStat
          label="Material events"
          value={materialCount}
          icon={<FileText className="h-4 w-4" />}
        />

        <ActivityStat
          label="Quiz events"
          value={quizCount}
          icon={<Trophy className="h-4 w-4" />}
        />

        <ActivityStat
          label="Assessment events"
          value={assessmentCount}
          icon={<CheckCircle2 className="h-4 w-4" />}
        />
      </div>
    </div>
  );
}

/* ========================================================= */
/* ACTIVITY STAT */
/* ========================================================= */

function ActivityStat({ label, value, icon }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="text-slate-600">{icon}</span>

        <span className="text-xs text-slate-600">{label}</span>
      </div>

      <p className="mt-2 text-lg font-bold text-slate-300">{value}</p>
    </div>
  );
}

/* ========================================================= */
/* ACTIVITY PANEL */
/* ========================================================= */

function ActivityPanel({ activities }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10">
          <Activity className="h-4 w-4 text-sky-400" />
        </div>

        <div>
          <h2 className="text-sm font-semibold">Recent project activity</h2>

          <p className="mt-1 text-xs text-slate-600">
            Recent learning and assessment events
          </p>
        </div>
      </div>

      {activities.length === 0 ? (
        <EmptyAnalytics
          icon={Activity}
          text="Your recent project activity will appear here."
        />
      ) : (
        <div className="mt-5 divide-y divide-slate-800">
          {activities.map((activity, index) => (
            <div
              key={`${activity.type || "event"}-${activity.created_at || index}-${index}`}
              className="flex gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950">
                <ActivityIcon type={activity.type} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-slate-300">
                    {activity.title}
                  </p>

                  <p className="shrink-0 text-[11px] text-slate-700">
                    {formatDate(activity.created_at)}
                  </p>
                </div>

                {activity.description && (
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {activity.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========================================================= */
/* ACTIVITY ICON */
/* ========================================================= */

function ActivityIcon({ type }) {
  const normalized = String(type || "").toLowerCase();

  if (normalized.includes("material")) {
    return <FileText className="h-4 w-4 text-violet-400" />;
  }

  if (normalized.includes("quiz") || normalized.includes("assessment")) {
    return <Trophy className="h-4 w-4 text-emerald-400" />;
  }

  if (normalized.includes("tutor")) {
    return <TrendingUp className="h-4 w-4 text-indigo-400" />;
  }

  return <Activity className="h-4 w-4 text-sky-400" />;
}

/* ========================================================= */
/* SMALL METRIC */
/* ========================================================= */

function SmallMetric({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-slate-700">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-300">{value}</p>
    </div>
  );
}

/* ========================================================= */
/* EMPTY ANALYTICS */
/* ========================================================= */

function EmptyAnalytics({ icon: Icon, text }) {
  return (
    <div className="py-12 text-center">
      <Icon className="mx-auto h-7 w-7 text-slate-700" />

      <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
        {text}
      </p>
    </div>
  );
}

/* ========================================================= */
/* TREND HELPERS */
/* ========================================================= */

function formatTrend(trend) {
  if (trend === "improving") {
    return "Improving";
  }

  if (trend === "needs_attention") {
    return "Needs attention";
  }

  return "Stable";
}

function getTrendClass(trend) {
  if (trend === "improving") {
    return "text-emerald-400";
  }

  if (trend === "needs_attention") {
    return "text-amber-400";
  }

  return "text-slate-600";
}

/* ========================================================= */
/* DATE */
/* ========================================================= */

function formatDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default Analytics;
