import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Star, LogOut, Edit3, Award, Calendar, 
  CheckCircle, Clock, UserCheck, TrendingUp, Zap,
  Mail, Phone, Activity
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { missionAPI } from '../services/api';
import './HelperDashboard.css';

const HelperDashboard = () => {
  const navigate = useNavigate();
  const { helperProfile, user, logout, updateHelperProfile } = useAuth();

  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [availability, setAvailability] = useState('available');
  const [recentHelps, setRecentHelps] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch recent helps from Firestore
   useEffect(() => {
     const fetchHelps = async () => {
       if (!user) return;
       try {
         const data = await missionAPI.getMyMissions();
         const helps = data.missions.map(m => ({
           id: m.id,
           ...m,
           date: m.createdAt
         }));
         setRecentHelps(helps);
       } catch (error) {
         console.error('Error fetching missions:', error);
         // Fallback to mock data for demo purposes
         setRecentHelps([
           {
             id: '1',
             category: 'Medical',
             urgency: 4,
             summary: 'Elderly person needs assistance at 123 Main St',
             status: 'completed',
             createdAt: new Date(Date.now() - 86400000 * 2)
           },
           {
             id: '2',
             category: 'Fire',
             urgency: 5,
             summary: 'Small kitchen fire, everyone evacuated',
             status: 'active',
             createdAt: new Date(Date.now() - 86400000)
           }
         ]);
       } finally {
         setLoading(false);
       }
     };

     fetchHelps();
   }, [user, helperProfile]);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = async () => {
    const updates = {
      skills,
      availability,
      updatedAt: new Date().toISOString()
    };
    await updateHelperProfile(updates);
    setIsEditing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Stats calculation
  const completedHelps = recentHelps.filter(h => h.status === 'completed').length;
  const activeHelps = recentHelps.filter(h => h.status === 'active' || h.status === 'pending').length;

  const getUrgencyColor = (urgency) => {
    if (urgency >= 4) return 'var(--danger)';
    if (urgency >= 3) return '#ffcc00';
    return '#51cf66';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#51cf66';
      case 'active': return 'var(--primary)';
      case 'pending': return '#ffcc00';
      case 'cancelled': return 'var(--danger)';
      default: return 'rgba(255,255,255,0.5)';
    }
  };

  if (!helperProfile) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Background Effects */}
      <div className="dashboard-bg">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-card glass-panel"
      >
        {/* Header */}
        <header className="dashboard-header">
          <div className="header-top">
            <div className="profile-section">
              <div className="avatar">
                <Heart size={32} />
              </div>
               <div className="profile-info">
                 <h1>{helperProfile.fullName || helperProfile.username}</h1>
                 <div className="profile-meta">
                   <span className="username-tag">@{helperProfile.username}</span>
                   <span className="separator">•</span>
                   <span className="unique-id">{helperProfile.uniqueId || 'HP-XXXX'}</span>
                   <span className="separator">•</span>
                   <span className={`status-badge ${helperProfile.availability}`}>
                     {helperProfile.availability === 'available' ? 'Available' : 'Busy'}
                   </span>
                 </div>
               </div>
            </div>
            <div className="header-actions">
              {!isEditing ? (
                <button className="action-button" onClick={() => setIsEditing(true)}>
                  <Edit3 size={18} />
                  Edit Profile
                </button>
              ) : (
                <div className="edit-actions">
                  <button className="cancel-button" onClick={() => setIsEditing(false)}>
                    Cancel
                  </button>
                  <button className="save-button" onClick={handleSaveProfile}>
                    Save Changes
                  </button>
                </div>
              )}
              <button className="logout-button" onClick={handleLogout}>
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          {/* Contact Info */}
          <div className="contact-grid">
            <div className="contact-item">
              <Mail size={16} />
              <span>{helperProfile.email}</span>
            </div>
            <div className="contact-item">
              <Phone size={16} />
              <span>{helperProfile.phone || 'Not provided'}</span>
            </div>
            <div className="contact-item">
              <Calendar size={16} />
              <span>Joined {new Date(helperProfile.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <nav className="dashboard-nav">
          <button 
            className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <Activity size={18} />
            Overview
          </button>
          <button 
            className={`nav-tab ${activeTab === 'skills' ? 'active' : ''}`}
            onClick={() => setActiveTab('skills')}
          >
            <Award size={18} />
            Skills
          </button>
          <button 
            className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Clock size={18} />
            Help History
          </button>
        </nav>

        {/* Content Area */}
        <div className="dashboard-content">
          <AnimatePresence mode="wait">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="tab-content"
              >
                {/* Stats Grid */}
                <div className="stats-grid">
                  <motion.div 
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="stat-icon primary">
                      <CheckCircle size={24} />
                    </div>
                    <div className="stat-details">
                      <span className="stat-value">{completedHelps}</span>
                      <span className="stat-label">Completed Helps</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="stat-icon active">
                      <Zap size={24} />
                    </div>
                    <div className="stat-details">
                      <span className="stat-value">{activeHelps}</span>
                      <span className="stat-label">Active Missions</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="stat-icon rating">
                      <Star size={24} />
                    </div>
                    <div className="stat-details">
                      <span className="stat-value">{helperProfile.rating?.toFixed(1) || '5.0'}</span>
                      <span className="stat-label">Rating</span>
                    </div>
                  </motion.div>

                  <motion.div 
                    className="stat-card"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="stat-icon skills">
                      <Award size={24} />
                    </div>
                    <div className="stat-details">
                      <span className="stat-value">{skills.length}</span>
                      <span className="stat-label">Skills Listed</span>
                    </div>
                  </motion.div>
                </div>

                {/* Quick Info */}
                <div className="quick-info">
                  <div className="info-card">
                    <h4><UserCheck size={18} /> Availability</h4>
                    <div className="availability-controls">
                      <button 
                        className={`avail-option ${availability === 'available' ? 'active' : ''}`}
                        onClick={() => !isEditing && setAvailability('available')}
                        disabled={!isEditing}
                      >
                        Available
                      </button>
                      <button 
                        className={`avail-option ${availability === 'busy' ? 'active' : ''}`}
                        onClick={() => !isEditing && setAvailability('busy')}
                        disabled={!isEditing}
                      >
                        Busy
                      </button>
                      <button 
                        className={`avail-option ${availability === 'offline' ? 'active' : ''}`}
                        onClick={() => !isEditing && setAvailability('offline')}
                        disabled={!isEditing}
                      >
                        Offline
                      </button>
                    </div>
                  </div>

                  <div className="info-card">
                    <h4><TrendingUp size={18} /> Performance</h4>
                    <div className="performance-metrics">
                      <div className="metric">
                        <span className="label">Response Time</span>
                        <span className="value">~3 min avg</span>
                      </div>
                      <div className="metric">
                        <span className="label">Completion Rate</span>
                        <span className="value">98.5%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Skills Tab */}
            {activeTab === 'skills' && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="tab-content"
              >
                <div className="skills-management">
                  <div className="skills-header">
                    <h3>Your Expertise</h3>
                    {isEditing && (
                      <div className="add-skill-form">
                        <input
                          type="text"
                          value={newSkill}
                          onChange={(e) => setNewSkill(e.target.value)}
                          placeholder="Add a skill (e.g., CPR, First Aid)"
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                        />
                        <button onClick={handleAddSkill}>Add</button>
                      </div>
                    )}
                  </div>

                  {skills.length > 0 ? (
                    <div className="skills-list">
                      {skills.map((skill, idx) => (
                        <motion.div
                          key={idx}
                          className="skill-tag"
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                        >
                          <span>{skill}</span>
                          {isEditing && (
                            <button 
                              className="remove-skill"
                              onClick={() => handleRemoveSkill(skill)}
                            >
                              ×
                            </button>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Award size={48} />
                      <p>No skills added yet</p>
                      {isEditing && <small>Add skills to get more mission matches</small>}
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* History Tab */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="tab-content"
              >
                <div className="history-section">
                  <h3>Recent Missions</h3>
                  
                  {loading ? (
                    <div className="loading-state">
                      <div className="spinner"></div>
                      <p>Loading mission history...</p>
                    </div>
                  ) : recentHelps.length > 0 ? (
                    <div className="help-list">
                      {recentHelps.map((help) => (
                        <div key={help.id} className="help-item">
                          <div className="help-header">
                            <div className="help-category">
                              <span 
                                className="category-badge"
                                style={{ 
                                  backgroundColor: getUrgencyColor(help.urgency) + '20',
                                  color: getUrgencyColor(help.urgency),
                                  border: `1px solid ${getUrgencyColor(help.urgency)}40`
                                }}
                              >
                                {help.category || 'General'}
                              </span>
                              <span 
                                className="status-badge"
                                style={{ 
                                  backgroundColor: getStatusColor(help.status) + '20',
                                  color: getStatusColor(help.status),
                                  border: `1px solid ${getStatusColor(help.status)}40`
                                }}
                              >
                                {help.status || 'Pending'}
                              </span>
                            </div>
                            <span className="help-date">
                              {new Date(help.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="help-description">{help.summary || help.description || 'No description'}</p>
                          {help.urgency && (
                            <div className="help-urgency">
                              <span>Urgency:</span>
                              <div className="urgency-bar">
                                {[1,2,3,4,5].map(level => (
                                  <div 
                                    key={level}
                                    className={`urgency-level ${level <= help.urgency ? 'filled' : ''}`}
                                    style={{ 
                                      backgroundColor: level <= help.urgency ? getUrgencyColor(help.urgency) : 'rgba(255,255,255,0.1)'
                                    }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <Clock size={48} />
                      <p>No mission history yet</p>
                      <small>Your assigned missions will appear here</small>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default HelperDashboard;
