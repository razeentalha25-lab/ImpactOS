import os
import logging
import hashlib
import secrets
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Literal
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, BackgroundTasks
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

MONGO_URL = os.environ['MONGO_URL']
DB_NAME = os.environ['DB_NAME']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALG = "HS256"
FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:3000')

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="ImpactOS API")
api = APIRouter(prefix="/api")


# ---------- Helpers ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def new_id() -> str:
    return str(uuid.uuid4())

def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode('utf-8'), hashed.encode('utf-8'))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, ver: int = 0) -> str:
    payload = {"sub": user_id, "email": email, "ver": ver,
               "exp": datetime.now(timezone.utc) + timedelta(minutes=60*8), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def create_refresh_token(user_id: str, ver: int = 0) -> str:
    payload = {"sub": user_id, "ver": ver,
               "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def set_auth_cookies(response: Response, access: str, refresh: str):
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none", max_age=60*60*8, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none", max_age=7*24*3600, path="/")


async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")
        user = await db.users.find_one({"id": payload["sub"]})
        if not user:
            raise HTTPException(401, "User not found")
        if payload.get("ver", 0) != user.get("token_version", 0):
            raise HTTPException(401, "Session expired")
        user.pop("password_hash", None)
        user.pop("_id", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")


# ---------- Models ----------
class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    name: str

class LoginInput(BaseModel):
    email: EmailStr
    password: str

class OrgCreate(BaseModel):
    name: str
    slug: str
    tagline: Optional[str] = ""
    mission: Optional[str] = ""
    about: Optional[str] = ""
    instagram: Optional[str] = ""
    contact_email: Optional[str] = ""
    monthly_meal_goal: int = 150

class EventInput(BaseModel):
    title: str
    date: str  # ISO date
    location: str
    description: Optional[str] = ""
    capacity: int = 20
    team_leader: Optional[str] = ""
    volunteers_attended: int = 0
    hours_logged: float = 0
    meals_produced: int = 0
    kits_produced: int = 0
    notes: Optional[str] = ""
    status: Literal["upcoming", "completed", "cancelled"] = "upcoming"

class VolunteerInput(BaseModel):
    name: str
    email: EmailStr
    grade: Optional[str] = ""
    hours: float = 0
    events_attended: int = 0
    skills: List[str] = []
    leadership_role: Optional[str] = ""

class ProjectInput(BaseModel):
    name: str
    description: Optional[str] = ""
    goal: int = 500
    progress: int = 0
    volunteers_count: int = 0
    meals_produced: int = 0
    kits_produced: int = 0
    partner_id: Optional[str] = None
    start_date: str
    end_date: str
    status: Literal["planning", "active", "completed"] = "active"

class PartnerInput(BaseModel):
    name: str
    contact_person: Optional[str] = ""
    email: Optional[str] = ""
    partnership_type: str = "shelter"
    contributions: Optional[str] = ""
    notes: Optional[str] = ""

class DonationInput(BaseModel):
    donor_name: str
    amount: float
    date: str
    campaign: Optional[str] = "General"
    purpose: Optional[str] = ""


# ---------- Auth Endpoints ----------
@api.post("/auth/register")
async def register(inp: RegisterInput, response: Response):
    email = inp.email.lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(400, "Email already registered")
    uid = new_id()
    # First user overall becomes super_admin
    is_first = (await db.users.count_documents({})) == 0
    user_doc = {
        "id": uid, "email": email, "name": inp.name,
        "password_hash": hash_password(inp.password),
        "role": "super_admin" if is_first else "org_admin",
        "org_id": None, "token_version": 0,
        "created_at": now_iso()
    }
    await db.users.insert_one(user_doc)
    at = create_access_token(uid, email, 0)
    rt = create_refresh_token(uid, 0)
    set_auth_cookies(response, at, rt)
    user_doc.pop("password_hash"); user_doc.pop("_id", None)
    return user_doc


@api.post("/auth/login")
async def login(inp: LoginInput, response: Response):
    email = inp.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(inp.password, user["password_hash"]):
        raise HTTPException(401, "Invalid email or password")
    at = create_access_token(user["id"], email, user.get("token_version", 0))
    rt = create_refresh_token(user["id"], user.get("token_version", 0))
    set_auth_cookies(response, at, rt)
    user.pop("password_hash"); user.pop("_id", None)
    return user


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(get_current_user)):
    return user


# ---------- Organizations ----------
@api.get("/orgs")
async def list_orgs(user=Depends(get_current_user)):
    orgs = await db.orgs.find({}, {"_id": 0}).to_list(500)
    return orgs

@api.get("/orgs/{slug}")
async def get_org_by_slug(slug: str):
    org = await db.orgs.find_one({"slug": slug}, {"_id": 0})
    if not org:
        raise HTTPException(404, "Organization not found")
    return org

@api.post("/orgs")
async def create_org(inp: OrgCreate, user=Depends(get_current_user)):
    if user["role"] not in ("super_admin", "org_admin"):
        raise HTTPException(403, "Forbidden")
    org = inp.model_dump()
    org["id"] = new_id()
    org["created_at"] = now_iso()
    await db.orgs.insert_one(org.copy())
    org.pop("_id", None)
    return org


# ---------- Public org data ----------
@api.get("/public/org/{slug}")
async def public_org(slug: str):
    org = await db.orgs.find_one({"slug": slug}, {"_id": 0})
    if not org:
        raise HTTPException(404)
    events = await db.events.find({"org_id": org["id"], "status": "upcoming"}, {"_id": 0}).sort("date", 1).to_list(6)
    volunteers = await db.volunteers.find({"org_id": org["id"]}, {"_id": 0}).sort("hours", -1).to_list(6)
    stats = await compute_stats(org["id"])
    return {"org": org, "events": events, "top_volunteers": volunteers, "stats": stats}


# ---------- Generic CRUD helpers ----------
async def _org_id(user):
    # Prefer user.org_id else default to first org (Hope in Hand)
    if user.get("org_id"):
        return user["org_id"]
    org = await db.orgs.find_one({"slug": "hope-in-hand"}, {"_id": 0})
    return org["id"] if org else None


# Events
@api.get("/events")
async def list_events(user=Depends(get_current_user)):
    oid = await _org_id(user)
    return await db.events.find({"org_id": oid}, {"_id": 0}).sort("date", -1).to_list(500)

@api.post("/events")
async def create_event(inp: EventInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    doc = inp.model_dump(); doc["id"] = new_id(); doc["org_id"] = oid; doc["created_at"] = now_iso()
    await db.events.insert_one(doc.copy()); doc.pop("_id", None)
    return doc

@api.put("/events/{eid}")
async def update_event(eid: str, inp: EventInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    r = await db.events.update_one({"id": eid, "org_id": oid}, {"$set": inp.model_dump()})
    if not r.matched_count:
        raise HTTPException(404)
    doc = await db.events.find_one({"id": eid}, {"_id": 0})
    return doc

@api.delete("/events/{eid}")
async def del_event(eid: str, user=Depends(get_current_user)):
    oid = await _org_id(user)
    await db.events.delete_one({"id": eid, "org_id": oid})
    return {"ok": True}

# Volunteers
@api.get("/volunteers")
async def list_volunteers(user=Depends(get_current_user)):
    oid = await _org_id(user)
    return await db.volunteers.find({"org_id": oid}, {"_id": 0}).sort("hours", -1).to_list(1000)

@api.post("/volunteers")
async def create_volunteer(inp: VolunteerInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    doc = inp.model_dump(); doc["id"] = new_id(); doc["org_id"] = oid; doc["created_at"] = now_iso()
    await db.volunteers.insert_one(doc.copy()); doc.pop("_id", None)
    return doc

@api.put("/volunteers/{vid}")
async def update_volunteer(vid: str, inp: VolunteerInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    r = await db.volunteers.update_one({"id": vid, "org_id": oid}, {"$set": inp.model_dump()})
    if not r.matched_count: raise HTTPException(404)
    return await db.volunteers.find_one({"id": vid}, {"_id": 0})

@api.delete("/volunteers/{vid}")
async def del_volunteer(vid: str, user=Depends(get_current_user)):
    oid = await _org_id(user)
    await db.volunteers.delete_one({"id": vid, "org_id": oid})
    return {"ok": True}

# Projects
@api.get("/projects")
async def list_projects(user=Depends(get_current_user)):
    oid = await _org_id(user)
    return await db.projects.find({"org_id": oid}, {"_id": 0}).sort("start_date", -1).to_list(500)

@api.post("/projects")
async def create_project(inp: ProjectInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    doc = inp.model_dump(); doc["id"] = new_id(); doc["org_id"] = oid; doc["created_at"] = now_iso()
    await db.projects.insert_one(doc.copy()); doc.pop("_id", None)
    return doc

@api.put("/projects/{pid}")
async def update_project(pid: str, inp: ProjectInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    r = await db.projects.update_one({"id": pid, "org_id": oid}, {"$set": inp.model_dump()})
    if not r.matched_count: raise HTTPException(404)
    return await db.projects.find_one({"id": pid}, {"_id": 0})

@api.delete("/projects/{pid}")
async def del_project(pid: str, user=Depends(get_current_user)):
    oid = await _org_id(user)
    await db.projects.delete_one({"id": pid, "org_id": oid})
    return {"ok": True}

# Partners
@api.get("/partners")
async def list_partners(user=Depends(get_current_user)):
    oid = await _org_id(user)
    return await db.partners.find({"org_id": oid}, {"_id": 0}).to_list(500)

@api.post("/partners")
async def create_partner(inp: PartnerInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    doc = inp.model_dump(); doc["id"] = new_id(); doc["org_id"] = oid; doc["created_at"] = now_iso()
    await db.partners.insert_one(doc.copy()); doc.pop("_id", None)
    return doc

@api.put("/partners/{pid}")
async def update_partner(pid: str, inp: PartnerInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    r = await db.partners.update_one({"id": pid, "org_id": oid}, {"$set": inp.model_dump()})
    if not r.matched_count: raise HTTPException(404)
    return await db.partners.find_one({"id": pid}, {"_id": 0})

@api.delete("/partners/{pid}")
async def del_partner(pid: str, user=Depends(get_current_user)):
    oid = await _org_id(user)
    await db.partners.delete_one({"id": pid, "org_id": oid})
    return {"ok": True}

# Donations
@api.get("/donations")
async def list_donations(user=Depends(get_current_user)):
    oid = await _org_id(user)
    return await db.donations.find({"org_id": oid}, {"_id": 0}).sort("date", -1).to_list(1000)

@api.post("/donations")
async def create_donation(inp: DonationInput, user=Depends(get_current_user)):
    oid = await _org_id(user)
    doc = inp.model_dump(); doc["id"] = new_id(); doc["org_id"] = oid; doc["created_at"] = now_iso()
    await db.donations.insert_one(doc.copy()); doc.pop("_id", None)
    return doc

@api.delete("/donations/{did}")
async def del_donation(did: str, user=Depends(get_current_user)):
    oid = await _org_id(user)
    await db.donations.delete_one({"id": did, "org_id": oid})
    return {"ok": True}


# ---------- Stats / Impact ----------
async def compute_stats(org_id: str):
    events = await db.events.find({"org_id": org_id}, {"_id": 0}).to_list(2000)
    volunteers = await db.volunteers.find({"org_id": org_id}, {"_id": 0}).to_list(5000)
    partners = await db.partners.find({"org_id": org_id}, {"_id": 0}).to_list(500)
    donations = await db.donations.find({"org_id": org_id}, {"_id": 0}).to_list(2000)
    total_meals = sum(e.get("meals_produced", 0) for e in events)
    total_kits = sum(e.get("kits_produced", 0) for e in events)
    total_hours = sum(e.get("hours_logged", 0) for e in events)
    completed_events = sum(1 for e in events if e.get("status") == "completed")
    total_donations = sum(d.get("amount", 0) for d in donations)
    return {
        "total_meals": total_meals,
        "total_kits": total_kits,
        "total_hours": round(total_hours, 1),
        "total_volunteers": len(volunteers),
        "total_events": len(events),
        "completed_events": completed_events,
        "total_partners": len(partners),
        "total_donations": round(total_donations, 2),
    }


@api.get("/stats")
async def stats(user=Depends(get_current_user)):
    oid = await _org_id(user)
    s = await compute_stats(oid)
    # Monthly service breakdown (last 8 months)
    events = await db.events.find({"org_id": oid}, {"_id": 0}).to_list(2000)
    donations = await db.donations.find({"org_id": oid}, {"_id": 0}).to_list(2000)
    from collections import defaultdict
    monthly = defaultdict(lambda: {"meals": 0, "kits": 0, "hours": 0, "donations": 0})
    for e in events:
        try:
            m = e["date"][:7]
            monthly[m]["meals"] += e.get("meals_produced", 0)
            monthly[m]["kits"] += e.get("kits_produced", 0)
            monthly[m]["hours"] += e.get("hours_logged", 0)
        except Exception:
            pass
    for d in donations:
        try:
            m = d["date"][:7]
            monthly[m]["donations"] += d.get("amount", 0)
        except Exception:
            pass
    series = [{"month": k, **v} for k, v in sorted(monthly.items())]
    # Recent activity (last 10 events)
    recent = sorted(events, key=lambda e: e.get("created_at", ""), reverse=True)[:8]
    return {"stats": s, "monthly": series, "recent_events": recent}


# ---------- Seeding ----------
async def seed():
    # Admin user
    admin_email = os.environ["ADMIN_EMAIL"].lower()
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": new_id(), "email": admin_email, "name": "Razeen Talha",
            "password_hash": hash_password(admin_pw),
            "role": "super_admin", "org_id": None, "token_version": 0,
            "created_at": now_iso(),
        })
    else:
        # keep password in sync with .env
        if not verify_password(admin_pw, existing["password_hash"]):
            await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})

    # Hope in Hand org
    org = await db.orgs.find_one({"slug": "hope-in-hand"})
    if not org:
        org = {
            "id": new_id(), "slug": "hope-in-hand", "name": "Hope in Hand",
            "tagline": "Youth-Led Community Service Initiative",
            "mission": "Empowering young leaders to combat local food insecurity through monthly shelter meals, volunteer mobilizations, and transparent community partnerships.",
            "about": "Hope in Hand is a student-founded nonprofit turning weekends into warm meals. Every month we pack, cook, and deliver food to shelters across the region.",
            "instagram": "@hopeinhand",
            "contact_email": "hello@hopeinhand.org",
            "monthly_meal_goal": 150,
            "created_at": now_iso(),
        }
        await db.orgs.insert_one(org.copy())
        # link admin
        await db.users.update_one({"email": admin_email}, {"$set": {"org_id": org["id"], "role": "org_admin"}})

    oid = (await db.orgs.find_one({"slug": "hope-in-hand"}))["id"]

    if await db.events.count_documents({"org_id": oid}) == 0:
        events_data = [
            ("Meal Packing Marathon", "2025-09-14", "Community Kitchen, Downtown", 26, 52, 184, 0, "completed", "Sara Ahmed"),
            ("Hygiene Kits Drive", "2025-10-05", "Lincoln High Cafeteria", 18, 36, 0, 64, "completed", "Jordan Patel"),
            ("Winter Meal Prep", "2025-11-08", "Grace Shelter Kitchen", 32, 96, 240, 0, "completed", "Ava Chen"),
            ("Holiday Care Packages", "2025-12-14", "Community Center", 40, 120, 0, 150, "completed", "Sara Ahmed"),
            ("New Year Kickoff Meal Pack", "2026-01-18", "Downtown Kitchen", 28, 84, 210, 0, "completed", "Ethan Ruiz"),
            ("February Shelter Meals", "2026-02-15", "Grace Shelter Kitchen", 30, 90, 240, 0, "completed", "Ava Chen"),
            ("March Community Cookout", "2026-03-22", "Riverside Park Pavilion", 35, 0, 0, 0, "upcoming", "Sara Ahmed"),
            ("Spring Hygiene Drive", "2026-04-12", "Lincoln High Gym", 25, 0, 0, 0, "upcoming", "Jordan Patel"),
        ]
        docs = []
        for (title, date, loc, cap, hours, meals, kits, status, leader) in events_data:
            atd = cap if status == "completed" else 0
            docs.append({
                "id": new_id(), "org_id": oid, "title": title, "date": date, "location": loc,
                "description": f"{title} — organized by Hope in Hand volunteers.",
                "capacity": cap, "team_leader": leader,
                "volunteers_attended": atd, "hours_logged": hours,
                "meals_produced": meals, "kits_produced": kits, "notes": "",
                "status": status, "created_at": now_iso(),
            })
        await db.events.insert_many(docs)

    if await db.volunteers.count_documents({"org_id": oid}) == 0:
        vols = [
            ("Sara Ahmed", "sara@hopeinhand.org", "12th", 84, 12, ["Leadership","Cooking"], "Project Lead"),
            ("Ava Chen", "ava@hopeinhand.org", "11th", 72, 10, ["Logistics","Design"], "Team Leader"),
            ("Jordan Patel", "jordan@hopeinhand.org", "12th", 68, 9, ["Outreach","Photography"], "Outreach Lead"),
            ("Ethan Ruiz", "ethan@hopeinhand.org", "10th", 54, 8, ["Cooking","Driving"], ""),
            ("Maya Osei", "maya@hopeinhand.org", "11th", 48, 7, ["Fundraising"], ""),
            ("Noah Kim", "noah@hopeinhand.org", "12th", 42, 6, ["Logistics"], ""),
            ("Lila Torres", "lila@hopeinhand.org", "9th", 36, 5, ["Social Media"], ""),
            ("Ben Cohen", "ben@hopeinhand.org", "10th", 30, 4, ["Cooking"], ""),
            ("Aria Singh", "aria@hopeinhand.org", "11th", 28, 4, ["Design","Outreach"], ""),
            ("Marcus Lee", "marcus@hopeinhand.org", "12th", 24, 3, ["Driving"], ""),
        ]
        docs = [{"id": new_id(), "org_id": oid, "name": n, "email": e, "grade": g,
                 "hours": h, "events_attended": ea, "skills": s, "leadership_role": r,
                 "created_at": now_iso()} for (n,e,g,h,ea,s,r) in vols]
        await db.volunteers.insert_many(docs)

    if await db.partners.count_documents({"org_id": oid}) == 0:
        partners = [
            ("Grace Community Shelter", "Rebecca Owens", "rebecca@graceshelter.org", "shelter", "Hosts monthly meal deliveries and packing space.", ""),
            ("Lincoln High School", "Dr. Patel", "patel@lincolnhs.edu", "school", "Provides gym & cafeteria for kit drives.", ""),
            ("Riverside Food Bank", "Marcus Ellison", "marcus@riversidefb.org", "community", "Bulk ingredient donations.", ""),
            ("Bright Health Clinic", "Dr. Nia Adams", "nia@brighthealth.com", "healthcare", "Donates hygiene kit supplies quarterly.", ""),
            ("Blue Ridge Coffee Co.", "Sam Torres", "sam@blueridgecoffee.co", "business", "Monthly $500 corporate match.", ""),
        ]
        docs = [{"id": new_id(), "org_id": oid, "name": n, "contact_person": cp, "email": e,
                 "partnership_type": pt, "contributions": c, "notes": nt,
                 "created_at": now_iso()} for (n,cp,e,pt,c,nt) in partners]
        await db.partners.insert_many(docs)

    if await db.projects.count_documents({"org_id": oid}) == 0:
        parts = await db.partners.find({"org_id": oid}, {"_id": 0}).to_list(10)
        pmap = {p["name"]: p["id"] for p in parts}
        projs = [
            ("Monthly Shelter Meal Initiative", "Cook and deliver 150+ warm meals to local shelters each month.", 1800, 1074, 60, 1074, 0, pmap.get("Grace Community Shelter"), "2025-09-01", "2026-08-31", "active"),
            ("Winter Hygiene Kit Program", "Assemble hygiene kits for unhoused neighbors through the winter months.", 500, 214, 40, 0, 214, pmap.get("Lincoln High School"), "2025-11-01", "2026-03-31", "active"),
            ("School Food Drive 2026", "District-wide school food drive for community pantry.", 3000, 420, 80, 0, 0, pmap.get("Riverside Food Bank"), "2026-02-01", "2026-05-30", "planning"),
        ]
        docs = [{"id": new_id(), "org_id": oid, "name": n, "description": d, "goal": g,
                 "progress": pr, "volunteers_count": v, "meals_produced": m,
                 "kits_produced": k, "partner_id": pid, "start_date": sd, "end_date": ed,
                 "status": st, "created_at": now_iso()}
                for (n,d,g,pr,v,m,k,pid,sd,ed,st) in projs]
        await db.projects.insert_many(docs)

    if await db.donations.count_documents({"org_id": oid}) == 0:
        donations = [
            ("Anonymous", 250, "2025-09-20", "Meal Fund", "General meal fund"),
            ("Blue Ridge Coffee Co.", 500, "2025-10-01", "Corporate Match", "Monthly match"),
            ("Karen Whitfield", 100, "2025-10-15", "Meal Fund", ""),
            ("Community Rotary", 1000, "2025-11-05", "Winter Warmth", "Winter meal prep"),
            ("Anonymous", 75, "2025-11-22", "Hygiene Kits", ""),
            ("Blue Ridge Coffee Co.", 500, "2025-12-01", "Corporate Match", "Monthly match"),
            ("David Nguyen", 200, "2025-12-14", "Holiday Drive", "Holiday care packages"),
            ("Blue Ridge Coffee Co.", 500, "2026-01-01", "Corporate Match", "Monthly match"),
            ("Sarah Patel", 150, "2026-01-25", "Meal Fund", ""),
            ("Anonymous", 300, "2026-02-10", "Hygiene Kits", ""),
            ("Blue Ridge Coffee Co.", 500, "2026-02-01", "Corporate Match", "Monthly match"),
        ]
        docs = [{"id": new_id(), "org_id": oid, "donor_name": n, "amount": a, "date": d,
                 "campaign": c, "purpose": p, "created_at": now_iso()}
                for (n,a,d,c,p) in donations]
        await db.donations.insert_many(docs)


@app.on_event("startup")
async def on_start():
    await db.users.create_index("email", unique=True)
    await db.orgs.create_index("slug", unique=True)
    await db.events.create_index("org_id")
    await db.volunteers.create_index("org_id")
    await db.projects.create_index("org_id")
    await db.partners.create_index("org_id")
    await db.donations.create_index("org_id")
    await seed()
    logger.info("ImpactOS seeded and ready")


@api.get("/")
async def root():
    return {"service": "ImpactOS API", "status": "ok"}


app.include_router(api)

# CORS - allow FRONTEND_URL and permit credentials
allow_origins = [FRONTEND_URL, "http://localhost:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def on_stop():
    client.close()
