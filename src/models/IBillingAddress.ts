/**
 * Billing details pre-filled on the Worldpay Hosted Payment Page.
 */
export interface IBillingAddress {
    firstName?: string;
    lastName?: string;
    address1?: string;
    address2?: string;
    address3?: string;
    city?: string;
    postCode?: string;
    countryCode?: string;
    phoneNo?: string;
}
