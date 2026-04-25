import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/firebase.js';

const router = Router();
const db = getDB();

// Middleware: Verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded;
    next();
  });
};

// GET /api/helpers/profile - Get current helper's profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const helperDoc = await db.collection('helpers').doc(req.user.email).get();
    
    if (!helperDoc.exists) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    const profile = helperDoc.data();
    
    // Remove sensitive fields
    delete profile._internalPassword;
    delete profile._authPassword;

    res.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

// PUT /api/helpers/profile - Update helper profile
router.put('/profile', authenticateToken, [
  body('skills').optional().isArray(),
  body('availability').optional().isIn(['available', 'busy', 'offline'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updates = req.body;
    delete updates._internalPassword;
    delete updates._authPassword;

    await db.collection('helpers').doc(req.user.email).update(updates);

    const updatedDoc = await db.collection('helpers').doc(req.user.email).get();
    const profile = updatedDoc.data();
    delete profile._internalPassword;
    delete profile._authPassword;

    res.json({ profile, message: 'Profile updated' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/helpers/:username - Get public helper profile by username
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const snapshot = await db.collection('helpers')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'Helper not found' });
    }

    const profile = snapshot.docs[0].data();
    delete profile._internalPassword;
    delete profile._authPassword;
    delete profile.email; // Hide email for privacy

    res.json({ profile });
  } catch (error) {
    console.error('Get helper error:', error);
    res.status(500).json({ error: 'Failed to fetch helper' });
  }
});

export default router;
