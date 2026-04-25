import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { getAuth } from 'firebase-admin/auth';
import { getDB } from '../config/firebase.js';
import { generateUniqueUsername } from '../utils/usernameGenerator.js';

const router = Router();
const db = getDB();

// POST /api/auth/register - Create new helper (passwordless)
router.post('/register', [
  body('fullName').trim().notEmpty().withMessage('Full name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { fullName, email, phone } = req.body;

    // Check if email already exists
    const existingHelper = await db.collection('helpers').doc(email).get();
    if (existingHelper.exists) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Generate unique username
    const [firstName, ...lastNameParts] = fullName.trim().split(' ');
    const lastName = lastNameParts.join(' ');
    
    const username = await generateUniqueUsername(
      firstName,
      lastName || firstName,
      email,
      phone || '',
      async (candidateUsername) => {
        const snapshot = await db.collection('helpers')
          .where('username', '==', candidateUsername)
          .limit(1)
          .get();
        return !snapshot.empty;
      }
    );

    // Create Firebase Auth user with random password (backend manages it)
    const randomPassword = Math.random().toString(36).slice(-12) + 'A1!';
    const firebaseUser = await getAuth().createUser({
      email,
      password: randomPassword,
      displayName: fullName
    });

    // Create helper profile
    const helperData = {
      uid: firebaseUser.uid,
      email,
      username,
      phone: phone || '',
      fullName,
      uniqueId: `HP-${firebaseUser.uid.substring(0, 8).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      skills: [],
      availability: 'available',
      totalHelps: 0,
      rating: 5.0,
      _internalPassword: randomPassword // ⚠️ For passwordless login only
    };

    await db.collection('helpers').doc(email).set(helperData);

    // Generate JWT token for session
    const token = jwt.sign(
      { uid: firebaseUser.uid, email, username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    console.log(`✅ New helper registered: ${username} (${email})`);

    res.status(201).json({
      message: 'Registration successful',
      token,
      helper: {
        uid: firebaseUser.uid,
        username,
        email,
        fullName,
        uniqueId: helperData.uniqueId
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// POST /api/auth/login - Login with email
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;

    // Find helper by email
    const helperDoc = await db.collection('helpers').doc(email).get();
    
    if (!helperDoc.exists) {
      return res.status(404).json({ error: 'Helper not found with this email' });
    }

     const helperData = helperDoc.data();

     // Generate JWT token (no Firebase sign-in needed)
     const token = jwt.sign(
       { uid: helperData.uid, email: helperData.email, username: helperData.username },
       process.env.JWT_SECRET,
       { expiresIn: '7d' }
     );

     console.log(`✅ Login successful: ${helperData.username}`);

    console.log(`✅ Login successful: ${helperData.username}`);

    res.json({
      message: 'Login successful',
      token,
      helper: {
        uid: helperData.uid,
        username: helperData.username,
        email: helperData.email,
        fullName: helperData.fullName,
        uniqueId: helperData.uniqueId
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// POST /api/auth/logout - Logout (invalidate JWT on client side)
router.post('/logout', (req, res) => {
  // JWT can't be invalidated server-side without a denylist
  // Client should discard token
  res.json({ message: 'Logged out successfully' });
});

export default router;
