
const { initializeApp } = require("firebase/app");
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require("firebase/auth");
const dotenv = require("dotenv");
const path = require("path");

// Load .env.local
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const email = "alceix@admin.com";
const password = "alceix13579";

async function createAdmin() {
    try {
        console.log(`Admin kullanıcısı oluşturuluyor: ${email}`);
        await createUserWithEmailAndPassword(auth, email, password);
        console.log("✅ Admin kullanıcısı başarıyla oluşturuldu.");
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log("ℹ️ Admin kullanıcısı zaten mevcut.");
        } else {
            console.error("❌ Hata:", error.message);
        }
    }
    process.exit();
}

createAdmin();
