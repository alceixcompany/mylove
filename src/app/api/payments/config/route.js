import { NextResponse } from "next/server";
import { getPaymentConfig } from "@/lib/paymentSettings";

export const runtime = "nodejs";

export async function GET() {
    try {
        const config = await getPaymentConfig();

        return NextResponse.json({
            success: true,
            data: config
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Odeme ayarlari alinamadi."
        }, { status: 500 });
    }
}
