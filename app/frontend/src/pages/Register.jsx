import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

function formatErr(d){ if(!d) return "Something went wrong"; if(typeof d==="string") return d; if(Array.isArray(d)) return d.map(e=>e?.msg||JSON.stringify(e)).join(" "); return d?.msg||String(d); }

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await register(email, password, name);
      toast.success("Account created");
      nav("/app");
    } catch (err) {
      toast.error(formatErr(err.response?.data?.detail) || "Registration failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-[#FAF7F2]">
      <form onSubmit={submit} className="w-full max-w-md io-card p-8 space-y-5" data-testid="register-form">
        <div>
          <h2 className="font-heading text-3xl font-bold text-[#1E293B]">Start your nonprofit's workspace</h2>
          <p className="text-[#64748B] mt-1 text-sm">Bring your community service work into one place.</p>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Full name</label>
          <input required value={name} onChange={(e)=>setName(e.target.value)} data-testid="register-name"
            className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#E6E1DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C63]" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Email</label>
          <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} data-testid="register-email"
            className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#E6E1DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C63]" />
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-wider text-[#64748B]">Password</label>
          <input type="password" required minLength={6} value={password} onChange={(e)=>setPassword(e.target.value)} data-testid="register-password"
            className="mt-1 w-full px-4 py-2.5 rounded-lg border border-[#E6E1DA] bg-white focus:outline-none focus:ring-2 focus:ring-[#0D5C63]" />
        </div>
        <button disabled={loading} className="io-btn-primary w-full" data-testid="register-submit-btn">
          {loading ? "Creating..." : "Create account"}
        </button>
        <div className="text-sm text-[#64748B]">Already have an account? <Link to="/login" className="text-[#0D5C63] font-medium">Sign in</Link></div>
      </form>
    </div>
  );
}
