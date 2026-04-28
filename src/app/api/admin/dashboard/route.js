import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminUser } from "@/lib/paymentAuth";

export const runtime = "nodejs";

function serializeFirestoreValue(value) {
    if (value === null || value === undefined) return value;
    if (typeof value?.toDate === "function") return value.toDate().toISOString();
    if (Array.isArray(value)) return value.map(serializeFirestoreValue);

    if (typeof value === "object") {
        return Object.fromEntries(
            Object.entries(value).map(([key, nested]) => [key, serializeFirestoreValue(nested)])
        );
    }

    return value;
}

async function readCollection(name) {
    const snap = await adminDb.collection(name).get();
    return snap.docs.map((doc) => ({
        id: doc.id,
        ...serializeFirestoreValue(doc.data())
    }));
}

export async function GET(request) {
    try {
        await requireAdminUser(request);

        const [users, pages, referrals, payments] = await Promise.all([
            readCollection("users"),
            readCollection("pages"),
            readCollection("referrals"),
            readCollection("payments")
        ]);

        return NextResponse.json({
            success: true,
            data: {
                users,
                pages,
                referrals,
                payments
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Admin verileri alinamadi."
        }, { status: error.status || 500 });
    }
}
