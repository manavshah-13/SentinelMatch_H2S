import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { getDB } from '../config/firebase.js';

const router = Router();
const db = getDB();

// Middleware: Verify JWT token (missions require helper authentication)
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

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

// GET /api/missions - Get missions assigned to current helper
router.get('/', authenticateToken, async (req, res) => {
  try {
    const helperEmail = req.user.email;
    
    // Get helper profile to get username
    const helperDoc = await db.collection('helpers').doc(helperEmail).get();
    if (!helperDoc.exists) {
      return res.status(404).json({ error: 'Helper profile not found' });
    }
    const helperData = helperDoc.data();

    // Query missions assigned to this helper
    const missionsSnapshot = await db.collection('missions')
      .where('assignedToUid', '==', helperData.uid)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();

    const missions = missionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || doc.data().createdAt
    }));

    res.json({ missions });
  } catch (error) {
    console.error('Get missions error:', error);
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// GET /api/missions/:id - Get single mission
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const missionDoc = await db.collection('missions').doc(id).get();
    
    if (!missionDoc.exists) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const mission = missionDoc.data();
    
    // Check if current helper is assigned
    if (mission.assignedToUid !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ mission });
  } catch (error) {
    console.error('Get mission error:', error);
    res.status(500).json({ error: 'Failed to fetch mission' });
  }
});

// PUT /api/missions/:id/status - Update mission status
router.put('/:id/status', authenticateToken, [
  body('status').isIn(['pending', 'active', 'completed', 'cancelled'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;

    const missionRef = db.collection('missions').doc(id);
    const missionDoc = await missionRef.get();

    if (!missionDoc.exists) {
      return res.status(404).json({ error: 'Mission not found' });
    }

    const mission = missionDoc.data();
    if (mission.assignedToUid !== req.user.uid) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await missionRef.update({
      status,
      updatedAt: new Date().toISOString()
    });

    res.json({ message: 'Status updated', missionId: id, status });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// POST /api/missions - Create a new mission (from triage, no auth required)
router.post('/', [
  body('category').notEmpty().withMessage('Category is required'),
  body('urgency').isInt({ min: 1, max: 5 }).withMessage('Urgency must be 1-5'),
  body('summary').trim().notEmpty().withMessage('Summary is required'),
  body('description').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, urgency, summary, description, skills, location } = req.body;

    const missionData = {
      category,
      urgency: parseInt(urgency),
      summary,
      description: description || '',
      skills: skills || [],
      location: location || null,
      userId: null,
      assignedTo: null,
      assignedToUid: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const docRef = await db.collection('missions').add(missionData);

    const createdMission = { id: docRef.id, ...missionData };
    res.status(201).json({ mission: createdMission, message: 'Mission created' });
  } catch (error) {
    console.error('Create mission error:', error);
    res.status(500).json({ error: 'Failed to create mission' });
  }
});

export default router;
