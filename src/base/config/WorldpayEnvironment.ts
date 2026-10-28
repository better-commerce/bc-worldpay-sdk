import { Endpoints } from "../../constants/Endpoints";

/**
 * {WorldpayEnvironment} class is used to setup the environment.
 * This class provides options to select the environment.
 */
export default class WorldpayEnvironment {

    /**
     * Field to store the installation id (`instId`).
     * @property {string}
     */
    static installationId: string;

    /**
     * Field to store the merchant code (`accId1`).
     * @property {string}
     */
    static merchantCode: string;

    /**
     * Field to store the MD5 secret used to sign the purchase request.
     * @property {string}
     */
    static md5Secret: string;

    /**
     * Field to store the response secret: the MAC secret (`mac2`/`mac`) or Payment Response password (`callbackPW`).
     * @property {string}
     */
    static responseSecret: string;

    static environment: string;
    static extras: any;

    /**
     * Field to store the Hosted Payment Page url.
     * @property {string}
     */
    static baseUrl: string;

    /**
     * Initializes the WorldpayEnvironment.
     * @param installationId {string} The installation id (`instId`).
     * @param merchantCode {string} The merchant code (`accId1`).
     * @param md5Secret {string} The MD5 secret for the purchase signature (`secret:currency:amount:testMode:instId`). No signature is sent when empty.
     * @param responseSecret {string} The MAC secret or Payment Response password used to authenticate responses.
     * @param useSandBox {boolean} Whether to use the sandbox (test) environment or not. Defaults to true.
     * @param extras {any} Optional `paymentPageUrl` (overrides the default endpoint), `returnUrl`, `cancelUrl` and
     *                     `requireVerifiedResponse` (report unverified responses as refused).
     * @returns {WorldpayEnvironment} The WorldpayEnvironment instance.
     */
    static init(installationId: string, merchantCode: string, md5Secret: string, responseSecret: string, useSandBox = true, extras: any = {}) {
        WorldpayEnvironment.installationId = installationId;
        WorldpayEnvironment.merchantCode = merchantCode;
        WorldpayEnvironment.md5Secret = md5Secret;
        WorldpayEnvironment.responseSecret = responseSecret;
        WorldpayEnvironment.extras = extras || {};

        if (useSandBox) {
            WorldpayEnvironment.baseUrl = extras?.paymentPageUrl || Endpoints.Base.PaymentPage.SANDBOX_URL;
            WorldpayEnvironment.environment = "sandbox";
        } else {
            WorldpayEnvironment.baseUrl = extras?.paymentPageUrl || Endpoints.Base.PaymentPage.PRODUCTION_URL;
            WorldpayEnvironment.environment = "production";
        }
        return this;
    }

    /**
     * Get the installation id set in the WorldpayEnvironment.
     * @returns {string} The installation id.
     */
    static getInstallationId(): string {
        return WorldpayEnvironment.installationId;
    }

    /**
     * Get the merchant code set in the WorldpayEnvironment.
     * @returns {string} The merchant code.
     */
    static getMerchantCode(): string {
        return WorldpayEnvironment.merchantCode;
    }

    /**
     * Get the MD5 secret set in the WorldpayEnvironment.
     * @returns {string} The MD5 secret.
     */
    static getMd5Secret(): string {
        return WorldpayEnvironment.md5Secret;
    }

    /**
     * Get the response secret set in the WorldpayEnvironment.
     * @returns {string} The response secret.
     */
    static getResponseSecret(): string {
        return WorldpayEnvironment.responseSecret;
    }

    /**
     * Get any additional configuration options that were passed in the constructor.
     * @returns {Object} The additional configuration options.
     */
    static getExtras(): any {
        return WorldpayEnvironment.extras;
    }

    /**
     * Get the current environment being used in the WorldpayEnvironment.
     * @returns {string} The current environment, either "sandbox" or "production".
     */
    static getEnvironment(): string {
        return WorldpayEnvironment.environment;
    }

    /**
     * Get the URL of the Hosted Payment Page.
     * @returns {string} The URL of the Hosted Payment Page.
     */
    static getBaseUrl(): string {
        return WorldpayEnvironment.baseUrl;
    }
}
