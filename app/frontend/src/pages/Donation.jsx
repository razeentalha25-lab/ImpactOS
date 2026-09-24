import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import { Plus, Trash2, TrendingUp, DollarSign, Target } from "lucide-react";
import { toast } from "sonner";
import Counter from "@/components/Counter";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";

const EMPTY = { donor_name:"", amount:0, date:"", campaign:"General", purpose:"" };

export default function Donations() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY);

  const load = async ()=> setItems((await api.get("/donations")).data);
  useEffect(()=>{ load(); },[]);

  const submit = async (e)=>{ e.preventDefault(); try {
    await api.post("/donations", form); toast.success("Donation recorded");
    setOpen(false); setForm(EMPTY); load();
  } catch { toast.error("Save failed"); } };
  const del = async (id)=>{ await api.delete(`/donations/${id}`); toast.success("Deleted"); load(); };

  const stats = useMemo(()=> {
    const total = items.reduce((s,d)=>s+(d.amount||0),0);
    const thisMonth = new Date().toISOString().slice(0,7);
    const monthTotal = items.filter(d=>(d.date||"").startsWith(thisMonth)).reduce((s,d)=>s+d.amount,0);
    const byMonth = {};
    items.forEach(d=>{ const m=(d.date||"").slice(0,7); byMonth[m]=(byMonth[m]||0)+d.amount; });
    const series = Object.entries(byMonth).sort().slice(-8).map(([m,v])=>({month:m.slice(5), amount:v}));
    const byCampaign = {};
    items.forEach(d=>{ byCampaign[d.campaign]=(byCampaign[d.campaign]||0)+d.amount; });
    return { total, monthTotal, series, campaigns: Object.entries(byCampaign).map(([c,v])=>({campaign:c, amount:v})) };
  },[items]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Donations</h1>
          <p className="text-[#64748B]">Every dollar counted, campaign by campaign.</p>
        </div>
        <button onClick={()=>{setForm({...EMPTY, date:new Date().toISOString().slice(0,10)}); setOpen(true);}} className="io-btn-accent" data-testid="record-donation-btn"><Plus size={16} className="inline mr-1"/>Record donation</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="io-card p-5" data-testid="don-stat-total">
          <div className="h-9 w-9 rounded-lg bg-[#E6F3F4] text-[#0D5C63] grid place-items-center"><DollarSign size={18}/></div>
          <div className="font-mono-stat text-3xl font-bold text-[#0D5C63] mt-4"><Counter end={stats.total} prefix="$"/></div>
          <div className="text-xs uppercase tracking-wider text-[#64748B] mt-1">Total raised</div>
        </div>
        <div className="io-card p-5" data-testid="don-stat-month">
          <div className="h-9 w-9 rounded-lg bg-[#FDF0ED] text-[#E05A47] grid place-items-center"><TrendingUp size={18}/></div>
          <div className="font-mono-stat text-3xl font-bold text-[#E05A47] mt-4"><Counter end={stats.monthTotal} prefix="$"/></div>
          <div className="text-xs uppercase tracking-wider text-[#64748B] mt-1">This month</div>
        </div>
        <div className="io-card p-5" data-testid="don-stat-avg">
          <div className="h-9 w-9 rounded-lg bg-[#E6F3F4] text-[#0D5C63] grid place-items-center"><Target size={18}/></div>
          <div className="font-mono-stat text-3xl font-bold text-[#0D5C63] mt-4"><Counter end={items.length?Math.round(stats.total/items.length):0} prefix="$"/></div>
          <div className="text-xs uppercase tracking-wider text-[#64748B] mt-1">Avg gift</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="io-card p-5">
          <h3 className="font-heading font-semibold text-lg">Monthly donations</h3>
          <div style={{width:"100%", height:240}}>
            <ResponsiveContainer>
              <BarChart data={stats.series}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA"/>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12}/>
                <YAxis stroke="#94A3B8" fontSize={12}/>
                <Tooltip contentStyle={{borderRadius:12, border:"1px solid #E6E1DA"}}/>
                <Bar dataKey="amount" fill="#0D5C63" radius={[8,8,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="io-card p-5">
          <h3 className="font-heading font-semibold text-lg">Campaigns</h3>
          <div style={{width:"100%", height:240}}>
            <ResponsiveContainer>
              <BarChart data={stats.campaigns} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA"/>
                <XAxis type="number" stroke="#94A3B8" fontSize={12}/>
                <YAxis dataKey="campaign" type="category" stroke="#94A3B8" fontSize={12} width={120}/>
                <Tooltip contentStyle={{borderRadius:12, border:"1px solid #E6E1DA"}}/>
                <Bar dataKey="amount" fill="#E05A47" radius={[0,8,8,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="io-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#F3EFEA] text-xs uppercase text-[#64748B] tracking-wider">
            <tr>
              <th className="text-left px-4 py-3">Donor</th>
              <th className="text-left px-4 py-3">Campaign</th>
              <th className="text-left px-4 py-3">Purpose</th>
              <th className="text-right px-4 py-3">Amount</th>
              <th className="text-left px-4 py-3">Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E6E1DA]">
            {items.map(d => (
              <tr key={d.id} className="hover:bg-[#FAF7F2]">
                <td className="px-4 py-3 font-medium">{d.donor_name}</td>
                <td className="px-4 py-3 text-[#64748B]">{d.campaign}</td>
                <td className="px-4 py-3 text-[#64748B]">{d.purpose}</td>
                <td className="px-4 py-3 text-right font-mono-stat text-[#0D5C63] font-bold">${d.amount}</td>
                <td className="px-4 py-3 text-[#64748B]">{d.date}</td>
                <td className="px-4 py-3 text-right"><button onClick={()=>del(d.id)} className="p-1.5 hover:bg-[#FDF0ED] text-[#E05A47] rounded"><Trash2 size={14}/></button></td>
              </tr>
            ))}
            {items.length===0 && <tr><td colSpan="6" className="text-center py-10 text-[#94A3B8]">No donations yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 bg-[#1E293B]/40 grid place-items-center p-4 z-50" onClick={()=>setOpen(false)}>
          <form onClick={e=>e.stopPropagation()} onSubmit={submit} className="bg-white rounded-2xl p-6 w-full max-w-md space-y-3">
            <h3 className="font-heading text-2xl font-bold">Record donation</h3>
            <input required placeholder="Donor name" value={form.donor_name} onChange={e=>setForm({...form,donor_name:e.target.value})} className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <input required type="number" step="0.01" placeholder="Amount" value={form.amount} onChange={e=>setForm({...form,amount:+e.target.value})} className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <input required type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <input placeholder="Campaign" value={form.campaign} onChange={e=>setForm({...form,campaign:e.target.value})} className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <input placeholder="Purpose" value={form.purpose} onChange={e=>setForm({...form,purpose:e.target.value})} className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={()=>setOpen(false)} className="io-btn-ghost border border-[#E6E1DA]">Cancel</button>
              <button className="io-btn-accent">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
