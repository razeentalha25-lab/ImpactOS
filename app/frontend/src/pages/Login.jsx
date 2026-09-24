import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

function formatErr(d){ if(!d) return "Something went wrong"; if(typeof d==="string") return d; if(Array.isArray(d)) return d.map(e=>e?.msg||JSON.stringify(e)).join(" "); return d?.msg||String(d); }

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("razeentalha25@gmail.com");
  const [password, setPassword] = useState("HopeInHand2026!");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success("Welcome back");
      nav("/app");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail) || "Login failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#FAF7F2]">
      <div className="hidden md:flex flex-col justify-between p-10 bg-[#0D5C63] text-white relative overflow-hidden">
        <div className="flex items-center gap-2 relative z-10">
          <div className="h-9 w-9 rounded-xl bg-white/15 grid place-items-center"><Sparkles size={18}/></div>
          <span className="font-heading font-bold text-lg">ImpactOS</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-heading text-4xl lg:text-5xl font-bold leading-tight">The operating system for youth-led community service.</h1>
          <p className="mt-4 text-white/80 max-w-md">Track volunteers, run events, measure real community impact — and make every meal count.</p>
          <div className="mt-8 flex gap-6">
            <div><div className="font-mono-stat text-3xl font-bold">2,754</div><div className="text-xs uppercase tracking-widest text-white/60">Meals Served</div></div>
            <div><div className="font-mono-stat text-3xl font-bold">184</div><div className="text-xs uppercase tracking-widest text-white/60">Volunteers</div></div>
            <div><div className="font-mono-stat text-3xl font-bold">14</div><div className="text-xs uppercase tracking-widest text-white/60">Partners</div></div>
          </div>
        </div>
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#E05A47]/30 blur-3xl"/>
      </div>
      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-md space-y-5" data-testid="login-form">
          <div>
            <h2 className="font-heading text-3xl font-bold text-[#1E293B]">Welcome back</h2>
            <p className="text-[#64748B] mt-1">Sign in to your ImpactOS workspace</p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Email</label>
            <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} data-testid="login-email"
              className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#E6E1DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C63]" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Password</label>
            <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} data-testid="login-password"
              className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#E6E1DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C63]" />
          </div>
          <button disabled={loading} className="io-btn-primary w-full" data-testid="login-submit-btn">
            {loading ? "Signing in..." : "Sign in"}
          </button>
          <div className="flex justify-between text-sm text-[#64748B]">
            <Link to="/register" className="hover:text-[#0D5C63]" data-testid="link-register">Create an account</Link>
            <Link to="/" className="hover:text-[#0D5C63]">← Home</Link>
          </div>
        </form>
      </div>
    </div>
  );
}
