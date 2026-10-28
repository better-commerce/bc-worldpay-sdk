import { IBillingAddress } from "./IBillingAddress";

/**
 * Input for {@link Transaction.request}.
 */
export interface IPaymentRequest {
    /** Merchant order reference; sent to Worldpay as `cartId`. */
    cartId: string | number;
    /** Amount to charge, in major units (e.g. 12.50). */
    amount: number;
    /** ISO 4217 currency code, e.g. GBP. */
    currency: string;
    description?: string;
    email?: string;
    billingAddress?: IBillingAddress;
    /** Optional Worldpay `paymentType` (e.g. VISA, MSCD) to pre-select a card scheme. */
    paymentType?: string;
    /** Absolute URL Worldpay returns the shopper to (`successURL`). Defaults to `extras.returnUrl`. */
    successUrl?: string;
    /** Absolute URL for the Payment Response (`MC_callback`). Defaults to the success URL. */
    callbackUrl?: string;
    /** Absolute URL for the "cancel" link on the payment page (`returnURL`). Defaults to `extras.cancelUrl`. */
    cancelUrl?: string;
}
