import {
  BarChart3,
  BookOpen,
  Brain,
  FileText,
  LineChart,
  MessageSquare,
} from "lucide-react";
import { NavLink } from "react-router-dom";

function ProjectNav({ projectId }) {
  const items = [
    {
      label: "Overview",
      path: `/projects/${projectId}`,
      icon: BookOpen,
      end: true,
    },
    {
      label: "Materials",
      path: `/projects/${projectId}/materials`,
      icon: FileText,
    },
    {
      label: "Tutor",
      path: `/projects/${projectId}/tutor`,
      icon: MessageSquare,
    },
    {
      label: "Quiz",
      path: `/projects/${projectId}/quiz`,
      icon: Brain,
    },
    {
      label: "Growth",
      path: `/projects/${projectId}/growth`,
      icon: LineChart,
    },
    {
      label: "Analytics",
      path: `/projects/${projectId}/analytics`,
      icon: BarChart3,
    },
  ];

  return (
    <nav className="flex flex-wrap gap-1 border-b border-slate-800">
      {items.map((item) => {
        const Icon = item.icon;

        return (
          <NavLink
            key={item.label}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              `flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition ${
                isActive
                  ? "border-indigo-400 text-indigo-300"
                  : "border-transparent text-slate-500 hover:text-slate-200"
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        );
      })}
    </nav>
  );
}

export default ProjectNav;
