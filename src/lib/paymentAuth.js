import { adminAuth } from "@/lib/firebaseAdmin";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "alceix@admin.com";

export async function requireFirebaseUser(request) {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : null;

    if (!token) {
        const error = new Error("Oturum bilgisi eksik.");
        error.status = 401;
        throw error;
    }

    return adminAuth.verifyIdToken(token);
}

export async function requireAdminUser(request) {
    const decoded = await requireFirebaseUser(request);

    if (decoded.email !== ADMIN_EMAIL) {
        const error = new Error("Bu işlem için admin yetkisi gerekiyor.");
        error.status = 403;
        throw error;
    }

    return decoded;
}
