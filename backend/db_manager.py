import os
import firebase_admin
from firebase_admin import credentials, firestore
from google.cloud import storage
from dotenv import load_dotenv

load_dotenv()

# Initialize Firebase
# Path to service account key file
cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "serviceAccountKey.json")

if os.path.exists(cred_path):
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase initialized with service account.")
else:
    print(f"Warning: Firebase service account file not found at {cred_path}. Using mock DB mode.")
    db = None

def create_mission(data, lat, lon):
    if not db:
        print("Mock: Created mission in database.")
        return "mock-mission-id"
        
    mission_ref = db.collection('missions').document()
    mission_data = {
        **data,
        "location": firestore.GeoPoint(lat, lon),
        "status": "pending",
        "createdAt": firestore.SERVER_TIMESTAMP,
        "assignedTo": None
    }
    mission_ref.set(mission_data)
    return mission_ref.id

def update_volunteer_location(uid, lat, lon):
    if not db:
        print(f"Mock: Updated volunteer {uid} location.")
        return
        
    volunteer_ref = db.collection('volunteers').document(uid)
    volunteer_ref.update({
        "location": firestore.GeoPoint(lat, lon),
        "lastSeen": firestore.SERVER_TIMESTAMP
    })

def get_mission(mission_id):
    if not db:
        return {"id": mission_id, "category": "Medical", "urgency": 5, "location": {"lat": 12.9716, "lon": 77.5946}}
        
    doc = db.collection('missions').document(mission_id).get()
    if doc.exists:
        return {**doc.to_dict(), "id": doc.id}
    return None

def get_all_volunteers():
    if not db:
        return [
            {"id": "v1", "name": "Dr. Sarah Chen", "skills": ["Medical", "First Aid"], "location": {"lat": 12.9800, "lon": 77.6000}},
            {"id": "v2", "name": "Marcus Miller", "skills": ["Firefighting", "Rescue"], "location": {"lat": 12.9700, "lon": 77.5900}},
        ]
        
    docs = db.collection('volunteers').stream()
    volunteers = []
    for doc in docs:
        v_data = doc.to_dict()
        # Convert GeoPoint to dict for JSON serialization
        if "location" in v_data:
            v_data["location"] = {"lat": v_data["location"].latitude, "lon": v_data["location"].longitude}
        volunteers.append({**v_data, "id": doc.id})
    return volunteers
