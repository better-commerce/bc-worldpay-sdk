/**
 * Enum {@link PaymentStatus} contains the `paymentStatus` values Worldpay appends to the
 * success/failure/cancel URLs of a Hosted Payment Page (HTML redirect) order.
 *
 * @readonly
 * @enum {string}
 */
export enum PaymentStatus {
    AUTHORISED = "AUTHORISED",
    CAPTURED = "CAPTURED",
    SETTLED = "SETTLED",
    SENT_FOR_AUTHORISATION = "SENT_FOR_AUTHORISATION",
    REFUSED = "REFUSED",
    ERROR = "ERROR",
    CANCELLED = "CANCELLED",
    SHOPPER_CANCELLED = "SHOPPER_CANCELLED",
}
