import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Mail, User, Phone, ArrowLeft, ArrowRight, 
  Shield, AlertCircle, CheckCircle, UserPlus, LogIn 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HelpProviderAuth.css';

const HelpProviderAuth = () => {
  const navigate = useNavigate();
  const { register, login } = useAuth();

  const [mode, setMode] = useState('select'); // select, login, register
  const [registerData, setRegisterData] = useState({
    email: '',
    fullName: '',
    phone: ''
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedUsername, setGeneratedUsername] = useState('');

  const handleRegisterChange = (e) => {
    setRegisterData({ ...registerData, [e.target.name]: e.target.value });
    setError('');
    setSuccess('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(loginEmail);
      if (result.success) {
        const username = result.profile?.username;
        setSuccess(`Login successful! Welcome back.`);
        if (username) {
          setGeneratedUsername(username);
        }
        setTimeout(() => navigate('/helper-dashboard'), 1500);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    setGeneratedUsername('');

    // Validation
    if (!registerData.fullName.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }
    if (!registerData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    try {
      const result = await register(
        registerData.email,
        registerData.fullName,
        registerData.phone
      );

      if (result.success) {
        setGeneratedUsername(result.generatedUsername || result.profile?.username);
        setSuccess(`Registration successful! Welcome to SentinelMatch.`);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch {
      setError('An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      {/* Background Effects */}
      <div className="auth-bg-effects">
        <div className="gradient-orb orb-1"></div>
        <div className="gradient-orb orb-2"></div>
        <div className="grid-overlay"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="auth-card glass-panel"
      >
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="back-button"
          onClick={() => mode === 'select' ? navigate('/') : setMode('select')}
        >
          <ArrowLeft size={18} />
          <span>{mode === 'select' ? 'Back to Home' : 'Back'}</span>
        </motion.button>

        <AnimatePresence mode="wait">
          {/* Selection Screen */}
          {mode === 'select' && (
            <motion.div
              key="select"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="auth-select"
            >
              <header className="auth-header">
                <div className="auth-icon">
                  <Heart size={40} />
                </div>
                <h1>Welcome, Helper</h1>
                <p>Join our network of lifesavers</p>
              </header>

              <div className="auth-options">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="auth-option"
                  onClick={() => setMode('register')}
                >
                  <div className="option-icon">
                    <UserPlus size={32} />
                  </div>
                  <div className="option-content">
                    <h3>New Registration</h3>
                    <p>Create your helper profile</p>
                  </div>
                  <ArrowRight size={20} className="arrow" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="auth-option"
                  onClick={() => setMode('login')}
                >
                  <div className="option-icon login">
                    <LogIn size={32} />
                  </div>
                  <div className="option-content">
                    <h3>Already Registered</h3>
                    <p>Login with your username</p>
                  </div>
                  <ArrowRight size={20} className="arrow" />
                </motion.button>
              </div>

              <div className="auth-features">
                <div className="feature-item">
                  <Shield size={16} />
                  <span>Secure & Verified</span>
                </div>
                <div className="feature-item">
                  <CheckCircle size={16} />
                  <span>Quick Response</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="auth-form"
            >
               <header className="auth-header">
                 <h2>Login</h2>
                 <p>Enter your email to access your account</p>
               </header>

                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label>Email</label>
                    <div className="input-wrapper">
                      <Mail size={20} />
                      <input
                        type="email"
                        value={loginEmail}
                        onChange={(e) => { setLoginEmail(e.target.value); setError(''); setSuccess(''); }}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                    <small>Enter your registered email to access your account</small>
                  </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="error-message"
                    >
                      <AlertCircle size={16} />
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <AnimatePresence>
                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="success-message"
                    >
                      <CheckCircle size={16} />
                      {success}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button 
                  type="submit" 
                  className={`submit-button ${loading ? 'loading' : ''}`}
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                  <ArrowRight size={18} />
                </button>
              </form>

              <p className="switch-mode">
                New helper?{' '}
                <button onClick={() => setMode('register')}>
                  Register here
                </button>
              </p>
            </motion.div>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="auth-form"
            >
              <header className="auth-header">
                <h2>Join the Network</h2>
                <p>Register as a verified helper</p>
              </header>

               <form onSubmit={handleRegister}>
                 <div className="form-group">
                   <label>Full Name</label>
                   <div className="input-wrapper">
                     <User size={20} />
                     <input
                       type="text"
                       name="fullName"
                       value={registerData.fullName}
                       onChange={handleRegisterChange}
                       placeholder="Your full name (e.g., John Doe)"
                       required
                     />
                   </div>
                   <small>Your unique username will be generated automatically</small>
                 </div>

                 <div className="form-group">
                   <label>Email</label>
                   <div className="input-wrapper">
                     <Mail size={20} />
                     <input
                       type="email"
                       name="email"
                       value={registerData.email}
                       onChange={handleRegisterChange}
                       placeholder="your.email@example.com"
                       required
                     />
                   </div>
                 </div>

                 <div className="form-group">
                   <label>Phone Number</label>
                   <div className="input-wrapper">
                     <Phone size={20} />
                     <input
                       type="tel"
                       name="phone"
                       value={registerData.phone}
                       onChange={handleRegisterChange}
                       placeholder="+1 (555) 123-4567"
                     />
                   </div>
                   <small>Optional but recommended for emergencies</small>
                 </div>

                 <AnimatePresence>
                   {error && (
                     <motion.div
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="error-message"
                     >
                       <AlertCircle size={16} />
                       {error}
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <AnimatePresence>
                   {success && (
                     <motion.div
                       initial={{ opacity: 0, y: -10 }}
                       animate={{ opacity: 1, y: 0 }}
                       className="success-message"
                     >
                       <CheckCircle size={16} />
                       <span>{success}</span>
                       {generatedUsername && (
                         <div className="username-display">
                           <strong>Your username:</strong> {generatedUsername}
                           <br />
                           <small>Use this username to login next time</small>
                         </div>
                       )}
                     </motion.div>
                   )}
                 </AnimatePresence>

                 <button 
                   type="submit" 
                   className={`submit-button ${loading ? 'loading' : ''}`}
                   disabled={loading}
                 >
                   {loading ? 'Creating Account...' : 'Create Account (Passwordless)'}
                   <ArrowRight size={18} />
                 </button>
               </form>

              <p className="switch-mode">
                Already a helper?{' '}
                <button onClick={() => setMode('login')}>
                  Login here
                </button>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default HelpProviderAuth;
