import { NavLink, useNavigate, Outlet } from "react-router-dom";
import { LayoutDashboard, Calendar, Users, Kanban, Handshake, HeartHandshake, TrendingUp, FileText, Globe, Settings, LogOut, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const NAV = [
  { to: "/app", label: "Dashboard", icon: LayoutDashboard, tid: "nav-dashboard", end: true },
  { to: "/app/events", label: "Events", icon: Calendar, tid: "nav-events" },
  { to: "/app/volunteers", label: "Volunteers", icon: Users, tid: "nav-volunteers" },
  { to: "/app/projects", label: "Projects", icon: Kanban, tid: "nav-projects" },
  { to: "/app/partners", label: "Partners", icon: Handshake, tid: "nav-partners" },
  { to: "/app/donations", label: "Donations", icon: HeartHandshake, tid: "nav-donations" },
  { to: "/app/impact", label: "Impact", icon: TrendingUp, tid: "nav-impact" },
  { to: "/app/reports", label: "Reports", icon: FileText, tid: "nav-reports" },
  { to: "/org/hope-in-hand", label: "Public Page", icon: Globe, tid: "nav-public-profile" },
  { to: "/app/settings", label: "Settings", icon: Settings, tid: "nav-settings" },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const initials = (user?.name || "U").split(" ").map((s) => s[0]).slice(0, 2).join("");
  return (
    <div className="min-h-screen flex bg-[#FAF7F2]">
      <aside className="w-64 min-h-screen bg-[#F3EFEA] border-r border-[#E6E1DA] flex flex-col justify-between sticky top-0 h-screen" data-testid="sidebar">
        <div className="p-5">
          <div className="flex items-center gap-2 mb-8" data-testid="app-header">
            <div className="h-9 w-9 rounded-xl bg-[#0D5C63] text-white grid place-items-center">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="font-heading font-bold text-[#1E293B] leading-tight">ImpactOS</div>
              <div className="text-[10px] uppercase tracking-widest text-[#64748B]">Hope in Hand</div>
            </div>
          </div>
          <nav className="space-y-1">
            {NAV.map(({ to, label, icon: Icon, tid, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                data-testid={tid}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-[#E6E1DA]">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-[#0D5C63] text-white grid place-items-center font-semibold text-sm">{initials}</div>
            <div className="min-w-0">
              <div className="text-sm font-semibold truncate text-[#1E293B]" data-testid="user-name">{user?.name}</div>
              <div className="text-[11px] text-[#64748B] uppercase tracking-wide">{user?.role?.replace("_", " ")}</div>
            </div>
          </div>
          <button
            onClick={async () => { await logout(); nav("/login"); }}
            className="w-full flex items-center gap-2 text-sm text-[#64748B] hover:text-[#E05A47] transition-colors"
            data-testid="logout-btn"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-4 md:p-8">
        <div className="max-w-7xl mx-auto io-fade-up">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
