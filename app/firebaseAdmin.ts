// app/firebaseAdmin.ts

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { ServiceAccount } from 'firebase-admin';
import fs from 'fs';
import path from 'path';

// Service account path and credentials
const serviceAccountPath = path.resolve(process.cwd(), 'ev-rehberligi-firebase-adminsdk-uu8e4-43d06bb92f.json');
const serviceAccount: ServiceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

// Initialize Firebase Admin SDK
if (!getApps().length) {
    initializeApp({
        credential: cert(serviceAccount),
    });
}

// Export Auth instance
export const adminAuth = getAuth();