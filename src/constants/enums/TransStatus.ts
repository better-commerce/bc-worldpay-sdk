/**
 * Enum {@link TransStatus} contains the `transStatus` values sent in a Business Gateway
 * Payment Response (`MC_callback`) message.
 *
 * @readonly
 * @enum {string}
 */
export enum TransStatus {
    SUCCESS = "Y",
    CANCELLED = "C",
}
