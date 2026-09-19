import {
  AlertCircle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  Brain,
  CheckCircle2,
  Clock3,
  Lightbulb,
  LoaderCircle,
  RefreshCw,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../../api/client";
import ProjectNav from "../../components/layout/ProjectNav";

function Growth() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);

  const [mastery, setMastery] = useState(null);

  const [growth, setGrowth] = useState(null);

  const [recommendations, setRecommendations] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    loadGrowthData();
  }, [projectId]);

  async function loadGrowthData({ background = false } = {}) {
    try {
      if (background) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const [
        projectResponse,
        masteryResponse,
        growthResponse,
        recommendationResponse,
      ] = await Promise.all([
        api.get(`/api/projects/${projectId}`),

        api.get(`/api/projects/${projectId}/mastery`),

        api.get(`/api/projects/${projectId}/growth`),

        api.get(`/api/projects/${projectId}/recommendations`),
      ]);

      setProject(projectResponse.data);

      setMastery(masteryResponse.data);

      setGrowth(growthResponse.data);

      setRecommendations(recommendationResponse.data);
    } catch (requestError) {
      console.error("Failed to load growth data:", requestError);

      setError(
        requestError.response?.data?.detail ||
          "Unable to load learning progress.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  const concepts = mastery?.concepts || [];

  const improving = growth?.improving || [];

  const stable = growth?.stable || [];

  const needsAttention = growth?.needs_attention || [];

  const recommendationItems = recommendations?.recommendations || [];

  const hasMastery = concepts.length > 0;

  const overallMastery = Number(mastery?.overall_mastery || 0);

  const conceptAverage = concepts.length
    ? concepts.reduce(
        (sum, concept) => sum + Number(concept.mastery_score || 0),
        0,
      ) / concepts.length
    : 0;

  const strongestConcepts = [...concepts]
    .sort((a, b) => Number(b.mastery_score || 0) - Number(a.mastery_score || 0))
    .slice(0, 3);

  const attentionConcepts = [...concepts]
    .sort((a, b) => Number(a.mastery_score || 0) - Number(b.mastery_score || 0))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading growth...
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />

          <p className="mt-4 text-sm text-slate-500">
            {error || "Project not found."}
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
              loadGrowthData({
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
              <TrendingUp className="h-6 w-6 text-indigo-400" />
            </div>

            <div className="min-w-0">
              <p className="text-sm font-medium text-indigo-400">
                {project.name}
              </p>

              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                Growth & Mastery
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                See what you understand, how your concepts are changing, and
                what to focus on next.
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
        {/* TOP SUMMARY */}
        {/* ================================================= */}

        <section className="mt-8">
          <div className="grid gap-4 md:grid-cols-3">
            <SummaryCard
              icon={<Brain className="h-5 w-5" />}
              label="Overall mastery"
              value={hasMastery ? `${Math.round(overallMastery)}%` : "—"}
              helper={
                hasMastery
                  ? "Current estimated mastery"
                  : "No assessment evidence yet"
              }
            />

            <SummaryCard
              icon={<BookOpen className="h-5 w-5" />}
              label="Concepts tracked"
              value={concepts.length}
              helper={
                concepts.length
                  ? "Concepts with assessment evidence"
                  : "Complete a quiz to begin"
              }
            />

            <SummaryCard
              icon={<Target className="h-5 w-5" />}
              label="Needs attention"
              value={needsAttention.length}
              helper={
                needsAttention.length
                  ? "Concepts currently flagged"
                  : "Nothing currently flagged"
              }
            />
          </div>
        </section>

        {/* ================================================= */}
        {/* OVERALL MASTERY */}
        {/* ================================================= */}

        <section className="mt-6">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Overall estimated mastery
                </p>

                <div className="mt-2 flex items-end gap-3">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {hasMastery ? `${Math.round(overallMastery)}%` : "—"}
                  </span>

                  {hasMastery && (
                    <span className="mb-1 text-xs text-slate-600">
                      based on available assessment evidence
                    </span>
                  )}
                </div>
              </div>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10">
                <Brain className="h-7 w-7 text-indigo-400" />
              </div>
            </div>

            {hasMastery ? (
              <>
                <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(0, overallMastery))}%`,
                    }}
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-slate-600">Current estimate</span>

                  <span className="text-slate-500">
                    Concept average {Math.round(conceptAverage)}%
                  </span>
                </div>

                <p className="mt-4 text-xs leading-5 text-slate-600">
                  Mastery is an estimate based on available learning evidence
                  and can change as you complete additional assessments.
                </p>
              </>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/40 p-5">
                <div className="flex items-start gap-3">
                  <Target className="mt-0.5 h-5 w-5 shrink-0 text-indigo-400" />

                  <div>
                    <p className="text-sm font-medium text-slate-300">
                      Your mastery has not been measured yet.
                    </p>

                    <p className="mt-1 text-sm leading-6 text-slate-600">
                      Complete a quiz to create the first assessment evidence
                      for this project.
                    </p>

                    <Link
                      to={`/projects/${projectId}/quiz`}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                    >
                      <Brain className="h-4 w-4" />
                      Take a Quiz
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================================================= */}
        {/* CONCEPT MASTERY */}
        {/* ================================================= */}

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Concept mastery</h2>

              <p className="mt-1 text-sm text-slate-500">
                Your current evidence for concepts covered by assessments.
              </p>
            </div>

            {hasMastery && (
              <span className="text-xs text-slate-600">
                {concepts.length}{" "}
                {concepts.length === 1 ? "concept" : "concepts"} tracked
              </span>
            )}
          </div>

          {!hasMastery ? (
            <EmptySection
              icon={BookOpen}
              title="No concept evidence yet"
              text="Complete a quiz and your concept-level mastery will appear here."
              action={
                <Link
                  to={`/projects/${projectId}/quiz`}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  Take a Quiz
                </Link>
              }
            />
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                {concepts.map((concept) => (
                  <ConceptCard key={concept.concept} concept={concept} />
                ))}
              </div>

              {/* Strongest + attention snapshots */}

              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <ConceptSnapshot
                  title="Higher mastery concepts"
                  icon={<ArrowUpRight className="h-4 w-4 text-emerald-400" />}
                  items={strongestConcepts}
                  emptyText="No concept evidence yet."
                />

                <ConceptSnapshot
                  title="Lower mastery concepts"
                  icon={<ArrowDownRight className="h-4 w-4 text-amber-400" />}
                  items={attentionConcepts}
                  emptyText="No concept evidence yet."
                />
              </div>
            </>
          )}
        </section>

        {/* ================================================= */}
        {/* GROWTH ANALYSIS */}
        {/* ================================================= */}

        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Growth analysis</h2>

            <p className="mt-1 text-sm text-slate-500">
              Understand which concepts are improving, stable, or need
              attention.
            </p>
          </div>

          {!growth ||
          (!improving.length && !stable.length && !needsAttention.length) ? (
            <EmptySection
              icon={TrendingUp}
              title="Growth will appear after assessment"
              text="We need assessment evidence before we can identify meaningful concept trends."
            />
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              <GrowthColumn
                title="Improving"
                subtitle="Positive movement"
                icon={ArrowUpRight}
                iconClass="text-emerald-400"
                items={improving}
                emptyText="No improving concepts yet."
                trendClass="text-emerald-400"
              />

              <GrowthColumn
                title="Stable"
                subtitle="Little recent change"
                icon={Clock3}
                iconClass="text-slate-400"
                items={stable}
                emptyText="No stable concepts yet."
                trendClass="text-slate-400"
              />

              <GrowthColumn
                title="Needs attention"
                subtitle="Review may help"
                icon={ArrowDownRight}
                iconClass="text-amber-400"
                items={needsAttention}
                emptyText="Nothing currently flagged."
                trendClass="text-amber-400"
              />
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* RECOMMENDATIONS */}
        {/* ================================================= */}

        <section className="mt-10 pb-10">
          <div className="mb-5">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-indigo-400" />

              <h2 className="text-lg font-semibold">
                Recommended next actions
              </h2>
            </div>

            <p className="mt-1 text-sm text-slate-500">
              Turn your current learning state into a practical next step.
            </p>
          </div>

          {recommendationItems.length ? (
            <div className="space-y-3">
              {recommendationItems.map((recommendation, index) => (
                <RecommendationCard
                  key={`${recommendation.title}-${index}`}
                  recommendation={recommendation}
                />
              ))}
            </div>
          ) : (
            <EmptySection
              icon={Lightbulb}
              title="No recommendations yet"
              text="Complete more learning activity and assessments to generate useful next actions."
            />
          )}
        </section>
      </main>
    </div>
  );
}

/* ========================================================= */
/* SUMMARY CARD */
/* ========================================================= */

function SummaryCard({ icon, label, value, helper }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
          {icon}
        </div>

        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-700">
          Growth
        </span>
      </div>

      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-slate-600">
        {label}
      </p>

      <p className="mt-1 text-2xl font-bold text-white">{value}</p>

      <p className="mt-1 text-xs leading-5 text-slate-700">{helper}</p>
    </div>
  );
}

/* ========================================================= */
/* CONCEPT CARD */
/* ========================================================= */

function ConceptCard({ concept }) {
  const score = Number(concept.mastery_score || 0);

  const trendConfig = {
    improving: {
      label: "Improving",
      className: "bg-emerald-500/10 text-emerald-400",
    },

    stable: {
      label: "Stable",
      className: "bg-slate-800 text-slate-400",
    },

    needs_attention: {
      label: "Needs attention",
      className: "bg-amber-500/10 text-amber-400",
    },
  };

  const trend = trendConfig[concept.trend] || trendConfig.stable;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-200">
            {concept.concept}
          </h3>

          <p className="mt-1 text-xs text-slate-600">
            {concept.evidence_count}{" "}
            {concept.evidence_count === 1
              ? "evidence point"
              : "evidence points"}
          </p>
        </div>

        <div
          className={`shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium ${trend.className}`}
        >
          {trend.label}
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between">
        <span className="text-2xl font-bold text-white">
          {Math.round(score)}%
        </span>

        {concept.previous_score !== null &&
          concept.previous_score !== undefined && (
            <span className="text-xs text-slate-600">
              Previous {Math.round(concept.previous_score)}%
            </span>
          )}
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500"
          style={{
            width: `${Math.min(100, Math.max(0, score))}%`,
          }}
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="text-slate-700">Current estimate</span>

        {concept.change !== undefined &&
          concept.change !== null &&
          concept.change !== 0 && (
            <span
              className={
                concept.change > 0 ? "text-emerald-400" : "text-amber-400"
              }
            >
              {concept.change > 0 ? "+" : ""}
              {Math.round(concept.change)}%
            </span>
          )}
      </div>
    </div>
  );
}

/* ========================================================= */
/* CONCEPT SNAPSHOT */
/* ========================================================= */

function ConceptSnapshot({ title, icon, items, emptyText }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-5">
      <div className="flex items-center gap-2">
        {icon}

        <h3 className="text-sm font-semibold text-slate-300">{title}</h3>
      </div>

      {items.length === 0 ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-2">
          {items.map((item) => (
            <div
              key={item.concept}
              className="flex items-center justify-between gap-3 rounded-xl bg-slate-950/50 px-3 py-2.5"
            >
              <span className="truncate text-xs font-medium text-slate-400">
                {item.concept}
              </span>

              <span className="shrink-0 text-xs font-semibold text-slate-300">
                {Math.round(item.mastery_score || 0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ========================================================= */
/* GROWTH COLUMN */
/* ========================================================= */

function GrowthColumn({
  title,
  subtitle,
  icon: Icon,
  iconClass,
  items,
  emptyText,
  trendClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950">
          <Icon className={`h-4 w-4 ${iconClass}`} />
        </div>

        <div>
          <h3 className="text-sm font-semibold">{title}</h3>

          <p className="mt-0.5 text-xs text-slate-700">{subtitle}</p>
        </div>

        <span className="ml-auto rounded-lg bg-slate-950 px-2 py-1 text-xs text-slate-600">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-5 text-sm leading-6 text-slate-600">{emptyText}</p>
      ) : (
        <div className="mt-4 space-y-3">
          {items.map((item) => (
            <div
              key={item.concept}
              className="rounded-xl border border-slate-800 bg-slate-950/40 p-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="truncate text-sm font-medium text-slate-300">
                  {item.concept}
                </p>

                <span
                  className={`shrink-0 text-sm font-semibold ${trendClass}`}
                >
                  {Math.round(item.mastery_score || 0)}%
                </span>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(0, item.mastery_score || 0),
                    )}%`,
                  }}
                />
              </div>

              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-slate-700">
                  {item.evidence_count} evidence
                </span>

                {item.change !== undefined &&
                  item.change !== null &&
                  item.change !== 0 && (
                    <span
                      className={
                        item.change > 0 ? "text-emerald-400" : "text-amber-400"
                      }
                    >
                      {item.change > 0 ? "+" : ""}
                      {Math.round(item.change)}%
                    </span>
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
/* RECOMMENDATION */
/* ========================================================= */

function RecommendationCard({ recommendation }) {
  const priority = recommendation.priority || "normal";

  const priorityConfig = {
    high: {
      label: "High priority",
      className: "bg-amber-500/10 text-amber-400",
    },

    medium: {
      label: "Recommended",
      className: "bg-indigo-500/10 text-indigo-400",
    },

    low: {
      label: "Suggested",
      className: "bg-slate-800 text-slate-400",
    },
  };

  const config = priorityConfig[priority] || priorityConfig.medium;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
          <Lightbulb className="h-5 w-5 text-indigo-400" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">
              {recommendation.title}
            </h3>

            <span
              className={`rounded-lg px-2 py-1 text-[11px] font-medium ${config.className}`}
            >
              {config.label}
            </span>
          </div>

          {recommendation.reason && (
            <p className="mt-2 text-sm leading-6 text-slate-500">
              {recommendation.reason}
            </p>
          )}

          {recommendation.action && (
            <div className="mt-3 rounded-xl bg-slate-950/60 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <Zap className="h-3.5 w-3.5 text-indigo-400" />

                <p className="text-xs font-medium text-slate-600">
                  Suggested action
                </p>
              </div>

              <p className="mt-1 text-sm leading-6 text-slate-300">
                {recommendation.action}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* EMPTY SECTION */
/* ========================================================= */

function EmptySection({ icon: Icon, title, text, action }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/20 px-6 py-12 text-center">
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900">
        <Icon className="h-5 w-5 text-slate-600" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-slate-300">{title}</h3>

      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
        {text}
      </p>

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export default Growth;
