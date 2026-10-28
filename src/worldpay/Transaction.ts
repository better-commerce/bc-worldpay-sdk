// Other Imports
import { Defaults } from "../constants";
import { AuthMode, PaymentStatus, TestMode, TransactionOutcome, TransStatus } from "../constants/enums";
import { ITransaction } from "../base/contracts/ITransaction";
import WorldpayEnvironment from "../base/config/WorldpayEnvironment";
import { IHostedPaymentForm, IPaymentRequest, IPaymentResult, VerificationMethod } from "../models";
import { hmacSha256, isAbsoluteUrl, md5, safeEqual, stringToBoolean } from "../utils/app-util";

/** Query params added to the return URLs so the response can be matched to the BetterCommerce order. */
const RETURN_PARAM_ORDER_ID = "bcOrderId";
const RETURN_PARAM_PAYMENT_REF = "bcPaymentRef";

const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Worldpay Hosted Payment Page (HTML redirect, `/wcc/purchase`).
 *
 * There is no server-to-server API call: the browser POSTs the form built by {@link request} to
 * Worldpay, the shopper pays on the Worldpay page and is returned to the success URL (and/or a
 * Payment Response is posted to the callback URL), which {@link getDetails} parses.
 *
 * API Reference - https://developerengine.fisglobal.com/apis/bg-total/html-redirect
 */
export default class Transaction implements ITransaction {

    /**
     * Builds the Hosted Payment Page form for a payment.
     *
     * @param {IPaymentRequest} data The payment request.
     * @returns {Promise<IHostedPaymentForm | any>} The form to POST from the browser, or an object with error details.
     */
    async request(data: IPaymentRequest): Promise<IHostedPaymentForm | any> {
        try {
            const extras = WorldpayEnvironment.getExtras() || {};
            const installationId = WorldpayEnvironment.getInstallationId();
            const action = WorldpayEnvironment.getBaseUrl();
            const amount = Number(data?.amount);
            if (!installationId) {
                throw new Error("Worldpay installation id is not configured.");
            }
            if (!isAbsoluteUrl(action)) {
                throw new Error("Worldpay payment page url is not configured.");
            }
            if (!data?.orderId || !data?.orderNo || !data?.paymentId || !data?.currency || !Number.isFinite(amount) || amount <= 0) {
                throw new Error("orderId, orderNo, paymentId, currency and a positive amount are required.");
            }
            const successUrl = tagReturnUrl(data, data.returnUrl || extras.returnUrl);
            const callbackUrl = data.callbackUrl ? tagReturnUrl(data, data.callbackUrl) : successUrl;
            // Legacy behaviour: the configured cancel url is suffixed with the order id.
            const cancelUrl = data.cancelUrl || (isAbsoluteUrl(extras.cancelUrl) ? `${extras.cancelUrl}${data.orderId}` : Defaults.String.Value);

            const formattedAmount = amount.toFixed(2);
            const testMode = String(WorldpayEnvironment.getEnvironment() === "sandbox" ? TestMode.TEST : TestMode.LIVE);
            const billing = data.billingAddress || {};

            const fields: Record<string, string> = {
                instId: installationId,
                cartId: String(data.orderNo),
                amount: formattedAmount,
                currency: data.currency,
                testMode,
                desc: data.description || Defaults.String.Value,
                authMode: AuthMode.FULL_AUTH,
                accId1: WorldpayEnvironment.getMerchantCode() || Defaults.String.Value,
                name: [billing.firstName, billing.lastName].filter(Boolean).join(" "),
                email: data.email || Defaults.String.Value,
                address1: billing.address1 || Defaults.String.Value,
                address2: billing.address2 || Defaults.String.Value,
                address3: billing.address3 || Defaults.String.Value,
                town: billing.city || Defaults.String.Value,
                postcode: billing.postCode || Defaults.String.Value,
                country: billing.countryCode || Defaults.String.Value,
                tel: billing.phoneNo || Defaults.String.Value,
                successURL: successUrl,
                MC_callback: callbackUrl,
            };
            const md5Secret = WorldpayEnvironment.getMd5Secret();
            if (md5Secret) {
                fields.signature = md5(`${md5Secret}:${data.currency}:${formattedAmount}:${testMode}:${installationId}`);
            }
            if (data.paymentType) {
                fields.paymentType = data.paymentType;
            }
            if (isAbsoluteUrl(cancelUrl)) {
                fields.returnURL = cancelUrl;
            }

            return { action, method: "POST", fields } as IHostedPaymentForm;
        }
        catch (error: any) {
            return { hasError: true, error: error?.message };
        }
    }

    /**
     * Parses and authenticates a Worldpay return / Payment Response.
     *
     * Supports the HTML redirect result URL (`orderKey`, `paymentStatus`, `paymentAmount`,
     * `paymentCurrency`, `mac2`/`mac`) and the Business Gateway Payment Response (`transStatus`,
     * `transId`, `authAmount`, `callbackPW`).
     *
     * When a response secret is configured, a response that fails verification is REFUSED. When none
     * is configured the result has `isVerified: false`; it is then REFUSED only if
     * `extras.requireVerifiedResponse` is set. Callers must still check the amount and currency
     * against their order before recording the payment.
     *
     * @param {Object} data Query string and form fields of the request Worldpay made or redirected to.
     * @returns {Promise<IPaymentResult | any>} The parsed result, or an object with error details.
     */
    async getDetails(data: Record<string, string>): Promise<IPaymentResult | any> {
        try {
            const params = data || {};
            const responseSecret = WorldpayEnvironment.getResponseSecret() || Defaults.String.Value;
            const requireVerifiedResponse = stringToBoolean(WorldpayEnvironment.getExtras()?.requireVerifiedResponse);

            const paymentStatus = params.paymentStatus?.toUpperCase() || Defaults.String.Value;
            const transStatus = params.transStatus?.toUpperCase() || Defaults.String.Value;
            let outcome = paymentStatus ? mapPaymentStatus(paymentStatus) : mapTransStatus(transStatus);
            let message = Defaults.String.Value;

            const verificationMethod = verify(params, responseSecret);
            const isVerified = verificationMethod !== "none";
            if (responseSecret && !isVerified) {
                outcome = TransactionOutcome.REFUSED;
                message = "Worldpay response verification failed.";
            } else if (!isVerified && requireVerifiedResponse) {
                outcome = TransactionOutcome.REFUSED;
                message = "Worldpay response is not signed and verified responses are required.";
            }

            // Legacy return URLs used `transId` (order GUID) and `orderId` (`orderNo-paymentId`).
            const legacyOrderId = GUID_REGEX.test(params.transId || Defaults.String.Value) ? params.transId : Defaults.String.Value;
            const paymentRef = params[RETURN_PARAM_PAYMENT_REF] || (/^\d+-.+$/.test(params.orderId || Defaults.String.Value) ? params.orderId : Defaults.String.Value);
            const [refOrderNo, ...refPaymentId] = (paymentRef || Defaults.String.Value).split("-");

            const amount = params.paymentAmount
                ? Number(params.paymentAmount) / 100
                : Number(params.authAmount || params.amount || Defaults.Int.Value);

            const result: IPaymentResult = {
                outcome,
                gatewayStatus: paymentStatus || transStatus,
                orderId: params[RETURN_PARAM_ORDER_ID] || legacyOrderId,
                orderNo: refOrderNo || params.cartId || Defaults.String.Value,
                paymentId: refPaymentId.join("-"),
                amount: Number.isFinite(amount) ? amount : Defaults.Int.Value,
                currency: params.paymentCurrency || params.authCurrency || params.currency || Defaults.String.Value,
                gatewayReference: params.orderKey || (legacyOrderId ? Defaults.String.Value : params.transId) || Defaults.String.Value,
                authCode: params.rawAuthCode || params.authCode || Defaults.String.Value,
                cardType: params.cardType || Defaults.String.Value,
                isVerified,
                verificationMethod,
                message,
            };
            return result;
        }
        catch (error: any) {
            return { hasError: true, error: error?.message };
        }
    }
}

/**
 * Adds the BetterCommerce order id and `orderNo-paymentId` reference to a return URL.
 */
const tagReturnUrl = (data: IPaymentRequest, url?: string): string => {
    if (!isAbsoluteUrl(url || Defaults.String.Value)) {
        throw new Error("An absolute Worldpay return url is required (returnUrl or extras.returnUrl).");
    }
    const result = new URL(url!);
    result.searchParams.set(RETURN_PARAM_ORDER_ID, data.orderId);
    result.searchParams.set(RETURN_PARAM_PAYMENT_REF, `${data.orderNo}-${data.paymentId}`);
    return result.toString();
}

/**
 * Maps a Hosted Payment Page `paymentStatus` to a {@link TransactionOutcome}.
 */
const mapPaymentStatus = (paymentStatus: string): TransactionOutcome => {
    switch (paymentStatus) {
        case PaymentStatus.AUTHORISED:
        case PaymentStatus.CAPTURED:
        case PaymentStatus.SETTLED:
            return TransactionOutcome.AUTHORISED;
        case PaymentStatus.SENT_FOR_AUTHORISATION:
            return TransactionOutcome.PENDING;
        case PaymentStatus.CANCELLED:
        case PaymentStatus.SHOPPER_CANCELLED:
            return TransactionOutcome.CANCELLED;
        default:
            return TransactionOutcome.REFUSED;
    }
}

/**
 * Maps a Payment Response `transStatus` to a {@link TransactionOutcome}.
 */
const mapTransStatus = (transStatus: string): TransactionOutcome => {
    if (transStatus === TransStatus.SUCCESS) {
        return TransactionOutcome.AUTHORISED;
    } else if (transStatus === TransStatus.CANCELLED) {
        return TransactionOutcome.CANCELLED;
    }
    return TransactionOutcome.REFUSED;
}

/**
 * Authenticates a Worldpay response with the response secret.
 *
 * - `mac2`: HMAC-SHA256(secret, `orderKey:paymentAmount:paymentCurrency:paymentStatus`), hex.
 * - `mac`: MD5(`orderKey` + `paymentAmount` + `paymentCurrency` + `paymentStatus` + secret), hex.
 * - `callbackPW`: equals the secret.
 *
 * @returns The method that authenticated the response, or `none`.
 */
const verify = (params: Record<string, string>, secret: string): VerificationMethod => {
    if (!secret) {
        return "none";
    }
    const macFields = [params.orderKey, params.paymentAmount, params.paymentCurrency, params.paymentStatus].filter((x) => x !== undefined);
    if (params.mac2 && safeEqual(params.mac2.toLowerCase(), hmacSha256(secret, macFields.join(":")))) {
        return "mac2";
    }
    if (params.mac && safeEqual(params.mac.toLowerCase(), md5(`${macFields.join("")}${secret}`))) {
        return "mac";
    }
    if (params.callbackPW && safeEqual(params.callbackPW, secret)) {
        return "callbackPW";
    }
    return "none";
}
