import { useCallback, useEffect, useMemo, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

const EVENT_LABELS = {
  quiz_started: "Quiz Started",
  question_answered: "Question Answered",
  quiz_completed: "Quiz Completed",
  mastery_updated: "Mastery Updated",
  material_uploaded: "Material Uploaded",
  material_processed: "Material Processed",
  tutor_interaction: "Tutor Interaction",
};

const EVENT_STYLES = {
  quiz_started: {
    icon: "▶",
    badge: "bg-blue-100 text-blue-700",
  },
  question_answered: {
    icon: "?",
    badge: "bg-violet-100 text-violet-700",
  },
  quiz_completed: {
    icon: "✓",
    badge: "bg-emerald-100 text-emerald-700",
  },
  mastery_updated: {
    icon: "↗",
    badge: "bg-amber-100 text-amber-700",
  },
  material_uploaded: {
    icon: "↑",
    badge: "bg-cyan-100 text-cyan-700",
  },
  material_processed: {
    icon: "✓",
    badge: "bg-green-100 text-green-700",
  },
  tutor_interaction: {
    icon: "AI",
    badge: "bg-pink-100 text-pink-700",
  },
};

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getEventStyle(eventType) {
  return (
    EVENT_STYLES[eventType] || {
      icon: "•",
      badge: "bg-slate-100 text-slate-700",
    }
  );
}

function getStoredToken() {
  return (
    localStorage.getItem("access_token") || localStorage.getItem("token") || ""
  );
}

export default function Activity() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  const fetchActivity = useCallback(async (showRefreshState = false) => {
    try {
      if (showRefreshState) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getStoredToken();

      const response = await fetch(`${API_BASE_URL}/api/activity?limit=100`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      if (!response.ok) {
        let message = "Failed to load activity.";

        try {
          const data = await response.json();
          message = data.detail || message;
        } catch {
          // Keep the default message.
        }

        throw new Error(message);
      }

      const data = await response.json();

      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || "Something went wrong while loading activity.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  const eventTypes = useMemo(() => {
    const types = events.map((event) => event.event_type).filter(Boolean);

    return ["all", ...new Set(types)];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (filter === "all") {
      return events;
    }

    return events.filter((event) => event.event_type === filter);
  }, [events, filter]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-indigo-600">
              Learning Journey
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Activity
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              A timeline of your learning actions and progress.
            </p>
          </div>

          <button
            type="button"
            onClick={() => fetchActivity(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total activities</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {events.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Activity types</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {Math.max(eventTypes.length - 1, 0)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Showing</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {filteredEvents.length}
            </p>
          </div>
        </div>

        {/* Filters */}
        {!loading && events.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex min-w-max gap-2">
              {eventTypes.map((type) => {
                const isActive = filter === type;

                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFilter(type)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      isActive
                        ? "bg-slate-900 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {type === "all"
                      ? "All"
                      : EVENT_LABELS[type] ||
                        type
                          .replaceAll("_", " ")
                          .replace(/\b\w/g, (char) => char.toUpperCase())}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">{error}</p>

            <button
              type="button"
              onClick={() => fetchActivity()}
              className="mt-3 text-sm font-semibold text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-indigo-600" />

            <p className="mt-4 text-sm text-slate-500">
              Loading your activity...
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && events.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500">
              +
            </div>

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              No activity yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Start a quiz, answer questions, or interact with your learning
              materials and your activity will appear here.
            </p>
          </div>
        )}

        {/* No results after filter */}
        {!loading &&
          !error &&
          events.length > 0 &&
          filteredEvents.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
              <p className="text-sm text-slate-500">
                No activity matches this filter.
              </p>
            </div>
          )}

        {/* Timeline */}
        {!loading && !error && filteredEvents.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
              <h2 className="text-base font-semibold text-slate-900">
                Recent Activity
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Latest learning events recorded by the system.
              </p>
            </div>

            <div className="divide-y divide-slate-100">
              {filteredEvents.map((event) => {
                const style = getEventStyle(event.event_type);

                return (
                  <div key={event.id} className="flex gap-4 px-5 py-5 sm:px-6">
                    {/* Event icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${style.badge} text-xs font-bold`}
                    >
                      {style.icon}
                    </div>

                    {/* Event body */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">
                            {event.title}
                          </h3>

                          <span
                            className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium ${style.badge}`}
                          >
                            {EVENT_LABELS[event.event_type] ||
                              event.event_type
                                ?.replaceAll("_", " ")
                                .replace(/\b\w/g, (char) => char.toUpperCase())}
                          </span>
                        </div>

                        <span className="text-xs text-slate-400">
                          {formatDate(event.created_at)}
                        </span>
                      </div>

                      {event.description && (
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                          {event.description}
                        </p>
                      )}

                      <div className="mt-3 flex flex-wrap gap-2">
                        {event.project_id != null && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            Project #{event.project_id}
                          </span>
                        )}

                        {event.space_id != null && (
                          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                            Space #{event.space_id}
                          </span>
                        )}
                      </div>

                      {event.metadata &&
                        Object.keys(event.metadata).length > 0 && (
                          <details className="mt-3">
                            <summary className="cursor-pointer text-xs font-medium text-indigo-600">
                              View event details
                            </summary>

                            <pre className="mt-2 overflow-x-auto rounded-xl bg-slate-950 p-3 text-xs leading-5 text-slate-200">
                              {JSON.stringify(event.metadata, null, 2)}
                            </pre>
                          </details>
                        )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
