var express = require("express");
var router = express.Router();

const buySubscriptionController = require("../controller/buySubscriptionController");
const { authorization } = require("../common/authentication");

router.post(
  "/buy-subscription",
  authorization,
  buySubscriptionController.buySubscription
);
router.get(
  "/verify-subscription/:id",
  authorization,
  buySubscriptionController.verifySubscription
);
router.get(
  "/get-invoice/:invoiceId",
  authorization,
  buySubscriptionController.getInvoiceById
);
router.post(
  "/create-payment-intent",
  authorization,
  buySubscriptionController.createPaymentIntent
);
router.delete(
  "/cancel-subscription",
  authorization,
  buySubscriptionController.cancelSubscription
);
// router.post('/webhook',buySubscriptionController.handleWebhook)
module.exports = router;
