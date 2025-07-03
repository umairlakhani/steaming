const Joi = require("joi");
const {
  PrismaClient,
  Prisma,
  SubscriptionStatus,
  PaymentStatus,
} = require("@prisma/client");
const prisma = require('../prisma/client');
require("dotenv").config();
const createHttpError = require("http-errors");
const stripe = require("stripe")(process.env.STRIPE_SECRETKEY);
const getInvoiceById = async (req, res, next) => {
  try {
    const { invoiceId } = req.params;
    let invoice = await stripe.invoices.retrieve(invoiceId);
    if (invoice) {
      return res.status(200).send({ invoice });
    }
    return await next(createHttpError(402, "Invoice not found"));
  } catch (error) {
    return await next(createHttpError(400, "Error retreiving invoice"));
  }
};
const STRIPE_STATUS = {
  canceled: "canceled",
};

async function buySubscription(req, res, next) {}
async function handleWebhook(req, res, next) {
  const endpointSecret = process.env.WEBHOOK_ENDPOINT;
  const verifyEndpointSignature = await stripe.webhooks.constructEvent(
    req.body,
    req.headers["stripe-signature"],
    endpointSecret
  );
  // if (req.body.type == 'payment_intent.succeeded' && req.body.data.object['status'] == 'succeeded') {
  if (
    verifyEndpointSignature.type == "invoice.payment_succeeded" &&
    verifyEndpointSignature.data.object["charge"] != null
  ) {
    console.log("saveSubscription execute");
    await saveStripeSubscription(verifyEndpointSignature);
  }
  if (
    verifyEndpointSignature.type == "payment_intent.succeeded" &&
    verifyEndpointSignature.data.object["metadata"].purpose == "upgrade-plan" &&
    verifyEndpointSignature.data.object["metadata"].dbSubscriptionId
  ) {
    console.log("upgradeSubscription execute");
    await upgradeSubscription(verifyEndpointSignature);
  }
  if (
    verifyEndpointSignature.type == "payment_intent.payment_failed" ||
    verifyEndpointSignature.type == "invoice.payment_failed"
  ) {
    await subscriptionFailed(verifyEndpointSignature);
    console.log("payment intent failed");
  } else {
    // console.log(req.body, "check body")
  }
  return res.status(200).json({ received: true });
}

async function upgradeSubscription(eventBody) {
  console.log(eventBody, "eventBody in upgrade storage");
  let usageTableRecord = await prisma.usageTable.findFirst({
    where: {
      subscriptionId: Number(
        eventBody.data.object["metadata"].dbSubscriptionId
      ),
    },
  });
  let userBandwidthRecord = await prisma.userBandwidth.findFirst({
    where: {
      subscriptionId: Number(
        eventBody.data.object["metadata"].dbSubscriptionId
      ),
    },
  });
  if (!usageTableRecord) {
    return;
  }
  let userExist = await prisma.user.findFirst({
    where: {
      stripeCustomerId: eventBody.data.object.customer,
    },
  });
  let stripeSubscriptionId = await eventBody.data.object["metadata"]
    .stripeSubscriptionId;
  let list = await stripe.subscriptions.list({
    customer: userExist.stripeCustomerId,
  });
  console.log(list, "list");
  let subss = await stripe.subscriptions.retrieve(stripeSubscriptionId);
  console.log(subss, "check subss");
  if (subss.status != "canceled") {
    let del = await stripe.subscriptions.cancel(stripeSubscriptionId);
  }
  let nextMonthSubscriptionPlanId = await JSON.parse(
    eventBody.data.object["metadata"].nextMonthSubscriptionPlanId
  );
  let subscriptionActiveTime = await JSON.parse(
    eventBody.data.object["metadata"].subscriptionActiveTime
  );
  let createdAt = new Date(subscriptionActiveTime);
  let endTimeInSeconds;
  if (nextMonthSubscriptionPlanId["type"] == "monthly") {
    endTimeInSeconds = (
      createdAt.setMonth(createdAt.getMonth() + 1) / 1000
    ).toFixed(0);
  } else {
    endTimeInSeconds = (
      createdAt.setFullYear(createdAt.getFullYear() + 1) / 1000
    ).toFixed(0);
  }
  console.log(stripeSubscriptionId, "stripeSubscriptionId");
  console.log(nextMonthSubscriptionPlanId, "nextMonthSubscriptionPlanId");

  const subscription = await stripe.subscriptions.create({
    customer: userExist.stripeCustomerId,
    items: [{ price: nextMonthSubscriptionPlanId.stripePriceId }],
    trial_end: Number(endTimeInSeconds),
    metadata: {
      dbPlanId: nextMonthSubscriptionPlanId.stripePlanId,
      userId: userExist.id,
    },
  });

  console.log(subscription, "check stripe subscription created");
  let paymentObj = {
    invoiceId: "",
    amount: eventBody.data.object.amount / 100,
    subscriptionId: "",
    status: PaymentStatus.paid,
    stripePaymentStatus: eventBody.data.object.status,
    paymentIntentId: eventBody.data.object.id,
    stripeRecordCreatedAt: String(eventBody.data.object.created * 1000),
  };

  let dbSubscription = await prisma.subscriptions.findFirst({
    where: {
      stripeCustomerId: eventBody.data.object.customer,
      recur: true,
    },
  });
  if (dbSubscription) {
    console.log("dbSubscription found");
    await prisma.subscriptions.update({
      where: {
        id: dbSubscription.id,
      },
      data: {
        recur: false,
        status: SubscriptionStatus.expired,
      },
    });
  }
  let activeSubscriptionCreatedObj = {
    userId: userExist.id,
    stripeCustomerId: eventBody.data.object.customer,
    status: SubscriptionStatus.active,
    stripeSubscriptionId: subscription.id,
    recur: true,
    willEndAt: null,
    bucketId: userExist.bucketId,
    subscriptionPlanId: nextMonthSubscriptionPlanId.id,
  };

  if (nextMonthSubscriptionPlanId["type"] == "monthly") {
    activeSubscriptionCreatedObj.willEndAt = Number(
      new Date().setMonth(new Date().getMonth() + 1).toFixed(0)
    );
  } else {
    activeSubscriptionCreatedObj.willEndAt = Number(
      new Date().setFullYear(new Date().getFullYear() + 1).toFixed(0)
    );
  }

  let activeSubscriptionCreated = await prisma.subscriptions.create({
    data: activeSubscriptionCreatedObj,
  });

  console.log(
    eventBody.data.object["metadata"].dbSubscriptionId,
    "dbSubscriptionId"
  );
  let updateUsageTable = await prisma.usageTable.update({
    where: {
      id: usageTableRecord.id,
    },
    data: {
      subscriptionId: activeSubscriptionCreated.id,
      total: Number(nextMonthSubscriptionPlanId.storage) * 1024,
      left:
        Number(nextMonthSubscriptionPlanId.storage) * 1024 -
        usageTableRecord.used,
    },
  });
  if (userBandwidthRecord) {
    let updateUserBandwidthTable = await prisma.userBandwidth.update({
      where: {
        id: userBandwidthRecord.id,
      },
      data: {
        subscriptionId: activeSubscriptionCreated.id,
        total: Number(nextMonthSubscriptionPlanId.storage) * 1024,
        left:
          Number(nextMonthSubscriptionPlanId.storage) * 1024 -
          userBandwidthRecord.used,
      },
    });
  }
  paymentObj.subscriptionId = activeSubscriptionCreated.id;
  let payment = await prisma.paymentTable.create({
    data: paymentObj,
  });
}
async function saveStripeSubscription(eventBody) {
  console.log(eventBody, "eventBody");
  let invo = await stripe.invoices.retrieve(eventBody.data.object.id);
  let user = await prisma.user.findFirst({
    where: {
      stripeCustomerId: eventBody.data.object.customer,
    },
  });
  let plan = await prisma.subscriptionPlans.findFirst({
    where: {
      stripeProductId: eventBody.data.object.lines.data[0].plan.product,
    },
  });
  let paymentObj = {
    invoiceId: eventBody.data.object.id,
    amount: eventBody.data.object.amount_paid / 100,
    subscriptionId: "",
    status: PaymentStatus.paid,
    stripePaymentStatus: eventBody.data.object.status,
    paymentIntentId: eventBody.data.object.payment_intent,
    stripeRecordCreatedAt: String(eventBody.data.object.created * 1000),
  };
  let subscription = await prisma.subscriptions.findFirst({
    where: {
      stripeCustomerId: eventBody.data.object.customer,
      recur: true,
    },
  });
  let subs;

  if (!subscription) {
    let subscriptionWithoutRecur = await prisma.subscriptions.findFirst({
      where: {
        stripeCustomerId: eventBody.data.object.customer,
        recur: false,
        status: SubscriptionStatus.active,
      },
    });
    if (subscriptionWithoutRecur) {
      let updated = await prisma.subscriptions.update({
        where: {
          id: subscriptionWithoutRecur.id,
        },
        data: {
          status: SubscriptionStatus.expired,
        },
      });
    }
    let subsObj = {
      userId: user.id,
      subscriptionPlanId: plan.id,
      stripeCustomerId: eventBody.data.object.customer,
      status: SubscriptionStatus.active,
      stripeSubscriptionId: invo.subscription,
      bucketId: user.bucketId,
      recur: true,
      willEndAt: null,
    };
    if (plan.type == "monthly") {
      subsObj.willEndAt = Number(
        new Date().setMonth(new Date().getMonth() + 1).toFixed(0)
      );
    } else {
      subsObj.willEndAt = Number(
        new Date().setFullYear(new Date().getFullYear() + 1)
      );
    }
    subs = await prisma.subscriptions.create({
      data: subsObj,
    });
    // start of usage table
    let usageTableRecord = await prisma.usageTable.findFirst({
      where: {
        userId: user.id,
        subscriptionId: null,
      },
    });
    if (usageTableRecord) {
      let usageTableRecordUpdateObj = {
        subscriptionId: subs.id,
        to: null,
        from: Date.now(),
        total: plan.storage * 1024,
        left: plan.storage * 1024 - usageTableRecord.used,
      };
      if (plan.type == "monthly") {
        usageTableRecordUpdateObj.to = new Date().setMonth(
          new Date().getMonth() + 1
        );
      } else {
        usageTableRecordUpdateObj.to = new Date().setFullYear(
          new Date().getFullYear() + 1
        );
      }

      await prisma.usageTable.update({
        where: {
          id: usageTableRecord.id,
        },
        data: usageTableRecordUpdateObj,
      });
    } else {
      let olderUsageRecords = await prisma.usageTable.findMany({
        where: {
          userId: user.id,
          NOT: {
            subscriptionId: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      let usageTableCreateObj = {
        userId: user.id,
        bucketId: user.bucketId,
        from: Date.now(),
        to: null,
        total: plan.storage * 1024,
        used: olderUsageRecords[0].used,
        left: olderUsageRecords[0].left,
        subscriptionId: subs.id,
      };
      if (plan.type == "monthly") {
        usageTableCreateObj.to = new Date().setMonth(new Date().getMonth() + 1);
      } else {
        usageTableCreateObj.to = new Date().setFullYear(
          new Date().getFullYear() + 1
        );
      }

      await prisma.usageTable.create({
        data: usageTableCreateObj,
      });
    }
    // start of userBandwidth table
    let userBandwidthRecord = await prisma.userBandwidth.findFirst({
      where: {
        userId: user.id,
        subscriptionId: null,
      },
    });
    if (userBandwidthRecord) {
      let userBandwidthRecordUpdateObj = {
        subscriptionId: subs.id,
        to: null,
        from: Date.now(),
        total: plan.bandwidth * 1024,
        left: plan.bandwidth * 1024 - userBandwidthRecord.used,
      };
      if (plan.type == "monthly") {
        userBandwidthRecordUpdateObj.to = new Date().setMonth(
          new Date().getMonth() + 1
        );
      } else {
        userBandwidthRecordUpdateObj.to = new Date().setFullYear(
          new Date().getFullYear() + 1
        );
      }

      await prisma.userBandwidth.update({
        where: {
          id: userBandwidthRecord.id,
        },
        data: userBandwidthRecordUpdateObj,
      });
    } else {
      let olderuserBandwidthRecords = await prisma.userBandwidth.findMany({
        where: {
          userId: user.id,
          NOT: {
            subscriptionId: null,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });
      let userBandwidthRecordUpdateObj = {
        userId: user.id,
        from: Date.now(),
        to: null,
        total: plan.storage * 1024,
        used: olderuserBandwidthRecords[0]?.used || 0,
        left: olderuserBandwidthRecords[0]?.left || plan.storage * 1024,
        subscriptionId: subs.id,
      };
      if (plan.type == "monthly") {
        userBandwidthRecordUpdateObj.to = new Date().setMonth(
          new Date().getMonth() + 1
        );
      } else {
        userBandwidthRecordUpdateObj.to = new Date().setFullYear(
          new Date().getFullYear() + 1
        );
      }

      await prisma.userBandwidth.create({
        data: userBandwidthRecordUpdateObj,
      });
    }
    paymentObj.subscriptionId = subs.id;
  } else {
    paymentObj.subscriptionId = subscription.id;
    let dateAfter1Month;
    if (plan.type == "monthly") {
      dateAfter1Month = Number(
        new Date().setMonth(new Date().getMonth() + 1).toFixed(0)
      );
    } else {
      dateAfter1Month = Number(
        new Date().setFullYear(new Date().getFullYear() + 1).toFixed(0)
      );
    }
    await prisma.subscriptions.update({
      where: {
        id: subscription.id,
      },
      data: {
        willEndAt: dateAfter1Month,
      },
    });
    let olderUsageRecords = await prisma.usageTable.findMany({
      where: {
        userId: user.id,
        NOT: {
          subscriptionId: null,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }
  let updateUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      premiumUser: true,
    },
  });
  let payment = await prisma.paymentTable.create({
    data: paymentObj,
  });
  // let startDateMonth = new Date(eventBody.data.object.created * 1000).getMonth()
  // let endDate = new Date().setMonth(startDateMonth + 1)
  // console.log(endDate, "endDate")

  // return "success"
}

async function subscriptionFailed(eventBody) {
  let user = await prisma.user.findFirst({
    where: {
      stripeCustomerId: eventBody.data.object.customer,
    },
  });
  if (user) {
    let updatedUser = await prisma.user.updateMany({
      where: {
        stripeCustomerId: eventBody.data.object.customer,
      },
      data: {
        premiumUser: false,
      },
    });
  }
  let subscription = await prisma.subscriptions.findFirst({
    where: {
      stripeCustomerId: eventBody.data.object.customer,
    },
  });
  if (subscription) {
    await prisma.subscriptions.update({
      where: {
        id: subscription.id,
      },
      data: {
        status: SubscriptionStatus.expired,
      },
    });
  }
}

async function createPaymentIntent(req, res, next) {
  console.log(req.tokenData, "req.tokenData");
  let user = await prisma.user.findFirst({
    where: {
      email: req.tokenData.userEmail,
    },
  });
  let subscriptionRecord = await prisma.subscriptions.findFirst({
    where: {
      userId: user.id,
      recur: true,
    },
  });
  if (subscriptionRecord) {
    console.log("subscriptionRecord exists");
    let payments = await prisma.paymentTable.findMany({
      where: {
        subscriptionId: subscriptionRecord.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    let date = new Date();
    let subscriptionActiveTime = new Date(payments[0]["createdAt"]);
    let endTimeInSeconds = (
      subscriptionActiveTime.setMonth(subscriptionActiveTime.getMonth() + 1) /
      1000
    ).toFixed(0);

    let paymentIntent;

    let obj = {
      amount: null,
      currency: "usd",
      payment_method_types: ["card"],
      customer: user.stripeCustomerId,
      description: "Plan Upgrade Payment",
      metadata: {
        dbSubscriptionId: subscriptionRecord.id,
        stripeSubscriptionId: subscriptionRecord.stripeSubscriptionId,
        dbNewPlanId: "",
        stripeNewPlanId: "",
        purpose: "upgrade-plan",
        nextMonthSubscriptionPlanId: "",
        subscriptionActiveTime: JSON.stringify(
          new Date(payments[0]["createdAt"])
        ),
      },
    };
    let data = req.body;
    console.log(req.body.upgrade, "check upgrade");
    if (data.upgrade == "BasicToProfessionalPerMonth") {
      console.log("basic to professional");
      let professionalPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "Professional",
          type: "monthly",
        },
      });
      // planService.getPlanByPlanName('Professional')
      let basicToprofessionalPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "BasicToProfessionalPerMonth",
          type: "monthly",
        },
      });
      // this.planService.getPlanByPlanName('PasicToprofessional')
      // nextMonthSubscriptionPlanId = ProfessionalPlan
      if (basicToprofessionalPlan) {
        obj.amount = basicToprofessionalPlan.price * 100;
        obj.metadata.dbNewPlanId = basicToprofessionalPlan.id;
        obj.metadata.stripeNewPlanId = basicToprofessionalPlan.stripeProductId;
        obj.metadata.nextMonthSubscriptionPlanId =
          JSON.stringify(professionalPlan);
        console.log(obj, "check obj");
        paymentIntent = await stripe.paymentIntents.create(obj);
      }
    }
    if (data.upgrade == "BasicToBusinessPerMonth") {
      let businessPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "Business",
          type: "monthly",
        },
      });
      let basicToBusinessPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "BasicToBusinessPerMonth",
        },
      });
      // this.planService.getPlanByPlanName('BasicToBusiness')
      if (basicToBusinessPlan) {
        obj.amount = basicToBusinessPlan.price * 100;
        obj.metadata.dbNewPlanId = basicToBusinessPlan.id;
        obj.metadata.stripeNewPlanId = basicToBusinessPlan.stripeProductId;
        obj.metadata.nextMonthSubscriptionPlanId = JSON.stringify(businessPlan);

        paymentIntent = await stripe.paymentIntents.create(obj);
      }
    }
    if (data.upgrade == "ProfessionalToBusinessPerMonth") {
      let businessPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "Business",
          type: "monthly",
        },
      });
      // this.planService.getPlanByPlanName('Premium')
      let professionalToBusinessPlan = await prisma.subscriptionPlans.findFirst(
        {
          where: {
            name: "ProfessionalToBusinessPerMonth",
          },
        }
      );
      if (professionalToBusinessPlan) {
        obj.amount = professionalToBusinessPlan.price * 100;
        obj.metadata.dbNewPlanId = professionalToBusinessPlan.id;
        obj.metadata.stripeNewPlanId =
          professionalToBusinessPlan.stripeProductId;
        obj.metadata.nextMonthSubscriptionPlanId = JSON.stringify(businessPlan);

        paymentIntent = await stripe.paymentIntents.create(obj);
      }
    }

    if (data.upgrade == "BasicToProfessionalPerYear") {
      console.log("basic to professional");
      let professionalPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "Professional",
          type: "yearly",
        },
      });
      // planService.getPlanByPlanName('Professional')
      let basicToprofessionalPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "BasicToProfessionalPerYear",
          type: "yearly",
        },
      });
      // this.planService.getPlanByPlanName('PasicToprofessional')
      // nextMonthSubscriptionPlanId = ProfessionalPlan
      if (basicToprofessionalPlan) {
        obj.amount = basicToprofessionalPlan.price * 100;
        obj.metadata.dbNewPlanId = basicToprofessionalPlan.id;
        obj.metadata.stripeNewPlanId = basicToprofessionalPlan.stripeProductId;
        obj.metadata.nextMonthSubscriptionPlanId =
          JSON.stringify(professionalPlan);
        console.log(obj, "check obj");
        paymentIntent = await stripe.paymentIntents.create(obj);
      }
    }
    if (data.upgrade == "BasicToBusinessPerYear") {
      let businessPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "Business",
          type: "yearly",
        },
      });
      let basicToBusinessPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "BasicToBusinessPerYear",
        },
      });
      // this.planService.getPlanByPlanName('BasicToBusiness')
      if (basicToBusinessPlan) {
        obj.amount = basicToBusinessPlan.price * 100;
        obj.metadata.dbNewPlanId = basicToBusinessPlan.id;
        obj.metadata.stripeNewPlanId = basicToBusinessPlan.stripeProductId;
        obj.metadata.nextMonthSubscriptionPlanId = JSON.stringify(businessPlan);

        paymentIntent = await stripe.paymentIntents.create(obj);
      }
    }
    if (data.upgrade == "ProfessionalToBusinessPerYear") {
      let businessPlan = await prisma.subscriptionPlans.findFirst({
        where: {
          name: "Business",
          type: "monthly",
        },
      });
      // this.planService.getPlanByPlanName('Premium')
      let professionalToBusinessPlan = await prisma.subscriptionPlans.findFirst(
        {
          where: {
            name: "ProfessionalToBusinessPerYear",
          },
        }
      );
      if (professionalToBusinessPlan) {
        obj.amount = professionalToBusinessPlan.price * 100;
        obj.metadata.dbNewPlanId = professionalToBusinessPlan.id;
        obj.metadata.stripeNewPlanId =
          professionalToBusinessPlan.stripeProductId;
        obj.metadata.nextMonthSubscriptionPlanId = JSON.stringify(businessPlan);

        paymentIntent = await stripe.paymentIntents.create(obj);
      }
    }
    await res.status(201).json(paymentIntent.client_secret);
  } else {
    console.log("subscriptionRecord does not exists");

    let checkStripeCustRegistered = await stripe.customers.list({
      email: req.tokenData.userEmail,
    });
    let customer;
    let updatedUser;
    if (checkStripeCustRegistered.data.length < 1) {
      console.log("less than one");
      customer = await stripe.customers.create({
        name: req.tokenData.userName,
        email: req.tokenData.userEmail,
      });
      // console.log(customer, "customer")
      updatedUser = await prisma.user.update({
        where: {
          email: req.tokenData.userEmail,
        },
        data: {
          stripeCustomerId: customer.id,
        },
      });
      user.stripeCustomerId = customer.id;
    }
    // else {
    //   console.log("customer exists")

    //   customer = checkStripeCustRegistered.data[0];
    // }
    let intent;
    console.log(req.body, "check reqboyd");
    let promise = await new Promise((resolve, reject) => {
      const subscription = stripe.subscriptions.create({
        customer: user.stripeCustomerId,
        items: [{ price: req.body.stripePriceId }],
        payment_behavior: "default_incomplete",
        payment_settings: { save_default_payment_method: "on_subscription" },
        expand: ["latest_invoice.payment_intent"],
        metadata: {
          dbPlanId: req.body.stripeProductId,
          userId: req.tokenData.userId,
        },
      });
      resolve(subscription);
    })
      .then((res) => {
        intent = res.latest_invoice["payment_intent"];
      })
      .then(() => {
        res.status(201).json(intent.client_secret);
      });
  }
}

async function verifySubscription(req, res, next) {
  console.log(req.params, "check req.params");
  let planId = req.params["id"];
  let subscription = await prisma.subscriptions.findMany({
    where: {
      userId: req.tokenData.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  if (subscription.length > 0) {
    console.log("subscription length greater");
    if (!subscription[0].recur) {
      console.log(subscription[0], "subscription[0]");
      let plan = await prisma.subscriptionPlans.findFirst({
        where: {
          id: Number(planId),
        },
      });
      if (subscription[0].status == SubscriptionStatus.expired) {
        let usageTable = await prisma.usageTable.findFirst({
          where: {
            userId: req.tokenData.userId,
            subscriptionId: subscription[0].id,
          },
        });
        if (usageTable.used > plan.storage * 1024) {
          console.log("extrea storage");
          let difference = usageTable.used - plan.storage * 1024;
          await res.json({
            data: {
              active: false,
              extraStorage: difference,
            },
          });
        } else {
          console.log("no extra storage");
          await res.json({
            data: {
              active: false,
              extraStorage: null,
            },
          });
        }
      } else {
        let usageTable = await prisma.usageTable.findFirst({
          where: {
            userId: req.tokenData.userId,
            subscriptionId: subscription[0].id,
          },
        });

        if (usageTable.used > plan.storage * 1024) {
          console.log("extrea storage");
          let difference = usageTable.used - plan.storage * 1024;
          await res.json({
            data: {
              active: false,
              extraStorage: difference,
            },
          });
        } else {
          await res.json({
            data: {
              active: false,
              extraStorage: null,
            },
          });
        }

        // await res.json({
        //   data: {
        //     active: false,
        //     extraStorage: null
        //   }
        // })
      }
    } else {
      console.log("true");
      await res.json({
        data: {
          active: true,
        },
      });
    }
  } else {
    await res.json({
      data: {
        active: false,
        extraStorage: null,
      },
    });
  }
}

async function cancelSubscription(req, res, next) {
  let user = await prisma.user.findUnique({
    where: {
      id: req.tokenData.userId,
    },
  });
  let subscription = await prisma.subscriptions.findFirst({
    where: {
      userId: req.tokenData.userId,
      recur: true,
    },
  });
  console.log(req.tokenData, "req.tokenData");
  // console.log(subscription.stripeSubscriptionId,"subscription.stripeSubscriptionId")
  if (subscription) {
    let list = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
    });
    console.log(list, "list");
    let subss = await stripe.subscriptions.retrieve(
      subscription.stripeSubscriptionId
    );
    console.log(subss, "check subss");
    if (subss.status != STRIPE_STATUS.canceled) {
      let del = await stripe.subscriptions.cancel(
        subscription.stripeSubscriptionId
      );
    }
    // await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
    await prisma.subscriptions.update({
      where: {
        id: subscription.id,
      },
      data: {
        recur: false,
      },
    });
    await prisma.user.update({
      where: {
        id: req.tokenData.userId,
      },
      data: {
        premiumUser: false,
      },
    });
    await res.json({
      message: "successfully unsubscribed the plan",
    });
    // return {
    //   message: "successfully unsubscribed the plan"
    // }
  } else {
    return await next(
      createHttpError(
        400,
        "You don't have any active subscription to be cancelled"
      )
    );
  }
}

module.exports = {
  buySubscription,
  handleWebhook,
  createPaymentIntent,
  verifySubscription,
  getInvoiceById,
  cancelSubscription,
};
