import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Folder,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import api from "../api/client";

function SpaceDetails() {
  const { spaceId } = useParams();

  const [space, setSpace] = useState(null);
  const [projects, setProjects] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [showCreateProject, setShowCreateProject] = useState(false);

  const [creatingProject, setCreatingProject] = useState(false);

  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [learningGoal, setLearningGoal] = useState("");

  const [createError, setCreateError] = useState("");

  async function loadSpace() {
    try {
      setLoading(true);
      setLoadError("");

      const [spaceResponse, projectsResponse] = await Promise.all([
        api.get(`/api/spaces/${spaceId}`),
        api.get(`/api/spaces/${spaceId}/projects`),
      ]);

      setSpace(spaceResponse.data);
      setProjects(projectsResponse.data || []);
    } catch (error) {
      console.error("Failed to load space:", error);

      setLoadError(
        error.response?.data?.detail || "Unable to load this space.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSpace();
  }, [spaceId]);

  const projectCount = projects.length;

  const projectsWithGoals = useMemo(() => {
    return projects.filter((project) => project.learning_goal?.trim()).length;
  }, [projects]);

  const handleCreateProject = async (event) => {
    event.preventDefault();

    if (!projectName.trim()) {
      setCreateError("Please enter a project name.");
      return;
    }

    try {
      setCreatingProject(true);
      setCreateError("");

      await api.post(`/api/spaces/${spaceId}/projects`, {
        name: projectName.trim(),
        description: projectDescription.trim() || null,
        learning_goal: learningGoal.trim() || null,
      });

      setProjectName("");
      setProjectDescription("");
      setLearningGoal("");

      setShowCreateProject(false);

      await loadSpace();
    } catch (error) {
      console.error("Failed to create project:", error);

      setCreateError(
        error.response?.data?.detail || "Unable to create the project.",
      );
    } finally {
      setCreatingProject(false);
    }
  };

  function openCreateModal() {
    setCreateError("");
    setShowCreateProject(true);
  }

  function closeCreateModal() {
    if (creatingProject) {
      return;
    }

    setShowCreateProject(false);
    setCreateError("");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-300">
        <div className="flex items-center gap-3 text-sm">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-700 border-t-indigo-400" />
          Loading learning space...
        </div>
      </div>
    );
  }

  if (!space) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/10">
            <Folder className="h-6 w-6 text-red-400" />
          </div>

          <h1 className="mt-5 text-xl font-semibold">Space not found</h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {loadError ||
              "This learning space may no longer exist or you may not have access to it."}
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
      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* ================================================= */}
        {/* BACK */}
        {/* ================================================= */}

        <Link
          to="/home"
          className="inline-flex items-center gap-2 text-sm text-slate-500 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>

        {loadError && (
          <div className="mt-6 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {loadError}
          </div>
        )}

        {/* ================================================= */}
        {/* SPACE HEADER */}
        {/* ================================================= */}

        <section className="mt-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-500/10">
                <Folder className="h-6 w-6 text-indigo-400" />
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-indigo-400">
                  Learning space
                </p>

                <h1 className="mt-1 text-3xl font-bold tracking-tight text-white">
                  {space.name}
                </h1>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  {space.description ||
                    "Organize related projects and continue building your learning journey."}
                </p>
              </div>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              <Plus className="h-4 w-4" />
              New Project
            </button>
          </div>
        </section>

        {/* ================================================= */}
        {/* SPACE STATS */}
        {/* ================================================= */}

        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <StatCard icon={BookOpen} label="Projects" value={projectCount} />

          <StatCard
            icon={Sparkles}
            label="Projects with goals"
            value={projectsWithGoals}
          />

          <StatCard icon={Folder} label="Space" value="Active" />
        </section>

        {/* ================================================= */}
        {/* PROJECTS */}
        {/* ================================================= */}

        <section className="mt-12">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Your learning journeys
              </p>

              <h2 className="mt-2 text-xl font-semibold text-white">
                Projects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Each project is a focused learning workspace.
              </p>
            </div>

            {projects.length > 0 && (
              <span className="text-sm text-slate-600">
                {projectCount} {projectCount === 1 ? "project" : "projects"}
              </span>
            )}
          </div>

          {projects.length === 0 ? (
            <EmptyProjects onCreate={openCreateModal} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>

        {/* ================================================= */}
        {/* GUIDANCE */}
        {/* ================================================= */}

        {projects.length > 0 && (
          <section className="mt-10 rounded-2xl border border-indigo-500/15 bg-indigo-500/5 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
                <Sparkles className="h-5 w-5 text-indigo-400" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  Next step
                </p>

                <h2 className="mt-2 text-base font-semibold text-white">
                  Pick a project and continue learning
                </h2>

                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                  Open a project to work with its materials, Tutor, quizzes,
                  growth, and analytics.
                </p>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ================================================= */}
      {/* CREATE PROJECT MODAL */}
      {/* ================================================= */}

      {showCreateProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                  New project
                </p>

                <h2 className="mt-2 text-lg font-semibold text-white">
                  Create a learning journey
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Define what you want to learn and accomplish.
                </p>
              </div>

              <button
                onClick={closeCreateModal}
                disabled={creatingProject}
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-5 text-red-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateProject} className="mt-6 space-y-5">
              {/* Project name */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Project name
                </label>

                <input
                  type="text"
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="e.g. Coordinate Geometry"
                  maxLength={200}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                  autoFocus
                  disabled={creatingProject}
                />
              </div>

              {/* Description */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  value={projectDescription}
                  onChange={(event) =>
                    setProjectDescription(event.target.value)
                  }
                  placeholder="What will this project cover?"
                  rows={3}
                  maxLength={1000}
                  disabled={creatingProject}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                />
              </div>

              {/* Learning goal */}

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Learning goal
                </label>

                <textarea
                  value={learningGoal}
                  onChange={(event) => setLearningGoal(event.target.value)}
                  placeholder="What should you be able to do after learning this?"
                  rows={3}
                  maxLength={1000}
                  disabled={creatingProject}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-indigo-500"
                />
              </div>

              {/* Actions */}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  disabled={creatingProject}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingProject}
                  className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingProject ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================================= */
/* SMALL COMPONENTS */
/* ========================================================= */

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            {label}
          </p>

          <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        </div>

        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10">
          <Icon className="h-4 w-4 text-indigo-400" />
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }) {
  return (
    <Link
      to={`/projects/${project.id}`}
      className="group rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition duration-200 hover:border-indigo-500/20 hover:bg-slate-900/80"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10">
          <BookOpen className="h-5 w-5 text-violet-400" />
        </div>

        <ArrowRight className="h-5 w-5 text-slate-700 transition group-hover:translate-x-1 group-hover:text-slate-400" />
      </div>

      <h3 className="mt-5 truncate font-semibold text-white">{project.name}</h3>

      <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
        {project.description || "A focused learning journey."}
      </p>

      {project.learning_goal && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Learning goal
          </p>

          <p className="mt-1 line-clamp-3 text-sm leading-5 text-slate-400">
            {project.learning_goal}
          </p>
        </div>
      )}

      <div className="mt-5 flex items-center justify-between border-t border-slate-800 pt-4">
        <span className="text-xs text-slate-600">Open project</span>

        <span className="text-xs font-medium text-indigo-400 opacity-0 transition group-hover:opacity-100">
          Continue →
        </span>
      </div>
    </Link>
  );
}

function EmptyProjects({ onCreate }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10">
        <BookOpen className="h-6 w-6 text-indigo-400" />
      </div>

      <h3 className="mt-5 text-base font-semibold text-white">
        No projects yet
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        Create your first project to start a focused learning journey inside
        this space.
      </p>

      <button
        onClick={onCreate}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
      >
        <Plus className="h-4 w-4" />
        Create Project
      </button>
    </div>
  );
}

export default SpaceDetails;
