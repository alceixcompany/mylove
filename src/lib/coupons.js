import { adminDb } from "@/lib/firebaseAdmin";
import { formatMoney, toMinorUnit } from "@/lib/paymentConfig";

export function normalizeCouponCode(code) {
    return String(code || "").trim().toUpperCase();
}

function createCouponError(message) {
    const error = new Error(message);
    error.status = 400;
    return error;
}

function getDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

function hasUserUsedCoupon(usedBy, uid) {
    if (!Array.isArray(usedBy)) return false;

    return usedBy.some((entry) => {
        if (entry === uid) return true;
        if (entry?.id === uid) return true;
        if (entry?.path?.endsWith(`/users/${uid}`)) return true;
        return false;
    });
}

async function findCouponByCode(code) {
    const directRef = adminDb.collection("coupons").doc(code);
    const directSnap = await directRef.get();

    if (directSnap.exists) {
        return { ref: directRef, snap: directSnap };
    }

    const querySnap = await adminDb
        .collection("coupons")
        .where("code", "==", code)
        .limit(1)
        .get();

    if (querySnap.empty) return null;

    const snap = querySnap.docs[0];
    return { ref: snap.ref, snap };
}

export async function validateCouponForAmount({ code, uid, baseAmount }) {
    const normalizedCode = normalizeCouponCode(code);

    if (!normalizedCode) {
        return {
            code: null,
            couponRefPath: null,
            discountAmount: 0,
            finalAmount: Number(formatMoney(baseAmount))
        };
    }

    const coupon = await findCouponByCode(normalizedCode);

    if (!coupon) {
        throw createCouponError("Indirim kodu bulunamadi.");
    }

    const data = coupon.snap.data();

    if (data.isActive === false) {
        throw createCouponError("Indirim kodu aktif degil.");
    }

    const expirationDate = getDate(data.expirationDate || data.expiryDate);

    if (expirationDate && expirationDate.getTime() < Date.now()) {
        throw createCouponError("Indirim kodunun suresi dolmus.");
    }

    const usageLimit = Number(data.usageLimit || 0);
    const usedCount = Number(data.usedCount || data.usageCount || 0);

    if (usageLimit > 0 && usedCount >= usageLimit) {
        throw createCouponError("Indirim kodunun kullanim limiti dolmus.");
    }

    if (uid && hasUserUsedCoupon(data.usedBy, uid)) {
        throw createCouponError("Bu indirim kodunu daha once kullandiniz.");
    }

    const baseMinor = toMinorUnit(baseAmount);
    const amount = Number(data.amount || 0);
    const type = data.discountType || "fixed";
    const discountMinor = type === "percentage"
        ? Math.round(baseMinor * Math.max(0, amount) / 100)
        : toMinorUnit(Math.max(0, amount));

    const finalDiscountMinor = Math.min(discountMinor, baseMinor);
    const finalAmountMinor = Math.max(baseMinor - finalDiscountMinor, 0);

    return {
        code: data.code || normalizedCode,
        couponRefPath: coupon.ref.path,
        discountAmount: Number(formatMoney(finalDiscountMinor / 100)),
        finalAmount: Number(formatMoney(finalAmountMinor / 100)),
        discountType: type,
        amount
    };
}
