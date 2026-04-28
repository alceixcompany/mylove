import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminUser } from "@/lib/paymentAuth";

export const runtime = "nodejs";

export async function DELETE(request, { params }) {
    try {
        await requireAdminUser(request);
        const { id } = await params;

        await Promise.all([
            adminDb.collection("referrals").doc(id).delete(),
            adminDb.collection("coupons").doc(id).delete()
        ]);

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Referans kodu silinemedi."
        }, { status: error.status || 500 });
    }
}
