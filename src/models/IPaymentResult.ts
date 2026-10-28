import { TransactionOutcome } from "../constants/enums";

/**
 * How a Worldpay response was authenticated.
 * - `mac2`/`mac`: the HMAC-SHA256 / MD5 MAC on the HTML redirect result URL matched.
 * - `callbackPW`: the Payment Response password matched.
 * - `none`: no response secret is configured, so the response could not be authenticated.
 */
export type VerificationMethod = "mac2" | "mac" | "callbackPW" | "none";

/**
 * Normalised result of {@link Transaction.getDetails} (a Worldpay return / Payment Response).
 */
export interface IPaymentResult {
    outcome: TransactionOutcome;
    /** Raw Worldpay status (`paymentStatus` or `transStatus`). */
    gatewayStatus: string;
    /** `cartId`, when Worldpay sends it back. */
    cartId: string;
    /** Amount reported by Worldpay, in major units (0 when absent). */
    amount: number;
    currency: string;
    /** HTML redirect `orderKey`. */
    orderKey: string;
    /** Business Gateway `transId`. */
    transId: string;
    authCode: string;
    cardType: string;
    /** True when the response was authenticated with the configured response secret. */
    isVerified: boolean;
    verificationMethod: VerificationMethod;
    message: string;
}
