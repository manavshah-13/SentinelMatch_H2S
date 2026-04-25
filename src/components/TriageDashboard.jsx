import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Send, AlertTriangle, ShieldCheck, MapPin, Loader2, Sparkles } from 'lucide-react';
import { triageRequest } from '../services/aiService';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import VerificationPanel from './VerificationPanel';
import MissionMap from './MissionMap';
import { missionAPI } from '../services/api';

const MOCK_VOLUNTEERS = [
  { id: '1', name: 'Dr. Sarah Chen', skills: ['Medical', 'First Aid', 'CPR'], distance: 1.2, rating: 4.9 },
  { id: '2', name: 'Marcus Miller', skills: ['Firefighting', 'Rescue', 'CPR'], distance: 2.5, rating: 4.8 },
  { id: '3', name: 'Elena Rodriguez', skills: ['Medical', 'Trauma Support'], distance: 0.8, rating: 5.0 },
  { id: '4', name: 'John Smith', skills: ['Logistics', 'Food Distribution'], distance: 3.1, rating: 4.7 },
];

const TriageDashboard = () => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [matchedVolunteers, setMatchedVolunteers] = useState([]);
  const [dispatchedMissionId, setDispatchedMissionId] = useState(null);
  const [assignedVolunteer, setAssignedVolunteer] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  const handleTriage = async (text) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError(null);
    setMatchedVolunteers([]);
    setDispatchedMissionId(null);
    setAssignedVolunteer(null);

    try {
      // Get location for grounding
      let location = null;
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });
        location = { lat: position.coords.latitude, lng: position.coords.longitude };
      } catch (locErr) {
        console.warn("Location grounding skipped:", locErr.message);
      }

      // Call Backend SOS
      const backendResult = await reportSOS(text, lat, lon);
      if (backendResult) {
        setResult(backendResult.triage);
        setDispatchedMissionId(backendResult.mission_id);
        // Automatically fetch nearby volunteers after SOS
        const volunteers = await fetchTasks('current-user', lat, lon);
        setMatchedVolunteers(volunteers);
      }
    } catch (err) {
      setError("AI Triage failed. Please check your API key or try again.");
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssign = async (volunteer) => {
    if (!dispatchedMissionId) return;
    try {
      // Update mission status to active and assign volunteer
      const response = await missionAPI.updateStatus(dispatchedMissionId, 'active');
      if (response.message) {
        setAssignedVolunteer(volunteer);
      }
    } catch (err) {
      console.error("Assignment Error:", err);
      setError("Failed to assign volunteer.");
    }
  };

  const handleDispatch = async () => {
    if (!result) return;
    setIsDispatching(true);
    setError(null);
    try {
      // Create mission in backend
      const missionData = {
        category: result.category,
        urgency: result.urgency,
        summary: result.summary,
        description: `Skills needed: ${result.skills.join(', ')}. ${result.summary}`,
        skills: result.skills,
        location: result.location
      };

      const response = await missionAPI.create(missionData);
      setDispatchedMissionId(response.mission.id);
      
      // After creating mission, find volunteers and show list
      const matches = MOCK_VOLUNTEERS.filter(v => 
        v.skills.some(s => result.skills.includes(s) || result.category === s)
      ).sort((a, b) => a.distance - b.distance);
      
      setMatchedVolunteers(matches);
    } catch (err) {
      console.error("Dispatch Error:", err);
      setError("Failed to dispatch. Please try again.");
    } finally {
      setIsDispatching(false);
    }
  };

  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      handleTriage(transcript);
    };

    recognition.start();
  };

  return (
    <div className="dashboard-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
      >
        <header style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '2.5rem', color: 'var(--primary)' }}>
            <ShieldCheck style={{ verticalAlign: 'middle', marginRight: '10px' }} size={40} />
            SentinelMatch AI
          </h1>
          <p style={{ opacity: 0.7 }}>Intelligent Emergency Triage & Dispatch</p>
        </header>

        <div className="sos-section" style={{ marginBottom: '2rem', textAlign: 'center' }}>
          <button 
            onClick={startSpeechRecognition}
            className={`sos-button ${isRecording ? 'pulse' : ''}`}
            style={{ 
              background: 'var(--danger)', 
              color: '#fff', 
              width: '120px', 
              height: '120px', 
              borderRadius: '50%', 
              border: 'none',
              boxShadow: '0 0 30px var(--danger-glow)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              fontWeight: 'bold',
              fontSize: '1.2rem',
              transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
            }}
          >
            <AlertCircle size={40} />
            {isRecording ? 'LISTENING' : 'SOS'}
          </button>
          <p style={{ opacity: 0.8, fontSize: '0.9rem' }}>Press and hold for voice triage</p>
        </div>

        <div className="input-section">
          <div style={{ position: 'relative' }}>
            <textarea
              className="input-field"
              placeholder="Describe the emergency (e.g., 'There is a kitchen fire at 123 Maple St')..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={4}
              style={{ width: '100%', marginBottom: '1rem', resize: 'vertical' }}
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginBottom: '1rem' }}>
            <button 
              onClick={() => handleTriage(input)}
              className="neon-button"
              disabled={isProcessing || !input.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
              Submit Signal
            </button>
          </div>
        </div>

        <MissionMap 
          missions={dispatchedMissionId ? [] : matchedVolunteers} 
          volunteers={dispatchedMissionId ? matchedVolunteers : []}
          currentPosition={currentLocation} 
        />

        {error && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            style={{ color: 'var(--danger)', marginTop: '1rem', textAlign: 'center' }}
          >
            <AlertTriangle size={16} inline /> {error}
          </motion.div>
        )}

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              style={{ marginTop: '2rem', borderTop: '1px solid var(--border)', paddingTop: '2rem' }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                <div className="result-card">
                  <h3 style={{ color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles size={20} /> AI Analysis
                  </h3>
                  <div style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span className={`badge ${result.category.toLowerCase()}`}>{result.category}</span>
                    <span className={`badge ${result.sentiment?.toLowerCase() === 'critical' ? 'danger' : 'success'}`} style={{ opacity: 0.9 }}>
                      {result.sentiment || 'Stable'}
                    </span>
                    <span style={{ color: result.urgency > 3 ? 'var(--danger)' : '#fff', fontWeight: 'bold' }}>
                      Urgency: {result.urgency}/5
                    </span>
                  </div>
                  <p style={{ fontStyle: 'italic', opacity: 0.9 }}>"{result.summary}"</p>
                  {result.location && (
                    <p style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '10px' }}>
                      📍 Grounded Location: {result.location.lat.toFixed(4)}, {result.location.lng.toFixed(4)}
                    </p>
                  )}
                </div>

                <div className="result-card">
                  <h3 style={{ color: 'var(--primary)' }}>Required Expert Skills</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {result.skills.map((skill, i) => (
                      <span key={i} style={{ background: 'rgba(0, 242, 255, 0.1)', border: '1px solid var(--primary)', padding: '4px 12px', borderRadius: '4px', fontSize: '0.8rem' }}>
                        {skill}
                      </span>
                    ))}
                  </div>
                  <p style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.7 }}>
                    Expert responders matching these tags are being prioritized.
                  </p>
                </div>
              </div>

              <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                {!dispatchedMissionId ? (
                  <button 
                    className="neon-button" 
                    style={{ width: '100%' }}
                    onClick={handleDispatch}
                    disabled={isDispatching}
                  >
                    {isDispatching ? (
                      <Loader2 className="animate-spin" style={{ marginRight: '8px' }} />
                    ) : (
                      <MapPin size={18} style={{ marginRight: '8px', verticalAlign: 'bottom' }} />
                    )}
                    {isDispatching ? 'Initiating Dispatch...' : 'Dispatch Volunteers'}
                  </button>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="dispatch-success"
                    style={{ padding: '1rem', background: 'rgba(81, 207, 102, 0.1)', border: '1px solid #51cf66', borderRadius: '12px' }}
                   >
                     <h3 style={{ color: '#51cf66', margin: 0 }}>Dispatch Initiated</h3>
                     <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Mission ID: {dispatchedMissionId}</p>
                   </motion.div>
                )}
              </div>

              {matchedVolunteers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ marginTop: '2rem' }}
                >
                  <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>Recommended Proximity Responders</h3>
                  <div style={{ display: 'grid', gap: '1rem' }}>
                    {matchedVolunteers.map(v => (
                      <div key={v.id} className="volunteer-card" style={{ 
                        background: 'rgba(255,255,255,0.05)', 
                        padding: '1rem', 
                        borderRadius: '12px', 
                        border: assignedVolunteer?.id === v.id ? '1px solid #51cf66' : '1px solid var(--border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.3s ease'
                      }}>
                        <div>
                          <h4 style={{ margin: 0 }}>{v.name}</h4>
                          <p style={{ fontSize: '0.8rem', opacity: 0.7, margin: '4px 0' }}>
                            {v.distance} km away • {v.rating} ⭐
                          </p>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            {v.skills.map((s, i) => (
                              <span key={i} style={{ fontSize: '0.6rem', background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: '4px' }}>{s}</span>
                            ))}
                          </div>
                        </div>
                        {assignedVolunteer?.id === v.id ? (
                          <span style={{ color: '#51cf66', fontWeight: 'bold', fontSize: '0.9rem' }}>Assigned</span>
                        ) : (
                          <button 
                            className="neon-button" 
                            style={{ padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                            onClick={() => handleAssign(v)}
                            disabled={!!assignedVolunteer}
                          >
                            Assign
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <VerificationPanel originalMission={result} missionId={dispatchedMissionId} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default TriageDashboard;
