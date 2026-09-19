import {
  Activity,
  AlertCircle,
  Brain,
  CheckCircle2,
  Clock3,
  Database,
  FileText,
  Gauge,
  LoaderCircle,
  Network,
  RefreshCw,
  Server,
  ShieldCheck,
  Sparkles,
  Users,
  XCircle,
  Zap,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

function AdminDashboard() {
  const { user } = useAuth();

  const [data, setData] = useState(null);

  const [aiUsageSummary, setAiUsageSummary] = useState(null);

  const [aiUsage, setAiUsage] = useState([]);

  const [aiEvaluationSummary, setAiEvaluationSummary] = useState(null);

  const [aiEvaluations, setAiEvaluations] = useState([]);

  const [loading, setLoading] = useState(true);

  const [aiLoading, setAiLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [aiError, setAiError] = useState("");

  useEffect(() => {
    loadDashboard();
    loadAIObservability();
  }, []);

  async function refreshAll() {
    setRefreshing(true);

    await Promise.all([
      loadDashboard({
        background: true,
      }),
      loadAIObservability({
        background: true,
      }),
    ]);

    setRefreshing(false);
  }

  async function loadDashboard({ background = false } = {}) {
    try {
      if (!background) {
        setLoading(true);
      }

      setError("");

      const response = await api.get("/api/admin/dashboard");

      setData(response.data);
    } catch (requestError) {
      console.error("Failed to load admin dashboard:", requestError);

      setError(
        requestError.response?.data?.detail ||
          "Unable to load admin dashboard.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function loadAIObservability({ background = false } = {}) {
    try {
      if (!background) {
        setAiLoading(true);
      }

      setAiError("");

      const [
        usageSummaryResponse,
        usageResponse,
        evaluationSummaryResponse,
        evaluationResponse,
      ] = await Promise.all([
        api.get("/api/admin/ai-usage/summary"),

        api.get("/api/admin/ai-usage?limit=100"),

        api.get("/api/admin/ai-evaluations/summary"),

        api.get("/api/admin/ai-evaluations?limit=100"),
      ]);

      setAiUsageSummary(usageSummaryResponse.data);

      setAiUsage(Array.isArray(usageResponse.data) ? usageResponse.data : []);

      setAiEvaluationSummary(evaluationSummaryResponse.data);

      setAiEvaluations(
        Array.isArray(evaluationResponse.data) ? evaluationResponse.data : [],
      );
    } catch (requestError) {
      console.error("Failed to load AI observability:", requestError);

      setAiError(
        requestError.response?.data?.detail ||
          "Unable to load AI observability.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  const usageStats = useMemo(() => {
    if (!aiUsage.length) {
      return {
        averageLatency: 0,
        totalTokens: 0,
        successful: 0,
        failed: 0,
        featureCounts: {},
      };
    }

    let latencyTotal = 0;
    let latencyCount = 0;
    let totalTokens = 0;
    let successful = 0;
    let failed = 0;

    const featureCounts = {};

    aiUsage.forEach((item) => {
      if (typeof item.latency_ms === "number") {
        latencyTotal += item.latency_ms;

        latencyCount += 1;
      }

      totalTokens += Number(item.total_tokens || 0);

      if (item.success) {
        successful += 1;
      } else {
        failed += 1;
      }

      const feature = item.feature || "unknown";

      featureCounts[feature] = (featureCounts[feature] || 0) + 1;
    });

    return {
      averageLatency: latencyCount ? latencyTotal / latencyCount : 0,

      totalTokens,

      successful,

      failed,

      featureCounts,
    };
  }, [aiUsage]);

  const featureRows = useMemo(() => {
    return Object.entries(usageStats.featureCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 8);
  }, [usageStats.featureCounts]);

  const successRate = aiUsage.length
    ? Math.round((usageStats.successful / aiUsage.length) * 100)
    : Number(aiUsageSummary?.success_rate || 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-2 text-sm">
          <LoaderCircle className="h-4 w-4 animate-spin" />
          Loading admin dashboard...
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-8 w-8 text-red-400" />

          <p className="mt-4 text-sm text-red-300">
            {error || "Unable to load dashboard."}
          </p>

          <button
            type="button"
            onClick={() => loadDashboard()}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  const { overview = {}, users = [], activity = [], system = {} } = data;

  const materialProcessing = system.material_processing || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <header>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
                Admin
              </div>

              <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                Platform Overview
              </h1>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                Users, learning activity, assessments, AI observability,
                material processing, and system health.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3">
                <p className="text-xs text-slate-600">Signed in as</p>

                <p className="mt-1 text-sm font-medium text-slate-300">
                  {user?.email || "Admin"}
                </p>
              </div>

              <button
                type="button"
                onClick={refreshAll}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-3 text-sm font-medium text-slate-400 transition hover:border-slate-700 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </header>

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
        {/* PLATFORM METRICS */}
        {/* ================================================= */}

        <section className="mt-8">
          <SectionLabel>Platform</SectionLabel>

          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Users}
              label="Users"
              value={overview.users || 0}
            />

            <MetricCard
              icon={Network}
              label="Spaces"
              value={overview.spaces || 0}
            />

            <MetricCard
              icon={Brain}
              label="Projects"
              value={overview.projects || 0}
            />

            <MetricCard
              icon={FileText}
              label="Materials"
              value={overview.materials_total || 0}
              note={`${overview.materials_ready || 0} ready`}
            />
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Zap}
              label="Quiz attempts"
              value={overview.quiz_attempts || 0}
              note={`${overview.completed_quizzes || 0} completed`}
            />

            <MetricCard
              icon={CheckCircle2}
              label="Average quiz score"
              value={`${Math.round(Number(overview.average_quiz_score || 0))}%`}
            />

            <MetricCard
              icon={Brain}
              label="Overall mastery"
              value={`${Math.round(Number(overview.overall_mastery || 0))}%`}
              note={`${overview.concepts_tracked || 0} concepts tracked`}
            />

            <MetricCard
              icon={Activity}
              label="Questions answered"
              value={overview.questions_answered || 0}
            />
          </div>
        </section>

        {/* ================================================= */}
        {/* ACTIVITY + SYSTEM */}
        {/* ================================================= */}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* Recent activity */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <SectionHeading
              icon={Activity}
              title="Recent activity"
              text="Latest learning activity across the platform."
            />

            {activity.length === 0 ? (
              <EmptyState text="No platform activity yet." />
            ) : (
              <div className="mt-5 divide-y divide-slate-800">
                {activity.map((item, index) => (
                  <div
                    key={`${item.type || "event"}-${item.created_at || index}-${index}`}
                    className="flex gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950">
                      <ActivityIcon type={item.type} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-300">
                        {item.title || "Activity"}
                      </p>

                      {item.description && (
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {item.description}
                        </p>
                      )}

                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-700">
                        {item.user_email && <span>{item.user_email}</span>}

                        {item.project_name && <span>{item.project_name}</span>}

                        <span>{formatDate(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* System health */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <SectionHeading
              icon={Server}
              title="System health"
              text="Operational signals exposed by the backend."
            />

            <div className="mt-5 space-y-3">
              <HealthRow
                icon={Database}
                label="PostgreSQL"
                value={system.database || "unknown"}
              />

              <HealthRow
                icon={Network}
                label="Redis"
                value={system.redis || "unknown"}
              />

              <HealthRow
                icon={Brain}
                label="AI provider"
                value={system.ai_provider || "unknown"}
                neutral
              />

              <HealthRow
                icon={Zap}
                label="AI model"
                value={system.ai_model || "unknown"}
                neutral
              />
            </div>

            <div className="mt-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Material processing
              </p>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <StatusCard
                  label="Ready"
                  value={materialProcessing.ready || 0}
                  className="text-emerald-400"
                />

                <StatusCard
                  label="Processing"
                  value={materialProcessing.processing || 0}
                  className="text-indigo-400"
                />

                <StatusCard
                  label="Queued"
                  value={materialProcessing.queued || 0}
                  className="text-amber-400"
                />

                <StatusCard
                  label="Failed"
                  value={materialProcessing.failed || 0}
                  className="text-red-400"
                />
              </div>
            </div>
          </section>
        </section>

        {/* ================================================= */}
        {/* AI OBSERVABILITY */}
        {/* ================================================= */}

        <section className="mt-8">
          <SectionHeading
            icon={Sparkles}
            title="AI observability"
            text="Request-level telemetry and application-level evaluation signals."
          />

          {aiLoading ? (
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/30 p-8">
              <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Loading AI observability...
              </div>
            </div>
          ) : aiError ? (
            <div className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 px-5 py-5">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-red-400" />

                <div>
                  <p className="text-sm font-medium text-red-300">
                    AI observability could not be loaded.
                  </p>

                  <p className="mt-1 text-xs leading-5 text-red-300/70">
                    {aiError}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-5 space-y-6">
              {/* AI usage */}

              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
                    <Gauge className="h-4 w-4 text-indigo-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold">AI usage</h2>

                    <p className="mt-1 text-xs text-slate-600">
                      Request volume, latency, tokens, and feature distribution.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    icon={Gauge}
                    label="AI requests"
                    value={aiUsageSummary?.total_requests ?? aiUsage.length}
                    note={`${usageStats.successful} successful`}
                  />

                  <MetricCard
                    icon={CheckCircle2}
                    label="Success rate"
                    value={`${successRate}%`}
                    note={`${usageStats.failed} failed in the loaded records`}
                  />

                  <MetricCard
                    icon={Clock3}
                    label="Average latency"
                    value={`${Math.round(usageStats.averageLatency)} ms`}
                  />

                  <MetricCard
                    icon={Zap}
                    label="Total tokens"
                    value={usageStats.totalTokens.toLocaleString()}
                  />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
                  {/* Feature breakdown */}

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Requests by feature
                    </p>

                    {featureRows.length === 0 ? (
                      <EmptyState text="No AI requests recorded yet." />
                    ) : (
                      <div className="mt-4 space-y-4">
                        {featureRows.map(([feature, count]) => {
                          const total = aiUsage.length || 1;

                          const percent = Math.round((count / total) * 100);

                          return (
                            <div key={feature}>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-400">
                                  {formatFeatureName(feature)}
                                </span>

                                <span className="text-slate-600">{count}</span>
                              </div>

                              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                                <div
                                  className="h-full rounded-full bg-indigo-500"
                                  style={{
                                    width: `${percent}%`,
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Recent AI requests */}

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Recent AI requests
                      </p>

                      <span className="text-[11px] text-slate-700">
                        Latest 100
                      </span>
                    </div>

                    {aiUsage.length === 0 ? (
                      <EmptyState text="No AI requests recorded yet." />
                    ) : (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[760px] text-left">
                          <thead>
                            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-600">
                              <th className="px-3 py-3">Feature</th>

                              <th className="px-3 py-3">Model</th>

                              <th className="px-3 py-3">Latency</th>

                              <th className="px-3 py-3">Tokens</th>

                              <th className="px-3 py-3">Status</th>

                              <th className="px-3 py-3">Time</th>
                            </tr>
                          </thead>

                          <tbody>
                            {aiUsage.slice(0, 12).map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-slate-800/70 last:border-0"
                              >
                                <td className="px-3 py-3 text-sm text-slate-400">
                                  {formatFeatureName(item.feature)}
                                </td>

                                <td className="max-w-[180px] truncate px-3 py-3 text-xs text-slate-600">
                                  {item.model || "—"}
                                </td>

                                <td className="px-3 py-3 text-xs text-slate-500">
                                  {item.latency_ms != null
                                    ? `${Math.round(item.latency_ms)} ms`
                                    : "—"}
                                </td>

                                <td className="px-3 py-3 text-xs text-slate-500">
                                  {item.total_tokens != null
                                    ? Number(item.total_tokens).toLocaleString()
                                    : "—"}
                                </td>

                                <td className="px-3 py-3">
                                  {item.success ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Success
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-red-400">
                                      <XCircle className="h-3.5 w-3.5" />
                                      Failed
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-3 text-[11px] text-slate-700">
                                  {formatDate(item.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* AI evaluation */}

              <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10">
                    <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold">AI evaluation</h2>

                    <p className="mt-1 text-xs text-slate-600">
                      Application-level checks for groundedness, citations, and
                      unsupported-question handling.
                    </p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    icon={Gauge}
                    label="Evaluations"
                    value={aiEvaluationSummary?.total_evaluations ?? 0}
                  />

                  <MetricCard
                    icon={CheckCircle2}
                    label="Pass rate"
                    value={`${Math.round(
                      Number(aiEvaluationSummary?.pass_rate || 0),
                    )}%`}
                  />

                  <MetricCard
                    icon={Brain}
                    label="Grounded"
                    value={aiEvaluationSummary?.grounded_responses ?? 0}
                  />

                  <MetricCard
                    icon={FileText}
                    label="Citation rate"
                    value={`${Math.round(
                      Number(aiEvaluationSummary?.citation_rate || 0),
                    )}%`}
                  />
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-[0.75fr_1.25fr]">
                  {/* Signals */}

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                      Evaluation signals
                    </p>

                    <div className="mt-4 space-y-3">
                      <EvaluationRow
                        label="Grounded responses"
                        value={aiEvaluationSummary?.grounded_responses ?? 0}
                      />

                      <EvaluationRow
                        label="Citation present"
                        value={aiEvaluationSummary?.citation_present ?? 0}
                      />

                      <EvaluationRow
                        label="Unsupported handled"
                        value={aiEvaluationSummary?.unsupported_handled ?? 0}
                      />

                      <EvaluationRow
                        label="Failed evaluations"
                        value={aiEvaluationSummary?.failed ?? 0}
                      />
                    </div>
                  </div>

                  {/* Records */}

                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Recent evaluations
                      </p>

                      <span className="text-[11px] text-slate-700">
                        Latest 100
                      </span>
                    </div>

                    {aiEvaluations.length === 0 ? (
                      <EmptyState text="No AI evaluations recorded yet." />
                    ) : (
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left">
                          <thead>
                            <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-600">
                              <th className="px-3 py-3">Feature</th>

                              <th className="px-3 py-3">Grounded</th>

                              <th className="px-3 py-3">Citation</th>

                              <th className="px-3 py-3">Unsupported</th>

                              <th className="px-3 py-3">Result</th>

                              <th className="px-3 py-3">Sources</th>

                              <th className="px-3 py-3">Time</th>
                            </tr>
                          </thead>

                          <tbody>
                            {aiEvaluations.slice(0, 12).map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-slate-800/70 last:border-0"
                              >
                                <td className="px-3 py-3 text-sm text-slate-400">
                                  {formatFeatureName(item.feature)}
                                </td>

                                <td className="px-3 py-3">
                                  <BooleanBadge value={item.grounded} />
                                </td>

                                <td className="px-3 py-3">
                                  <BooleanBadge value={item.citation_present} />
                                </td>

                                <td className="px-3 py-3">
                                  <BooleanBadge
                                    value={item.unsupported_handling}
                                  />
                                </td>

                                <td className="px-3 py-3">
                                  {item.overall_pass ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                                      <CheckCircle2 className="h-3.5 w-3.5" />
                                      Pass
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-xs text-red-400">
                                      <XCircle className="h-3.5 w-3.5" />
                                      Review
                                    </span>
                                  )}
                                </td>

                                <td className="px-3 py-3 text-xs text-slate-500">
                                  {item.source_count ?? 0}
                                </td>

                                <td className="px-3 py-3 text-[11px] text-slate-700">
                                  {formatDate(item.created_at)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* USERS */}
        {/* ================================================= */}

        <section className="mt-8 pb-10">
          <SectionHeading
            icon={Users}
            title="Users"
            text="Platform users and their learning activity."
          />

          <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/40">
            <table className="w-full min-w-[760px] text-left">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-600">
                  <th className="px-4 py-4">User</th>

                  <th className="px-4 py-4">Role</th>

                  <th className="px-4 py-4">Spaces</th>

                  <th className="px-4 py-4">Projects</th>

                  <th className="px-4 py-4">Quiz attempts</th>

                  <th className="px-4 py-4">Completed</th>
                </tr>
              </thead>

              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-12 text-center text-sm text-slate-600"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-800/70 last:border-0"
                    >
                      <td className="px-4 py-4">
                        <p className="text-sm font-medium text-slate-300">
                          {item.email}
                        </p>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-400">
                          {item.role}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-500">
                        {item.spaces ?? 0}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-500">
                        {item.projects ?? 0}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-500">
                        {item.quiz_attempts ?? 0}
                      </td>

                      <td className="px-4 py-4 text-sm text-slate-500">
                        {item.completed_quizzes ?? 0}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

/* ========================================================= */
/* SECTION LABEL */
/* ========================================================= */

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-slate-700">
      {children}
    </p>
  );
}

/* ========================================================= */
/* METRIC CARD */
/* ========================================================= */

function MetricCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">{label}</p>

          <p className="mt-2 text-2xl font-bold text-white">{value}</p>

          {note && (
            <p className="mt-2 text-xs leading-5 text-slate-600">{note}</p>
          )}
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
          <Icon className="h-4 w-4 text-indigo-400" />
        </div>
      </div>
    </div>
  );
}

/* ========================================================= */
/* SECTION HEADING */
/* ========================================================= */

function SectionHeading({ icon: Icon, title, text }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
        <Icon className="h-4 w-4 text-indigo-400" />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-slate-200">{title}</h2>

        <p className="mt-1 text-xs leading-5 text-slate-600">{text}</p>
      </div>
    </div>
  );
}

/* ========================================================= */
/* HEALTH ROW */
/* ========================================================= */

function HealthRow({ icon: Icon, label, value, neutral = false }) {
  const healthy = String(value).toLowerCase() === "healthy";

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
      <Icon className="h-4 w-4 text-slate-600" />

      <span className="flex-1 text-sm text-slate-400">{label}</span>

      <span
        className={
          neutral
            ? "max-w-[180px] truncate text-right text-xs font-medium text-slate-500"
            : healthy
              ? "text-xs font-medium text-emerald-400"
              : "text-xs font-medium text-amber-400"
        }
      >
        {value}
      </span>
    </div>
  );
}

/* ========================================================= */
/* STATUS CARD */
/* ========================================================= */

function StatusCard({ label, value, className }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
      <p className="text-xs text-slate-600">{label}</p>

      <p className={`mt-1 text-lg font-semibold ${className}`}>{value}</p>
    </div>
  );
}

/* ========================================================= */
/* EVALUATION ROW */
/* ========================================================= */

function EvaluationRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 px-3 py-3">
      <span className="text-sm text-slate-500">{label}</span>

      <span className="text-sm font-semibold text-slate-300">{value}</span>
    </div>
  );
}

/* ========================================================= */
/* BOOLEAN BADGE */
/* ========================================================= */

function BooleanBadge({ value }) {
  if (value) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Yes
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-600">
      <XCircle className="h-3.5 w-3.5" />
      No
    </span>
  );
}

/* ========================================================= */
/* EMPTY */
/* ========================================================= */

function EmptyState({ text }) {
  return (
    <div className="py-10 text-center">
      <Activity className="mx-auto h-7 w-7 text-slate-700" />

      <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
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
    return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  }

  if (normalized.includes("tutor")) {
    return <Sparkles className="h-4 w-4 text-indigo-400" />;
  }

  return <Activity className="h-4 w-4 text-sky-400" />;
}

/* ========================================================= */
/* FEATURE NAME */
/* ========================================================= */

function formatFeatureName(value) {
  if (!value) {
    return "Unknown";
  }

  return String(value)
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
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

export default AdminDashboard;
