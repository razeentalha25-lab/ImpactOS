import { useEffect, useState } from "react";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Check } from "lucide-react";

const PLANS = [
  { id:"free", name:"Free", price:"$0", features:["1 organization","Basic volunteer tracking","Basic events"] },
  { id:"growth", name:"Growth", price:"$15/mo", features:["Advanced analytics","PDF reports","More volunteers"] },
  { id:"organization", name:"Organization", price:"$39/mo", features:["Multiple admins","Advanced reporting","Custom branding"] },
];

export default function Settings() {
  const { user } = useAuth();
  const [org, setOrg] = useState(null);

  useEffect(()=>{ (async()=>{ try { const o = (await api.get("/orgs/hope-in-hand")).data; setOrg(o);} catch{} })(); },[]);

  const save = async (e)=>{
    e.preventDefault();
    toast.info("Org profile updates are a Growth plan feature — coming soon.");
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
        <p className="text-[#64748B]">Manage your workspace, plan and branding.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="io-card p-6 lg:col-span-2">
          <h3 className="font-heading font-semibold text-lg">Organization profile</h3>
          <form onSubmit={save} className="grid grid-cols-2 gap-3 mt-4">
            <input defaultValue={org?.name} placeholder="Name" className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <input defaultValue={org?.tagline} placeholder="Tagline" className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <textarea defaultValue={org?.mission} placeholder="Mission" className="col-span-2 px-3 py-2 border border-[#E6E1DA] rounded-lg" rows={3}/>
            <input defaultValue={org?.instagram} placeholder="Instagram handle" className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <input defaultValue={org?.contact_email} placeholder="Contact email" className="px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <div className="col-span-2 flex justify-end"><button className="io-btn-primary">Save changes</button></div>
          </form>
        </div>

        <div className="io-card p-6">
          <h3 className="font-heading font-semibold text-lg">Account</h3>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#64748B]">Name</span><span>{user?.name}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Email</span><span className="truncate">{user?.email}</span></div>
            <div className="flex justify-between"><span className="text-[#64748B]">Role</span><span className="uppercase text-[11px] tracking-widest text-[#0D5C63] font-semibold">{user?.role}</span></div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-lg mb-3">Plans</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PLANS.map(p => (
            <div key={p.id} className={`io-card p-6 ${p.id==="growth"?"ring-2 ring-[#0D5C63]":""}`} data-testid={`plan-${p.id}`}>
              <div className="flex justify-between items-baseline">
                <div className="font-heading font-bold text-xl">{p.name}</div>
                <div className="font-mono-stat text-2xl text-[#0D5C63]">{p.price}</div>
              </div>
              <ul className="mt-4 space-y-2 text-sm">
                {p.features.map(f => <li key={f} className="flex items-center gap-2 text-[#1E293B]"><Check size={14} className="text-[#0D5C63]"/>{f}</li>)}
              </ul>
              <button className={`mt-5 w-full ${p.id==="growth"?"io-btn-primary":"io-btn-ghost border border-[#E6E1DA]"}`}>Choose {p.name}</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
