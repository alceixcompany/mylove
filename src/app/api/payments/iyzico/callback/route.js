import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { getAppUrl, toMinorUnit } from "@/lib/paymentConfig";
import { getPaymentConfig } from "@/lib/paymentSettings";
import { retrieveCheckoutForm } from "@/lib/iyzico";

export const runtime = "nodejs";

async function readToken(request) {
    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
        const body = await request.json().catch(() => ({}));
        return body.token;
    }

    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await request.formData();
        return formData.get("token");
    }

    const text = await request.text();
    return new URLSearchParams(text).get("token");
}

function redirectTo(appUrl, status, params = {}) {
    const url = new URL("/payment/callback", appUrl);
    url.searchParams.set("status", status);

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            url.searchParams.set(key, String(value));
        }
    });

    return NextResponse.redirect(url, { status: 303 });
}

async function findPayment(result, token) {
    const paymentId = result.basketId || result.conversationId;

    if (paymentId) {
        const paymentRef = adminDb.collection("payments").doc(paymentId);
        const paymentSnap = await paymentRef.get();

        if (paymentSnap.exists) {
            return { ref: paymentRef, snap: paymentSnap };
        }
    }

    if (token) {
        const tokenSnap = await adminDb
            .collection("payments")
            .where("iyzicoToken", "==", token)
            .limit(1)
            .get();

        if (!tokenSnap.empty) {
            const snap = tokenSnap.docs[0];
            return { ref: snap.ref, snap };
        }
    }

    return null;
}

async function markFailed(paymentRef, reason, result = {}) {
    if (!paymentRef) return;

    await paymentRef.set({
        status: "failed",
        failureReason: reason,
        iyzicoPaymentId: result.paymentId || null,
        iyzicoPaymentStatus: result.paymentStatus || null,
        updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
}

export async function POST(request) {
    const paymentConfig = await getPaymentConfig();
    const appUrl = getAppUrl(request, paymentConfig.appUrl);

    try {
        const token = await readToken(request);

        if (!token) {
            return redirectTo(appUrl, "error", { message: "missing_token" });
        }

        const result = await retrieveCheckoutForm(token);
        const payment = await findPayment(result, token);

        if (!payment) {
            return redirectTo(appUrl, "error", { message: "payment_not_found" });
        }

        const paymentData = payment.snap.data();

        if (paymentData.status === "paid") {
            return redirectTo(appUrl, "success", { paymentId: payment.ref.id });
        }

        if (result.status !== "success" || result.paymentStatus !== "SUCCESS") {
            const reason = result.errorMessage || result.paymentStatus || result.errorCode || "iyzico_payment_failed";
            await markFailed(payment.ref, reason, result);
            return redirectTo(appUrl, "error", { message: reason });
        }

        const expectedAmount = toMinorUnit(paymentData.finalAmount);
        const paidAmount = toMinorUnit(result.paidPrice);
        const expectedCurrency = String(paymentData.currency || "").toUpperCase();
        const resultCurrency = String(result.currency || "").toUpperCase();

        if (expectedAmount !== paidAmount) {
            await markFailed(payment.ref, "amount_mismatch", result);
            return redirectTo(appUrl, "error", { message: "amount_mismatch" });
        }

        if (expectedCurrency !== resultCurrency) {
            await markFailed(payment.ref, "currency_mismatch", result);
            return redirectTo(appUrl, "error", { message: "currency_mismatch" });
        }

        await adminDb.runTransaction(async (transaction) => {
            const freshPaymentSnap = await transaction.get(payment.ref);

            if (!freshPaymentSnap.exists) {
                throw new Error("payment_not_found");
            }

            const freshPayment = freshPaymentSnap.data();

            if (freshPayment.status === "paid") return;

            transaction.update(payment.ref, {
                status: "paid",
                paidAt: FieldValue.serverTimestamp(),
                iyzicoPaymentId: result.paymentId || null,
                iyzicoPaymentStatus: result.paymentStatus || null,
                paidPrice: Number(result.paidPrice),
                updatedAt: FieldValue.serverTimestamp(),
                failureReason: null
            });

            transaction.set(adminDb.collection("users").doc(freshPayment.uid), {
                paid: true,
                paidAt: FieldValue.serverTimestamp(),
                plan: freshPayment.packageKey,
                paymentId: result.paymentId || payment.ref.id
            }, { merge: true });

            if (freshPayment.pageId) {
                transaction.set(adminDb.collection("pages").doc(freshPayment.pageId), {
                    isLive: true,
                    activatedAt: FieldValue.serverTimestamp(),
                    updatedAt: FieldValue.serverTimestamp()
                }, { merge: true });
            }

            if (freshPayment.couponRefPath) {
                transaction.update(adminDb.doc(freshPayment.couponRefPath), {
                    usedCount: FieldValue.increment(1),
                    usedBy: FieldValue.arrayUnion(freshPayment.uid)
                });
            }
        });

        return redirectTo(appUrl, "success", { paymentId: payment.ref.id });
    } catch (error) {
        return redirectTo(appUrl, "error", { message: error.message || "callback_error" });
    }
}
