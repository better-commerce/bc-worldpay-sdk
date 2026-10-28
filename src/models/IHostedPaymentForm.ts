/**
 * An auto-submitting form the browser must POST to the Worldpay Hosted Payment Page.
 */
export interface IHostedPaymentForm {
    action: string;
    method: "POST";
    fields: Record<string, string>;
}
