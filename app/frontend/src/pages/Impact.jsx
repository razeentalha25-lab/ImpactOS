import { useEffect, useState } from "react";
import api from "@/lib/api";
import Counter from "@/components/Counter";
import { Utensils, Package, Clock, Users, Calendar, Building2 } from "lucide-react";
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar } from "recharts";

export default function Impact() {
  const [data, setData] = useState(null);
  useEffect(()=>{ (async()=>{ const s = (await api.get("/stats")).data; setData(s); })(); },[]);
  if (!data) return <div className="text-[#64748B]">Loading impact...</div>;
  const s = data.stats;
  const monthly = data.monthly.slice(-8).map(m=>({...m, month: m.month.slice(5)}));

  const items = [
    { icon: Utensils, label:"Meals prepared", value:s.total_meals, tid:"impact-meals" },
    { icon: Package, label:"Hygiene kits distributed", value:s.total_kits, tid:"impact-kits" },
    { icon: Clock, label:"Volunteer hours", value:s.total_hours, tid:"impact-hours" },
    { icon: Users, label:"Volunteers involved", value:s.total_volunteers, tid:"impact-vols" },
    { icon: Calendar, label:"Events completed", value:s.completed_events, tid:"impact-events" },
    { icon: Building2, label:"Organizations served", value:s.total_partners, tid:"impact-orgs" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-[#0D5C63]">Community Impact</div>
        <h1 className="font-heading text-4xl md:text-5xl font-bold text-[#1E293B]">Every hand shapes a story.</h1>
        <p className="text-[#64748B] mt-2 max-w-2xl">Turning volunteer time into measurable community outcomes across our region.</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {items.map(({icon:Icon, label, value, tid}) => (
          <div key={tid} className="io-card p-6" data-testid={tid}>
            <div className="h-10 w-10 rounded-lg bg-[#E6F3F4] text-[#0D5C63] grid place-items-center"><Icon size={20}/></div>
            <div className="font-mono-stat text-4xl font-bold text-[#0D5C63] mt-4"><Counter end={value}/></div>
            <div className="text-sm text-[#64748B] mt-1">{label}</div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="io-card p-5">
          <h3 className="font-heading font-semibold text-lg">Meals & kits over time</h3>
          <div style={{width:"100%", height:280}}>
            <ResponsiveContainer>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="a1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#0D5C63" stopOpacity={0.4}/><stop offset="100%" stopColor="#0D5C63" stopOpacity={0}/></linearGradient>
                  <linearGradient id="a2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E05A47" stopOpacity={0.4}/><stop offset="100%" stopColor="#E05A47" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA"/>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12}/>
                <YAxis stroke="#94A3B8" fontSize={12}/>
                <Tooltip contentStyle={{borderRadius:12, border:"1px solid #E6E1DA"}}/>
                <Area type="monotone" dataKey="meals" stroke="#0D5C63" fill="url(#a1)" strokeWidth={2}/>
                <Area type="monotone" dataKey="kits" stroke="#E05A47" fill="url(#a2)" strokeWidth={2}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="io-card p-5">
          <h3 className="font-heading font-semibold text-lg">Volunteer hours by month</h3>
          <div style={{width:"100%", height:280}}>
            <ResponsiveContainer>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E6E1DA"/>
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12}/>
                <YAxis stroke="#94A3B8" fontSize={12}/>
                <Tooltip contentStyle={{borderRadius:12, border:"1px solid #E6E1DA"}}/>
                <Bar dataKey="hours" fill="#EAB308" radius={[8,8,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
    </div>
  );
}
