/**
 * DEMO MISSIONS SEED SCRIPT
 * 
 * Adds sample mission/help records to the Firestore database
 * assigned to the demo helper profiles.
 * 
 * USAGE:
 *   npm run seed:missions
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Demo missions data - will be assigned to random demo helpers
const DEMO_MISSIONS = [
  {
    category: 'Medical',
    urgency: 4,
    summary: 'Elderly person requires assistance at home. Possible fall, needs immediate check.',
    description: 'Elderly male, living alone, reported not answering calls for 24 hours.',
    status: 'completed',
    skills: ['First Aid', 'CPR', 'Elderly Care']
  },
  {
    category: 'Fire',
    urgency: 5,
    summary: 'Kitchen fire reported, residents evacuated but need shelter assistance',
    description: 'Small kitchen fire extinguished, 4 residents displaced, need temporary housing and supplies.',
    status: 'completed',
    skills: ['Firefighting', 'Rescue', 'Shelter Support']
  },
  {
    category: 'Medical',
    urgency: 3,
    summary: 'Minor injuries from minor accident, need basic first aid',
    description: 'Two people with minor cuts and bruises from bicycle accident.',
    status: 'active',
    skills: ['First Aid', 'Trauma Support']
  },
  {
    category: 'Shelter',
    urgency: 4,
    summary: 'Family of 4 needs temporary shelter after flooding',
    description: 'Basement apartment flooded, family evacuated, needs food and bedding.',
    status: 'active',
    skills: ['Shelter Support', 'Logistics', 'Food Distribution']
  },
  {
    category: 'General',
    urgency: 2,
    summary: 'Groceries delivery for isolated senior',
    description: 'Senior citizen unable to leave home, needs weekly grocery delivery.',
    status: 'pending',
    skills: ['Logistics', 'Food Distribution']
  },
  {
    category: 'Medical',
    urgency: 5,
    summary: 'Cardiac emergency, CPR in progress',
    description: ' reported cardiac arrest, bystander performing CPR, need defibrillator and ambulance.',
    status: 'completed',
    skills: ['CPR', 'Emergency Medicine', 'First Aid']
  },
  {
    category: 'Fire',
    urgency: 4,
    summary: 'Gas leak reported, evacuate building',
    description: 'Suspected gas leak in apartment building, 20+ residents need evacuation.',
    status: 'pending',
    skills: ['Firefighting', 'Rescue', 'Evacuation']
  },
  {
    category: 'Medical',
    urgency: 3,
    summary: 'Child with high fever needs medical evaluation',
    description: '3-year-old with 104°F fever, parents concerned, need medical assessment.',
    status: 'active',
    skills: ['Medical', 'Pediatric Care']
  }
];

// Helper usernames from seed script
const DEMO_HELPER_USERNAMES = [
  'john_doe_123',
  'alice_smith_456',
  'bob_jones_789',
  'emily_davis_101',
  'mike_brown_202'
];

async function seedDemoMissions() {
  try {
    const serviceAccountPath = join(__dirname, '..', 'firebase-service-account.json');
    
    if (!readFileSync(serviceAccountPath).length) {
      throw new Error('Service account key not found');
    }

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    const db = getFirestore(app);

    console.log('🌱 Starting demo missions seeding...\n');

    // Get all demo helpers
    const helpersSnapshot = await db.collection('helpers')
      .where('username', 'in', DEMO_HELPER_USERNAMES)
      .get();

    if (helpersSnapshot.empty) {
      console.log('❌ No demo helpers found. Run the demo users seed first:');
      console.log('   npm run seed');
      process.exit(1);
    }

    const helpers = helpersSnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    let created = 0;
    let skipped = 0;

    for (const mission of DEMO_MISSIONS) {
      try {
        // Assign to a random helper (weighted by skills match would be better but random for demo)
        const randomHelper = helpers[Math.floor(Math.random() * helpers.length)];

        // Check if mission already exists (by summary hash?)
        const existing = await db.collection('missions')
          .where('summary', '==', mission.summary)
          .where('assignedTo', '==', randomHelper.data.fullName)
          .get();

        if (!existing.empty) {
          console.log(`⚠️  Skipping: ${mission.summary.substring(0, 40)}...`);
          skipped++;
          continue;
        }

        const missionData = {
          ...mission,
          assignedTo: randomHelper.data.fullName,
          assignedToUid: randomHelper.id,
          createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(), // Random date within last week
          updatedAt: new Date().toISOString()
        };

        await db.collection('missions').add(missionData);
        console.log(`✓ Added: ${mission.summary.substring(0, 50)}... → ${randomHelper.data.username}`);
        created++;

      } catch (err) {
        console.error(`✗ Error creating mission:`, err.message);
      }
    }

    console.log(`\n✅ Mission seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDemoMissions();
