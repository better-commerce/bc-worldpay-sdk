import { IBillingAddress } from "./IBillingAddress";

/**
 * Input for {@link Transaction.request}. Values come from the BetterCommerce order created by
 * `POST /commerce/checkout/{basketId}/convert`.
 */
export interface IPaymentRequest {
    /** BetterCommerce order id (GUID). */
    orderId: string;
    /** BetterCommerce order number; sent to Worldpay as `cartId`. */
    orderNo: string | number;
    /** Id of the pending BetterCommerce payment record (`order.payment.id`). */
    paymentId: string | number;
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
    returnUrl?: string;
    /** Absolute URL for the Payment Response (`MC_callback`). Defaults to the return URL. */
    callbackUrl?: string;
    /** Absolute URL for the "cancel" link on the payment page (`returnURL`). Defaults to `extras.cancelUrl` + orderId. */
    cancelUrl?: string;
}
