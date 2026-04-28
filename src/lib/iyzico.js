import { getPaymentSettings } from "@/lib/paymentSettings";
import CheckoutFormInitialize from "iyzipay/lib/resources/CheckoutFormInitialize";
import CheckoutForm from "iyzipay/lib/resources/CheckoutForm";

const Iyzipay = {
    LOCALE: {
        TR: "tr",
        EN: "en"
    },
    PAYMENT_GROUP: {
        PRODUCT: "PRODUCT",
        LISTING: "LISTING",
        SUBSCRIPTION: "SUBSCRIPTION"
    },
    BASKET_ITEM_TYPE: {
        PHYSICAL: "PHYSICAL",
        VIRTUAL: "VIRTUAL"
    },
    PAYMENT_CHANNEL: {
        MOBILE: "MOBILE",
        WEB: "WEB",
        MOBILE_WEB: "MOBILE_WEB",
        MOBILE_IOS: "MOBILE_IOS",
        MOBILE_ANDROID: "MOBILE_ANDROID",
        MOBILE_WINDOWS: "MOBILE_WINDOWS",
        MOBILE_TABLET: "MOBILE_TABLET",
        MOBILE_PHONE: "MOBILE_PHONE"
    },
    CURRENCY: {
        TRY: "TRY",
        EUR: "EUR",
        USD: "USD",
        IRR: "IRR",
        GBP: "GBP",
        NOK: "NOK",
        RUB: "RUB",
        CHF: "CHF"
    }
};

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
        const config = { apiKey, secretKey, uri };
        cachedClient = {
            checkoutFormInitialize: new CheckoutFormInitialize(config),
            checkoutForm: new CheckoutForm(config)
        };
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
