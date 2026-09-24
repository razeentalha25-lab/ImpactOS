import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, Trophy, Award } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { name:"", email:"", grade:"", hours:0, events_attended:0, skills:[], leadership_role:"" };

export default function Volunteers() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState("hours");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [skillsText, setSkillsText] = useState("");

  const load = async () => setItems((await api.get("/volunteers")).data);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, skills: skillsText.split(",").map(s=>s.trim()).filter(Boolean) };
    try {
      if (editing) await api.put(`/volunteers/${editing}`, payload);
      else await api.post("/volunteers", payload);
      toast.success(editing ? "Volunteer updated" : "Volunteer added");
      setOpen(false); setEditing(null); setForm(EMPTY); setSkillsText(""); load();
    } catch { toast.error("Save failed"); }
  };
  const del = async (id) => { await api.delete(`/volunteers/${id}`); toast.success("Removed"); load(); };
  const edit = (v) => { setForm({...EMPTY, ...v}); setSkillsText((v.skills||[]).join(", ")); setEditing(v.id); setOpen(true); };

  const filtered = items.filter(v => v.name.toLowerCase().includes(q.toLowerCase()) || (v.email||"").toLowerCase().includes(q.toLowerCase()));
  const sorted = [...filtered].sort((a,b)=> sortBy==="name" ? a.name.localeCompare(b.name) : (b[sortBy]||0)-(a[sortBy]||0));
  const top = sorted.slice(0,3);

  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-col sm:flex-row gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Volunteers</h1>
          <p className="text-[#64748B]">Manage your community heroes and their impact.</p>
        </div>
        <button onClick={()=>{setForm(EMPTY); setSkillsText(""); setEditing(null); setOpen(true);}} className="io-btn-primary" data-testid="new-volunteer-btn"><Plus size={16} className="inline mr-1"/>Add volunteer</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {top.map((v,i) => (
          <div key={v.id} className="io-card p-5 relative overflow-hidden" data-testid={`leaderboard-${i}`}>
            <div className="absolute -top-4 -right-4 h-16 w-16 rounded-full bg-[#E6F3F4]"/>
            <div className="relative">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-[#0D5C63] font-semibold">
                {i===0 ? <Trophy size={14}/> : <Award size={14}/>} #{i+1}
              </div>
              <div className="font-heading font-bold text-xl mt-2">{v.name}</div>
              <div className="text-xs text-[#64748B]">{v.grade} · {v.leadership_role || "Volunteer"}</div>
              <div className="mt-3 flex gap-4">
                <div><div className="font-mono-stat text-2xl font-bold text-[#0D5C63]">{v.hours}</div><div className="text-[10px] uppercase text-[#94A3B8]">Hours</div></div>
                <div><div className="font-mono-stat text-2xl font-bold text-[#E05A47]">{v.events_attended}</div><div className="text-[10px] uppercase text-[#94A3B8]">Events</div></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 flex-wrap">
        <input placeholder="Search by name or email..." value={q} onChange={e=>setQ(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-[#E6E1DA] bg-white" data-testid="volunteer-search"/>
        <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="px-4 py-2 rounded-lg border border-[#E6E1DA] bg-white" data-testid="volunteer-sort">
          <option value="hours">Sort: Hours</option>
          <option value="events_attended">Sort: Events</option>
          <option value="name">Sort: Name</option>
        </select>
      </div>

      <div className="io-card overflow-hidden" data-testid="volunteer-leaderboard-table">
        <table className="w-full text-sm">
          <thead className="bg-[#F3EFEA] text-[#64748B] text-xs uppercase tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Grade</th>
              <th className="text-left px-4 py-3">Role</th>
              <th className="text-right px-4 py-3">Hours</th>
              <th className="text-right px-4 py-3">Events</th>
              <th className="text-left px-4 py-3">Skills</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E1DA]">
            {sorted.map(v => (
              <tr key={v.id} className="hover:bg-[#FAF7F2]">
                <td className="px-4 py-3 font-medium">{v.name}<div className="text-xs text-[#94A3B8]">{v.email}</div></td>
                <td className="px-4 py-3 text-[#64748B]">{v.grade}</td>
                <td className="px-4 py-3 text-[#64748B]">{v.leadership_role || "—"}</td>
                <td className="px-4 py-3 text-right font-mono-stat">{v.hours}</td>
                <td className="px-4 py-3 text-right font-mono-stat">{v.events_attended}</td>
                <td className="px-4 py-3"><div className="flex flex-wrap gap-1">{(v.skills||[]).map(s => <span key={s} className="text-[10px] px-2 py-0.5 rounded-full bg-[#E6F3F4] text-[#0D5C63]">{s}</span>)}</div></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={()=>edit(v)} className="p-1.5 hover:bg-[#F3EFEA] rounded" data-testid={`edit-vol-${v.id}`}><Pencil size={14}/></button>
                  <button onClick={()=>del(v.id)} className="p-1.5 hover:bg-[#FDF0ED] text-[#E05A47] rounded" data-testid={`del-vol-${v.id}`}><Trash2 size={14}/></button>
                </td>
              </tr>
            ))}
            {sorted.length===0 && <tr><td colSpan="7" className="text-center py-10 text-[#94A3B8]">No volunteers yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-[#1E293B]/40 grid place-items-center p-4 z-50" onClick={()=>setOpen(false)}>
          <form onClick={e=>e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-3" data-testid="volunteer-dialog">
            <h3 className="font-heading text-2xl font-bold">{editing?"Edit volunteer":"Add volunteer"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Full name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input placeholder="Grade / age group" value={form.grade} onChange={e=>setForm({...form, grade:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input placeholder="Leadership role" value={form.leadership_role} onChange={e=>setForm({...form, leadership_role:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Hours" value={form.hours} onChange={e=>setForm({...form, hours:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Events attended" value={form.events_attended} onChange={e=>setForm({...form, events_attended:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input placeholder="Skills (comma separated)" value={skillsText} onChange={e=>setSkillsText(e.target.value)} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={()=>setOpen(false)} className="io-btn-ghost border border-[#E6E1DA]">Cancel</button>
              <button className="io-btn-primary" data-testid="volunteer-save-btn">{editing?"Save":"Add"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
