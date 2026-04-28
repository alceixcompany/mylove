import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { requireAdminUser } from "@/lib/paymentAuth";

export const runtime = "nodejs";

async function deleteQueryDocs(query) {
    const snap = await query.get();
    if (snap.empty) return;

    const batch = adminDb.batch();
    snap.docs.forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
}

export async function DELETE(request, { params }) {
    try {
        await requireAdminUser(request);
        const { userId } = await params;

        await Promise.allSettled([
            adminAuth.deleteUser(userId),
            adminDb.collection("users").doc(userId).delete(),
            deleteQueryDocs(adminDb.collection("pages").where("userId", "==", userId)),
            deleteQueryDocs(adminDb.collection("payments").where("uid", "==", userId))
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Kullanici silinemedi."
        }, { status: error.status || 500 });
    }
}
