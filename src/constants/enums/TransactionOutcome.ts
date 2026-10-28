/**
 * Enum {@link TransactionOutcome} is the normalised outcome of a Worldpay return / Payment Response.
 *
 * @readonly
 * @enum {string}
 */
export enum TransactionOutcome {
    /** Authorised, captured or settled. */
    AUTHORISED = "authorised",
    /** Sent for authorisation, final status not known yet. */
    PENDING = "pending",
    /** Cancelled by the shopper. */
    CANCELLED = "cancelled",
    /** Refused, errored, or the response failed verification. */
    REFUSED = "refused",
}
