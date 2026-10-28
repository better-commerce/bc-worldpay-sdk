import { IPaymentRequest } from "../../models";

export interface ITransaction {

    /**
     * Builds the Hosted Payment Page form for a payment.
     * @param data {IPaymentRequest}
     */
    request(data: IPaymentRequest): any;

    /**
     * Parses and authenticates a Worldpay return / Payment Response.
     * @param data {Object} Query string and form fields of the request.
     */
    getDetails(data: Record<string, string>): any;
}
