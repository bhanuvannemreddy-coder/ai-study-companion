import {
  ArrowRight,
  BookOpen,
  Brain,
  Folder,
  LayoutDashboard,
  LogOut,
  Plus,
  X,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";

import { Link } from "react-router-dom";

import api from "../api/client";
import { useAuth } from "../context/AuthContext";

function Home() {
  const { user, logout } = useAuth();

  const [spaces, setSpaces] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState("");

  const [showCreateSpace, setShowCreateSpace] = useState(false);

  const [creatingSpace, setCreatingSpace] = useState(false);

  const [spaceName, setSpaceName] = useState("");

  const [spaceDescription, setSpaceDescription] = useState("");

  const [createError, setCreateError] = useState("");

  // ========================================================
  // LOAD ALL SPACES + PROJECTS
  // ========================================================

  async function loadDashboard() {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/spaces");

      const fetchedSpaces = Array.isArray(response.data) ? response.data : [];

      setSpaces(fetchedSpaces);
    } catch (requestError) {
      console.error("Failed to load dashboard:", requestError);

      setError(
        requestError.response?.data?.detail ||
          "Unable to load your learning spaces.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, []);

  // ========================================================
  // TOTAL PROJECTS
  // ========================================================

  const totalProjects = useMemo(() => {
    return spaces.reduce(
      (total, space) =>
        total + (Array.isArray(space.projects) ? space.projects.length : 0),
      0,
    );
  }, [spaces]);

  // ========================================================
  // USER DISPLAY
  // ========================================================

  const firstName = user?.email?.split("@")[0] || "there";

  // ========================================================
  // CREATE SPACE
  // ========================================================

  async function handleCreateSpace(event) {
    event.preventDefault();

    if (!spaceName.trim()) {
      setCreateError("Please enter a space name.");
      return;
    }

    try {
      setCreatingSpace(true);
      setCreateError("");

      await api.post("/api/spaces", {
        name: spaceName.trim(),

        description: spaceDescription.trim() || null,
      });

      setSpaceName("");
      setSpaceDescription("");
      setShowCreateSpace(false);

      await loadDashboard();
    } catch (requestError) {
      console.error("Failed to create space:", requestError);

      setCreateError(
        requestError.response?.data?.detail || "Unable to create the space.",
      );
    } finally {
      setCreatingSpace(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex min-h-screen">
        {/* ================================================= */}
        {/* SIDEBAR */}
        {/* ================================================= */}

        <aside className="hidden w-60 shrink-0 border-r border-slate-800 bg-slate-950 lg:flex lg:flex-col">
          <div className="px-5 py-6">
            <Link to="/home" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10">
                <Brain className="h-5 w-5 text-indigo-400" />
              </div>

              <div>
                <p className="text-sm font-semibold text-slate-100">
                  AI Study Companion
                </p>

                <p className="text-xs text-slate-500">Your learning space</p>
              </div>
            </Link>
          </div>

          <nav className="px-3">
            <Link
              to="/home"
              className="mb-1 flex w-full items-center gap-3 rounded-lg bg-indigo-500/10 px-3 py-2.5 text-sm text-indigo-300"
            >
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </Link>

            <button
              type="button"
              onClick={() =>
                document.getElementById("your-spaces")?.scrollIntoView({
                  behavior: "smooth",
                })
              }
              className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
            >
              <BookOpen className="h-4 w-4" />
              Spaces
            </button>
          </nav>

          {/* User */}

          <div className="mt-auto border-t border-slate-800 p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-sm font-semibold text-slate-300">
                {firstName.charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-200">
                  {user?.email}
                </p>

                <p className="text-xs text-slate-500">
                  {user?.role === "admin" ? "Administrator" : "Student"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-900 hover:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </aside>

        {/* ================================================= */}
        {/* MAIN */}
        {/* ================================================= */}

        <main className="min-w-0 flex-1">
          {/* Mobile header */}

          <div className="border-b border-slate-800 px-5 py-4 lg:hidden">
            <div className="flex items-center justify-between">
              <Link to="/home" className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-indigo-400" />

                <span className="text-sm font-semibold">
                  AI Study Companion
                </span>
              </Link>

              <button
                type="button"
                onClick={logout}
                className="text-slate-500 hover:text-slate-200"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mx-auto max-w-5xl px-6 py-10">
            {/* ================================================= */}
            {/* HEADER */}
            {/* ================================================= */}

            <section>
              <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-indigo-400">
                    Overview
                  </p>

                  <h1 className="mt-2 text-3xl font-bold tracking-tight text-white">
                    Good to see you, {firstName}.
                  </h1>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    Organize your learning into spaces and focused projects.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCreateError("");
                    setSpaceName("");
                    setSpaceDescription("");
                    setShowCreateSpace(true);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-400"
                >
                  <Plus className="h-4 w-4" />
                  New Space
                </button>
              </div>
            </section>

            {/* ================================================= */}
            {/* ERROR */}
            {/* ================================================= */}

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <X className="mt-0.5 h-4 w-4 shrink-0" />

                <span>{error}</span>
              </div>
            )}

            {/* ================================================= */}
            {/* STATS */}
            {/* ================================================= */}

            <section className="mt-8 grid grid-cols-2 gap-3 sm:max-w-md">
              <StatCard
                label="Spaces"
                value={loading ? "..." : spaces.length}
              />

              <StatCard
                label="Projects"
                value={loading ? "..." : totalProjects}
              />
            </section>

            {/* ================================================= */}
            {/* SPACES */}
            {/* ================================================= */}

            <section id="your-spaces" className="mt-12">
              <div className="mb-5">
                <h2 className="text-lg font-semibold text-white">
                  Your spaces
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Learning areas that organize your projects.
                </p>
              </div>

              {/* Loading */}

              {loading && (
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <div
                      key={item}
                      className="h-48 animate-pulse rounded-2xl border border-slate-800 bg-slate-900"
                    />
                  ))}
                </div>
              )}

              {/* Empty */}

              {!loading && spaces.length === 0 && (
                <div className="rounded-2xl border border-dashed border-slate-700 px-6 py-16 text-center">
                  <BookOpen className="mx-auto h-8 w-8 text-slate-600" />

                  <h3 className="mt-4 text-base font-semibold">
                    No learning spaces yet
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                    Create your first space to organize your learning journey.
                  </p>

                  <button
                    type="button"
                    onClick={() => setShowCreateSpace(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400"
                  >
                    <Plus className="h-4 w-4" />
                    Create Space
                  </button>
                </div>
              )}

              {/* Spaces */}

              {!loading && spaces.length > 0 && (
                <div className="space-y-4">
                  {spaces.map((space) => (
                    <SpaceCard key={space.id} space={space} />
                  ))}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* ===================================================== */}
      {/* CREATE SPACE MODAL */}
      {/* ===================================================== */}

      {showCreateSpace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  Create a space
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  A space is a broad learning area.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateSpace(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {createError && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSpace} className="mt-6 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Space name
                </label>

                <input
                  type="text"
                  value={spaceName}
                  onChange={(event) => setSpaceName(event.target.value)}
                  placeholder="e.g. Machine Learning"
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Description
                </label>

                <textarea
                  value={spaceDescription}
                  onChange={(event) => setSpaceDescription(event.target.value)}
                  placeholder="What will you learn here?"
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateSpace(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={creatingSpace}
                  className="rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {creatingSpace ? "Creating..." : "Create Space"}
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
/* STAT CARD */
/* ========================================================= */

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

/* ========================================================= */
/* SPACE CARD */
/* ========================================================= */

function SpaceCard({ space }) {
  const projects = Array.isArray(space.projects) ? space.projects : [];

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 transition hover:border-slate-700 hover:bg-slate-900/70">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10">
          <Folder className="h-5 w-5 text-indigo-400" />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white">{space.name}</h3>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            {space.description || "A focused area for your learning."}
          </p>
        </div>

        <Link
          to={`/spaces/${space.id}`}
          className="hidden items-center gap-1 text-sm font-medium text-slate-500 transition hover:text-white sm:flex"
        >
          Open
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* ================================================= */}
      {/* PROJECTS */}
      {/* ================================================= */}

      <div className="mt-5 border-t border-slate-800 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-600">
            Projects
          </p>

          <span className="text-xs text-slate-600">{projects.length}</span>
        </div>

        {projects.length === 0 && (
          <div className="mt-3 rounded-xl border border-dashed border-slate-800 bg-slate-950/30 px-4 py-4">
            <p className="text-sm text-slate-600">
              No projects in this space yet.
            </p>

            <Link
              to={`/spaces/${space.id}`}
              className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              Open space to create a project
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        )}

        {projects.length > 0 && (
          <div className="mt-3 space-y-1">
            {projects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-800/60"
              >
                <BookOpen className="h-4 w-4 shrink-0 text-slate-500" />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-slate-300">
                    {project.name}
                  </p>

                  {project.learning_goal && (
                    <p className="mt-0.5 truncate text-xs text-slate-600">
                      {project.learning_goal}
                    </p>
                  )}
                </div>

                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-700" />
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Mobile open link */}

      <Link
        to={`/spaces/${space.id}`}
        className="mt-4 flex items-center justify-center gap-1 rounded-lg border border-slate-800 py-2.5 text-sm font-medium text-slate-500 transition hover:bg-slate-800 hover:text-white sm:hidden"
      >
        Open Space
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

export default Home;
