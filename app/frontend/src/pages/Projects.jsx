import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { name:"", description:"", goal:500, progress:0, volunteers_count:0, meals_produced:0, kits_produced:0, partner_id:null, start_date:"", end_date:"", status:"active" };

export default function Projects() {
  const [items, setItems] = useState([]);
  const [partners, setPartners] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const [p, pp] = await Promise.all([api.get("/projects"), api.get("/partners")]);
    setItems(p.data); setPartners(pp.data);
  };
  useEffect(()=>{ load(); },[]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) await api.put(`/projects/${editing}`, form);
      else await api.post("/projects", form);
      toast.success(editing?"Project updated":"Project created");
      setOpen(false); setEditing(null); setForm(EMPTY); load();
    } catch { toast.error("Save failed"); }
  };
  const del = async (id)=>{ await api.delete(`/projects/${id}`); toast.success("Removed"); load(); };
  const edit = (p)=>{ setForm({...EMPTY, ...p}); setEditing(p.id); setOpen(true); };

  const groups = { planning: [], active: [], completed: [] };
  items.forEach(p => (groups[p.status] || groups.active).push(p));

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Projects</h1>
          <p className="text-[#64748B]">Long-running initiatives with measurable goals.</p>
        </div>
        <button onClick={()=>{setForm(EMPTY); setEditing(null); setOpen(true);}} className="io-btn-primary" data-testid="new-project-btn"><Plus size={16} className="inline mr-1"/>New project</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4" data-testid="project-kanban-board">
        {["planning","active","completed"].map(col => (
          <div key={col} className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="font-heading font-semibold capitalize">{col}</h3>
              <span className="text-xs text-[#94A3B8]">{groups[col].length}</span>
            </div>
            {groups[col].map(p => {
              const pct = Math.min(100, Math.round((p.progress / (p.goal||1)) * 100));
              const partner = partners.find(x => x.id === p.partner_id);
              return (
                <div key={p.id} className="io-card p-4" data-testid={`project-card-${p.id}`}>
                  <div className="flex justify-between">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-semibold tracking-wider ${p.status==="active"?"bg-[#E6F3F4] text-[#0D5C63]":p.status==="completed"?"bg-[#F3EFEA] text-[#64748B]":"bg-[#FDF0ED] text-[#E05A47]"}`}>{p.status}</span>
                    <div className="flex gap-1">
                      <button onClick={()=>edit(p)} className="p-1 hover:bg-[#F3EFEA] rounded"><Pencil size={12}/></button>
                      <button onClick={()=>del(p.id)} className="p-1 hover:bg-[#FDF0ED] text-[#E05A47] rounded"><Trash2 size={12}/></button>
                    </div>
                  </div>
                  <h4 className="font-heading font-semibold mt-2">{p.name}</h4>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{p.description}</p>
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1"><span className="text-[#64748B]">Progress</span><span className="font-mono-stat text-[#0D5C63]">{pct}%</span></div>
                    <div className="h-1.5 bg-[#F3EFEA] rounded-full overflow-hidden"><div className="h-full bg-[#0D5C63]" style={{width:pct+"%"}}/></div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div><div className="font-mono-stat text-sm font-bold">{p.volunteers_count}</div><div className="text-[9px] uppercase text-[#94A3B8]">Vols</div></div>
                    <div><div className="font-mono-stat text-sm font-bold">{p.meals_produced}</div><div className="text-[9px] uppercase text-[#94A3B8]">Meals</div></div>
                    <div><div className="font-mono-stat text-sm font-bold">{p.kits_produced}</div><div className="text-[9px] uppercase text-[#94A3B8]">Kits</div></div>
                  </div>
                  {partner && <div className="text-[11px] mt-3 text-[#64748B]">Partner: <span className="text-[#1E293B]">{partner.name}</span></div>}
                </div>
              );
            })}
            {groups[col].length===0 && <div className="text-center text-xs text-[#94A3B8] py-6 border border-dashed border-[#E6E1DA] rounded-xl">Empty</div>}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-[#1E293B]/40 grid place-items-center p-4 z-50" onClick={()=>setOpen(false)}>
          <form onClick={e=>e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-xl space-y-3">
            <h3 className="font-heading text-2xl font-bold">{editing?"Edit project":"New project"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <textarea placeholder="Description" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Goal" value={form.goal} onChange={e=>setForm({...form,goal:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Progress" value={form.progress} onChange={e=>setForm({...form,progress:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Volunteers" value={form.volunteers_count} onChange={e=>setForm({...form,volunteers_count:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Meals" value={form.meals_produced} onChange={e=>setForm({...form,meals_produced:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Kits" value={form.kits_produced} onChange={e=>setForm({...form,kits_produced:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <select value={form.status} onChange={e=>setForm({...form,status:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg">
                <option value="planning">Planning</option><option value="active">Active</option><option value="completed">Completed</option>
              </select>
              <input required type="date" value={form.start_date} onChange={e=>setForm({...form,start_date:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input required type="date" value={form.end_date} onChange={e=>setForm({...form,end_date:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <select value={form.partner_id||""} onChange={e=>setForm({...form,partner_id:e.target.value||null})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg">
                <option value="">No partner</option>
                {partners.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={()=>setOpen(false)} className="io-btn-ghost border border-[#E6E1DA]">Cancel</button>
              <button className="io-btn-primary">{editing?"Save":"Create"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
