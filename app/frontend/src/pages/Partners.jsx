import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, Building2 } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { name:"", contact_person:"", email:"", partnership_type:"shelter", contributions:"", notes:"" };
const TYPES = ["shelter","school","community","healthcare","business"];

export default function Partners() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [type, setType] = useState("all");

  const load = async () => setItems((await api.get("/partners")).data);
  useEffect(()=>{ load(); },[]);
  const submit = async (e)=>{ e.preventDefault(); try {
    if (editing) await api.put(`/partners/${editing}`, form); else await api.post("/partners", form);
    toast.success("Saved"); setOpen(false); setEditing(null); setForm(EMPTY); load();
  } catch { toast.error("Save failed"); } };
  const del = async (id)=>{ await api.delete(`/partners/${id}`); toast.success("Removed"); load(); };
  const edit = (p)=>{ setForm({...EMPTY,...p}); setEditing(p.id); setOpen(true); };

  const filtered = items.filter(p => (type==="all"||p.partnership_type===type) && p.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Partners</h1>
          <p className="text-[#64748B]">The organizations that make our impact possible.</p>
        </div>
        <button onClick={()=>{setForm(EMPTY); setEditing(null); setOpen(true);}} className="io-btn-primary" data-testid="new-partner-btn"><Plus size={16} className="inline mr-1"/>Add partner</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input placeholder="Search partners..." value={q} onChange={e=>setQ(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-[#E6E1DA] bg-white"/>
        <select value={type} onChange={e=>setType(e.target.value)} className="px-4 py-2 rounded-lg border border-[#E6E1DA] bg-white">
          <option value="all">All types</option>
          {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(p => (
          <div key={p.id} className="io-card p-5" data-testid={`partner-card-${p.id}`}>
            <div className="flex justify-between items-start">
              <div className="h-10 w-10 rounded-lg bg-[#E6F3F4] text-[#0D5C63] grid place-items-center"><Building2 size={18}/></div>
              <div className="flex gap-1">
                <button onClick={()=>edit(p)} className="p-1 hover:bg-[#F3EFEA] rounded"><Pencil size={14}/></button>
                <button onClick={()=>del(p.id)} className="p-1 hover:bg-[#FDF0ED] text-[#E05A47] rounded"><Trash2 size={14}/></button>
              </div>
            </div>
            <h3 className="font-heading font-semibold mt-3">{p.name}</h3>
            <span className="text-[10px] uppercase tracking-widest text-[#0D5C63] font-semibold">{p.partnership_type}</span>
            <div className="text-sm text-[#64748B] mt-2">{p.contact_person}<div className="text-xs">{p.email}</div></div>
            {p.contributions && <p className="text-xs text-[#64748B] mt-3 border-t border-[#E6E1DA] pt-3">{p.contributions}</p>}
          </div>
        ))}
        {filtered.length===0 && <div className="col-span-full text-center text-[#94A3B8] io-card p-10">No partners match.</div>}
      </div>

      {open && (
        <div className="fixed inset-0 bg-[#1E293B]/40 grid place-items-center p-4 z-50" onClick={()=>setOpen(false)}>
          <form onClick={e=>e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-3">
            <h3 className="font-heading text-2xl font-bold">{editing?"Edit partner":"Add partner"}</h3>
            <input required placeholder="Organization name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Contact person" value={form.contact_person} onChange={e=>setForm({...form,contact_person:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <select value={form.partnership_type} onChange={e=>setForm({...form,partnership_type:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg col-span-2">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <textarea placeholder="Contributions" value={form.contributions} onChange={e=>setForm({...form,contributions:e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={()=>setOpen(false)} className="io-btn-ghost border border-[#E6E1DA]">Cancel</button>
              <button className="io-btn-primary">{editing?"Save":"Add"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
