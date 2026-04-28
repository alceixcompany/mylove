import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
let adminApp = null;

function getAdminCredential() {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    if (serviceAccountKey) {
        return cert(JSON.parse(serviceAccountKey));
    }

    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (projectId && clientEmail && privateKey) {
        return cert({
            projectId,
            clientEmail,
            privateKey
        });
    }

    if (
        process.env.GOOGLE_APPLICATION_CREDENTIALS ||
        process.env.K_SERVICE
    ) {
        return applicationDefault();
    }

    throw new Error("Firebase Admin bilgileri eksik. FIREBASE_SERVICE_ACCOUNT_KEY veya FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY tanımlayın.");
}

function getAdminApp() {
    if (adminApp) return adminApp;
    if (getApps().length) {
        adminApp = getApps()[0];
        return adminApp;
    }

    adminApp = initializeApp({
        credential: getAdminCredential(),
        projectId
    });

    return adminApp;
}

function proxyService(getService) {
    return new Proxy({}, {
        get(_target, property) {
            const service = getService();
            const value = service[property];
            return typeof value === "function" ? value.bind(service) : value;
        }
    });
}

export const adminAuth = proxyService(() => getAuth(getAdminApp()));
export const adminDb = proxyService(() => getFirestore(getAdminApp()));
