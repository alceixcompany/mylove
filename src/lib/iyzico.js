import Iyzipay from "iyzipay";
import { getPaymentSettings } from "@/lib/paymentSettings";

let cachedClient = null;
let cachedSignature = "";

export { Iyzipay };

export async function getIyzipayClient() {
    const settings = await getPaymentSettings({ includeSecrets: true });
    const apiKey = settings.iyzico.apiKey;
    const secretKey = settings.iyzico.secretKey;
    const uri = settings.iyzico.baseUrl || "https://api.iyzipay.com";

    if (settings.iyzico.active === false) {
        throw new Error("Iyzico odemeleri admin panelinde pasif.");
    }

    if (!apiKey || !secretKey) {
        throw new Error("Iyzico API bilgileri eksik. Admin panelinden API key ve secret key kaydedin.");
    }

    const signature = `${apiKey}:${secretKey}:${uri}`;

    if (!cachedClient || cachedSignature !== signature) {
        cachedClient = new Iyzipay({ apiKey, secretKey, uri });
        cachedSignature = signature;
    }

    return cachedClient;
}

export async function initializeCheckoutForm(payload) {
    const client = await getIyzipayClient();

    return new Promise((resolve, reject) => {
        client.checkoutFormInitialize.create(payload, (error, result) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(result);
        });
    });
}

export async function retrieveCheckoutForm(token) {
    const client = await getIyzipayClient();

    return new Promise((resolve, reject) => {
        client.checkoutForm.retrieve({
            locale: Iyzipay.LOCALE.TR,
            token
        }, (error, result) => {
            if (error) {
                reject(error);
                return;
            }

            resolve(result);
        });
    });
}
