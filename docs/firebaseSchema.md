# Firebase Schema for SentinelMatch

To support the AI-driven triage and verification system, I propose the following Firestore structure:

## Missions Collection (`/missions`)
Stores distress requests processed by Gemini.

| Field | Type | Description |
| :--- | :--- | :--- |
| `category` | String | Extracted by AI (Medical, Fire, Food, Shelter) |
| `urgency` | Number | Priority level (1-5) |
| `skills` | Array<String> | Required volunteer skills |
| `summary` | String | AI-cleaned description of the emergency |
| `location` | GeoPoint | User's GPS coordinates |
| `status` | String | `pending`, `active`, `completed` |
| `userId` | String | ID of the reporting user |
| `createdAt` | Timestamp | Time of submission |
| `verification` | Object | Visual proof data (Image URL + AI validation flag) |

## Volunteers Collection (`/volunteers`)
Stores volunteer profiles and their contributions.

| Field | Type | Description |
| :--- | :--- | :--- |
| `name` | String | Full name |
| `skills` | Array<String> | Skills verified or declared |
| `location` | GeoPoint | Live tracking of volunteer position |
| `impactPoints`| Number | Total points earned (validated by AI) |

## Impact Validation Logic
- When a task is marked `completed`, the AI checks the `verification.image` against the original requirements.
- If validated, `impactPoints` are awarded.
