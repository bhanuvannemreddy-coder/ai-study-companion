import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../api/client";
import ProjectNav from "../../components/layout/ProjectNav";

function ProjectDashboard() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [mastery, setMastery] = useState(null);
  const [growth, setGrowth] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [materials, setMaterials] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadDashboard();
  }, [projectId]);

  async function loadDashboard(isRefresh = false) {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        projectResult,
        analyticsResult,
        masteryResult,
        growthResult,
        recommendationsResult,
        materialsResult,
      ] = await Promise.allSettled([
        api.get(`/api/projects/${projectId}`),
        api.get(`/api/projects/${projectId}/analytics`),
        api.get(`/api/projects/${projectId}/mastery`),
        api.get(`/api/projects/${projectId}/growth`),
        api.get(`/api/projects/${projectId}/recommendations`),
        api.get(`/api/projects/${projectId}/materials`),
      ]);

      // ------------------------------------------------------------
      // PROJECT
      // ------------------------------------------------------------

      if (projectResult.status === "fulfilled") {
        setProject(projectResult.value.data);
      } else {
        throw projectResult.reason;
      }

      // ------------------------------------------------------------
      // ANALYTICS
      // ------------------------------------------------------------

      if (analyticsResult.status === "fulfilled") {
        setAnalytics(analyticsResult.value.data);
      } else {
        console.error("Project analytics failed:", analyticsResult.reason);
        setAnalytics(null);
      }

      // ------------------------------------------------------------
      // MASTERY
      // ------------------------------------------------------------

      if (masteryResult.status === "fulfilled") {
        setMastery(masteryResult.value.data);
      } else {
        console.error("Project mastery failed:", masteryResult.reason);
        setMastery(null);
      }

      // ------------------------------------------------------------
      // GROWTH
      // ------------------------------------------------------------

      if (growthResult.status === "fulfilled") {
        setGrowth(growthResult.value.data);
      } else {
        console.error("Project growth failed:", growthResult.reason);
        setGrowth(null);
      }

      // ------------------------------------------------------------
      // RECOMMENDATIONS
      // ------------------------------------------------------------

      if (recommendationsResult.status === "fulfilled") {
        setRecommendations(recommendationsResult.value.data);
      } else {
        console.error(
          "Project recommendations failed:",
          recommendationsResult.reason,
        );
        setRecommendations(null);
      }

      // ------------------------------------------------------------
      // MATERIALS
      // ------------------------------------------------------------

      if (materialsResult.status === "fulfilled") {
        const data = materialsResult.value.data;

        setMaterials(
          Array.isArray(data)
            ? data
            : Array.isArray(data?.materials)
              ? data.materials
              : [],
        );
      } else {
        console.error("Project materials failed:", materialsResult.reason);
        setMaterials([]);
      }
    } catch (error) {
      console.error("Failed to load project dashboard:", error);

      setError(
        error.response?.data?.detail || "Unable to load the project dashboard.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading project dashboard...
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="text-center">
          <p className="text-sm text-red-400">
            {error || "Project could not be loaded."}
          </p>

          <Link
            to="/home"
            className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  // ============================================================
  // LIVE DATA
  // ============================================================

  const analyticsSummary = analytics?.summary || {};

  const analyticsConcepts = analytics?.concept_trends || [];

  const recentActivity = analytics?.recent_activity || [];

  const quizPerformance = analytics?.quiz_performance || [];

  // Mastery endpoint is the source of truth for mastery.
  const masteryConcepts = Array.isArray(mastery?.concepts)
    ? mastery.concepts
    : [];

  const conceptData =
    masteryConcepts.length > 0 ? masteryConcepts : analyticsConcepts;

  const overallMastery =
    typeof mastery?.overall_mastery === "number"
      ? mastery.overall_mastery
      : Number(analyticsSummary.overall_mastery || 0);

  const conceptsTracked =
    masteryConcepts.length > 0
      ? masteryConcepts.length
      : Number(
          analyticsSummary.concepts_tracked || analyticsConcepts.length || 0,
        );

  // Materials come directly from the materials endpoint.
  const materialsTotal = materials.length;

  const materialsReady = materials.filter(
    (material) => material.status === "ready",
  ).length;

  const materialsProcessing = materials.filter(
    (material) =>
      material.status === "queued" || material.status === "processing",
  ).length;

  const materialsFailed = materials.filter(
    (material) => material.status === "failed",
  ).length;

  const questionsAnswered = Number(analyticsSummary.questions_answered || 0);

  const quizAttempts = Number(analyticsSummary.quiz_attempts || 0);

  const completedQuizzes = Number(analyticsSummary.completed_quizzes || 0);

  const averageQuizScore = Number(analyticsSummary.average_quiz_score || 0);

  // ============================================================
  // GROWTH
  // ============================================================

  const improvingConcepts = Array.isArray(growth?.improving)
    ? growth.improving
    : [];

  const stableConcepts = Array.isArray(growth?.stable) ? growth.stable : [];

  const attentionFromGrowth = Array.isArray(growth?.needs_attention)
    ? growth.needs_attention
    : [];

  const attentionConcepts = conceptData
    .filter(
      (concept) =>
        concept.trend === "needs_attention" ||
        Number(concept.mastery_score || 0) < 60,
    )
    .slice(0, 5);

  const finalAttentionConcepts =
    attentionConcepts.length > 0
      ? attentionConcepts
      : attentionFromGrowth.slice(0, 5);

  // ============================================================
  // RECOMMENDATIONS
  // ============================================================

  const recommendationList = Array.isArray(recommendations?.recommendations)
    ? recommendations.recommendations
    : Array.isArray(recommendations)
      ? recommendations
      : Array.isArray(growth?.recommendations)
        ? growth.recommendations
        : [];

  const recommendation = getNextRecommendation({
    projectId,
    materialsTotal,
    materialsReady,
    materialsProcessing,
    materialsFailed,
    questionsAnswered,
    conceptsTracked,
    overallMastery,
    recommendationList,
  });

  // ============================================================
  // IMPORTANT CONCEPTS
  // ============================================================

  const importantConcepts = [...conceptData]
    .sort((a, b) => Number(a.mastery_score || 0) - Number(b.mastery_score || 0))
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* ====================================================== */}
        {/* HEADER */}
        {/* ====================================================== */}

        <div className="flex items-center justify-between gap-4">
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>

          <button
            type="button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-400 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`}
            />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        <header className="mt-8">
          <p className="text-sm font-medium text-indigo-400">
            Learning project
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {project.name}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
            {project.description ||
              project.learning_goal ||
              "Your focused learning workspace."}
          </p>
        </header>

        <div className="mt-8">
          <ProjectNav projectId={projectId} />
        </div>

        {/* ====================================================== */}
        {/* TOP OVERVIEW */}
        {/* ====================================================== */}

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            icon={Target}
            label="Overall progress"
            value={`${Math.round(overallMastery)}%`}
            description={
              conceptsTracked > 0
                ? `${conceptsTracked} concepts tracked`
                : "No mastery evidence yet"
            }
          />

          <MetricCard
            icon={Brain}
            label="Concepts"
            value={conceptsTracked}
            description={
              conceptsTracked > 0
                ? "Concept mastery is being tracked"
                : "Complete a quiz to build mastery"
            }
          />

          <MetricCard
            icon={FileText}
            label="Materials"
            value={materialsTotal}
            description={
              materialsProcessing > 0
                ? `${materialsReady} ready · ${materialsProcessing} processing`
                : materialsFailed > 0
                  ? `${materialsReady} ready · ${materialsFailed} failed`
                  : `${materialsReady} ready`
            }
          />

          <MetricCard
            icon={CheckCircle2}
            label="Quiz performance"
            value={`${Math.round(averageQuizScore)}%`}
            description={
              completedQuizzes > 0
                ? `${completedQuizzes} completed`
                : "No completed quiz yet"
            }
          />
        </section>

        {/* ====================================================== */}
        {/* LEARNING PROGRESS + LATEST ACTIVITY */}
        {/* ====================================================== */}

        <section className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <SectionHeading
              icon={TrendingUp}
              title="Learning progress"
              text="Your current project-level learning state."
            />

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Overall mastery</span>

                <span className="text-sm font-semibold text-white">
                  {Math.round(overallMastery)}%
                </span>
              </div>

              <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{
                    width: `${Math.min(100, Math.max(0, overallMastery))}%`,
                  }}
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <ProgressStat
                  label="Materials"
                  value={`${materialsReady}/${materialsTotal}`}
                  text={
                    materialsProcessing > 0
                      ? `${materialsProcessing} processing`
                      : "ready"
                  }
                />

                <ProgressStat
                  label="Quiz attempts"
                  value={quizAttempts}
                  text={
                    completedQuizzes > 0
                      ? `${completedQuizzes} completed`
                      : "started"
                  }
                />

                <ProgressStat
                  label="Questions"
                  value={questionsAnswered}
                  text="answered"
                />
              </div>
            </div>
          </section>

          {/* ==================================================== */}
          {/* LATEST ACTIVITY */}
          {/* ==================================================== */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <SectionHeading
              icon={Activity}
              title="Latest activity"
              text="Your most recent project activity."
            />

            {recentActivity.length === 0 ? (
              <EmptyState text="No learning activity recorded yet." />
            ) : (
              <div className="mt-5 space-y-4">
                {recentActivity.slice(0, 5).map((item, index) => (
                  <ActivityRow
                    key={`${item.created_at || "activity"}-${index}`}
                    item={item}
                  />
                ))}
              </div>
            )}
          </section>
        </section>

        {/* ====================================================== */}
        {/* CONTINUE LEARNING */}
        {/* ====================================================== */}

        <section className="mt-6 rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.04] p-6">
          <div className="flex items-start justify-between gap-5">
            <div className="flex gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Continue learning
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  {recommendation.title}
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {recommendation.description}
                </p>
              </div>
            </div>

            <Link
              to={recommendation.href}
              className="hidden shrink-0 items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 sm:inline-flex"
            >
              {recommendation.action}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <Link
            to={recommendation.href}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 sm:hidden"
          >
            {recommendation.action}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        {/* ====================================================== */}
        {/* IMPORTANT CONCEPTS + ATTENTION */}
        {/* ====================================================== */}

        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <SectionHeading
              icon={Brain}
              title="Important concepts"
              text="Current concept-level learning evidence."
            />

            {importantConcepts.length === 0 ? (
              <EmptyState text="Complete a quiz to create concept mastery evidence." />
            ) : (
              <div className="mt-5 space-y-4">
                {importantConcepts.map((concept) => (
                  <ConceptRow key={concept.concept} concept={concept} />
                ))}
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <SectionHeading
              icon={Clock3}
              title="Areas requiring attention"
              text="Concepts that currently need more practice."
            />

            {finalAttentionConcepts.length === 0 ? (
              <EmptyState
                text={
                  conceptsTracked > 0
                    ? "No concepts are currently flagged."
                    : "Complete an assessment to identify areas requiring attention."
                }
              />
            ) : (
              <div className="mt-5 space-y-3">
                {finalAttentionConcepts.map((concept) => (
                  <AttentionRow key={concept.concept} concept={concept} />
                ))}
              </div>
            )}
          </section>
        </section>

        {/* ====================================================== */}
        {/* LEARNING PERFORMANCE */}
        {/* ====================================================== */}

        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <SectionHeading
            icon={BarChart3}
            title="Learning performance"
            text="Recent assessment performance for this project."
          />

          {quizPerformance.length === 0 ? (
            <EmptyState text="Complete a quiz to see assessment performance here." />
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[600px] text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-600">
                    <th className="px-3 py-3">Attempt</th>

                    <th className="px-3 py-3">Score</th>

                    <th className="px-3 py-3">Questions</th>

                    <th className="px-3 py-3">Date</th>
                  </tr>
                </thead>

                <tbody>
                  {quizPerformance.slice(0, 5).map((item, index) => (
                    <tr
                      key={`${item.attempt_id || index}-${item.created_at || index}`}
                      className="border-b border-slate-900"
                    >
                      <td className="px-3 py-4 text-sm text-slate-300">
                        Quiz {quizPerformance.length - index}
                      </td>

                      <td className="px-3 py-4 text-sm font-semibold text-white">
                        {Math.round(Number(item.score_percent || 0))}%
                      </td>

                      <td className="px-3 py-4 text-sm text-slate-400">
                        {item.question_count ?? 0}
                      </td>

                      <td className="px-3 py-4 text-sm text-slate-500">
                        {formatDate(item.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* ====================================================== */}
        {/* LEARNING WORKFLOW */}
        {/* ====================================================== */}

        <section className="mt-6 pb-10">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Learning workflow</h2>

            <p className="mt-1 text-sm text-slate-500">
              Move through your project without losing context.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <WorkflowCard
              icon={FileText}
              title="Materials"
              to={`/projects/${projectId}/materials`}
              active
            />

            <WorkflowCard
              icon={Brain}
              title="Tutor"
              to={`/projects/${projectId}/tutor`}
            />

            <WorkflowCard
              icon={Target}
              title="Quiz"
              to={`/projects/${projectId}/quiz`}
            />

            <WorkflowCard
              icon={CheckCircle2}
              title="Assessment"
              to={`/projects/${projectId}/quiz`}
            />

            <WorkflowCard
              icon={TrendingUp}
              title="Growth"
              to={`/projects/${projectId}/growth`}
            />

            <WorkflowCard
              icon={BarChart3}
              title="Analytics"
              to={`/projects/${projectId}/analytics`}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

// ================================================================
// COMPONENTS
// ================================================================

function MetricCard({ icon: Icon, label, value, description }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950">
          <Icon className="h-4 w-4 text-indigo-400" />
        </div>
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-2 text-2xl font-bold text-white">{value}</p>

      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function SectionHeading({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950">
        <Icon className="h-4 w-4 text-indigo-400" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-white">{title}</h2>

        <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

function ProgressStat({ label, value, text }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
      <p className="text-xs text-slate-600">{label}</p>

      <p className="mt-2 text-lg font-semibold text-white">{value}</p>

      <p className="mt-1 text-xs text-slate-600">{text}</p>
    </div>
  );
}

function ActivityRow({ item }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-950">
        <Activity className="h-3.5 w-3.5 text-sky-400" />
      </div>

      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-300">
          {item.title || item.type || "Learning activity"}
        </p>

        <p className="mt-1 text-xs leading-5 text-slate-500">
          {item.description || "Project activity recorded."}
        </p>

        {item.created_at && (
          <p className="mt-1 text-[11px] text-slate-700">
            {formatDate(item.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

function ConceptRow({ concept }) {
  const score = Math.min(100, Math.max(0, Number(concept.mastery_score || 0)));

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
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
            width: `${score}%`,
          }}
        />
      </div>

      <div className="mt-1 flex items-center justify-between">
        <span className="text-[11px] text-slate-700">
          {concept.evidence_count ?? 0} evidence
        </span>

        <span
          className={
            concept.trend === "improving"
              ? "text-[11px] text-emerald-400"
              : concept.trend === "needs_attention"
                ? "text-[11px] text-amber-400"
                : "text-[11px] text-slate-600"
          }
        >
          {formatTrend(concept.trend)}
        </span>
      </div>
    </div>
  );
}

function AttentionRow({ concept }) {
  return (
    <div className="rounded-xl border border-amber-500/10 bg-amber-500/[0.03] p-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-300">{concept.concept}</p>

        <span className="text-xs font-semibold text-amber-400">
          {Math.round(Number(concept.mastery_score || 0))}%
        </span>
      </div>

      <p className="mt-1 text-xs text-slate-600">
        {concept.trend === "needs_attention"
          ? "This concept is currently flagged for attention."
          : "Additional practice may be useful."}
      </p>
    </div>
  );
}

function WorkflowCard({ icon: Icon, title, to, active = false }) {
  return (
    <Link
      to={to}
      className={`rounded-2xl border p-4 transition ${
        active
          ? "border-indigo-500/30 bg-indigo-500/[0.06]"
          : "border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/70"
      }`}
    >
      <Icon
        className={`h-5 w-5 ${active ? "text-indigo-400" : "text-slate-500"}`}
      />

      <p className="mt-3 text-sm font-medium text-slate-300">{title}</p>
    </Link>
  );
}

function EmptyState({ text }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-800 p-5">
      <p className="text-sm text-slate-500">{text}</p>
    </div>
  );
}

// ================================================================
// NEXT ACTION
// ================================================================

function getNextRecommendation({
  projectId,
  materialsTotal,
  materialsReady,
  materialsProcessing,
  materialsFailed,
  questionsAnswered,
  conceptsTracked,
  overallMastery,
  recommendationList,
}) {
  if (recommendationList.length > 0) {
    const first = recommendationList[0];

    return {
      title: first.title || first.message || "Continue your learning",

      description:
        first.description ||
        first.reason ||
        "Follow the recommended next learning action.",

      action: first.action || "Continue",

      href: first.href || `/projects/${projectId}/growth`,
    };
  }

  if (materialsTotal === 0) {
    return {
      title: "Add your first learning material",

      description:
        "Upload a PDF so the project can build searchable learning evidence.",

      action: "Open Materials",

      href: `/projects/${projectId}/materials`,
    };
  }

  if (materialsFailed > 0) {
    return {
      title: "Review failed material processing",

      description:
        "One or more learning materials could not be processed successfully.",

      action: "Open Materials",

      href: `/projects/${projectId}/materials`,
    };
  }

  if (materialsProcessing > 0 || materialsReady < materialsTotal) {
    return {
      title: "Finish processing your learning material",

      description:
        "Your project has material that is still being processed before it becomes searchable.",

      action: "Open Materials",

      href: `/projects/${projectId}/materials`,
    };
  }

  if (questionsAnswered === 0) {
    return {
      title: "Test your understanding",

      description:
        "Your materials are ready. Take a quiz to create the first assessment evidence for this project.",

      action: "Start Quiz",

      href: `/projects/${projectId}/quiz`,
    };
  }

  if (conceptsTracked > 0 && overallMastery < 60) {
    return {
      title: "Strengthen your weaker concepts",

      description:
        "Your current mastery evidence suggests that additional practice could help.",

      action: "Open Growth",

      href: `/projects/${projectId}/growth`,
    };
  }

  return {
    title: "Continue learning with Tutor",

    description:
      "Review your project material and ask the Tutor about the concepts you are currently studying.",

    action: "Open Tutor",

    href: `/projects/${projectId}/tutor`,
  };
}

// ================================================================
// HELPERS
// ================================================================

function formatTrend(trend) {
  if (trend === "improving") {
    return "Improving";
  }

  if (trend === "needs_attention") {
    return "Needs attention";
  }

  return "Stable";
}

function formatDate(value) {
  if (!value) {
    return "—";
  }

  try {
    return new Date(value).toLocaleString();
  } catch {
    return "—";
  }
}

export default ProjectDashboard;
