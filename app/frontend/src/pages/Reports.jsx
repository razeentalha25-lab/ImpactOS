import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Reports() {
  const [data, setData] = useState(null);
  const [events, setEvents] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [org, setOrg] = useState(null);
  const [month, setMonth] = useState(new Date().toISOString().slice(0,7));

  useEffect(()=>{ (async()=>{
    const [s,e,v,o] = await Promise.all([api.get("/stats"), api.get("/events"), api.get("/volunteers"), api.get("/orgs/hope-in-hand")]);
    setData(s.data); setEvents(e.data); setVolunteers(v.data); setOrg(o.data);
  })(); },[]);

  if (!data) return <div className="text-[#64748B]">Loading...</div>;

  const monthEvents = events.filter(e => (e.date||"").startsWith(month));
  const monthMeals = monthEvents.reduce((s,e)=>s+(e.meals_produced||0),0);
  const monthKits = monthEvents.reduce((s,e)=>s+(e.kits_produced||0),0);
  const monthHours = monthEvents.reduce((s,e)=>s+(e.hours_logged||0),0);
  const monthVols = monthEvents.reduce((s,e)=>s+(e.volunteers_attended||0),0);
  const monthShelters = new Set(monthEvents.map(e=>e.location)).size;
  const topVols = [...volunteers].sort((a,b)=>b.hours-a.hours).slice(0,5);

  const exportPDF = () => {
    const doc = new jsPDF({ unit:"pt", format:"a4" });
    const W = doc.internal.pageSize.getWidth();
    doc.setFillColor(13, 92, 99);
    doc.rect(0, 0, W, 90, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text((org?.name || "Hope in Hand").toUpperCase(), 40, 45);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text("Monthly Impact Report", 40, 70);
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.text(`Report period: ${month}`, 40, 120);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 40, 138);

    doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text("Impact Summary", 40, 175);
    autoTable(doc, {
      startY: 185,
      head: [["Metric","Value"]],
      body: [
        ["Meals prepared", String(monthMeals)],
        ["Care kits distributed", String(monthKits)],
        ["Volunteers", String(monthVols)],
        ["Volunteer hours", String(monthHours)],
        ["Shelters/locations served", String(monthShelters)],
      ],
      theme: "grid",
      headStyles: { fillColor: [13,92,99], textColor: 255 },
      styles: { fontSize: 11, cellPadding: 8 },
    });

    let y = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text("Events this month", 40, y);
    autoTable(doc, {
      startY: y + 10,
      head: [["Date","Event","Location","Meals","Kits","Hours"]],
      body: monthEvents.map(e=>[e.date, e.title, e.location, e.meals_produced, e.kits_produced, e.hours_logged]),
      theme: "striped",
      headStyles: { fillColor: [224,90,71], textColor: 255 },
      styles: { fontSize: 10 },
    });

    y = doc.lastAutoTable.finalY + 30;
    doc.setFontSize(14); doc.setFont("helvetica","bold");
    doc.text("Volunteer Recognition (top 5)", 40, y);
    autoTable(doc, {
      startY: y + 10,
      head: [["Name","Role","Hours","Events"]],
      body: topVols.map(v=>[v.name, v.leadership_role || "Volunteer", v.hours, v.events_attended]),
      theme: "grid",
      headStyles: { fillColor: [13,92,99], textColor: 255 },
    });

    y = doc.lastAutoTable.finalY + 40;
    doc.setFontSize(10); doc.setFont("helvetica","italic"); doc.setTextColor(100,116,139);
    doc.text("On behalf of every volunteer, partner, and neighbor — thank you.", 40, y);
    doc.text(`— ${org?.name || "Hope in Hand"} Team`, 40, y + 16);

    doc.save(`${(org?.name||"Report").replace(/\s+/g,"_")}_${month}.pdf`);
    toast.success("Report downloaded");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between flex-col sm:flex-row gap-3">
        <div>
          <h1 className="font-heading text-3xl font-bold">Reports</h1>
          <p className="text-[#64748B]">Generate a beautiful monthly impact report — one click.</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={month} onChange={e=>setMonth(e.target.value)} className="px-3 py-2 rounded-lg border border-[#E6E1DA] bg-white" data-testid="report-month-input"/>
          <button onClick={exportPDF} className="io-btn-accent" data-testid="generate-pdf-report-btn"><Download size={16} className="inline mr-1"/>Export PDF</button>
        </div>
      </div>

      <div className="io-card p-8 max-w-3xl mx-auto" data-testid="report-preview">
        <div className="bg-[#0D5C63] text-white -mx-8 -mt-8 px-8 py-6 rounded-t-2xl">
          <div className="text-xs uppercase tracking-widest text-white/70">Monthly Impact Report</div>
          <h2 className="font-heading text-3xl font-bold mt-1">{org?.name || "Hope in Hand"}</h2>
          <div className="text-sm text-white/80 mt-1">Period: {month}</div>
        </div>
        <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-4">
          {[["Meals prepared",monthMeals],["Care kits",monthKits],["Volunteers",monthVols],["Volunteer hours",monthHours],["Locations served",monthShelters],["Events",monthEvents.length]].map(([l,v])=>(
            <div key={l} className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E6E1DA]">
              <div className="font-mono-stat text-3xl font-bold text-[#0D5C63]">{v}</div>
              <div className="text-xs uppercase tracking-widest text-[#64748B] mt-1">{l}</div>
            </div>
          ))}
        </div>
        <div className="mt-8">
          <h3 className="font-heading font-semibold mb-2 flex items-center gap-2"><FileText size={16}/> Events this month</h3>
          <ul className="text-sm divide-y divide-[#E6E1DA]">
            {monthEvents.map(e=>(<li key={e.id} className="py-2 flex justify-between"><span>{e.date} — {e.title}</span><span className="text-[#64748B]">{e.meals_produced} meals · {e.kits_produced} kits</span></li>))}
            {monthEvents.length===0 && <li className="py-3 text-[#94A3B8] text-center">No events in this month yet.</li>}
          </ul>
        </div>
        <p className="mt-8 text-xs italic text-[#64748B]">On behalf of every volunteer, partner, and neighbor — thank you.<br/>— {org?.name || "Hope in Hand"} Team</p>
      </div>
    </div>
  );
}
