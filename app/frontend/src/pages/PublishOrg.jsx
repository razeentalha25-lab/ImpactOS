import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "@/lib/api";
import Counter from "@/components/Counter";
import { Sparkles, Instagram, Mail, Heart, HandHeart, Calendar, MapPin, Trophy } from "lucide-react";
import { toast } from "sonner";

const IMG = "https://images.pexels.com/photos/6646987/pexels-photo-6646987.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

export default function PublicOrg() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [showDonate, setShowDonate] = useState(false);
  const [showVolunteer, setShowVolunteer] = useState(false);

  useEffect(()=>{ (async()=>{
    try { const r = (await api.get(`/public/org/${slug}`)).data; setData(r); }
    catch { setData({ error: true }); }
  })(); },[slug]);

  if (!data) return <div className="p-10 text-[#64748B]">Loading...</div>;
  if (data.error) return <div className="p-10 text-center">Organization not found. <Link to="/" className="text-[#0D5C63] font-medium">Back home</Link></div>;

  const { org, events, top_volunteers, stats } = data;

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1E293B]">
      <nav className="sticky top-0 z-40 bg-[#FAF7F2]/85 backdrop-blur border-b border-[#E6E1DA]">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-[#0D5C63] text-white grid place-items-center"><Sparkles size={18}/></div>
            <div>
              <div className="font-heading font-bold">{org.name}</div>
              <div className="text-[10px] uppercase tracking-widest text-[#64748B]">{org.tagline}</div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={()=>setShowVolunteer(true)} className="io-btn-ghost border border-[#E6E1DA]" data-testid="public-org-volunteer-btn">Volunteer</button>
            <button onClick={()=>setShowDonate(true)} className="io-btn-accent" data-testid="public-org-donate-btn"><Heart size={14} className="inline mr-1"/>Donate</button>
          </div>
        </div>
      </nav>

      <header className="max-w-6xl mx-auto px-6 pt-14 pb-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="text-xs font-semibold uppercase tracking-widest text-[#0D5C63] flex items-center gap-2"><Sparkles size={14}/> {org.tagline}</div>
          <h1 className="font-heading text-4xl md:text-6xl font-bold leading-[1.05] mt-3">
            Turning weekends into <span className="text-[#0D5C63]">warm meals</span> for our neighbors.
          </h1>
          <p className="text-[#64748B] mt-5 text-lg max-w-lg">{org.mission}</p>
          <div className="mt-6 flex gap-3">
            <button onClick={()=>setShowVolunteer(true)} className="io-btn-primary"><HandHeart size={16} className="inline mr-1"/>Become a volunteer</button>
            <button onClick={()=>setShowDonate(true)} className="io-btn-accent">Donate</button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 rounded-3xl dot-pattern -z-0"/>
          <img src={IMG} alt="Hope in Hand volunteers" className="relative rounded-3xl w-full aspect-[4/3] object-cover shadow-xl"/>
          <div className="absolute -bottom-6 -left-6 io-card p-4 w-52 hidden md:block">
            <div className="font-mono-stat text-2xl font-bold text-[#0D5C63]"><Counter end={stats.total_meals}/></div>
            <div className="text-xs uppercase tracking-widest text-[#64748B]">meals served</div>
          </div>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Meals", stats.total_meals],
          ["Volunteers", stats.total_volunteers],
          ["Events", stats.total_events],
          ["Partners", stats.total_partners],
        ].map(([l,v]) => (
          <div key={l} className="io-card p-5 text-center">
            <div className="font-mono-stat text-3xl font-bold text-[#0D5C63]"><Counter end={v}/></div>
            <div className="text-xs uppercase tracking-widest text-[#64748B] mt-1">{l}</div>
          </div>
        ))}
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="flex justify-between items-end mb-6">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[#0D5C63]">This month</div>
            <h2 className="font-heading text-3xl font-bold mt-1">Upcoming community events</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {events.length===0 && <div className="col-span-full io-card p-10 text-center text-[#94A3B8]">Next events coming soon.</div>}
          {events.map(e=>(
            <div key={e.id} className="io-card p-5">
              <div className="text-xs font-semibold uppercase tracking-widest text-[#E05A47] flex items-center gap-1"><Calendar size={12}/>{e.date}</div>
              <h3 className="font-heading font-semibold text-lg mt-1">{e.title}</h3>
              <div className="text-sm text-[#64748B] flex items-center gap-1 mt-1"><MapPin size={12}/>{e.location}</div>
              <button onClick={()=>setShowVolunteer(true)} className="io-btn-primary w-full mt-4">RSVP</button>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 mt-16">
        <div className="text-xs font-semibold uppercase tracking-widest text-[#0D5C63] flex items-center gap-2"><Trophy size={14}/>Community heroes</div>
        <h2 className="font-heading text-3xl font-bold mt-1">Top volunteers</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          {top_volunteers.slice(0,3).map((v,i)=>(
            <div key={v.id} className="io-card p-5">
              <div className="text-[11px] uppercase tracking-widest text-[#94A3B8]">#{i+1}</div>
              <div className="font-heading font-bold text-lg mt-1">{v.name}</div>
              <div className="text-sm text-[#64748B]">{v.leadership_role || "Volunteer"} · {v.grade}</div>
              <div className="mt-3 flex gap-4">
                <div><div className="font-mono-stat text-2xl font-bold text-[#0D5C63]">{v.hours}</div><div className="text-[10px] uppercase text-[#94A3B8]">Hours</div></div>
                <div><div className="font-mono-stat text-2xl font-bold text-[#E05A47]">{v.events_attended}</div><div className="text-[10px] uppercase text-[#94A3B8]">Events</div></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 mt-20 py-10 border-t border-[#E6E1DA] flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-[#64748B]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#0D5C63] text-white grid place-items-center"><Sparkles size={14}/></div>
          <span>{org.name} · powered by <Link to="/" className="text-[#0D5C63] font-medium">ImpactOS</Link></span>
        </div>
        <div className="flex items-center gap-4">
          <a href={`mailto:${org.contact_email}`} className="flex items-center gap-1 hover:text-[#0D5C63]"><Mail size={14}/> {org.contact_email}</a>
          <a href={`https://instagram.com/${(org.instagram||"").replace("@","")}`} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-[#0D5C63]"><Instagram size={14}/> {org.instagram}</a>
        </div>
      </footer>

      {showDonate && (
        <div className="fixed inset-0 bg-[#1E293B]/50 grid place-items-center p-4 z-50" onClick={()=>setShowDonate(false)}>
          <div onClick={e=>e.stopPropagation()} className="bg-white rounded-2xl p-8 w-full max-w-md" data-testid="donate-modal">
            <h3 className="font-heading text-2xl font-bold">Support {org.name}</h3>
            <p className="text-[#64748B] mt-2 text-sm">Every gift funds a warm meal or a hygiene kit for a neighbor. Payment processing coming soon.</p>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[25,50,100].map(a => <button key={a} className="p-3 rounded-lg border border-[#E6E1DA] hover:border-[#0D5C63]">${a}</button>)}
            </div>
            <button onClick={()=>{toast.success("Thanks! We'll be in touch."); setShowDonate(false);}} className="io-btn-accent w-full mt-4">Pledge donation</button>
          </div>
        </div>
      )}
      {showVolunteer && (
        <div className="fixed inset-0 bg-[#1E293B]/50 grid place-items-center p-4 z-50" onClick={()=>setShowVolunteer(false)}>
          <form onClick={e=>e.stopPropagation()} onSubmit={(e)=>{e.preventDefault(); toast.success("Thanks — we'll email you the next steps."); setShowVolunteer(false);}} className="bg-white rounded-2xl p-8 w-full max-w-md space-y-3" data-testid="volunteer-modal">
            <h3 className="font-heading text-2xl font-bold">Join {org.name}</h3>
            <input required placeholder="Your name" className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <input required type="email" placeholder="Email" className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <input placeholder="Grade / age" className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <textarea placeholder="Anything we should know?" className="w-full px-3 py-2 border border-[#E6E1DA] rounded-lg"/>
            <button className="io-btn-primary w-full">Sign me up</button>
          </form>
        </div>
      )}
    </div>
  );
}
