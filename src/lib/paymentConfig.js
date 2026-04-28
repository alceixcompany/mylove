export function formatMoney(amount) {
    return (Math.round(Number(amount) * 100) / 100).toFixed(2);
}

export function toMinorUnit(amount) {
    return Math.round(Number(amount) * 100);
}

function normalizeConfiguredAppUrl(configuredUrl) {
    const value = String(configuredUrl || "").trim();
    if (!value) return "";

    try {
        const normalized = /^[a-z][a-z0-9+\-.]*:\/\//i.test(value) ? value : `https://${value}`;
        const url = new URL(normalized);
        return url.origin;
    } catch {
        return value.replace(/\/$/, "");
    }
}

export function getAppUrl(request, configuredAppUrl) {
    const configuredUrl = configuredAppUrl || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL;

    if (configuredUrl) {
        return normalizeConfiguredAppUrl(configuredUrl);
    }

    const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
    const proto = request.headers.get("x-forwarded-proto") || "http";

    return `${proto}://${host}`;
}

export function getClientIp(request) {
    const forwardedFor = request.headers.get("x-forwarded-for");

    if (forwardedFor) {
        return forwardedFor.split(",")[0].trim();
    }

    return request.headers.get("x-real-ip") || "127.0.0.1";
}
