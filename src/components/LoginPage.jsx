import { motion } from 'framer-motion';
import { Shield, Heart, AlertTriangle, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css';

const LoginPage = () => {
  const navigate = useNavigate();

  return (
    <div className="login-container">
      {/* Background Effects */}
      <div className="login-bg-effects">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="grid-overlay"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="login-card glass-panel"
      >
        {/* Header */}
        <header className="login-header">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="logo-container"
          >
            <Shield size={48} className="logo-icon" />
            <h1 className="login-title">
              Sentinel<span className="highlight">Match</span>
            </h1>
            <p className="login-subtitle">Emergency Triage & Volunteer Network</p>
          </motion.div>
        </header>

        {/* Options */}
        <div className="options-container">
          {/* Ask for Help Option */}
          <motion.button
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="option-button ask-help"
            onClick={() => navigate('/triage')}
          >
            <div className="option-icon-wrapper">
              <AlertTriangle size={32} className="option-icon" />
            </div>
            <div className="option-content">
              <h2>Ask for Help</h2>
              <p>Describe your emergency and get instant AI-powered triage</p>
            </div>
            <ArrowRight size={20} className="arrow-icon" />
          </motion.button>

          {/* Provide Help Option */}
          <motion.button
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="option-button provide-help"
            onClick={() => navigate('/help-provider')}
          >
            <div className="option-icon-wrapper">
              <Heart size={32} className="option-icon" />
            </div>
            <div className="option-content">
              <h2>Provide Help</h2>
              <p>Register as a volunteer and save lives in your community</p>
            </div>
            <ArrowRight size={20} className="arrow-icon" />
          </motion.button>
        </div>

        {/* Footer Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="login-footer"
        >
          <div className="status-indicator">
            <div className="pulse-dot"></div>
            <span>Network Active · 24/7 Monitoring</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
