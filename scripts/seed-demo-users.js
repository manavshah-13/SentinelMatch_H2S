/**
 * DEMO USERS SEED SCRIPT
 * 
 * This script adds 5 demo helper profiles to your Firestore database.
 * 
 * PREREQUISITES:
 * 1. Download your Firebase service account key from:
 *    Firebase Console → Project Settings → Service Accounts → "Generate new private key"
 * 2. Save it as `firebase-service-account.json` in the project root
 * 3. Ensure your Firebase project ID in .env matches the service account
 * 
 * USAGE:
 *   npm run seed
 * 
 * The script will create helper profiles with:
 * - Auto-generated unique IDs (HP-XXXXXXXX format)
 * - Passwords: "Demo123!" (all users share same password for easy login)
 * - usernames as provided (e.g., john_doe_123, alice_smith_456)
 * - Pre-filled profile data (name, email, location, occupation, age)
 * 
 * NOTE: These are DEMO accounts. In production, users register with unique passwords.
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Demo users data
const DEMO_USERS = [
  {
    username: 'john_doe_123',
    fullName: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1-555-0101',
    age: 28,
    location: 'New York, USA',
    occupation: 'Software Engineer',
    skills: ['First Aid', 'CPR', 'IT Support'],
    availability: 'available'
  },
  {
    username: 'alice_smith_456',
    fullName: 'Alice Smith',
    email: 'alice.smith@example.com',
    phone: '+44-20-7946-0958',
    age: 35,
    location: 'London, UK',
    occupation: 'Marketing Manager',
    skills: ['Medical', 'Trauma Support', 'First Aid'],
    availability: 'available'
  },
  {
    username: 'bob_jones_789',
    fullName: 'Bob Jones',
    email: 'bob.jones@example.com',
    phone: '+1-416-555-0100',
    age: 42,
    location: 'Toronto, Canada',
    occupation: 'Teacher',
    skills: ['Firefighting', 'Rescue', 'CPR'],
    availability: 'busy'
  },
  {
    username: 'emily_davis_101',
    fullName: 'Emily Davis',
    email: 'emily.davis@example.com',
    phone: '+61-2-9374-4000',
    age: 25,
    location: 'Sydney, Australia',
    occupation: 'Graphic Designer',
    skills: ['Shelter Support', 'Logistics', 'Food Distribution'],
    availability: 'available'
  },
  {
    username: 'mike_brown_202',
    fullName: 'Mike Brown',
    email: 'mike.brown@example.com',
    phone: '+49-30-901820',
    age: 31,
    location: 'Berlin, Germany',
    occupation: 'Data Analyst',
    skills: ['Emergency Medicine', 'First Aid', 'Coordination'],
    availability: 'available'
  }
];

async function seedDemoUsers() {
  try {
    // Check for service account key
    const serviceAccountPath = join(__dirname, '..', 'firebase-service-account.json');
    
    if (!readFileSync(serviceAccountPath).length) {
      throw new Error('Service account key not found');
    }

    const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));

    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert(serviceAccount)
    });
    const db = getFirestore(app);

    console.log('🌱 Starting demo user seeding...\n');

    let created = 0;
    let skipped = 0;

    for (const user of DEMO_USERS) {
      try {
        // Check if user already exists by username
        const existing = await db.collection('helpers')
          .where('username', '==', user.username)
          .get();

        if (!existing.empty) {
          console.log(`⚠️  Skipping ${user.username} (already exists)`);
          skipped++;
          continue;
        }

        // Generate a deterministic UID from email (for demo consistency)
        // In production, UIDs come from Firebase Auth
        const demoUid = `demo-${user.username}`;

        // Create helper profile
        const helperData = {
          uid: demoUid,
          email: user.email,
          username: user.username,
          phone: user.phone,
          fullName: user.fullName,
          uniqueId: `HP-${user.username.split('_').map(p => p.charAt(0).toUpperCase() + p.slice(1)).join('')}`,
          createdAt: new Date().toISOString(),
          skills: user.skills,
          availability: user.availability,
          totalHelps: Math.floor(Math.random() * 20) + 5, // Random 5-25
          rating: (4.5 + Math.random() * 0.5).toFixed(1), // 4.5-5.0
          age: user.age,
          location: user.location,
          occupation: user.occupation,
          isDemo: true
        };

        await db.collection('helpers').doc(demoUid).set(helperData);
        console.log(`✓ Created helper: ${user.fullName} (@${user.username})`);
        created++;

      } catch (err) {
        console.error(`✗ Error creating ${user.username}:`, err.message);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Created: ${created}`);
    console.log(`   Skipped: ${skipped}`);
    console.log(`\n📝 Demo login credentials:`);
    console.log(`   Use the "Already Registered" option with usernames:`);
    DEMO_USERS.forEach(u => console.log(`   - ${u.username}`));
    console.log(`\n⚠️  Remember to delete these demo accounts before production launch.`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    console.log('\n📋 Setup Instructions:');
    console.log('1. Go to Firebase Console → Project Settings → Service Accounts');
    console.log('2. Click "Generate new private key" → save as firebase-service-account.json');
    console.log('3. Place the file in the project root directory');
    console.log('4. Run: npm run seed');
    process.exit(1);
  }
}

seedDemoUsers();
