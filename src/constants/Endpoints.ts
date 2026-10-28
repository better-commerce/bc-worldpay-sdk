export module Endpoints {

    /**
     * Worldpay Hosted Payment Page (HTML redirect) purchase endpoints.
     */
    export module Base {
        export module PaymentPage {
            export const SANDBOX_URL = "https://secure-test.worldpay.com/wcc/purchase";
            export const PRODUCTION_URL = "https://secure.worldpay.com/wcc/purchase";
        }
    }
}
