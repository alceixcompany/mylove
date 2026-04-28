import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";

const LIVE_IYZICO_URL = "https://api.iyzipay.com";

function getSettingsRef() {
    return adminDb.collection("settings").doc("payment");
}

function parseMoney(value, fallback) {
    const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function normalizeSettings(data = {}, includeSecrets = false) {
    const iyzico = data.iyzico || {};
    const packageSettings = data.package || {};

    const settings = {
        iyzico: {
            active: iyzico.active !== false,
            apiKey: iyzico.apiKey || "",
            baseUrl: LIVE_IYZICO_URL,
            secretKeyConfigured: Boolean(iyzico.secretKey)
        },
        package: {
            packageKey: packageSettings.packageKey || "single_page_live",
            packageName: packageSettings.packageName || "Sonsuz Ask Sayfa Yayini",
            amount: parseMoney(packageSettings.amount, 499),
            currency: packageSettings.currency || "TRY"
        },
        appUrl: data.appUrl || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || ""
    };

    if (includeSecrets) {
        settings.iyzico.secretKey = iyzico.secretKey || "";
    }

    return settings;
}

export async function getPaymentSettings(options = {}) {
    const snap = await getSettingsRef().get();
    return normalizeSettings(snap.exists ? snap.data() : {}, options.includeSecrets);
}

export async function getPaymentConfig() {
    const settings = await getPaymentSettings();

    return {
        packageKey: settings.package.packageKey,
        packageName: settings.package.packageName,
        amount: settings.package.amount,
        currency: settings.package.currency,
        appUrl: settings.appUrl
    };
}

export async function savePaymentSettings(input) {
    const current = await getPaymentSettings({ includeSecrets: true });
    const secretKey = input.iyzico?.secretKey?.trim() || current.iyzico.secretKey || "";
    const payload = {
        iyzico: {
            active: input.iyzico?.active !== false,
            apiKey: input.iyzico?.apiKey?.trim() || "",
            secretKey,
            baseUrl: LIVE_IYZICO_URL
        },
        package: {
            packageKey: input.package?.packageKey?.trim() || "single_page_live",
            packageName: input.package?.packageName?.trim() || "Sonsuz Ask Sayfa Yayini",
            amount: parseMoney(input.package?.amount, 499),
            currency: (input.package?.currency || "TRY").trim().toUpperCase()
        },
        appUrl: input.appUrl?.trim() || "",
        updatedAt: FieldValue.serverTimestamp()
    };

    await getSettingsRef().set(payload, { merge: true });
    return normalizeSettings(payload);
}
