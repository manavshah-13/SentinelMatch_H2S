import { motion } from 'framer-motion';
import { Heart, Stethoscope, Flame, Home, Utensils, Shield, ArrowLeft, CheckCircle, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HelpProvider.css';

const HelpProvider = () => {
  const navigate = useNavigate();

  const skills = [
    { icon: Stethoscope, label: 'Medical', desc: 'First Aid, CPR, Nursing' },
    { icon: Flame, label: 'Fire & Rescue', desc: 'Firefighting, Emergency Rescue' },
    { icon: Home, label: 'Shelter Support', desc: 'Evacuation, Temporary Housing' },
    { icon: Utensils, label: 'Food & Supply', desc: 'Logistics, Distribution' },
  ];

  const steps = [
    'Complete verification',
    'Set availability status',
    'Receive nearby alerts',
    'Respond & coordinate',
  ];

  return (
    <div className="provider-container">
      {/* Background Effects */}
      <div className="provider-bg-effects">
        <div className="gradient-orb orb-left"></div>
        <div className="gradient-orb orb-right"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="provider-card glass-panel"
      >
        {/* Back Button */}
        <motion.button
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="back-button"
          onClick={() => navigate('/')}
        >
          <ArrowLeft size={18} />
          <span>Back to Home</span>
        </motion.button>

        {/* Hero Section */}
        <header className="provider-hero">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="hero-icon-wrapper"
          >
            <Heart size={40} className="heart-icon" />
          </motion.div>
          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="provider-title"
          >
            Become a <span className="accent">Sentinel</span>
          </motion.h1>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="provider-subtitle"
          >
            Join our network of verified responders. Save lives, strengthen your community.
          </motion.p>
        </header>

        {/* Stats */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="stats-row"
        >
          <div className="stat-item">
            <Users size={20} />
            <span className="stat-number">2,450+</span>
            <span className="stat-label">Active Volunteers</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <Clock size={20} />
            <span className="stat-number">3 min</span>
            <span className="stat-label">Avg Response</span>
          </div>
          <div className="stat-divider"></div>
          <div className="stat-item">
            <CheckCircle size={20} />
            <span className="stat-number">99.2%</span>
            <span className="stat-label">Success Rate</span>
          </div>
        </motion.div>

        {/* Skills Grid */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="skills-section"
        >
          <h3 className="section-title">
            <Shield size={20} />
            Needed Expertise
          </h3>
          <div className="skills-grid">
            {skills.map((skill, idx) => (
              <motion.div
                key={skill.label}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.7 + idx * 0.1 }}
                className="skill-card"
              >
                <div className="skill-icon">
                  <skill.icon size={24} />
                </div>
                <h4>{skill.label}</h4>
                <p>{skill.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* How It Works */}
        <motion.section
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="steps-section"
        >
          <h3 className="section-title">
            <Clock size={20} />
            How It Works
          </h3>
          <div className="steps-list">
            {steps.map((step, idx) => (
              <div key={idx} className="step-item">
                <div className="step-number">{idx + 1}</div>
                <span>{step}</span>
              </div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="cta-section"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="cta-button neon-button"
            onClick={() => navigate('/helper-auth')}
          >
            <Shield size={20} />
            Register as Volunteer
          </motion.button>
          <p className="cta-note">Verification required • Free to join</p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default HelpProvider;
