const createHttpError = require('http-errors');
const Joi = require('joi');
const { joiPasswordExtendCore } = require('joi-password');
const joiPassword = Joi.extend(joiPasswordExtendCore);
const jwt = require('jsonwebtoken');
const bcrypt = require("bcrypt");
const { PrismaClient, Prisma, SubscriptionStatus } = require("@prisma/client");
const emailVerification = require('../emails/emailVerification');
const formidable = require('formidable');
const fs = require('fs');
const crypto = require('crypto');
const { default: axios } = require('axios');
const prisma = require('../prisma/client');
const apiKey = 'ff64f0543a6b737dca0e7d5e8688bce1';
const passReset = require('../emails/passReset');
const AWS = require('aws-sdk');
require('dotenv').config();
const { createSpacesBucket } = require('./storageController');
AWS.config.update({
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY, // Replace with your DigitalOcean Spaces access key
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY, // Replace with your DigitalOcean Spaces secret key
    endpoint: process.env.DIGITAL_OCEAN_TEMP_URL_KEY, // Replace with your DigitalOcean Spaces endpoint
    s3ForcePathStyle: true,
});
const spaces = new AWS.S3({
    signatureVersion: 'v4',
    params: {
        acl: 'public-read',
    },
});
async function signup(req, res, next) {
    const schema = Joi.object({
        name: Joi.string()
            .alphanum()
            .min(1)
            .max(30)
            .required(),

        surname: Joi.string()
            .alphanum()
            .min(1)
            .max(30)
            .required(),

        email: Joi.string()
            .email()
            .required(),

        dateOfBirth: Joi.date()
            .required(),

        password: joiPassword.string()
            .min(8)
            .minOfSpecialCharacters(1)
            .minOfLowercase(2)
            .minOfUppercase(1)
            .minOfNumeric(1)
            .noWhiteSpaces()
            .messages({
                'password.minOfUppercase': '{#label} should contain at least {#min} uppercase character',
                'password.minOfSpecialCharacters':
                    '{#label} should contain at least {#min} special character',
                'password.minOfLowercase': '{#label} should contain at least {#min} lowercase character',
                'password.minOfNumeric': '{#label} should contain at least {#min} numeric character',
                'password.noWhiteSpaces': '{#label} should not contain white spaces',
            })
            .required(),

        repeatPassword: Joi.ref('password'),
        profile_image: Joi.string().required()
    });

    var { error, value } = schema.validate(req.body);
    delete value.repeatPassword;

    if (error) {
        return next(createHttpError(400, error.message));
    }

    const salt = await bcrypt.genSalt(10);
    value.password = await bcrypt.hash(value.password, salt);

    try {
        var getUserEmail = await prisma.user.findMany({
            where: {
                email: value.email
            }
        });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }

    console.log('getUserEmail', getUserEmail)

    if (getUserEmail.length !== 0) {
        return next(createHttpError(409, "A user with this email already exists!"));
    }

    value.emailVerificationNumber = Math.floor(Math.random() * 599) + 1111;
    console.log(value, "check value")

    try {
        // let bucketId = await createSpacesBucket()
        // if (bucketId) {
           
        // } else {
        //     return next(createHttpError());
        // }
        var user = await prisma.user.create({
            data: value 
        });
        delete user.password;
        await emailVerification(value.name + ' ' + value.surname, value.email, value.emailVerificationNumber);
        req.body.tokenData = user;
        return await next();
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}

async function verifyEmail(req, res, next) {
    const schema = Joi.object({
        verificationCode: Joi.number()
            // .min(4)
            // .max(4)
            .required(),
    });

    var { error, value } = schema.validate(req.body);

    if (error) {
        return next(createHttpError(400, error.message));
    }

    try {
        var getUserEmail = await prisma.user.findFirst({
            where: {
                email: req.tokenData.userEmail
            }
        });

        if (getUserEmail.emailVerificationNumber !== value.verificationCode) {
            return await next(createHttpError(400, "Wrong verification code!"));
        }
        let bucketId = await createSpacesBucket()
        if(bucketId){
            const updatedUser = await prisma.user.update({
                where: {
                    email: req.tokenData.userEmail,
                },
                data: {
                    emailVerified: true,
                    emailVerificationNumber: 0,
                    bucketId:bucketId
                },
            });
            if(updatedUser){
                delete updatedUser.password;
                req.body.tokenData = updatedUser;
                // await createZone({ id: updatedUser.id, name: updatedUser.name })
    
                let usageTableRecord = await prisma.usageTable.create({
                    data: {
                        userId: getUserEmail.id,
                        bucketId: bucketId,
                        from: Date.now(),
                        to: new Date().setMonth(new Date().getMonth() + 1),
                        total: Number(process.env.FREE_STORAGE),
                        used: 0.00,
                        left: Number(process.env.FREE_STORAGE)
                    }
                })
                let userBandWidthRecord = await prisma.userBandwidth.create({
                    data: {
                        userId: getUserEmail.id,
                        from: Date.now(),
                        to: new Date().setMonth(new Date().getMonth() + 1),
                        total: Number(process.env.FREE_BANDWIDTH),
                        used: 0.00,
                        left: Number(process.env.FREE_BANDWIDTH)
                    }
                })
            }
        }

        return await next()



    } catch (error) {
        console.log(error)
        return next(createHttpError());
    }
}



async function createZone({ id, name }) {
    const signature = await generateSig({ descr: "qwerty", name: name, method: 'AS.Zones.create' })
    console.log(signature, 'sig')
    let data = {}
    data.descr = "qwerty";
    data.key = apiKey;
    data.method = 'AS.Zones.create';
    data.name = name;
    data.sig = signature;
    data.type = 'video';

    console.log(data, "check data")
    try {
        const createdZone = await axios.post(`https://api.adspeed.com`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': '*/*'
            },
        })
        console.log(createdZone.data, "createdZone")
        const startIndex = createdZone.data.indexOf('Zone id=');
        const endIndex = createdZone.data.indexOf('"', startIndex + 'Zone id='.length + 2);
        const zoneId = createdZone.data.substring(startIndex + '<Zone id='.length, endIndex);
        //   const startIndex = await createdZone.data.indexOf('Zone id=');
        //   const endIndex = await createdZone.data.indexOf('"', startIndex + 'Zone id='.length);
        //   const zoneId = await createdZone.data.substring(startIndex + 'Zone id='.length, endIndex);
        // var doc = new DOMParser().parseFromString(a, "text/xml");
        // var check = doc.firstChild.childNodes[1];
        // console.log(check.getAttribute("id"))
        console.log(await zoneId, "check zone id extracted")
        return await prisma.zones.create({
            data: {
                userId: id,
                zoneRes: createdZone.data,
                adSpeedZoneId: zoneId,
                zoneName: name
            }
        })
        //   let resp = {
        //     data:createdZone,
        //     message:"Zone created successfully"
        //   }
    }
    catch (err) {
        console.log(err, "err in create zone")
    }
}

async function login(req, res, next) {
    const schema = Joi.object({
        email: Joi.string()
            .email()
            .required(),

        password: Joi.string()
            .required(),
    });

    var { error, value } = schema.validate(req.body);

    if (error) {
        return next(createHttpError(400, error.message));
    }

    try {
        var getUserEmail = await prisma.user.findFirst({
            where: {
                email: value.email
            }
        });

        if (!getUserEmail) {
            return next(createHttpError(401, "No user found with this email!"));
        }

        const validPassword = await bcrypt.compare(value.password, getUserEmail.password);

        if (!validPassword) {
            return next(createHttpError(401, "Password is incorrect!"));
        }

        req.body.tokenData = getUserEmail;
        console.log(req.body.tokenData, "req.body.tokenData")
        return next();
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}

async function update(req, res, next) {
    const schema = Joi.object({
        email: Joi.string()
            .email()
            .required(),
    });

    var { error, value } = schema.validate(req.body);

    if (error) {
        return next(createHttpError(400, error.message));
    }

    value.emailVerified = false;

    try {
        var getUserEmail = await prisma.user.findFirst({
            where: {
                email: value.email
            }
        });
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }

    if (getUserEmail) {
        return next(createHttpError(409, "A user with this email already exists!"));
    }
    value.emailVerificationNumber = Math.floor(Math.random() * 599) + 900;

    // value.emailVerificationNumber = Math.floor(Math.random() * 899999999) + 100000000;
    value.emailVerificationNumberGeneratedAt = new Date().toISOString();

    try {
        var user = await prisma.user.update({
            where: {
                id: req.tokenData.userId
            },
            data: value
        });

        delete user.password;

        emailVerification(value.name + ' ' + value.surname, value.email, value.emailVerificationNumber);

        req.body.tokenData = user;
        return next();
    } catch (error) {
        console.log(error);
        return next(createHttpError());
    }
}

async function forgotPassword(req, res, next) {
    const schema = Joi.object({
        email: Joi.string().email().required()
    })
    var { error, value } = schema.validate(req.body);
    if (error) {
        return next(createHttpError(400, error.message));
    }
    console.log(req, "check req")
    const user = await prisma.user.findFirst({
        where: { email: req.body.email }
    })
    console.log(user, "check user")
    if (!user) {
        return next(createHttpError(401, "Invalid email"));
    }

    let token = Math.floor(Math.random() * 599) + 900;
    let updatedUser = await prisma.user.update({
        where: {
            email: req.body.email
        },
        data: { passwordUpdateToken: token }
    })
    passReset(req.body.email, token, user.surname)
    res.json({
        message: "Password verification token sent"
    })

}

async function resetPassword(req, res, next) {
    const schema = Joi.object({
        token: Joi.string().required()
            .min(4)
        ,
        email: Joi.string().email().required(),
        password: Joi.string().required(),
        confirmPassword: Joi.string().required(),
    })

    var { error, value } = schema.validate(req.body);
    if (error) {
        return next(createHttpError(400, error.message));
    }
    const salt = await bcrypt.genSalt(10);
    let newPass = await bcrypt.hash(req.body.password, salt);
    var existUser = await prisma.user.findFirst({ where: { email: req.body.email, passwordUpdateToken: Number(req.body.token) } })
    if (!existUser) {
        return next(createHttpError(401, "Invalid email or token!"));
    }
    var user = await prisma.user.update({
        where: {
            email: req.body.email
        },
        data: {
            password: newPass,
            passwordUpdateToken: 0
        }
    })
    res.json({
        message: "Password updated successfully"
    })
}

async function images(req, res, next) {

    const form = formidable({ multiples: true });

    form.parse(req, async (err, fields, files) => {
        if (err) {
            next(err);
            return;
        }
        if (!files.image) {
            console.log('No Image field on form');
            next(createHttpError(400, 'No Image field on form'));
        } else {
            console.log(files.image, "files.image")
            console.log(files.image.filepath);
            var oldpath = files.image.filepath;
            console.log(req.tokenData, "check user id")
            let newFilename = `${req.tokenData.userId}.png`
            var newpath = './userImage/' + req.tokenData.userId + '.png';
            console.log(newpath, "check new path")
            let imagePath = './userImage/' + newFilename
            fs.rename(oldpath, newpath, function (err) {
                // if (err) next(err);
                // res.json({ message: "Image uploaded successfully!", data: files.image });
                // res.end();
            });
            const uploadParams = {
                // Bucket: 'temp-video',
                Bucket: 'profileimages',
                Key: newFilename,
                Body: fs.createReadStream(imagePath),
            };
            const uploadResult = await spaces
                .upload({
                    ...uploadParams,
                    ContentType: 'image/png',
                    ACL: 'public-read',
                }).promise()

            //   let checkimageUrl = (imageUrl) => {
            //     if (!imageUrl.startsWith('https://profileimages.')) {
            //       imageUrl = 'https://profileimages.' + imageUrl;
            //     }
            //     // also check if/profileimages/profileimages/ remove  one /profileimages/
            //     if (imageUrl.includes('profileimages/profileimages/')) {
            //       imageUrl = imageUrl.replace(
            //         'profileimages/profileimages/',
            //         'profileimages/',
            //       );

            //       // check string nyc3 and replace with nyc3.cdn
            //       if (imageUrl.includes('nyc3')) {
            //         imageUrl = imageUrl.replace('nyc3', 'nyc3.cdn');
            //       }
            //     }

            //     return imageUrl;
            //   };

            console.log(uploadResult, "uploadResult")
            //   const imageUrl = await checkimageUrl(uploadResult.Location);
            //   console.log(imageUrl,"check image url")
            await prisma.user.update({
                where: {
                    id: req.tokenData.userId,
                },
                data: {
                    profile_image: uploadResult.Location
                }
            })
            res.json({ message: "Image uploaded successfully!", data: files.image });



        }
    });
}


async function generateSig({ name, descr, method }) {
    // Replace with your actual API key
    const secretKey = '71614030f8'; // Replace with your actual secret key
    function generateSignature(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});
        const queryString = new URLSearchParams(sortedParams).toString();
        const message = secretKey + queryString;
        const signature = crypto.createHash('md5').update(message).digest('hex');
        return signature;
    }
    const sig = generateSignature({
        descr: descr,
        key: apiKey,
        method: method,
        name: name,
        type: 'video'
    });
    console.log(sig);
    return sig
}

async function getCurrentActivePlan(req, res, next) {
    console.log(process.env.FREE_STORAGE,"process.env.FREE_STORAGE")
    userId = req.tokenData.userId
    let activePlan = await prisma.subscriptions.findFirst({
        where: {
            userId: userId,
            status: SubscriptionStatus.active
        },
        include: {
            subscriptionPlan: true
        },
        orderBy: {
          createdAt: "desc",
        },
    })
    // console.log(activePlan, "activePlan")

    if (!activePlan) {
        let usageTable = await prisma.usageTable.findFirst({
            where: {
                userId: userId,
                subscriptionId: null
            }
        })
        let freePlanObj = {
            bandwidth: process.env.FREE_BANDWIDTH / 1024,
            name: 'Free',
            storage: process.env.FREE_STORAGE / 1024,
            price: '0'
        }
        let objToSend = {
            planId: freePlanObj,
            storageLeft: '',
            storageUsed: '',
            bandwidthLeft: process.env.FREE_BANDWIDTH / 1024,
            willEndOn: '',
            recur: null,
            totalStorage:process.env.FREE_STORAGE
        }
        if(!usageTable){
            let usageTable = await prisma.usageTable.findMany({
                where: {
                    userId: userId,
                    subscription:{
                        status:SubscriptionStatus.expired
                    }
                },
                orderBy:{
                    createdAt:'desc'
                }
            })
            // console.log(usageTable[0].left,"usageTable[0].left")
            // console.log(String(Number(process.env.FREE_STORAGE) - Number(usageTable[0].left)),"String(Number(process.env.FREE_STORAGE) - Number(usageTable[0].left))")
            objToSend.storageLeft = String(usageTable[0].left)
            // objToSend.storageUsed = String(Number(process.env.FREE_STORAGE) - Number(usageTable[0].used))     
            objToSend.storageUsed = String(usageTable[0].used)     
            objToSend.willEndOn = String(usageTable[0].to)
        }else{
            objToSend.storageLeft = String(usageTable.left) 
            // objToSend.storageUsed = String(Number(process.env.FREE_STORAGE) - Number(usageTable.used))
            objToSend.storageUsed = String(usageTable.used)
            objToSend.willEndOn =  String(usageTable.to)
        }
        // console.log(objToSend, "objToSend")
        await res.json({
            data: objToSend,
            // message: "No active Subscription"
        })
    } else {
        console.log(userId,"userId")
        let subscription = await prisma.subscriptions.findFirst({
            where: {
                userId: userId,
                status: SubscriptionStatus.active
            },
            orderBy:{
                createdAt:'desc'
            }
        })
        console.log(subscription,"subscription")
        let usageTable = await prisma.usageTable.findMany({
            where: {
                userId: userId,
                subscriptionId: subscription.id
            },
            orderBy: {
                createdAt: 'desc'
            }
        })
        // console.log(usageTable,"ceheck usage table")
        let totalPlanBandwidth = activePlan.subscriptionPlan.bandwidth
        let bandwidthLeft = totalPlanBandwidth
        let objToSend = {
            planId: activePlan.subscriptionPlan,
            storageLeft: String(usageTable[0].left),
            bandwidthLeft: bandwidthLeft,
            // storageUsed: String(Number(activePlan.subscriptionPlan.storage * 1024) - Number(usageTable[0].left)),
            storageUsed: String(usageTable[0].used),
            totalStorage:String(usageTable[0].total),
            willEndOn: String(usageTable[0].to),
            recur: activePlan.recur,
        }
        // console.log(objToSend, "objToSend")
        await res.json({
            data: objToSend
        })
    }
}
async function getAllPayments(req, res, next) {
    const title = (req.query.title || '').replace(/\s/g, '').toLowerCase();
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    // await prisma.paymentTable.findMany({
    //     skip: page - 1 >= 0 ? (page - 1) * limit : 0,
    //     take: limit,
    //     where: {
    //         subscription: {
    //             userId: userId
    //         },
    //     },
    //     include:{
    //         subscription:{
    //             include:{
    //                 subscriptionPlan:true
    //             }
    //         }
    //     },
    //     orderBy: {
    //         createdAt: 'desc',
    //     },
    // })
    const query = {
        skip: page - 1 >= 0 ? (page - 1) * limit : 0,
        take: limit,
        where: {
            subscription: {
                userId: userId
            },
            // Title: {
            //     contains: title || '',
            // },
        },
        include:{
            subscription:{
                include:{
                    subscriptionPlan:true
                }
            }
        },
        orderBy: {
            createdAt: 'desc',
        },
    }
    const [payments, count] = await prisma.$transaction([
        prisma.paymentTable.findMany(query),
        prisma.paymentTable.count({ where: query.where })
    ]);
const serializedPayments = await payments.map(payment => ({
    ...payment,
    subscription: {
      ...payment.subscription,
      willEndAt:payment.subscription.willEndAt.toString(),
      subscriptionPlan: {
        ...payment.subscription.subscriptionPlan
      }
    }
  }));
    // console.log(serializedPayments, "serializedPayments")
    return await res.status(200).json({ data: { results: serializedPayments, totalRecords: count } });
}

async function updateUser(req, res, next){
    let user = await prisma.user.findFirst({
        where:{
            id:Number(req.tokenData.userId)
        }
    })
      const { id, email, name, type, emailVerified, surname, dateOfBirth,profile_image,bucketId,stripeCustomerId,invoice_address,premiumUser } =
      user;
      const token =  jwt.sign(
        {
          userId: id,
          userEmail: email,
          userName: name,
          userSurname: surname,
          userBirthDate: dateOfBirth,
          userType: type,
          emailVerify: emailVerified,
          profileImage:profile_image,
          bucketId,
          stripeCustomerId,
          invoice_address,
          premiumUser:true
        },
        'YOUR_SECRET_KEY',
      );
      console.log(token,"token")
      await res.json({ access_token: token });
}

module.exports = {
    signup,
    verifyEmail,
    login,
    update,
    images,
    createZone,
    generateSig,
    forgotPassword,
    resetPassword,
    getCurrentActivePlan,
    getAllPayments,
    updateUser
}