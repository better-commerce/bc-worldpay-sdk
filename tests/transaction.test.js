const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createHash, createHmac } = require("node:crypto");
const { WorldpayEnvironment, Transaction, TransactionOutcome } = require("../dist");

const md5 = (v) => createHash("md5").update(v).digest("hex");
const request = {
    cartId: "1001",
    amount: 12.3,
    currency: "GBP",
    description: "Order 1001",
    email: "jo@example.com",
    billingAddress: { firstName: "Jo", lastName: "Bloggs", city: "Leeds", postCode: "LS1 1AA", countryCode: "GB" },
    successUrl: "https://shop.test/return?ref=1",
    callbackUrl: "https://shop.test/notify?ref=1",
    cancelUrl: "https://shop.test/basket",
};
const authorised = { orderKey: "ADMIN^MERCHANT^1001", paymentStatus: "AUTHORISED", paymentAmount: "1230", paymentCurrency: "GBP" };

test("builds a live form with the legacy-compatible MD5 signature", async () => {
    WorldpayEnvironment.init("1234567", "MERCHANT", "test1234", "", false);
    const form = await new Transaction().request(request);
    assert.equal(form.action, "https://secure.worldpay.com/wcc/purchase");
    assert.equal(form.method, "POST");
    assert.deepEqual(
        { instId: form.fields.instId, accId1: form.fields.accId1, cartId: form.fields.cartId, amount: form.fields.amount, testMode: form.fields.testMode, name: form.fields.name, returnURL: form.fields.returnURL },
        { instId: "1234567", accId1: "MERCHANT", cartId: "1001", amount: "12.30", testMode: "0", name: "Jo Bloggs", returnURL: "https://shop.test/basket" },
    );
    assert.equal(form.fields.signature, md5("test1234:GBP:12.30:0:1234567"));
    assert.equal(form.fields.successURL, request.successUrl);
    assert.equal(form.fields.MC_callback, request.callbackUrl);
});

test("uses the sandbox endpoint and testMode=100, and honours a configured page url", async () => {
    WorldpayEnvironment.init("1234567", "MERCHANT", "s", "", true);
    let form = await new Transaction().request(request);
    assert.equal(form.action, "https://secure-test.worldpay.com/wcc/purchase");
    assert.equal(form.fields.testMode, "100");
    WorldpayEnvironment.init("1234567", "MERCHANT", "s", "", false, { paymentPageUrl: "https://example.worldpay.test/wcc/purchase" });
    form = await new Transaction().request(request);
    assert.equal(form.action, "https://example.worldpay.test/wcc/purchase");
});

test("omits the signature without an MD5 secret and validates the request", async () => {
    WorldpayEnvironment.init("1234567", "MERCHANT", "", "", false);
    const form = await new Transaction().request(request);
    assert.equal(form.fields.signature, undefined);
    assert.equal((await new Transaction().request({ ...request, amount: 0 })).hasError, true);
    assert.equal((await new Transaction().request({ ...request, successUrl: "/relative" })).hasError, true);
    WorldpayEnvironment.init("", "MERCHANT", "", "", false);
    assert.match((await new Transaction().request(request)).error, /installation id/);
});

test("parses an unverified authorised redirect when no response secret is set", async () => {
    WorldpayEnvironment.init("1234567", "MERCHANT", "", "", false);
    const r = await new Transaction().getDetails(authorised);
    assert.equal(r.outcome, TransactionOutcome.AUTHORISED);
    assert.equal(r.amount, 12.3);
    assert.equal(r.currency, "GBP");
    assert.equal(r.isVerified, false);
    WorldpayEnvironment.init("1234567", "MERCHANT", "", "", false, { requireVerifiedResponse: true });
    assert.equal((await new Transaction().getDetails(authorised)).outcome, TransactionOutcome.REFUSED);
});

test("verifies mac2, mac and callbackPW and refuses forged responses", async () => {
    WorldpayEnvironment.init("1234567", "MERCHANT", "", "macsecret", false);
    const mac2 = createHmac("sha256", "macsecret").update("ADMIN^MERCHANT^1001:1230:GBP:AUTHORISED").digest("hex");
    const mac = md5("ADMIN^MERCHANT^10011230GBPAUTHORISEDmacsecret");
    const t = new Transaction();
    assert.deepEqual(await t.getDetails({ ...authorised, mac2 }).then((r) => [r.outcome, r.verificationMethod]), [TransactionOutcome.AUTHORISED, "mac2"]);
    assert.deepEqual(await t.getDetails({ ...authorised, mac }).then((r) => [r.outcome, r.verificationMethod]), [TransactionOutcome.AUTHORISED, "mac"]);
    assert.deepEqual(await t.getDetails({ transStatus: "Y", authAmount: "12.30", callbackPW: "macsecret" }).then((r) => [r.outcome, r.verificationMethod]), [TransactionOutcome.AUTHORISED, "callbackPW"]);
    assert.equal((await t.getDetails({ ...authorised, mac2: "forged" })).outcome, TransactionOutcome.REFUSED);
    assert.equal((await t.getDetails({ ...authorised, paymentAmount: "1", mac2 })).outcome, TransactionOutcome.REFUSED);
    assert.equal((await t.getDetails(authorised)).outcome, TransactionOutcome.REFUSED);
});

test("maps Worldpay statuses", async () => {
    WorldpayEnvironment.init("1234567", "MERCHANT", "", "", false);
    const t = new Transaction();
    const outcome = async (p) => (await t.getDetails(p)).outcome;
    assert.equal(await outcome({ paymentStatus: "SENT_FOR_AUTHORISATION" }), TransactionOutcome.PENDING);
    assert.equal(await outcome({ paymentStatus: "SHOPPER_CANCELLED" }), TransactionOutcome.CANCELLED);
    assert.equal(await outcome({ paymentStatus: "REFUSED" }), TransactionOutcome.REFUSED);
    assert.equal(await outcome({ transStatus: "C" }), TransactionOutcome.CANCELLED);
    assert.equal(await outcome({}), TransactionOutcome.REFUSED);
});
