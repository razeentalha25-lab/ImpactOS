import { useEffect, useState } from "react";
import api from "@/lib/api";
import Counter from "@/components/Counter";
import { Link } from "react-router-dom";
import { Utensils, Users, Clock, HeartHandshake, Calendar, Plus, TrendingUp, Target, CheckCircle2, Sparkles } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const TEAL = "#0D5C63";
const CORAL = "#E05A47";

function StatCard({ icon: Icon, label, value, hint, tid, decimals=0, prefix="", suffix="" }) {
  return (
    <div className="io-card p-5" data-testid={tid}>
      <div className="flex items-center justify-between">
        <div className="h-9 w-9 rounded-lg bg-[#E6F3F4] text-[#0D5C63] grid place-items-center"><Icon size={18}/></div>
        <span className="text-[10px] uppercase tracking-widest text-[#94A3B8]">{hint}</span>
      </div>
      <div className="mt-4 font-mono-stat text-3xl font-bold text-[#0D5C63]"><Counter end={value} decimals={decimals} prefix={prefix} suffix={suffix}/></div>
      <div className="text-xs font-semibold uppercase tracking-wider text-[#64748B] mt-1">{label}</div>
    </div>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [projects, setProjects] = useState([]);
  useEffect(() => { (async () => {
    const [s, e, p] = await Promise.all([api.get("/stats"), api.get("/events"), api.get("/projects")]);
    setData(s.data); setEvents(e.data); setProjects(p.data);
  })(); }, []);
  if (!data) return <div className="text-[#64748B]">Loading impact data...</div>;
  const s = data.stats;
  const upcoming = events.filter(e => e.status === "upcoming").slice(0, 4);
  const monthly = data.monthly.slice(-8).map(m => ({ ...m, month: m.month.slice(5) }));
  const pieData = [
    { name: "Meals", value: s.total_meals, color: TEAL },
    { name: "Kits", value: s.total_kits, color: CORAL },
    { name: "Hours", value: s.total_hours, color: "#EAB308" },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#0D5C63] flex items-center gap-2"><Sparkles size={14}/> Youth-Led Initiative</div>
          <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1E293B] mt-1">Hope in Hand</h1>
          <p className="text-[#64748B] mt-1">Your community impact at a glance.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/app/events" className="io-btn-primary" data-testid="quick-action-new-event"><Plus size={16} className="inline mr-1"/> New event</Link>
          <Link to="/app/volunteers" className="io-btn-ghost border border-[#E6E1DA]" data-testid="quick-action-log-hours">Log hours</Link>
          <Link to="/app/donations" className="io-btn-accent" data-testid="quick-action-record-donation">Record donation</Link>
        </div>
      </header>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Utensils} label="Meals Made" value={s.total_meals || 2754} hint="Lifetime" tid="stat-card-meals-made"/>
        <StatCard icon={Target} label="Monthly Goal" value={150} hint="Meals / month" tid="stat-card-monthly-goal" suffix="+"/>
        <StatCard icon={Clock} label="Volunteer Hours" value={s.total_hours} hint="Logged" tid="stat-card-volunteer-hours" decimals={0}/>
        <StatCard icon={Users} label="Volunteers" value={s.total_volunteers} hint="Active" tid="stat-card-volunteers-count"/>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard icon={Calendar} label="Events" value={s.total_events} hint={`${s.completed_events} completed`} tid="stat-card-events"/>
        <StatCard icon={HeartHandshake} label="Partners" value={s.total_partners} hint="Orgs served" tid="stat-card-partners"/>
        <StatCard icon={TrendingUp} label="Donations" value={s.total_donations} hint="Raised" tid="stat-card-donations" prefix="$"/>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="io-card p-5 lg:col-span-2" data-testid="chart-monthly-service">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-heading font-semibold text-lg text-[#1E293B]">Monthly service</h3>
              <p className="text-xs text-[#64748B]">Meals & kits produced each month</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="mealsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={TEAL} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={TEAL} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="kitsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CORAL} stopOpacity={0.4}/>
                    <stop offset="100%" stopColor={CORAL} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA"/>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12}/>
                <YAxis stroke="#94A3B8" fontSize={12}/>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E6E1DA" }}/>
                <Area type="monotone" dataKey="meals" stroke={TEAL} fill="url(#mealsGrad)" strokeWidth={2}/>
                <Area type="monotone" dataKey="kits" stroke={CORAL} fill="url(#kitsGrad)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="io-card p-5" data-testid="chart-impact-breakdown">
          <h3 className="font-heading font-semibold text-lg text-[#1E293B]">Impact mix</h3>
          <p className="text-xs text-[#64748B]">Lifetime breakdown</p>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" stroke="none">
                  {pieData.map((d, i) => <Cell key={i} fill={d.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #E6E1DA" }}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-around text-xs text-[#64748B]">
            {pieData.map(p => <div key={p.name} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{background:p.color}}/>{p.name}</div>)}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="io-card p-5 lg:col-span-2" data-testid="upcoming-events">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold text-lg">Upcoming events</h3>
            <Link to="/app/events" className="text-sm text-[#0D5C63] font-medium">View all →</Link>
          </div>
          <ul className="divide-y divide-[#E6E1DA]">
            {upcoming.length === 0 && <li className="py-6 text-center text-[#94A3B8] text-sm">No upcoming events yet.</li>}
            {upcoming.map(e => (
              <li key={e.id} className="py-3 flex items-center gap-4">
                <div className="h-11 w-11 rounded-lg bg-[#FDF0ED] text-[#E05A47] grid place-items-center font-mono-stat font-bold">
                  {new Date(e.date).getDate()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#1E293B] truncate">{e.title}</div>
                  <div className="text-xs text-[#64748B] truncate">{e.location} · Led by {e.team_leader || "—"}</div>
                </div>
                <div className="text-xs uppercase tracking-widest text-[#64748B]">Cap {e.capacity}</div>
              </li>
            ))}
          </ul>
        </div>

        <div className="io-card p-5" data-testid="goals-card">
          <h3 className="font-heading font-semibold text-lg mb-3">Monthly goals</h3>
          <div className="space-y-4">
            {projects.slice(0,3).map(p => {
              const pct = Math.min(100, Math.round((p.progress / p.goal) * 100));
              return (
                <div key={p.id}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-[#1E293B] truncate">{p.name}</span>
                    <span className="font-mono-stat text-[#0D5C63]">{pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#F3EFEA] mt-1 overflow-hidden">
                    <div className="h-full rounded-full bg-[#0D5C63]" style={{ width: pct + "%" }}/>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-1">{p.progress} / {p.goal}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="io-card p-5" data-testid="recent-activity">
        <h3 className="font-heading font-semibold text-lg mb-3">Recent activity</h3>
        <ul className="space-y-3">
          {data.recent_events.slice(0,5).map(e => (
            <li key={e.id} className="flex items-center gap-3 text-sm">
              <div className="h-7 w-7 rounded-full bg-[#E6F3F4] text-[#0D5C63] grid place-items-center"><CheckCircle2 size={14}/></div>
              <div className="flex-1"><span className="font-semibold">{e.title}</span> · <span className="text-[#64748B]">{e.meals_produced || 0} meals · {e.hours_logged || 0} hrs</span></div>
              <div className="text-xs text-[#94A3B8]">{e.date}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
