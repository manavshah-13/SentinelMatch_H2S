import os
import random
import string
import hashlib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from ai_engine import triage_crisis
from db_manager import create_mission, update_volunteer_location, get_mission, db
from matcher import get_nearby_volunteers

app = FastAPI(title="SentinelMatch Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "SentinelMatch Backend",
        "documentation": "/docs",
        "message": "Crisis Resource Orchestrator is operational. AI Triage and Real-time matching are ready."
    }

class SOSRequest(BaseModel):
    text: str
    lat: float
    lon: float

class LocationUpdate(BaseModel):
    volunteer_id: str
    lat: float
    lon: float

class MissionAcceptance(BaseModel):
    mission_id: str
    volunteer_id: str

class VerifyCompletion(BaseModel):
    mission_id: str
    token: str

@app.post("/sos")
async def handle_sos(request: SOSRequest):
    # 1. Triage with Gemini
    triage_data = triage_crisis(request.text)
    
    # 2. Store in Firebase
    mission_id = create_mission(triage_data, request.lat, request.lon)
    
    # 3. Find matched volunteers
    from db_manager import get_all_volunteers
    volunteers = get_all_volunteers()
    
    # Simple matching for the response
    matched = []
    from matcher import haversine, calculate_match_score
    for v in volunteers:
        dist = haversine(request.lat, request.lon, v["location"]["lat"], v["location"]["lon"])
        score = calculate_match_score(triage_data, v, dist)
        matched.append({**v, "distance": round(dist, 2), "score": score})
    
    matched.sort(key=lambda x: x["score"], reverse=True)
    
    return {
        "mission_id": mission_id,
        "triage": triage_data,
        "matched_volunteers": matched[:5]
    }

@app.get("/tasks/{volunteer_id}")
async def get_tasks(volunteer_id: str, lat: float, lon: float):
    # Update volunteer location first
    update_volunteer_location(volunteer_id, lat, lon)
    
    # For demo: Find all pending missions and rank them for this volunteer
    # In production, we'd query missions within a radius
    if not db:
        # Mock missions for testing
        missions = [{"id": "m1", "category": "Medical", "urgency": 5, "location": {"lat": lat + 0.01, "lon": lon + 0.01}, "skills": ["Medical"]}]
    else:
        docs = db.collection('missions').where('status', '==', 'pending').stream()
        missions = [{**doc.to_dict(), "id": doc.id} for doc in docs]
    
    ranked_missions = []
    # This is a bit inefficient for all missions, but works for the demo
    # Matcher's get_nearby_volunteers works the other way around (mission -> volunteers)
    # We can reuse the scoring logic here
    from matcher import haversine, calculate_match_score
    
    # Mock volunteer data for current user
    volunteer = {"id": volunteer_id, "skills": ["Medical", "Rescue"]} # Should fetch from DB
    
    for m in missions:
        m_lat = m["location"].latitude if hasattr(m["location"], "latitude") else m["location"]["lat"]
        m_lon = m["location"].longitude if hasattr(m["location"], "longitude") else m["location"]["lon"]
        
        dist = haversine(lat, lon, m_lat, m_lon)
        if dist <= 10: # 10km radius for search
            score = calculate_match_score(m, volunteer, dist)
            ranked_missions.append({
                **m,
                "distance": round(dist, 2),
                "score": round(score, 2)
            })
            
    ranked_missions.sort(key=lambda x: x["score"], reverse=True)
    return ranked_missions[:10]

@app.patch("/accept-mission")
async def accept_mission(request: MissionAcceptance):
    # 1. Generate 6-char token
    token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))
    token_hash = hashlib.sha256(token.encode()).hexdigest()
    
    # 2. Update mission in DB
    if db:
        mission_ref = db.collection('missions').document(request.mission_id)
        mission_ref.update({
            "status": "active",
            "assignedTo": request.volunteer_id,
            "token_hash": token_hash
        })
    else:
        print(f"Mock: Mission {request.mission_id} accepted by {request.volunteer_id}. Token: {token}")
        
    return {
        "status": "accepted",
        "verification_token": token # This would be shared with the volunteer
    }

@app.post("/verify-completion")
async def verify_completion(request: VerifyCompletion):
    token_hash = hashlib.sha256(request.token.encode()).hexdigest()
    
    if db:
        mission_ref = db.collection('missions').document(request.mission_id)
        mission = mission_ref.get().to_dict()
        
        if not mission:
            raise HTTPException(status_code=404, detail="Mission not found")
            
        if mission.get("token_hash") == token_hash:
            mission_ref.update({"status": "completed"})
            return {"status": "verified", "message": "Mission completed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid verification token")
    else:
        # Mock verification
        if request.token:
            return {"status": "verified", "message": "Mock verification successful"}
        raise HTTPException(status_code=400, detail="Token required")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
