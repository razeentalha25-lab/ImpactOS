import { Link } from "react-router-dom";
import { Sparkles, ArrowRight, Users, Calendar, TrendingUp, Heart } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B]">
      <nav className="sticky top-0 z-40 bg-[#FAF7F2]/85 backdrop-blur border-b border-[#E6E1DA]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#0D5C63] text-white grid place-items-center"><Sparkles size={18}/></div>
            <span className="font-heading font-bold text-lg">ImpactOS</span>
          </div>
          <div className="flex gap-2">
            <Link to="/org/hope-in-hand" className="io-btn-ghost hidden sm:inline-block">Live demo →</Link>
            <Link to="/login" className="io-btn-ghost border border-[#E6E1DA]">Sign in</Link>
            <Link to="/register" className="io-btn-primary">Get started</Link>
          </div>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-6 pt-20 pb-20 text-center">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#0D5C63] flex items-center justify-center gap-2"><Sparkles size={14}/>The OS for youth-led nonprofits</div>
        <h1 className="font-heading text-5xl md:text-7xl font-bold leading-[1.02] mt-4 max-w-4xl mx-auto">
          Run your service org like a <span className="text-[#0D5C63]">real startup</span>.
        </h1>
        <p className="text-[#64748B] mt-6 text-lg max-w-2xl mx-auto">
          Manage volunteers, events, projects, donations and partners — and turn every hour of service into measurable community impact.
        </p>
        <div className="mt-8 flex gap-3 justify-center">
          <Link to="/register" className="io-btn-primary">Start free <ArrowRight size={16} className="inline ml-1"/></Link>
          <Link to="/org/hope-in-hand" className="io-btn-ghost border border-[#E6E1DA]">See a live example</Link>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          [Calendar,"Events","Plan, run, and measure."],
          [Users,"Volunteers","Profiles, leaderboards, hours."],
          [TrendingUp,"Impact","Real dashboards, real numbers."],
          [Heart,"Donations","Every dollar accounted for."],
        ].map(([Icon,t,d])=>(
          <div key={t} className="io-card p-5">
            <div className="h-9 w-9 rounded-lg bg-[#E6F3F4] text-[#0D5C63] grid place-items-center"><Icon size={18}/></div>
            <div className="font-heading font-semibold mt-3">{t}</div>
            <div className="text-sm text-[#64748B]">{d}</div>
          </div>
        ))}
      </section>

      <footer className="max-w-6xl mx-auto px-6 mt-24 py-10 text-sm text-[#64748B] text-center border-t border-[#E6E1DA]">
        Built by youth, for youth. © {new Date().getFullYear()} ImpactOS.
      </footer>
    </div>
  );
}
