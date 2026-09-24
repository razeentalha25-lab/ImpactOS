import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Plus, Pencil, Trash2, MapPin, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";

const EMPTY = { title:"", date:"", location:"", description:"", capacity:20, team_leader:"", volunteers_attended:0, hours_logged:0, meals_produced:0, kits_produced:0, notes:"", status:"upcoming" };

export default function Events() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);

  const load = async () => setItems((await api.get("/events")).data);
  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      if (editing) { await api.put(`/events/${editing}`, form); toast.success("Event updated"); }
      else { await api.post("/events", form); toast.success("Event created"); }
      setOpen(false); setEditing(null); setForm(EMPTY); load();
    } catch(err) { toast.error("Save failed"); }
  };
  const del = async (id) => { await api.delete(`/events/${id}`); toast.success("Deleted"); load(); };
  const edit = (e) => { setForm({...EMPTY, ...e}); setEditing(e.id); setOpen(true); };

  const filtered = items.filter(e => (status==="all" || e.status===status) && e.title.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold text-[#1E293B]">Events</h1>
          <p className="text-[#64748B]">Plan, run, and measure every community event.</p>
        </div>
        <button onClick={() => { setForm(EMPTY); setEditing(null); setOpen(true); }} className="io-btn-primary" data-testid="new-event-btn"><Plus size={16} className="inline mr-1"/>New event</button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <input placeholder="Search events..." value={q} onChange={e=>setQ(e.target.value)} className="flex-1 min-w-[200px] px-4 py-2 rounded-lg border border-[#E6E1DA] bg-white" data-testid="events-search"/>
        <select value={status} onChange={e=>setStatus(e.target.value)} className="px-4 py-2 rounded-lg border border-[#E6E1DA] bg-white" data-testid="events-filter-status">
          <option value="all">All statuses</option>
          <option value="upcoming">Upcoming</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="event-management-grid">
        {filtered.length === 0 && <div className="col-span-full text-center text-[#94A3B8] io-card p-10">No events match your filters.</div>}
        {filtered.map(e => (
          <div key={e.id} className="io-card p-5" data-testid={`event-card-${e.id}`}>
            <div className="flex justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${e.status==="completed"?"bg-[#E6F3F4] text-[#0D5C63]":e.status==="upcoming"?"bg-[#FDF0ED] text-[#E05A47]":"bg-[#F3EFEA] text-[#64748B]"}`}>{e.status}</span>
              <div className="flex gap-1">
                <button onClick={()=>edit(e)} className="p-1.5 hover:bg-[#F3EFEA] rounded" data-testid={`edit-event-${e.id}`}><Pencil size={14}/></button>
                <button onClick={()=>del(e.id)} className="p-1.5 hover:bg-[#FDF0ED] text-[#E05A47] rounded" data-testid={`delete-event-${e.id}`}><Trash2 size={14}/></button>
              </div>
            </div>
            <h3 className="font-heading font-semibold text-lg mt-3">{e.title}</h3>
            <div className="text-xs text-[#64748B] flex items-center gap-1 mt-1"><CalIcon size={12}/> {e.date}</div>
            <div className="text-xs text-[#64748B] flex items-center gap-1"><MapPin size={12}/> {e.location}</div>
            <div className="grid grid-cols-3 gap-2 mt-4 text-center">
              <div><div className="font-mono-stat font-bold text-[#0D5C63]">{e.volunteers_attended}</div><div className="text-[10px] uppercase text-[#94A3B8]">Vols</div></div>
              <div><div className="font-mono-stat font-bold text-[#0D5C63]">{e.meals_produced}</div><div className="text-[10px] uppercase text-[#94A3B8]">Meals</div></div>
              <div><div className="font-mono-stat font-bold text-[#0D5C63]">{e.hours_logged}</div><div className="text-[10px] uppercase text-[#94A3B8]">Hours</div></div>
            </div>
            {e.team_leader && <div className="text-xs text-[#64748B] mt-3">Led by <span className="text-[#1E293B] font-medium">{e.team_leader}</span></div>}
          </div>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 bg-[#1E293B]/40 grid place-items-center p-4 z-50" onClick={()=>setOpen(false)}>
          <form onClick={e=>e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-3" data-testid="event-dialog">
            <h3 className="font-heading text-2xl font-bold">{editing?"Edit event":"New event"}</h3>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="Title" value={form.title} onChange={e=>setForm({...form, title:e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg" data-testid="event-title-input"/>
              <input required type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg" data-testid="event-date-input"/>
              <input placeholder="Location" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg" data-testid="event-location-input"/>
              <input placeholder="Team leader" value={form.team_leader} onChange={e=>setForm({...form, team_leader:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <select value={form.status} onChange={e=>setForm({...form, status:e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg">
                <option value="upcoming">Upcoming</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option>
              </select>
              <input type="number" placeholder="Capacity" value={form.capacity} onChange={e=>setForm({...form, capacity:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Volunteers attended" value={form.volunteers_attended} onChange={e=>setForm({...form, volunteers_attended:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Hours logged" value={form.hours_logged} onChange={e=>setForm({...form, hours_logged:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Meals produced" value={form.meals_produced} onChange={e=>setForm({...form, meals_produced:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <input type="number" placeholder="Kits produced" value={form.kits_produced} onChange={e=>setForm({...form, kits_produced:+e.target.value})} className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
              <textarea placeholder="Notes" value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={()=>setOpen(false)} className="io-btn-ghost border border-[#E6E1DA]">Cancel</button>
              <button className="io-btn-primary" data-testid="event-save-btn">{editing?"Save":"Create"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
