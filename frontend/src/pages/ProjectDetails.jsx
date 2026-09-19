import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  CircleAlert,
  Clock3,
  FileText,
  GraduationCap,
  LineChart,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Target,
  Upload,
  XCircle,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { Link, useParams } from "react-router-dom";

import api from "../api/client";

function ProjectDetails() {
  const { projectId } = useParams();

  const [project, setProject] = useState(null);

  const [materials, setMaterials] = useState([]);

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  async function loadProject({ showPageLoader = true } = {}) {
    try {
      if (showPageLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [projectResponse, materialsResponse, activityResponse] =
        await Promise.all([
          api.get(`/api/projects/${projectId}`),

          api.get(`/api/projects/${projectId}/materials`),

          api.get("/api/activity?limit=20"),
        ]);

      setProject(projectResponse.data);

      setMaterials(materialsResponse.data || []);

      const projectActivities = (activityResponse.data || []).filter(
        (item) => Number(item.project_id) === Number(projectId),
      );

      setActivities(projectActivities);
    } catch (requestError) {
      console.error("Failed to load project:", requestError);

      setError(
        requestError.response?.data?.detail || "Unable to load this project.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadProject();
  }, [projectId]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Only PDF files can be uploaded.");

      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");

      const formData = new FormData();

      formData.append("file", file);

      await api.post(`/api/projects/${projectId}/materials`, formData);

      await loadProject({
        showPageLoader: false,
      });
    } catch (uploadError) {
      console.error("Upload failed:", uploadError);

      setError(
        uploadError.response?.data?.detail || "Unable to upload the PDF.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  const materialStats = useMemo(() => {
    return materials.reduce(
      (stats, material) => {
        const status = material.status || "queued";

        if (status === "ready") {
          stats.ready += 1;
        } else if (status === "processing") {
          stats.processing += 1;
        } else if (status === "failed") {
          stats.failed += 1;
        } else {
          stats.queued += 1;
        }

        return stats;
      },
      {
        ready: 0,
        processing: 0,
        failed: 0,
        queued: 0,
      },
    );
  }, [materials]);

  const latestActivity = activities.length > 0 ? activities[0] : null;

  const continueDestination = getContinueDestination(
    latestActivity,
    projectId,
    materials,
  );

  if (loading) {
    return <LoadingScreen />;
  }

  if (!project) {
    return <NotFoundScreen message={error || "Project not found."} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* =============================================== */}
        {/* TOP BAR */}
        {/* =============================================== */}

        <div className="flex items-center justify-between gap-4">
          <Link
            to={`/spaces/${project.space_id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to space
          </Link>

          <button
            type="button"
            onClick={() =>
              loadProject({
                showPageLoader: false,
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

        {/* =============================================== */}
        {/* PROJECT HEADER */}
        {/* =============================================== */}

        <section className="mt-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                <BookOpen className="h-6 w-6 text-indigo-400" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-indigo-400">
                  Learning project
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                  {project.name}
                </h1>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {project.description ||
                    "Build your understanding through materials, tutoring, practice, and review."}
                </p>
              </div>
            </div>

            <Link
              to={continueDestination.href}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              {continueDestination.label}

              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {project.learning_goal && (
            <div className="mt-6 max-w-3xl rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-4">
              <div className="flex items-start gap-3">
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Learning goal
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {project.learning_goal}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* =============================================== */}
        {/* ERROR */}
        {/* =============================================== */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <div className="flex-1">
              <p className="text-sm font-medium text-red-300">
                Something needs attention
              </p>

              <p className="mt-1 text-xs leading-5 text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {/* =============================================== */}
        {/* PROJECT NAVIGATION */}
        {/* =============================================== */}

        <nav className="mt-8 overflow-x-auto border-b border-slate-800">
          <div className="flex min-w-max items-center gap-1 pb-px">
            <ProjectTab
              to={`/projects/${projectId}`}
              icon={LineChart}
              label="Overview"
              active
            />

            <ProjectTab
              to={`/projects/${projectId}/materials`}
              icon={FileText}
              label="Materials"
            />

            <ProjectTab
              to={`/projects/${projectId}/tutor`}
              icon={MessageCircle}
              label="Tutor"
            />

            <ProjectTab
              to={`/projects/${projectId}/quiz`}
              icon={GraduationCap}
              label="Quiz"
            />

            <ProjectTab
              to={`/projects/${projectId}/growth`}
              icon={Sparkles}
              label="Growth"
            />

            <ProjectTab
              to={`/projects/${projectId}/analytics`}
              icon={BarChart3}
              label="Analytics"
            />
          </div>
        </nav>

        {/* =============================================== */}
        {/* PROJECT SNAPSHOT */}
        {/* =============================================== */}

        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Materials"
              value={materials.length}
              note={
                materialStats.ready > 0
                  ? `${materialStats.ready} ready`
                  : "No ready materials"
              }
            />

            <StatCard
              icon={CheckCircle2}
              label="Ready"
              value={materialStats.ready}
              note="Available for learning"
            />

            <StatCard
              icon={Activity}
              label="Recent activity"
              value={activities.length}
              note="Recorded project events"
            />

            <StatCard
              icon={Target}
              label="Learning goal"
              value={project.learning_goal ? "Set" : "Not set"}
              note={
                project.learning_goal
                  ? "Project goal defined"
                  : "Add a project goal"
              }
            />
          </div>
        </section>

        {/* =============================================== */}
        {/* CONTINUE + MATERIAL PROCESSING */}
        {/* =============================================== */}

        <section className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* Continue */}

          <section className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Continue learning
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  {continueDestination.title}
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                  {continueDestination.description}
                </p>
              </div>
            </div>

            <Link
              to={continueDestination.href}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              {continueDestination.label}

              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>

          {/* Material processing */}

          <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                <FileText className="h-5 w-5 text-violet-400" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Material status
                </p>

                <h2 className="mt-2 text-base font-semibold text-white">
                  Knowledge readiness
                </h2>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <StatusLine
                label="Ready"
                value={materialStats.ready}
                icon={CheckCircle2}
                className="text-emerald-400"
              />

              <StatusLine
                label="Processing"
                value={materialStats.processing}
                icon={LoaderCircle}
                className="text-indigo-400"
              />

              <StatusLine
                label="Queued"
                value={materialStats.queued}
                icon={Clock3}
                className="text-amber-400"
              />

              <StatusLine
                label="Failed"
                value={materialStats.failed}
                icon={XCircle}
                className="text-red-400"
              />
            </div>
          </section>
        </section>

        {/* =============================================== */}
        {/* MATERIALS */}
        {/* =============================================== */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Learning material
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Materials
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                PDFs attached to this project.
              </p>
            </div>

            <label
              className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                uploading
                  ? "cursor-not-allowed bg-slate-800 text-slate-500"
                  : "bg-indigo-500 text-white hover:bg-indigo-400"
              }`}
            >
              {uploading ? (
                <LoaderCircle className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}

              {uploading ? "Uploading..." : "Upload PDF"}

              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </label>
          </div>

          {materials.length === 0 ? (
            <EmptyMaterials />
          ) : (
            <div className="mt-5 space-y-3">
              {materials.slice(0, 5).map((material) => (
                <MaterialRow key={material.id} material={material} />
              ))}
            </div>
          )}

          {materials.length > 5 && (
            <div className="mt-5 border-t border-slate-800 pt-4">
              <Link
                to={`/projects/${projectId}/materials`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-400 hover:text-indigo-300"
              >
                View all {materials.length} materials
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        {/* =============================================== */}
        {/* RECENT ACTIVITY */}
        {/* =============================================== */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
              <Activity className="h-4 w-4 text-indigo-400" />
            </div>

            <div>
              <h2 className="text-sm font-semibold text-white">
                Recent activity
              </h2>

              <p className="mt-1 text-xs text-slate-600">
                Recent events recorded for this project.
              </p>
            </div>
          </div>

          {activities.length === 0 ? (
            <div className="mt-5 rounded-xl border border-dashed border-slate-800 px-4 py-8 text-center">
              <Activity className="mx-auto h-6 w-6 text-slate-700" />

              <p className="mt-3 text-sm text-slate-600">
                No project activity has been recorded yet.
              </p>
            </div>
          ) : (
            <div className="mt-5 divide-y divide-slate-800">
              {activities.slice(0, 6).map((item) => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>

        {/* =============================================== */}
        {/* LEARNING FLOW */}
        {/* =============================================== */}

        <section className="mt-8 pb-10">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Learning workflow
            </p>

            <h2 className="mt-2 text-xl font-semibold text-white">
              Keep your learning loop connected
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Move naturally from material to explanation, assessment, growth,
              and analysis.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <FlowCard
              icon={FileText}
              title="Materials"
              description="Add and process PDFs."
              href={`/projects/${projectId}/materials`}
            />

            <FlowCard
              icon={MessageCircle}
              title="Tutor"
              description="Ask grounded questions."
              href={`/projects/${projectId}/tutor`}
            />

            <FlowCard
              icon={GraduationCap}
              title="Quiz"
              description="Test understanding."
              href={`/projects/${projectId}/quiz`}
            />

            <FlowCard
              icon={Sparkles}
              title="Growth"
              description="Review mastery changes."
              href={`/projects/${projectId}/growth`}
            />

            <FlowCard
              icon={BarChart3}
              title="Analytics"
              description="Understand learning activity."
              href={`/projects/${projectId}/analytics`}
            />
          </div>
        </section>
      </main>
    </div>
  );
}

/* ========================================================= */
/* HELPERS */
/* ========================================================= */

function getContinueDestination(latestActivity, projectId, materials) {
  if (!latestActivity) {
    if (materials.length === 0) {
      return {
        title: "Add your first learning material",
        description:
          "Upload a PDF so the project can start building searchable learning knowledge.",
        label: "Upload material",
        href: `/projects/${projectId}/materials`,
      };
    }

    const hasReadyMaterial = materials.some((item) => item.status === "ready");

    if (hasReadyMaterial) {
      return {
        title: "Start with the AI Tutor",
        description:
          "Your project has ready material. Ask questions and learn directly from your project sources.",
        label: "Open Tutor",
        href: `/projects/${projectId}/tutor`,
      };
    }

    return {
      title: "Wait for material processing",
      description:
        "Your uploaded material is still being prepared for learning.",
      label: "View materials",
      href: `/projects/${projectId}/materials`,
    };
  }

  const eventType = latestActivity.event_type;

  if (eventType === "material_uploaded") {
    return {
      title: "Continue with your material",
      description:
        "A material upload was recently recorded. Check its processing status before starting your study session.",
      label: "View materials",
      href: `/projects/${projectId}/materials`,
    };
  }

  if (eventType === "tutor_interaction") {
    return {
      title: "Continue with the Tutor",
      description:
        "Your latest activity was a Tutor interaction. Continue exploring the project material.",
      label: "Open Tutor",
      href: `/projects/${projectId}/tutor`,
    };
  }

  if (eventType === "quiz_completed" || eventType === "mastery_updated") {
    return {
      title: "Review your learning progress",
      description:
        "An assessment-related event was recently recorded. Review Growth to continue from there.",
      label: "Open Growth",
      href: `/projects/${projectId}/growth`,
    };
  }

  return {
    title: "Continue this project",
    description: "Pick up your learning journey from the project workspace.",
    label: "Continue",
    href: `/projects/${projectId}`,
  };
}

/* ========================================================= */
/* UI COMPONENTS */
/* ========================================================= */

function ProjectTab({ to, icon: Icon, label, active = false }) {
  return (
    <Link
      to={to}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-indigo-400 text-indigo-300"
          : "border-transparent text-slate-500 hover:border-slate-700 hover:text-slate-200"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

function StatCard({ icon: Icon, label, value, note }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">{value}</p>

          <p className="mt-1 text-xs text-slate-600">{note}</p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
          <Icon className="h-4 w-4 text-indigo-400" />
        </div>
      </div>
    </div>
  );
}

function StatusLine({ label, value, icon: Icon, className }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon
          className={`h-4 w-4 ${className} ${
            label === "Processing" ? "animate-spin" : ""
          }`}
        />

        <span className="text-sm text-slate-400">{label}</span>
      </div>

      <span className="text-sm font-semibold text-slate-300">{value}</span>
    </div>
  );
}

function EmptyMaterials() {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-700 px-6 py-14 text-center">
      <FileText className="mx-auto h-8 w-8 text-slate-600" />

      <h3 className="mt-4 text-sm font-semibold text-white">
        No materials yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Upload a PDF to start building project knowledge.
      </p>
    </div>
  );
}

function MaterialRow({ material }) {
  const statusConfig = {
    queued: {
      icon: Clock3,
      label: "Queued",
      className: "text-amber-400 bg-amber-400/10",
    },

    processing: {
      icon: LoaderCircle,
      label: "Processing",
      className: "text-indigo-400 bg-indigo-400/10",
    },

    ready: {
      icon: CheckCircle2,
      label: "Ready",
      className: "text-emerald-400 bg-emerald-400/10",
    },

    failed: {
      icon: XCircle,
      label: "Failed",
      className: "text-red-400 bg-red-400/10",
    },
  };

  const config = statusConfig[material.status] || statusConfig.queued;

  const Icon = config.icon;

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/40 px-4 py-4">
      <div className="flex items-center gap-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
          <FileText className="h-4 w-4 text-red-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-slate-200">
            {material.original_filename}
          </p>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            {material.file_size_bytes && (
              <span>
                {(material.file_size_bytes / 1024 / 1024).toFixed(2)} MB
              </span>
            )}

            {material.page_count && <span>{material.page_count} pages</span>}
          </div>
        </div>

        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium ${config.className}`}
        >
          <Icon
            className={`h-3.5 w-3.5 ${
              material.status === "processing" ? "animate-spin" : ""
            }`}
          />

          {config.label}
        </div>
      </div>

      {material.status === "failed" && material.error_message && (
        <p className="mt-3 rounded-lg bg-red-500/5 px-3 py-2 text-xs leading-5 text-red-300">
          {material.error_message}
        </p>
      )}
    </div>
  );
}

function ActivityRow({ item }) {
  const Icon = getActivityIcon(item.event_type);

  return (
    <div className="flex gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-300">{item.title}</p>

        {item.description && (
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {item.description}
          </p>
        )}

        {item.created_at && (
          <p className="mt-2 text-[11px] text-slate-700">
            {formatDate(item.created_at)}
          </p>
        )}
      </div>
    </div>
  );
}

function getActivityIcon(eventType) {
  if (eventType?.includes("material")) {
    return FileText;
  }

  if (eventType?.includes("quiz")) {
    return GraduationCap;
  }

  if (eventType?.includes("tutor")) {
    return MessageCircle;
  }

  if (eventType?.includes("mastery")) {
    return Sparkles;
  }

  return Activity;
}

function FlowCard({ icon: Icon, title, description, href }) {
  return (
    <Link
      to={href}
      className="group rounded-xl border border-slate-800 bg-slate-900/40 p-4 transition hover:border-indigo-500/20 hover:bg-slate-900/70"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
        <Icon className="h-4 w-4 text-indigo-400" />
      </div>

      <h3 className="mt-4 text-sm font-semibold text-white">{title}</h3>

      <p className="mt-1 text-xs leading-5 text-slate-600">{description}</p>

      <div className="mt-3 flex items-center gap-1 text-xs font-medium text-indigo-400 opacity-0 transition group-hover:opacity-100">
        Open
        <ArrowRight className="h-3 w-3" />
      </div>
    </Link>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
      <div className="flex items-center gap-3 text-sm">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading project...
      </div>
    </div>
  );
}

function NotFoundScreen({ message }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
          <CircleAlert className="h-6 w-6 text-red-400" />
        </div>

        <h1 className="mt-5 text-xl font-semibold">Project unavailable</h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">{message}</p>

        <Link
          to="/home"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default ProjectDetails;
