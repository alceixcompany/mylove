import { NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/paymentAuth";
import { getPaymentSettings, savePaymentSettings } from "@/lib/paymentSettings";

export const runtime = "nodejs";

export async function GET(request) {
    try {
        await requireAdminUser(request);
        const settings = await getPaymentSettings();

        return NextResponse.json({
            success: true,
            data: settings
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Odeme ayarlari alinamadi."
        }, { status: error.status || 500 });
    }
}

export async function POST(request) {
    try {
        await requireAdminUser(request);
        const body = await request.json().catch(() => ({}));
        const settings = await savePaymentSettings(body);

        return NextResponse.json({
            success: true,
            data: settings
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Odeme ayarlari kaydedilemedi."
        }, { status: error.status || 500 });
    }
}
