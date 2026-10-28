# BetterCommerce Worldpay NodeJS SDK

BetterCommerce's Worldpay NodeJS SDK enables BC client applications to integrate with the [Worldpay Hosted Payment Page (HTML redirect)](https://developerengine.fisglobal.com/apis/bg-total/html-redirect). It builds the purchase form posted to `/wcc/purchase` and parses / authenticates the shopper return and Payment Response.

Use below command for package installation:

```
npm install bc-worldpay-sdk
```

## Architecture Diagram

![Architecture Diagram](/assets/app-architecture.png)

## SDK Initialization

**Use following snippet to initialize the SDK:**

```
WorldpayEnvironment.init("<installation_id>", "<merchant_code>", "<md5_secret>", "<response_secret>", [useSandbox: boolean], [extras]);
```

| Parameter         | Description                                                                                                    |
| ----------------- | -------------------------------------------------------------------------------------------------------------- |
| `installation_id` | Worldpay installation id (`instId`).                                                                           |
| `merchant_code`   | Worldpay merchant code (`accId1`).                                                                             |
| `md5_secret`      | MD5 secret for the purchase `signature` (`secret:currency:amount:testMode:instId`). No signature when empty. |
| `response_secret` | MAC secret (`mac2`/`mac`) or Payment Response password (`callbackPW`). Responses are unverified when empty.   |
| `useSandbox`      | `true` posts to `secure-test.worldpay.com` with `testMode=100`. Defaults to `true`.                            |

Extras (all optional):

| Key                       | Description                                                            |
| ------------------------- | ---------------------------------------------------------------------- |
| `paymentPageUrl`          | Overrides the default sandbox / production purchase URL.              |
| `returnUrl`               | Default `successURL` when the request has none.                        |
| `cancelUrl`               | Default `returnURL` (cancel link) when the request has none.           |
| `requireVerifiedResponse` | `true` reports responses that cannot be verified as `refused`.        |

## Usage Example

### Request Payment

Builds the form the browser must POST (auto-submit) to Worldpay for a BetterCommerce order payment. The order number is sent as `cartId`, and the return / callback URLs are tagged with `bcOrderId` and `bcPaymentRef=<orderNo>-<paymentId>`.

```
const form = await new Transaction().request({
    orderId: "<order guid>",
    orderNo: 1001,
    paymentId: "<pending payment id>",
    amount: 12.30,
    currency: "GBP",
    description: "Order 1001",
    email: "jo@example.com",
    billingAddress: { firstName: "Jo", lastName: "Bloggs", address1: "1 High St", city: "Leeds", postCode: "LS1 1AA", countryCode: "GB" },
    returnUrl: "https://www.example.com/payment/worldpay/return",
    callbackUrl: "https://www.example.com/payment/worldpay/notify",
    cancelUrl: "https://www.example.com/checkout",
});
// => { action: "https://secure.worldpay.com/wcc/purchase", method: "POST", fields: { instId, cartId, amount, currency, testMode, signature, successURL, MC_callback, ... } }
```

### Get Payment Details

Parses the query / form fields of the shopper return or Payment Response, including the legacy return URL (`transId` = order id, `orderId` = `orderNo-paymentId`).

```
const result = await new Transaction().getDetails(params);
// => { outcome: "authorised" | "pending" | "cancelled" | "refused", gatewayStatus, orderId, orderNo, paymentId,
//      amount, currency, gatewayReference, authCode, cardType, isVerified, verificationMethod, message }
```

A response that fails verification against a configured response secret is `refused`. Always check `amount` and `currency` against your order before recording the payment.

## Tests

```
npm test
```
