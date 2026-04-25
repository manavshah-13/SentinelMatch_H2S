import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle2, XCircle, ShieldAlert, Loader2 } from 'lucide-react';
import { verifyTaskCompletion } from '../services/aiService';

const VerificationPanel = ({ originalMission, missionId }) => {
  const [image, setImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startVerification = async () => {
    if (!image || !originalMission) return;
    setIsVerifying(true);
    try {
      let result;
      if (import.meta.env.VITE_GEMINI_API_KEY === 'PLACEHOLDER') {
        console.warn("Using mock verification data (API Key is PLACEHOLDER)");
        result = {
          verified: true,
          reason: "Mock Verification: Image verified via local AI fallback.",
          impactPoints: 85
        };
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        result = await verifyTaskCompletion(image, originalMission.summary);
      }
      setVerificationResult(result);
    } catch (err) {
      console.error(err);
      alert("Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel"
      style={{ marginTop: '2rem' }}
    >
      <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <ShieldAlert size={24} /> Mission Verification
      </h2>

      {!verificationResult ? (
        <div style={{ textAlign: 'center' }}>
          <div 
            style={{ 
              border: '2px dashed var(--border)', 
              borderRadius: '16px', 
              padding: '2rem', 
              marginBottom: '1rem',
              cursor: 'pointer',
              overflow: 'hidden'
            }}
            onClick={() => document.getElementById('imageInput').click()}
          >
            {image ? (
              <img src={image} alt="Verification" style={{ width: '100%', borderRadius: '8px' }} />
            ) : (
              <div>
                <Upload size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>Click to upload proof of completion</p>
              </div>
            )}
            <input 
              id="imageInput"
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              style={{ display: 'none' }}
            />
          </div>

          <button 
            className="neon-button" 
            disabled={!image || isVerifying}
            onClick={startVerification}
            style={{ width: '100%' }}
          >
            {isVerifying ? <Loader2 className="animate-spin" /> : "Verify with AI VLM"}
          </button>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{ textAlign: 'center' }}
        >
          {verificationResult.verified ? (
            <div style={{ color: '#51cf66' }}>
              <CheckCircle2 size={64} style={{ marginBottom: '1rem' }} />
              <h3>Task Verified!</h3>
              <p>Points Awarded: {verificationResult.impactPoints}</p>
            </div>
          ) : (
            <div style={{ color: 'var(--danger)' }}>
              <XCircle size={64} style={{ marginBottom: '1rem' }} />
              <h3>Verification Failed</h3>
              <p>{verificationResult.reason}</p>
            </div>
          )}
          <button 
            className="neon-button" 
            style={{ marginTop: '1rem' }}
            onClick={() => {
              setVerificationResult(null);
              setImage(null);
            }}
          >
            Try Again
          </button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default VerificationPanel;
