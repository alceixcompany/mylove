import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { requireFirebaseUser } from "@/lib/paymentAuth";
import { validateCouponForAmount } from "@/lib/coupons";
import { getAppUrl, getClientIp, formatMoney } from "@/lib/paymentConfig";
import { getPaymentConfig } from "@/lib/paymentSettings";
import { initializeCheckoutForm, Iyzipay } from "@/lib/iyzico";

export const runtime = "nodejs";

async function readJson(request) {
    return request.json().catch(() => ({}));
}

async function getOwnedPage(uid, pageId) {
    if (pageId) {
        const pageRef = adminDb.collection("pages").doc(pageId);
        const pageSnap = await pageRef.get();

        if (!pageSnap.exists || pageSnap.data().userId !== uid) {
            return null;
        }

        return { ref: pageRef, snap: pageSnap, data: pageSnap.data() };
    }

    const pageSnap = await adminDb
        .collection("pages")
        .where("userId", "==", uid)
        .limit(1)
        .get();

    if (pageSnap.empty) return null;

    const doc = pageSnap.docs[0];
    return { ref: doc.ref, snap: doc, data: doc.data() };
}

function splitName(userRecord, userData) {
    const displayName = userData.name || userData.displayName || userRecord.displayName || userRecord.email?.split("@")[0] || "Sonsuz Ask";
    const parts = displayName.trim().split(/\s+/).filter(Boolean);

    return {
        name: parts[0] || "Sonsuz",
        surname: parts.slice(1).join(" ") || "Ask"
    };
}

async function markFreePaymentPaid({ paymentRef, uid, pageRef, couponRefPath, paymentConfig }) {
    await adminDb.runTransaction(async (transaction) => {
        const paymentSnap = await transaction.get(paymentRef);

        if (!paymentSnap.exists || paymentSnap.data().status === "paid") return;

        transaction.update(paymentRef, {
            status: "paid",
            paidAt: FieldValue.serverTimestamp(),
            iyzicoPaymentId: "coupon_free_checkout",
            updatedAt: FieldValue.serverTimestamp()
        });

        transaction.set(adminDb.collection("users").doc(uid), {
            paid: true,
            paidAt: FieldValue.serverTimestamp(),
            plan: paymentConfig.packageKey,
            paymentId: "coupon_free_checkout"
        }, { merge: true });

        transaction.set(pageRef, {
            isLive: true,
            activatedAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        if (couponRefPath) {
            transaction.update(adminDb.doc(couponRefPath), {
                usedCount: FieldValue.increment(1),
                usedBy: FieldValue.arrayUnion(uid)
            });
        }
    });
}

export async function POST(request) {
    try {
        const decoded = await requireFirebaseUser(request);
        const body = await readJson(request);
        const uid = decoded.uid;
        const paymentConfig = await getPaymentConfig();
        const appUrl = getAppUrl(request, paymentConfig.appUrl);
        const page = await getOwnedPage(uid, body.pageId);

        if (!page) {
            return NextResponse.json({
                success: false,
                message: "Odeme baslatmadan once sayfanizi kaydedin."
            }, { status: 400 });
        }

        const userRef = adminDb.collection("users").doc(uid);
        const [userSnap, userRecord] = await Promise.all([
            userRef.get(),
            adminAuth.getUser(uid)
        ]);
        const userData = userSnap.exists ? userSnap.data() : {};

        if (!userSnap.exists) {
            await userRef.set({
                email: userRecord.email || decoded.email || null,
                paid: false,
                createdAt: FieldValue.serverTimestamp()
            }, { merge: true });
        }

        if (userData.paid === true) {
            await page.ref.set({
                isLive: true,
                activatedAt: FieldValue.serverTimestamp(),
                updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });

            return NextResponse.json({
                success: true,
                data: {
                    requiresPayment: false,
                    redirectUrl: "/dashboard",
                    message: "Sayfaniz zaten yayinda."
                }
            });
        }

        const coupon = await validateCouponForAmount({
            code: body.couponCode,
            uid,
            baseAmount: paymentConfig.amount
        });
        const paymentRef = adminDb.collection("payments").doc();
        const paymentData = {
            uid,
            pageId: page.ref.id,
            pageSlug: page.data.urlSlug || null,
            packageKey: paymentConfig.packageKey,
            packageName: paymentConfig.packageName,
            amount: paymentConfig.amount,
            currency: paymentConfig.currency,
            couponCode: coupon.code,
            couponRefPath: coupon.couponRefPath,
            discountAmount: coupon.discountAmount,
            finalAmount: coupon.finalAmount,
            status: "pending",
            iyzicoToken: null,
            iyzicoPaymentId: null,
            failureReason: null,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            paidAt: null
        };

        await paymentRef.set(paymentData);

        if (coupon.finalAmount <= 0) {
            await markFreePaymentPaid({
                paymentRef,
                uid,
                pageRef: page.ref,
                couponRefPath: coupon.couponRefPath,
                paymentConfig
            });

            return NextResponse.json({
                success: true,
                data: {
                    requiresPayment: false,
                    paymentId: paymentRef.id,
                    redirectUrl: `/payment/callback?status=success&paymentId=${paymentRef.id}`
                }
            });
        }

        const { name, surname } = splitName(userRecord, userData);
        const finalAmount = formatMoney(coupon.finalAmount);
        const checkoutRequest = {
            locale: Iyzipay.LOCALE.TR,
            conversationId: paymentRef.id,
            price: finalAmount,
            paidPrice: finalAmount,
            currency: Iyzipay.CURRENCY[paymentConfig.currency] || paymentConfig.currency,
            basketId: paymentRef.id,
            paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
            paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
            enabledInstallments: [1],
            callbackUrl: `${appUrl}/api/payments/iyzico/callback`,
            buyer: {
                id: uid,
                name,
                surname,
                gsmNumber: userData.phone || userRecord.phoneNumber || "+905350000000",
                email: userRecord.email || decoded.email || userData.email,
                identityNumber: userData.identityNumber || "11111111111",
                registrationAddress: userData.address || "Online teslimat",
                ip: getClientIp(request),
                city: userData.city || "Istanbul",
                country: userData.country || "Turkey",
                zipCode: userData.zipCode || "34000"
            },
            billingAddress: {
                contactName: `${name} ${surname}`,
                city: userData.city || "Istanbul",
                country: userData.country || "Turkey",
                address: userData.address || "Online teslimat",
                zipCode: userData.zipCode || "34000"
            },
            shippingAddress: {
                contactName: `${name} ${surname}`,
                city: userData.city || "Istanbul",
                country: userData.country || "Turkey",
                address: userData.address || "Online teslimat",
                zipCode: userData.zipCode || "34000"
            },
            basketItems: [
                {
                    id: paymentConfig.packageKey,
                    name: paymentConfig.packageName,
                    category1: "Digital",
                    itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
                    price: finalAmount
                }
            ]
        };

        const iyzicoResult = await initializeCheckoutForm(checkoutRequest);

        if (iyzicoResult.status !== "success") {
            await paymentRef.update({
                status: "failed",
                failureReason: iyzicoResult.errorMessage || iyzicoResult.errorCode || "iyzico_initialize_failed",
                updatedAt: FieldValue.serverTimestamp()
            });

            return NextResponse.json({
                success: false,
                message: iyzicoResult.errorMessage || "Iyzico odeme formu baslatilamadi."
            }, { status: 502 });
        }

        await paymentRef.update({
            iyzicoToken: iyzicoResult.token || null,
            iyzicoConversationId: iyzicoResult.conversationId || paymentRef.id,
            updatedAt: FieldValue.serverTimestamp()
        });

        return NextResponse.json({
            success: true,
            data: {
                requiresPayment: true,
                paymentId: paymentRef.id,
                token: iyzicoResult.token,
                checkoutFormContent: iyzicoResult.checkoutFormContent,
                paymentPageUrl: iyzicoResult.paymentPageUrl,
                amount: paymentConfig.amount,
                discountAmount: coupon.discountAmount,
                finalAmount: coupon.finalAmount,
                currency: paymentConfig.currency
            }
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            message: error.message || "Odeme baslatilamadi."
        }, { status: error.status || 500 });
    }
}
