import { NextResponse } from "next/server";
import { requireFirebaseUser } from "@/lib/paymentAuth";
import { getPaymentConfig } from "@/lib/paymentSettings";
import { validateCouponForAmount } from "@/lib/coupons";

export const runtime = "nodejs";

export async function POST(request) {
    try {
        const decoded = await requireFirebaseUser(request);
        const body = await request.json().catch(() => ({}));
        const paymentConfig = await getPaymentConfig();
        const coupon = await validateCouponForAmount({
            code: body.couponCode || body.code,
            uid: decoded.uid,
            baseAmount: paymentConfig.amount
        });

        return NextResponse.json({
            success: true,
            data: {
                code: coupon.code,
                discountAmount: coupon.discountAmount,
                finalAmount: coupon.finalAmount,
                currency: paymentConfig.currency
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Indirim kodu kontrol edilemedi."
        }, { status: error.status || 500 });
    }
}
