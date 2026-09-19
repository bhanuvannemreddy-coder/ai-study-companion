import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  LoaderCircle,
  RefreshCw,
  Upload,
  XCircle,
} from "lucide-react";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Link, useParams } from "react-router-dom";

import api from "../../api/client";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function Materials() {
  const { projectId } = useParams();

  const [materials, setMaterials] = useState([]);

  const [project, setProject] = useState(null);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const fileInputRef = useRef(null);

  const loadMaterials = useCallback(
    async ({ showLoader = false } = {}) => {
      try {
        if (showLoader) {
          setLoading(true);
        } else {
          setRefreshing(true);
        }

        setError("");

        const [projectResponse, materialsResponse] = await Promise.all([
          api.get(`/api/projects/${projectId}`),

          api.get(`/api/projects/${projectId}/materials`),
        ]);

        setProject(projectResponse.data);

        setMaterials(materialsResponse.data || []);
      } catch (requestError) {
        console.error("Failed to load materials:", requestError);

        setError(
          requestError.response?.data?.detail ||
            "Unable to load project materials.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [projectId],
  );

  useEffect(() => {
    loadMaterials({
      showLoader: true,
    });
  }, [loadMaterials]);

  /*
   * Background document processing can continue after upload.
   * Poll while documents are queued/processing so the UI reflects
   * the latest state without requiring a manual refresh.
   */
  useEffect(() => {
    const hasActiveProcessing = materials.some(
      (material) =>
        material.status === "queued" || material.status === "processing",
    );

    if (!hasActiveProcessing) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      loadMaterials();
    }, 5000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [materials, loadMaterials]);

  const statistics = useMemo(() => {
    return materials.reduce(
      (result, material) => {
        const status = material.status || "queued";

        if (status === "ready") {
          result.ready += 1;
        } else if (status === "processing") {
          result.processing += 1;
        } else if (status === "failed") {
          result.failed += 1;
        } else {
          result.queued += 1;
        }

        return result;
      },
      {
        ready: 0,
        processing: 0,
        queued: 0,
        failed: 0,
      },
    );
  }, [materials]);

  async function handleUpload(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setSuccessMessage("");

    const isPdf =
      file.type === "application/pdf" ||
      file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
      setError("Only PDF files can be uploaded.");

      resetFileInput();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("The maximum PDF size is 20 MB.");

      resetFileInput();
      return;
    }

    try {
      setUploading(true);

      const formData = new FormData();

      formData.append("file", file);

      await api.post(`/api/projects/${projectId}/materials`, formData);

      setSuccessMessage(
        `"${file.name}" was uploaded successfully. Processing will continue in the background.`,
      );

      await loadMaterials();
    } catch (uploadError) {
      console.error("Material upload failed:", uploadError);

      setError(
        uploadError.response?.data?.detail || "Unable to upload the PDF.",
      );
    } finally {
      setUploading(false);
      resetFileInput();
    }
  }

  function resetFileInput() {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function triggerUpload() {
    if (uploading) {
      return;
    }

    fileInputRef.current?.click();
  }

  if (loading) {
    return <LoadingState />;
  }

  if (!project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto h-9 w-9 text-red-400" />

          <h1 className="mt-4 text-xl font-semibold">Project unavailable</h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {error || "Unable to load this project."}
          </p>

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
            onClick={() => loadMaterials()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>

        {/* ================================================= */}
        {/* TITLE */}
        {/* ================================================= */}

        <section className="mt-8">
          <p className="text-sm font-medium text-indigo-400">
            Learning material
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
            {project.name}
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Upload the PDFs that should become part of this project's learning
            knowledge.
          </p>
        </section>

        {/* ================================================= */}
        {/* MESSAGES */}
        {/* ================================================= */}

        {error && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
            <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />

            <div>
              <p className="text-sm font-medium text-red-300">
                Upload or loading error
              </p>

              <p className="mt-1 text-xs leading-5 text-red-400/80">{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />

            <div>
              <p className="text-sm font-medium text-emerald-300">
                Upload successful
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-400/80">
                {successMessage}
              </p>
            </div>
          </div>
        )}

        {/* ================================================= */}
        {/* UPLOAD AREA */}
        {/* ================================================= */}

        <section className="mt-8">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                  <Upload className="h-6 w-6 text-indigo-400" />
                </div>

                <div>
                  <h2 className="text-base font-semibold text-white">
                    Add a PDF
                  </h2>

                  <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">
                    Upload study notes, textbooks, assignments, or other project
                    material. Maximum file size: 20 MB.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={triggerUpload}
                disabled={uploading}
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? (
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}

                {uploading ? "Uploading..." : "Choose PDF"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>

            <div className="mt-5 border-t border-indigo-500/10 pt-4">
              <p className="text-xs text-slate-600">
                Uploaded material is processed asynchronously so you can
                continue using the application.
              </p>
            </div>
          </div>
        </section>

        {/* ================================================= */}
        {/* SUMMARY */}
        {/* ================================================= */}

        <section className="mt-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={FileText}
              label="Total"
              value={materials.length}
              note="Uploaded materials"
            />

            <StatCard
              icon={CheckCircle2}
              label="Ready"
              value={statistics.ready}
              note="Available to learn from"
            />

            <StatCard
              icon={LoaderCircle}
              label="Processing"
              value={statistics.processing + statistics.queued}
              note="Waiting or processing"
            />

            <StatCard
              icon={XCircle}
              label="Failed"
              value={statistics.failed}
              note="Need attention"
            />
          </div>
        </section>

        {/* ================================================= */}
        {/* PROCESSING PIPELINE */}
        {/* ================================================= */}

        <section className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/40 p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Document pipeline
            </p>

            <h2 className="mt-2 text-lg font-semibold text-white">
              From PDF to project knowledge
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Documents move through background processing before becoming
              available to the Tutor and other learning experiences.
            </p>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-4">
            <PipelineStep
              number="1"
              title="Upload"
              description="PDF enters the project"
              active
            />

            <PipelineStep
              number="2"
              title="Processing"
              description="Content is prepared"
              active={statistics.processing > 0 || statistics.queued > 0}
            />

            <PipelineStep
              number="3"
              title="Knowledge"
              description="Searchable representation"
              active={statistics.ready > 0}
            />

            <PipelineStep
              number="4"
              title="Ready"
              description="Available for learning"
              active={statistics.ready > 0}
            />
          </div>
        </section>

        {/* ================================================= */}
        {/* MATERIAL LIST */}
        {/* ================================================= */}

        <section className="mt-8 pb-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Project files
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Your materials
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track the processing state of every uploaded PDF.
              </p>
            </div>

            {materials.length > 0 && (
              <span className="text-sm text-slate-600">
                {materials.length} {materials.length === 1 ? "file" : "files"}
              </span>
            )}
          </div>

          {materials.length === 0 ? (
            <EmptyState onUpload={triggerUpload} />
          ) : (
            <div className="mt-5 space-y-3">
              {materials.map((material) => (
                <MaterialRow key={material.id} material={material} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

/* ========================================================= */
/* COMPONENTS */
/* ========================================================= */

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
          <Icon
            className={`h-4 w-4 text-indigo-400 ${
              label === "Processing" && value > 0 ? "animate-spin" : ""
            }`}
          />
        </div>
      </div>
    </div>
  );
}

function PipelineStep({ number, title, description, active }) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        active
          ? "border-indigo-500/20 bg-indigo-500/5"
          : "border-slate-800 bg-slate-950/30"
      }`}
    >
      <div className="flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
            active
              ? "bg-indigo-500/15 text-indigo-300"
              : "bg-slate-800 text-slate-600"
          }`}
        >
          {number}
        </div>

        <div>
          <p
            className={`text-sm font-semibold ${
              active ? "text-slate-200" : "text-slate-600"
            }`}
          >
            {title}
          </p>

          <p className="mt-1 text-xs text-slate-600">{description}</p>
        </div>
      </div>
    </div>
  );
}

function MaterialRow({ material }) {
  const statusConfig = {
    queued: {
      icon: Clock3,
      label: "Queued",
      className: "text-amber-400 bg-amber-400/10 border-amber-400/10",
      description: "Waiting for background processing.",
    },

    processing: {
      icon: LoaderCircle,
      label: "Processing",
      className: "text-indigo-400 bg-indigo-400/10 border-indigo-400/10",
      description: "The document is being prepared.",
    },

    ready: {
      icon: CheckCircle2,
      label: "Ready",
      className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/10",
      description: "Available for project learning.",
    },

    failed: {
      icon: XCircle,
      label: "Failed",
      className: "text-red-400 bg-red-400/10 border-red-400/10",
      description: "Processing failed and may need another upload.",
    },
  };

  const config = statusConfig[material.status] || statusConfig.queued;

  const Icon = config.icon;

  const sizeMb = material.file_size_bytes
    ? (material.file_size_bytes / 1024 / 1024).toFixed(2)
    : null;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 px-5 py-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
          <FileText className="h-5 w-5 text-red-400" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-200">
            {material.original_filename || "Untitled PDF"}
          </p>

          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-600">
            {sizeMb && <span>{sizeMb} MB</span>}

            {material.page_count && <span>{material.page_count} pages</span>}

            {material.created_at && (
              <span>Uploaded {formatDate(material.created_at)}</span>
            )}
          </div>

          <p className="mt-2 text-xs text-slate-600">{config.description}</p>
        </div>

        <div
          className={`flex shrink-0 items-center gap-1.5 self-start rounded-lg border px-2.5 py-1.5 text-xs font-medium sm:self-auto ${config.className}`}
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
        <div className="mt-4 rounded-xl border border-red-500/10 bg-red-500/5 px-4 py-3">
          <p className="text-xs font-medium text-red-300">Processing error</p>

          <p className="mt-1 text-xs leading-5 text-red-400/80">
            {material.error_message}
          </p>
        </div>
      )}
    </div>
  );
}

function EmptyState({ onUpload }) {
  return (
    <div className="mt-5 rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
        <FileText className="h-6 w-6 text-indigo-400" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-white">
        No learning materials yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Upload your first PDF to start building knowledge for this project.
      </p>

      <button
        type="button"
        onClick={onUpload}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
      >
        <Upload className="h-4 w-4" />
        Upload PDF
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
      <div className="flex items-center gap-3 text-sm">
        <LoaderCircle className="h-4 w-4 animate-spin" />
        Loading materials...
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

export default Materials;
