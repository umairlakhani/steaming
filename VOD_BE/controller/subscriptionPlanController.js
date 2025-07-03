const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const createHttpError = require('http-errors');
const prisma = require('../prisma/client');
const stripe = require('stripe')(process.env.STRIPE_SECRETKEY);


async function createSubscriptionPlan(req, res, next) {
    const schema = Joi.object({
        name: Joi.string().valid('Basic', 'Professional', 'Business').required(),
        price: Joi.number().required(),
        features: Joi.string().required(),
        storage: Joi.number().required(),
        bandwidth: Joi.number().required(),
        type: Joi.string().valid('monthly', 'yearly').required(),
        disc: Joi.optional()
    })
    var { error, value } = schema.validate(req.body);
    if (error) {
        console.log(error);
        return await next(createHttpError(400, error.message));
    }
    let planAlreadyExists = await prisma.subscriptionPlans.findFirst({
        where: {
            name: value.name,
            type: value.type
        }
    })
    if (planAlreadyExists) {
        return await next(createHttpError(400, "Subscription plan already exists!"));
    }
    if (value.type == 'monthly') {
        let BasicPlanPerMonth = await prisma.subscriptionPlans.findFirst({
            where: {
                name: 'Basic',
                type: 'monthly'
            }
        })
        if (
            (
                value.name == 'Professional' ||
                value.name == 'Business'
            ) &&
            !BasicPlanPerMonth
        ) {
            return await next(createHttpError(400, "Please create a Basic plan first"));
        }

        let ProfessionalPlanPerMonth = await prisma.subscriptionPlans.findFirst({
            where: {
                name: 'Professional'
            }
        })

        if (value.name == 'Business' && !ProfessionalPlanPerMonth) {
            return await next(createHttpError(400, "Please create a Professional plan first"));
        }
        const default_price = value.price
        const product = await stripe.products.create({
            name: value.name,
            default_price_data: {
                unit_amount: value.price * 100,
                currency: 'usd',
                recurring: { interval: 'month' },
            },
        });
        console.log(product, "product")
        let plan = await prisma.subscriptionPlans.create({
            data: {
                name: value.name,
                price: value.price,
                features: value.features,
                storage: value.storage,
                bandwidth: value.bandwidth,
                stripeProductId: product.id,
                stripePriceId: product.default_price,
                type: value.type
            }
        })

        if (value.name == 'Professional') {
            let priceDifference = plan.price - BasicPlanPerMonth.price

            const basicToProfessionalProductPerMonth = await stripe.products.create({
                name: 'BasicToProfessionalPerMonth',
                default_price_data: {
                    unit_amount: priceDifference * 100,
                    currency: 'usd',
                },
            });
            const basicToProfessionalPlanPerMonth = await prisma.subscriptionPlans.create({
                data: {
                    name: 'BasicToProfessionalPerMonth',
                    price: priceDifference,
                    features: value.features,
                    stripePriceId: basicToProfessionalProductPerMonth.default_price,
                    stripeProductId: basicToProfessionalProductPerMonth.id,
                    storage: plan.storage,
                    bandwidth: plan.bandwidth,
                    type: value.type
                }
            })
        }

        if (value.name == 'Business') {
            let basicToBusinessPriceDifference = plan.price - BasicPlanPerMonth.price

            const basicToBusinessProductPerMonth = await stripe.products.create({
                name: 'BasicToBusinessPerMonth',
                default_price_data: {
                    unit_amount: basicToBusinessPriceDifference * 100,
                    currency: 'usd',
                },
            });
            const basicToBusinessPlanPerMonth = await prisma.subscriptionPlans.create({
                data: {
                    name: 'BasicToBusinessPerMonth',
                    price: basicToBusinessPriceDifference,
                    features: value.features,
                    stripePriceId: basicToBusinessProductPerMonth.default_price,
                    stripeProductId: basicToBusinessProductPerMonth.id,
                    storage: plan.storage,
                    bandwidth: plan.bandwidth,
                    type: value.type
                }
            })

            let professionalToBusinessPriceDifference = plan.price - ProfessionalPlanPerMonth.price
            const professionalToBusinessProductPerMonth = await stripe.products.create({
                name: 'ProfessionalToBusinessPerMonth',
                default_price_data: {
                    unit_amount: professionalToBusinessPriceDifference * 100,
                    currency: 'usd',
                },
            });
            const professionalToBusinessPlanPerMonth = await prisma.subscriptionPlans.create({
                data: {
                    name: 'ProfessionalToBusinessPerMonth',
                    price: professionalToBusinessPriceDifference,
                    features: value.features,
                    stripePriceId: professionalToBusinessProductPerMonth.default_price,
                    stripeProductId: professionalToBusinessProductPerMonth.id,
                    storage: plan.storage,
                    bandwidth: plan.bandwidth,
                    type: value.type
                }
            })
        }
        return await res.json({
            message: 'Subscription plan created successfully'
        })
    } else {
        let discountAmount = value.price * (value.disc / 100)
        let discountedPrice = value.price - discountAmount
        let BasicPlanPerYear = await prisma.subscriptionPlans.findFirst({
            where: {
                name: 'Basic',
                type: 'yearly'
            }
        })
        if (
            (
                value.name == 'Professional' ||
                value.name == 'Business'
            ) &&
            !BasicPlanPerYear
        ) {
            return await next(createHttpError(400, "Please create a Basic plan first"));
        }
        let basicPlanPerYearDiscountAmount;
        let BasicPlanPerYearDiscountedPrice;
        if (BasicPlanPerYear) {
            basicPlanPerYearDiscountAmount = BasicPlanPerYear.price * (BasicPlanPerYear.discount / 100)
            BasicPlanPerYearDiscountedPrice = BasicPlanPerYear.price - basicPlanPerYearDiscountAmount
        }

        let ProfessionalPlanPerYear = await prisma.subscriptionPlans.findFirst({
            where: {
                name: 'Professional',
                type: 'yearly'
            }
        })

        if (value.name == 'Business' && !ProfessionalPlanPerYear) {
            return await next(createHttpError(400, "Please create a Professional plan first"));
        }
        // let professionalPlanPerYearDiscountAmount;
        // let ProfessionalPlanPerYearDiscountedPrice;
        // if (ProfessionalPlanPerYear) {
        //     professionalPlanPerYearDiscountAmount = ProfessionalPlanPerYear.price * (ProfessionalPlanPerYear.discount / 100)
        //     ProfessionalPlanPerYearDiscountedPrice = ProfessionalPlanPerYear.price - professionalPlanPerYearDiscountAmount
        // }
        const default_price = value.price
        const product = await stripe.products.create({
            name: value.name,
            default_price_data: {
                unit_amount: discountedPrice * 100,
                currency: 'usd',
                recurring: { interval: 'year' },
            },
        });
        console.log(product, "product")
        let plan = await prisma.subscriptionPlans.create({
            data: {
                name: value.name,
                price: value.price,
                features: value.features,
                storage: value.storage,
                bandwidth: value.bandwidth,
                stripeProductId: product.id,
                stripePriceId: product.default_price,
                type: value.type,
                discount: value.disc
            }
        })

        if (value.name == 'Professional') {
            let priceDifference = discountedPrice - BasicPlanPerYearDiscountedPrice

            const basicToProfessionalProductPerYear = await stripe.products.create({
                name: 'BasicToProfessionalPerYear',
                default_price_data: {
                    unit_amount: priceDifference * 100,
                    currency: 'usd',
                },
            });
            const basicToProfessionalPlanPerYear = await prisma.subscriptionPlans.create({
                data: {
                    name: 'BasicToProfessionalPerYear',
                    price: priceDifference,
                    features: value.features,
                    stripePriceId: basicToProfessionalProductPerYear.default_price,
                    stripeProductId: basicToProfessionalProductPerYear.id,
                    storage: plan.storage,
                    bandwidth: plan.bandwidth,
                    type: value.type
                }
            })
        }

        if (value.name == 'Business') {
            let basicToBusinessPriceDifference = discountedPrice - BasicPlanPerYearDiscountedPrice

            const basicToBusinessProductPerYear = await stripe.products.create({
                name: 'BasicToBusinessPerYear',
                default_price_data: {
                    unit_amount: basicToBusinessPriceDifference * 100,
                    currency: 'usd',
                },
            });
            const basicToBusinessPlanPerYear = await prisma.subscriptionPlans.create({
                data: {
                    name: 'BasicToBusinessPerYear',
                    price: basicToBusinessPriceDifference,
                    features: value.features,
                    stripePriceId: basicToBusinessProductPerYear.default_price,
                    stripeProductId: basicToBusinessProductPerYear.id,
                    storage: plan.storage,
                    bandwidth: plan.bandwidth,
                    type: value.type
                }
            })

            let professionalToBusinessPriceDifference = plan.price - ProfessionalPlanPerYear.price
            const professionalToBusinessProductPerYear = await stripe.products.create({
                name: 'ProfessionalToBusinessPerYear',
                default_price_data: {
                    unit_amount: professionalToBusinessPriceDifference * 100,
                    currency: 'usd',
                },
            });
            const professionalToBusinessPlanPerYear = await prisma.subscriptionPlans.create({
                data: {
                    name: 'ProfessionalToBusinessPerYear',
                    price: professionalToBusinessPriceDifference,
                    features: value.features,
                    stripePriceId: professionalToBusinessProductPerYear.default_price,
                    stripeProductId: professionalToBusinessProductPerYear.id,
                    storage: plan.storage,
                    bandwidth: plan.bandwidth,
                    type: value.type
                }
            })
        }
        return await res.json({
            message: 'Subscription plan created successfully'
        })
    }

}

async function updateSubscriptionPlan(req, res, next) {
    let id = req.params['id']
    const schema = Joi.object({
        name: Joi.string().valid('Basic', 'Professional', 'Business').required(),
        price: Joi.number().required(),
        features: Joi.string().required(),
        storage: Joi.number().required(),
        bandwidth: Joi.number().required(),
        type: Joi.string().valid('monthly', 'yearly').required(),
        disc: Joi.optional()
    })
    var { error, value } = schema.validate(req.body);
    if (error) {
        console.log(error);
        return await next(createHttpError(400, error.message));
    }
    let subscriptionPlan = await prisma.subscriptionPlans.findFirst({
        where: {
            id: id
        }
    })
    if (!subscriptionPlan) {
        return await next(createHttpError(401, 'Subscription plan not found'))
    }

    if (subscriptionPlan.price != value.price) {
        let newPrice = await stripe.prices.create({
            currency: 'usd',
            unit_amount: value.price * 100,
            recurring: { interval: 'month' },
            product: subscriptionPlan.stripeProductId
        })
        let obj = {
            ...value,
            stripePriceId: newPrice.id
        }
        let stripePlanUpdated = await stripe.products.update(value.stripeProductId, {
            default_price: newPrice.id
        })

        let deactivePrice = await stripe.prices.update(subscriptionPlan.stripePriceId, {
            active: false
        })

        await prisma.subscriptionPlans.update({
            where: {
                id: id
            },
            data: obj
        })
        if (value.name == 'Professional') {
            let basicToProfessionalPlan = await prisma.subscriptionPlans.findFirst({
                where: {
                    name: 'BasicToProfessional'
                }
            })
            if (basicToProfessionalPlan) {
                let newBasicToProfessionalPrice = await stripe.prices.create({
                    currency: 'usd',
                    unit_amount: value.price * 100,
                    product: basicToProfessionalPlan.stripeProductId
                })
                let obj = {
                    ...value,
                    stripePriceId: newBasicToProfessionalPrice.id
                }

                let stripeBasicToProfessionalPlanUpdated = await stripe.products.update(basicToProfessionalPlan.stripeProductId, {
                    default_price: newBasicToProfessionalPrice.id
                })
                let deactiveBasicToProfessionalPrice = await stripe.prices.update(basicToProfessionalPlan.stripePriceId, {
                    active: false
                })
                await prisma.subscriptionPlans.update({
                    where: {
                        id: basicToProfessionalPlan.id
                    },
                    data: obj
                })
            }
        }
        if (value.name == 'Business') {
            let basicToBusinessPlan = await prisma.subscriptionPlans.findFirst({
                where: {
                    name: 'BasicToBusiness'
                }
            })
            let standardToBusinessPlan = await prisma.subscriptionPlans.findFirst({
                where: {
                    name: 'StandardToBusiness'
                }
            })
            if (basicToBusinessPlan) {
                let newBasicToBusinessPrice = await stripe.prices.create({
                    currency: 'usd',
                    unit_amount: value.price * 100,
                    product: basicToBusinessPlan.stripeProductId
                })
                let obj = {
                    ...value,
                    stripePriceId: newBasicToBusinessPrice.id
                }

                let stripeBasicToBusinessPlanUpdated = await stripe.products.update(basicToBusinessPlan.stripeProductId, {
                    default_price: newBasicToBusinessPrice.id
                })
                let deactiveBasicToBusinessPrice = await stripe.prices.update(basicToBusinessPlan.stripePriceId, {
                    active: false
                })
                await prisma.subscriptionPlans.update({
                    where: {
                        id: basicToBusinessPlan.id
                    },
                    data: obj
                })
            }

            if (standardToBusinessPlan) {
                let newStandardToBusinessPrice = await stripe.prices.create({
                    currency: 'usd',
                    unit_amount: value.price * 100,
                    product: standardToBusinessPlan.stripeProductId
                })
                let obj = {
                    ...value,
                    stripePriceId: newStandardToBusinessPrice.id
                }

                let stripeStandardToBusinessPlanUpdated = await stripe.products.update(standardToBusinessPlan.stripeProductId, {
                    default_price: newStandardToBusinessPrice.id
                })
                let deactiveStandardToBusinessPrice = await stripe.prices.update(standardToBusinessPlan.stripePriceId, {
                    active: false
                })
                await prisma.subscriptionPlans.update({
                    where: {
                        id: standardToBusinessPlan.id
                    },
                    data: obj
                })
            }
        }
    } else {
        if(value.type == 'monthly'){
            if (value.name == 'Professional') {
                let basicToProfessionalPlan = await prisma.subscriptionPlans.findFirst({
                    where: {
                        name: 'BasicToProfessionalPerMonth'
                    }
                })
                if (basicToProfessionalPlan) {
                    await prisma.subscriptionPlans.update({
                        where: {
                            id: basicToProfessionalPlan.id
                        },
                        data: {
                            storage: value.storage,
                            bandwidth: value.bandwidth
                        }
                    })
                }
            }
            if (value.name == 'Business') {
                let basicToBusinessPlan = await prisma.subscriptionPlans.findFirst({
                    where: {
                        name: 'BasicToBusinessPerMonth'
                    }
                })
                if (basicToBusinessPlan) {
                    await prisma.subscriptionPlans.update({
                        where: {
                            id: basicToBusinessPlan.id
                        },
                        data: {
                            storage: value.storage,
                            bandwidth: value.bandwidth
                        }
                    })
                }
                let professionalToBusinessPlan = await prisma.subscriptionPlans.findFirst({
                    where: {
                        name: 'ProfessionalToBusinessPerMonth'
                    }
                })
                if (professionalToBusinessPlan) {
                    await prisma.subscriptionPlans.update({
                        where: {
                            id: professionalToBusinessPlan.id
                        },
                        data: {
                            storage: value.storage,
                            bandwidth: value.bandwidth
                        }
                    })
                }
            }
        }else{
            if (value.name == 'Professional') {
                let basicToProfessionalPlan = await prisma.subscriptionPlans.findFirst({
                    where: {
                        name: 'BasicToProfessionalPerYear'
                    }
                })
                if (basicToProfessionalPlan) {
                    await prisma.subscriptionPlans.update({
                        where: {
                            id: basicToProfessionalPlan.id
                        },
                        data: {
                            storage: value.storage,
                            bandwidth: value.bandwidth
                        }
                    })
                }
            }
            if (value.name == 'Business') {
                let basicToBusinessPlan = await prisma.subscriptionPlans.findFirst({
                    where: {
                        name: 'BasicToBusinessPerYear'
                    }
                })
                if (basicToBusinessPlan) {
                    await prisma.subscriptionPlans.update({
                        where: {
                            id: basicToBusinessPlan.id
                        },
                        data: {
                            storage: value.storage,
                            bandwidth: value.bandwidth
                        }
                    })
                }
                let professionalToBusinessPlan = await prisma.subscriptionPlans.findFirst({
                    where: {
                        name: 'ProfessionalToBusinessPerYear'
                    }
                })
                if (professionalToBusinessPlan) {
                    await prisma.subscriptionPlans.update({
                        where: {
                            id: professionalToBusinessPlan.id
                        },
                        data: {
                            storage: value.storage,
                            bandwidth: value.bandwidth
                        }
                    })
                }
            }
        }
        await prisma.subscriptionPlans.update({
            where: {
                id: id
            },
            data: value
        })
    }
    await res.json({
        message: 'Subscription created successfully'
    })
}

async function getAll(req, res, next) {
    let subscriptionPlans = await prisma.subscriptionPlans.findMany({})
    res.json({
        data: subscriptionPlans
    })
}

async function getSubscriptionPlan(req, res, next) {
    let id = req.params['id']

    let subscriptionPlan = await prisma.subscriptionPlans.findFirst({
        where: {
            id: Number(id)
        }
    })
    if (!subscriptionPlan) {
        return next(createHttpError(401, "Subscription Plan not found"))
    }
    res.json({
        data: subscriptionPlan
    })
}
module.exports = {
    createSubscriptionPlan,
    updateSubscriptionPlan,
    getAll,
    getSubscriptionPlan
}