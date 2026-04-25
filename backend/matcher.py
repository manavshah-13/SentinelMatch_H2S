import math
from db_manager import get_mission, get_all_volunteers

def haversine(lat1, lon1, lat2, lon2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    # Convert decimal degrees to radians 
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])

    # Haversine formula 
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a)) 
    r = 6371 # Radius of earth in kilometers. Use 3956 for miles
    return c * r

def calculate_match_score(mission, volunteer, distance):
    urgency = mission.get("urgency", 1)
    
    # Calculate Skill Match Bonus
    mission_skills = set(mission.get("skills", []))
    volunteer_skills = set(volunteer.get("skills", []))
    common_skills = mission_skills.intersection(volunteer_skills)
    
    skill_match_bonus = len(common_skills) * 15 # Award 15 points per matching skill
    
    # Ranking Formula: (Urgency * 10) + (SkillMatchBonus) - (Distance * 2)
    score = (urgency * 10) + skill_match_bonus - (distance * 2)
    return score

def get_nearby_volunteers(mission_id, radius_km=5):
    mission = get_mission(mission_id)
    if not mission:
        return []
        
    m_lat = mission["location"].latitude if hasattr(mission["location"], "latitude") else mission["location"]["lat"]
    m_lon = mission["location"].longitude if hasattr(mission["location"], "longitude") else mission["location"]["lon"]
    
    volunteers = get_all_volunteers()
    candidates = []
    
    for v in volunteers:
        v_lat = v["location"]["lat"]
        v_lon = v["location"]["lon"]
        
        distance = haversine(m_lat, m_lon, v_lat, v_lon)
        
        if distance <= radius_km:
            score = calculate_match_score(mission, v, distance)
            candidates.append({
                **v,
                "distance": round(distance, 2),
                "match_score": round(score, 2)
            })
            
    # Sort by score descending
    candidates.sort(key=lambda x: x["match_score"], reverse=True)
    
    return candidates[:5] # Return top 5
