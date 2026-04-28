import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdminUser } from "@/lib/paymentAuth";

export const runtime = "nodejs";

const REFERRAL_CODE_LENGTH = 6;

function buildReferralCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: REFERRAL_CODE_LENGTH }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

async function createUniqueCode() {
    for (let attempt = 0; attempt < 12; attempt += 1) {
        const code = buildReferralCode();
        const existing = await adminDb.collection("referrals").doc(code).get();
        if (!existing.exists) return code;
    }

    throw new Error("Referans kodu olusturulamadi. Tekrar deneyin.");
}

export async function POST(request) {
    try {
        await requireAdminUser(request);
        const body = await request.json().catch(() => ({}));
        const amount = Number.parseFloat(String(body.amount ?? "").replace(",", "."));

        if (!body.name?.trim()) {
            return NextResponse.json({ success: false, message: "Kaynak adi gerekli." }, { status: 400 });
        }

        if (!Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ success: false, message: "Gecerli bir indirim degeri girin." }, { status: 400 });
        }

        const discountType = body.discountType === "fixed" ? "fixed" : "percentage";
        const currency = String(body.currency || "TRY").trim().toUpperCase();
        const code = await createUniqueCode();
        const payload = {
            name: body.name.trim(),
            code,
            clicks: 0,
            conversions: 0,
            discount: discountType === "percentage" ? `%${amount}` : `${amount} ${currency}`,
            discountType,
            amount,
            usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
            expiryDate: body.expiryDate || null,
            usageCount: 0,
            usedCount: 0,
            isActive: true,
            createdAt: new Date().toISOString()
        };

        await Promise.all([
            adminDb.collection("referrals").doc(code).set(payload),
            adminDb.collection("coupons").doc(code).set(payload)
        ]);

        return NextResponse.json({
            success: true,
            data: payload
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Referans kodu olusturulamadi."
        }, { status: error.status || 500 });
    }
}
