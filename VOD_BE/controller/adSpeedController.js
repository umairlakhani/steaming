const createHttpError = require("http-errors");
const Joi = require("joi");
const { PrismaClient, Prisma, ZoneType } = require("@prisma/client");
const formidable = require("formidable");
// const fs = require('fs');
const { getVideoDurationInSeconds } = require("get-video-duration");
const request = require("request");
const prisma = require('../prisma/client');
const AWS = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const crypto = require("crypto");
const createVast = require("vast-builder");
const apiKey = "ff64f0543a6b737dca0e7d5e8688bce1";
const fs = require("fs");
const secretKey = "71614030f8";

const { Queue, Worker } = require("bullmq");
const { default: axios } = require("axios");
const {
  generateTokenToEditAd,
  generateEditAdSig,
  generateDeleteAdSignature,
} = require("../signatures/adSpeedSignatures");
const { json } = require("body-parser");
const { generateSig } = require("./usersController");
const { ExtractZoneTag } = require("./zoneController");
const { getBucketCurrentStorage } = require("./storageController");
const redisConfig = require("../utils/redisConfig");

const adsVideoQueue = new Queue("adsVideoQueue", {
  connection: redisConfig,
});
// const videoQueue = new Queue('videoQueue', {
//   connection: {
//     host: process.env.REDIS_HOST,
//     port: process.env.REDIS_PORT,
//   },
// })

// Create a new instance of the S3 service
// const spaces = new AWS.S3({
//   signatureVersion: 'v4',
//   params: {
//     acl: 'public-read',
//   },
// });
async function generateSignatureForVideoAds({
  name,
  clickurl,
  videourl,
  method,
  weight,
  skippable,
}) {
  // Replace with your actual API key
  const secretKey = "71614030f8"; // Replace with your actual secret key
  function generateSignature(params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    const queryString = new URLSearchParams(sortedParams).toString();
    const message = secretKey + queryString;
    const signature = crypto.createHash("md5").update(message).digest("hex");
    return signature;
  }
  const sig = generateSignature({
    clickurl: clickurl,
    key: apiKey,
    method: method,
    name: name,
    videourl: videourl,
    weight: weight,
    skippable: skippable,
  });
  console.log(sig);
  return sig;
}

async function generateWrapperSig({ name, wrapperurl, method }) {
  // Replace with your actual API key
  const secretKey = "71614030f8"; // Replace with your actual secret key
  function generateSignature(params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    const queryString = new URLSearchParams(sortedParams).toString();
    const message = secretKey + queryString;
    const signature = crypto.createHash("md5").update(message).digest("hex");
    return signature;
  }
  const sig = generateSignature({
    key: apiKey,
    method: method,
    name: name,
    wrapperurl: wrapperurl,
  });
  console.log(sig);
  return sig;
}
async function generateRestrictionSig({ ad, type, value, method,token }) {
  // Replace with your actual API key
  const secretKey = "71614030f8"; // Replace with your actual secret key
  function generateSignature(params) {
    console.log("params", params);
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    const queryString = new URLSearchParams(sortedParams).toString();
    const message = secretKey + queryString;
    const signature = crypto.createHash("md5").update(message).digest("hex");
    return signature;
  }
  const sig = generateSignature({
    ad,
    type,
    value,
    key: apiKey,
    token,
    method,
  });
  console.log(sig);
  return sig;
}

async function creaVideoAds({ clickurl, name, videourl, weight, skippable }) {
  console.log(name, "name");
  const signature = await generateSignatureForVideoAds({
    clickurl: clickurl,
    method: "AS.Ads.createVideo",
    name: name,
    videourl: videourl,
    weight: weight,
    skippable: skippable,
  });

  let formData = {};
  formData.clickurl = clickurl;
  formData.key = apiKey;
  formData.method = "AS.Ads.createVideo";
  formData.name = name;
  formData.videourl = videourl;
  formData.sig = signature;
  formData.weight = weight;
  formData.skippable = skippable;

  try {
    const createVideoAd = await axios.post(
      `https://api.adspeed.com`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "*/*",
        },
      }
    );

    console.log(createVideoAd, "Vide create");

    return await createVideoAd.data;
  } catch (error) {
    console.log(error, "Error in creating url");
    // return res.status(500)
  }
}

async function create(req, res, next) {
  // console.log(req,"check req")
  console.log("in create function");
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    videoId: Joi.string().min(1).max(200).required(),
    skipAd: Joi.boolean().required(),
    clickurl: Joi.optional(),
    videourl: Joi.string().required(),
    // wrapperUrl:Joi.string().allow(""),
    size: Joi.number().required(),
    length: Joi.required(),
    type: Joi.string().valid("broadcasting", "video", "both").required(),
    weight: Joi.string().required(),
    skippable: Joi.optional(),
    duration: Joi.number().required(),
  });
  // console.log(schema,"Schema")
  // console.log(req.body['videourl'], "check videourl")
  console.log(req.body["duration"], "req.body['duration']");
  var { error, value } = schema.validate(req.body);
  if (error) {
    console.log(error);
    return next(createHttpError(400, error.message));
  }
  console.log(value.videourl, "videourl");

  console.log(value, "value");

  value.userId = req.tokenData.userId;

  try {
    let zone;
    let videoZone;
    let broadcastZone;
    let zoneExists;
    let videoZoneExists;
    let broadcastingZoneExists;

    console.log(ZoneType.both, "ZoneType.both");
    console.log(value.type, "value.type");
    if (value.type != ZoneType.both) {
      zoneExists = await prisma.zones.findFirst({
        where: {
          userId: req.tokenData.userId,
          type: value.type,
        },
      });
      if (!zoneExists) {
        const signature = await generateSig({
          descr: `${value.name} ${value.type} description`,
          name: value.type,
          method: "AS.Zones.create",
        });
        console.log(signature, "sig");
        let data = {};
        data.descr = `${value.name} ${value.type} description`;
        data.key = apiKey;
        data.method = "AS.Zones.create";
        data.name = value.type;
        data.sig = signature;
        data.type = value.type;

        console.log(data, "check data");
        const createdZone = await axios.post(`https://api.adspeed.com`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "*/*",
          },
        });
        console.log(createdZone.data, "createdZone");
        const startIndex = createdZone.data.indexOf("Zone id=");
        const endIndex = createdZone.data.indexOf(
          '"',
          startIndex + "Zone id=".length + 2
        );
        const zoneId = createdZone.data.substring(
          startIndex + "<Zone id=".length,
          endIndex
        );
        console.log(await zoneId, "check zone id extracted");

        let zoneVastUrl = await ExtractZoneTag({
          zoneId: zoneId,
          zoneName: value.type,
        });
        zone = await prisma.zones.create({
          data: {
            userId: req.tokenData.userId,
            zoneRes: createdZone.data,
            adSpeedZoneId: zoneId,
            zoneName: value.type,
            description: `${value.name} ${value.type} description`,
            // secondaryZone: value.secondaryZone,
            type: value.type,
            vastUrl: zoneVastUrl,
          },
        });
      } else {
        zone = zoneExists;
      }
    } else {
      videoZoneExists = await prisma.zones.findFirst({
        where: {
          userId: req.tokenData.userId,
          type: ZoneType.video,
        },
      });
      broadcastingZoneExists = await prisma.zones.findFirst({
        where: {
          userId: req.tokenData.userId,
          type: ZoneType.broadcasting,
        },
      });
      if (!videoZoneExists) {
        const signature = await generateSig({
          descr: `${value.name} ${ZoneType.video} description`,
          name: ZoneType.video,
          method: "AS.Zones.create",
        });
        console.log(signature, "sig");
        let data = {};
        data.descr = `${value.name} ${ZoneType.video} description`;
        data.key = apiKey;
        data.method = "AS.Zones.create";
        data.name = ZoneType.video;
        data.sig = signature;
        data.type = ZoneType.video;

        console.log(data, "check data");
        const createdZone = await axios.post(`https://api.adspeed.com`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "*/*",
          },
        });
        console.log(createdZone.data, "createdZone");
        const startIndex = createdZone.data.indexOf("Zone id=");
        const endIndex = createdZone.data.indexOf(
          '"',
          startIndex + "Zone id=".length + 2
        );
        const zoneId = createdZone.data.substring(
          startIndex + "<Zone id=".length,
          endIndex
        );
        console.log(await zoneId, "check zone id extracted");

        let zoneVastUrl = await ExtractZoneTag({
          zoneId: zoneId,
          zoneName: ZoneType.video,
        });
        videoZone = await prisma.zones.create({
          data: {
            userId: req.tokenData.userId,
            zoneRes: createdZone.data,
            adSpeedZoneId: zoneId,
            zoneName: ZoneType.video,
            description: `${value.name} ${ZoneType.video} description`,
            // secondaryZone: value.secondaryZone,
            type: ZoneType.video,
            vastUrl: zoneVastUrl,
          },
        });
      } else {
        videoZone = videoZoneExists;
      }
      if (!broadcastingZoneExists) {
        const signature = await generateSig({
          descr: `${value.name} ${ZoneType.broadcasting} description`,
          name: ZoneType.broadcasting,
          method: "AS.Zones.create",
        });
        console.log(signature, "sig");
        let data = {};
        data.descr = `${value.name} ${ZoneType.broadcasting} description`;
        data.key = apiKey;
        data.method = "AS.Zones.create";
        data.name = ZoneType.broadcasting;
        data.sig = signature;
        data.type = ZoneType.video;

        console.log(data, "check data");
        const createdZone = await axios.post(`https://api.adspeed.com`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Accept: "*/*",
          },
        });
        console.log(createdZone.data, "createdZone");
        const startIndex = createdZone.data.indexOf("Zone id=");
        const endIndex = createdZone.data.indexOf(
          '"',
          startIndex + "Zone id=".length + 2
        );
        const zoneId = createdZone.data.substring(
          startIndex + "<Zone id=".length,
          endIndex
        );
        console.log(await zoneId, "check zone id extracted");

        let zoneVastUrl = await ExtractZoneTag({
          zoneId: zoneId,
          zoneName: ZoneType.broadcasting,
        });
        broadcastZone = await prisma.zones.create({
          data: {
            userId: req.tokenData.userId,
            zoneRes: createdZone.data,
            adSpeedZoneId: zoneId,
            zoneName: ZoneType.broadcasting,
            description: `${value.name} ${ZoneType.broadcasting} description`,
            // secondaryZone: value.secondaryZone,
            type: ZoneType.broadcasting,
            vastUrl: zoneVastUrl,
          },
        });
      } else {
        broadcastZone = broadcastingZoneExists;
      }
    }
    console.log(
      `${req.body["videourl"]}?width=1280&height=720&sec=20`,
      "`${req.body['videourl']}?width=1280&height=720&sec=20`"
    );
    const response = await creaVideoAds({
      clickurl: req.body["clickurl"],
      name: req.body["name"],
      videourl: `${req.body["videourl"]}?width=1280&height=720&sec=${req.body["duration"]}`,
      weight: req.body["weight"],
      skippable: req.body["skippable"],
    });
    console.log(response, "response");
    if (response.search("Error") == -1) {
      const startIndex = await response.indexOf("Ad id=");
      const endIndex = await response.indexOf(
        '"',
        startIndex + "Ad id=".length + 2
      );
      const AdId = await response.substring(
        startIndex + "<Ad id=".length,
        endIndex
      );
      console.log(AdId, "AdId");
      if (value.type == ZoneType.both) {
        console.log(req.body["name"], "req.body['name']");
        let resp = await linkZoneToAd({
          adId: AdId,
          adName: req.body["name"],
          zoneName: ZoneType.video,
          zoneId: videoZone.adSpeedZoneId,
        });
        // let respRes = await addAdRestriction({
        //   adId: AdId,
        //   adName: req.body["name"],
        //   zoneName: ZoneType.video,
        //   zoneId: videoZone.adSpeedZoneId,
        //   restrictionType: "country",
        //   restrictionValue: "US",
        // });

        if (resp.search("Error") == -1) {
        } else {
          return next(createHttpError("Error linking to zone ."));
        }
        let response = await linkZoneToAd({
          adId: AdId,
          adName: req.body["name"],
          zoneName: ZoneType.broadcasting,
          zoneId: broadcastZone.adSpeedZoneId,
        });
        if (response.search("Error") != -1) {
          return next(createHttpError("Error linking to zone ."));
        }
        const schem = {
          adType: ZoneType.both,
          adName: req.body["name"],
          videoId: req.body["videoId"],
          videoUrl: req.body["videourl"],
          length: req.body["length"],
          size: req.body["size"],
          skipAd: req.body["skipAd"],
          clickurl: req.body["clickurl"],
          userId: req.tokenData.userId,
          adspeedAdId: AdId,
          zoneId: videoZone.id,
          skippable: req.body["skippable"] == "" ? null : req.body["skippable"],
          weight: req.body["weight"],
        };

        var adVideo = await prisma.adVideo.create({
          data: schem,
        });
        console.log(adVideo, "addVideo created successfully");
        var adSpeed = await prisma.adSpeed.create({
          data: {
            adVideoId: adVideo.id,
            adRes: resp,
            adSpeedAdId: AdId,
            adName: req.body["name"],
            userId: req.tokenData.userId,
          },
        });
      } else {
        let resp = await linkZoneToAd({
          adId: AdId,
          adName: value.name,
          zoneName: value.type,
          zoneId: zone.adSpeedZoneId,
        });
        if (resp.search("Error") == -1) {
          const schem = {
            adType: req.body["method"],
            videoId: req.body["videoId"],
            videoUrl: req.body["videourl"],
            length: req.body["length"],
            size: req.body["size"],
            skipAd: req.body["skipAd"],
            clickurl: req.body["clickurl"],
            userId: req.tokenData.userId,
            adspeedAdId: AdId,
            zoneId: zone.id,
          };
          var adVideo = await prisma.adVideo.create({
            data: schem,
          });
          console.log(adVideo, "addVideo created successfully");
          var adSpeed = await prisma.adSpeed.create({
            data: {
              adVideoId: adVideo.id,
              adRes: response,
              adSpeedAdId: AdId,
              adName: req.body["name"],
              userId: req.tokenData.userId,
            },
          });
        } else {
          return next(createHttpError("Error linking to zone ."));
        }
      }
      res.status(200).json({
        data: response,
      });
    } else {
      return next(createHttpError("Error creating adspeed video"));
    }
    console.log(req.body["length"], "check length of the video");
    console.log(req.body["duration"], "req.body['duration']`");
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}
async function generateLinkToZoneSig({ zoneId, adId, token }) {
  function generateSignature(params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    const queryString = new URLSearchParams(sortedParams).toString();
    const message = secretKey + queryString;
    const signature = crypto.createHash("md5").update(message).digest("hex");
    return signature;
  }
  const sig = generateSignature({
    ad: adId,
    key: apiKey,
    method: "AS.Ad.linkToZone",
    token: token,
    zone: zoneId,
  });
  console.log(sig);
  return sig;
}
async function generateSigToGetAllAds({ zone, token }) {
  function generateSignature(params) {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        acc[key] = params[key];
        return acc;
      }, {});
    const queryString = new URLSearchParams(sortedParams).toString();
    const message = secretKey + queryString;
    const signature = crypto.createHash("md5").update(message).digest("hex");
    return signature;
  }
  const sig = generateSignature({
    key: apiKey,
    method: "AS.Zone.getInfo",
    token: token,
    zone: zone,
  });
  console.log(sig);
  return sig;
}
function generateSignature(params) {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
  const queryString = new URLSearchParams(sortedParams).toString();
  const message = secretKey + queryString;
  const signature = crypto.createHash("md5").update(message).digest("hex");
  return signature;
}
async function generateToken({ adId, adName, zoneId, zoneName }) {
  const sig = generateSignature({
    adId: adId,
    adName: adName,
    key: apiKey,
    method: "AS.Ad.linkToZone",
    zoneId: zoneId,
    zoneName: zoneName,
  });
  console.log(sig);
  return sig;
}
async function md5(content) {
  return crypto.createHash("md5").update(content).digest("hex");
}
async function linkZoneToAd({ adId, adName, zoneId, zoneName }) {
  // let token = await generateToken({adId:adId,adName:adName,zoneId:zoneId,zoneName:zoneName})
  console.log(adId, "adId");
  console.log(adName, "adName");
  console.log(zoneId, "zoneId");
  console.log(zoneName, "zoneName");
  let content = adId + adName + zoneId + zoneName;
  const token = await md5(content);
  let sig = await generateLinkToZoneSig({
    adId: adId,
    token: token,
    zoneId: zoneId,
  });
  let data = {};
  data.ad = adId;
  data.key = apiKey;
  data.method = "AS.Ad.linkToZone";
  data.sig = sig;
  data.token = token;
  data.zone = zoneId;

  try {
    const linkZone = await axios.get(
      `https://api.adspeed.com?ad=${adId}&key=${apiKey}&method=AS.Ad.linkToZone&token=${token}&zone=${zoneId}&sig=${sig}`
    );
    console.log(linkZone.data, "linkZone.data");
    return linkZone.data;
  } catch (err) {
    console.log(err, "err in link to zone");
  }
}

async function addAdRestriction({
  adId,
  adName,
  zoneName,
  zoneId,
  restrictionType,
  restrictionValue,
}) {
  try {
    let content = adId + adName;
    const token = crypto.createHash("md5").update(content).digest("hex");
    const sig = await generateRestrictionSig({
      ad: adId,
      token,
      type: restrictionType,
      value: restrictionValue,
      method: "AS.Ad.addRestriction",
    });

    const queryParams = {
      ad: adId,
      key: apiKey,
      method: "AS.Ad.addRestriction",
      token: token,
      type: restrictionType,
      value: restrictionValue,
      sig: sig,
    };
    console.log("queryParams", queryParams);

    const addRestriction = await axios.get(
      `https://api.adspeed.com?ad=${adId}&key=${apiKey}&method=AS.Ad.addRestriction&token=${token}&type=${restrictionType}&value=${restrictionValue}&sig=${sig}`
    );
    console.log(addRestriction, "addRestriction");
    console.log(addRestriction.data, "addRestriction.data");
    return addRestriction.data;
  } catch (err) {
    console.error("Error in adding ad restriction:", err);
    throw err;
  }
}

async function createWrapperAd(req, res, next) {
  console.log("in create wrapper function");
  const schema = Joi.object({
    name: Joi.string().min(1).max(200).required(),
    skipAd: Joi.boolean().required(),
    type: Joi.string().required(),
    wrapperUrl: Joi.string().required(),
    clickurl: Joi.string().allow(""),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    console.log(error, "thisa===============");
    return next(createHttpError(400, error.message));
  }

  value.userId = req.tokenData.userId;
  const schem = {
    adType: req.body["method"],
    clickurl: req.body["clickurl"],
    wrapperUrl: req.body["wrapperUrl"],
    skipAd: req.body["skipAd"],
    userId: req.tokenData.userId,
  };
  console.log(schema, "check schema creating");
  try {
    var adVideo = await prisma.adVideo.create({
      data: schem,
    });
    console.log(adVideo, "addVideo created successfully");
    const signature = await generateWrapperSig({
      method: "AS.Ads.createVASTWrapper",
      name: req.body["name"],
      wrapperurl: req.body["wrapperUrl"],
    });
    const userZone = await prisma.zones.findFirst({
      where: { userId: req.tokenData.userId },
    });
    let formData = {};
    formData.key = apiKey;
    formData.method = "AS.Ads.createVASTWrapper";
    formData.name = req.body["name"];
    formData.sig = signature;
    formData.wrapperurl = req.body["wrapperUrl"];
    // formData.wrapperurl = uploadResult.Location

    const createVideoAd = await axios.post(
      `https://api.adspeed.com`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Accept: "*/*",
        },
      }
    );
    const startIndex = await createVideoAd.data.indexOf("Ad id=");
    const endIndex = await createVideoAd.data.indexOf(
      '"',
      startIndex + "Ad id=".length + 2
    );
    const AdId = await createVideoAd.data.substring(
      startIndex + "<Ad id=".length,
      endIndex
    );
    var adSpeed = await prisma.adSpeed.create({
      data: {
        adVideoId: adVideo.id,
        adRes: createVideoAd.data,
        adSpeedAdId: AdId,
        adName: req.body["name"],
        userId: req.tokenData.userId,
      },
    });
    console.log(adSpeed, "adSpeed");

    await linkZoneToAd({
      adId: AdId,
      adName: req.body["name"],
      zoneName: userZone.zoneName,
      zoneId: userZone.adSpeedZoneId,
    });
    res.status(200).json({
      data: createVideoAd.data,
    });
  } catch (err) {
    console.log(err);
  }
}
async function generateTokenToGetList({ zoneId, zoneName }) {
  let content = zoneId + zoneName;
  return crypto.createHash("md5").update(content).digest("hex");
  // const token = await md5(content)
  // return token
}
async function getAdList(req, res, next) {
  let zoneId = req.params["zoneId"];
  let zoneName = req.params["zoneName"];
  let token = generateTokenToGetList({ zoneId: zoneId, zoneName: zoneName });
  const sig = generateSigToGetAllAds({ zone: zoneId, token: token });
  try {
    const getAllAds = await axios.get(
      `https://api.adspeed.com?key=${apiKey}&method=AS.Zone.getInfo&sig=${sig}&token=${token}&zone=${zoneId}`
    );
    console.log(getAllAds, "getAllAds");
    res.json({
      data: getAllAds.data,
    });
  } catch (err) {
    console.log(err, "err in get ads");
  }
}
async function getAllAds(req, res, next) {
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");

  const query = {
    skip: page - 1 >= 0 ? (page - 1) * limit : 0,
    take: limit,
    where: { userId: req.tokenData.userId, deleted: false },
    include: { adSpeed: true },
    orderBy: {
      createdAt: "desc",
    },
  };
  const [allAds, count] = await prisma.$transaction([
    prisma.adVideo.findMany(query),
    prisma.adVideo.count({ where: query.where }),
  ]);

  res.json({
    data: { results: allAds, totalRecords: count },
  });
}

async function deleteAd(req, res, next) {
  const schema = Joi.object({
    id: Joi.number().required(),
  });
  var { error, value } = schema.validate(req.body);

  if (error) {
    console.log(error);
    return next(createHttpError(400, error.message));
  }
  const ad = await prisma.adVideo.findUnique({
    where: { id: Number(req.body["id"]) },
  });
  if (!ad) {
    return next(createHttpError(401, "No ad found"));
  }
  console.log(ad, "check ad");
  let content = ad.adspeedAdId + ad.adName;
  let token = await generateTokenToEditAd(content);
  let signature = await generateDeleteAdSignature({
    adId: ad.adspeedAdId,
    adName: ad.adName,
    key: apiKey,
    token: token,
  });
  let data = {
    ad: ad.adspeedAdId,
    key: apiKey,
    method: "AS.Ad.edit",
    name: ad.adName,
    token: token,
    sig: signature,
    status: "deleted",
  };
  console.log(data, "check data sending");
  try {
    const deleteAd = await axios.post(`https://api.adspeed.com`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "*/*",
      },
    });
    console.log(deleteAd.data, "deleteAd");
    const del = await prisma.adVideo.update({
      where: { id: ad.id },
      data: {
        deleted: true,
      },
    });
    await res.json({ message: "Ad deleted successfully" });
  } catch (err) {
    console.log(err, "error in delete ad");
    next(err);
  }
}

async function getAd(req, res, next) {
  // let id = req.params['id']
  // const Ad = await prisma.adSpeed.findUnique({
  //   where: { id: Number(id) },
  //   include: { video: true }
  // })
  // if (!Ad) {
  //   return next(createHttpError());
  // }
  // res.json({
  //   data: Ad
  // })
  let adVideoId = req.params["id"];
  let adVideo = await prisma.adVideo.findFirst({
    where: {
      id: Number(adVideoId),
    },
  });
  if (!adVideo) {
    return next(createHttpError("No Ad video found with this id"));
  }
  await res.json({
    data: adVideo,
  });
}

async function editAd(req, res, next) {
  console.log("in create wrapper function");
  const schema = Joi.object({
    // name: Joi.string().min(1).max(200).required(),
    ad: Joi.string().min(1).max(200).required(),
    adVideoId: Joi.number().required(),
    // clickurl: Joi.string().required(),
    // height: Joi.string().allow(""),
    name: Joi.string().required(),
    weight: Joi.string().required(),
    // width: Joi.string().allow(""),
    originalName: Joi.string().required(),
    skipAd: Joi.boolean().required(),
    skippable: Joi.optional(),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    console.log(error);
    return next(createHttpError(400, error.message));
  }

  value.userId = req.tokenData.userId;
  let ad = req.body["ad"];
  // let clickurl = req.body['clickurl']
  let height = req.body["height"];
  let name = req.body["name"];
  let weight = req.body["weight"];
  let width = req.body["width"];
  // { ad, clickurl, height, name, weight, width }
  // console.log(ad, "check ad id")
  console.log(value, "check values");
  const record = await prisma.adVideo.findFirst({
    where: {
      id: Number(value.adVideoId),
    },
  });
  if (!record) {
    return next(createHttpError(401, "No Ad found!"));
  }
  console.log(value.weight, "value.weight");
  console.log(record, "check record");
  console.log(ad, "check ad id");
  console.log(name, "check name");
  let content = ad + req.body["originalName"];

  const token = await generateTokenToEditAd(content);
  const sig = await generateEditAdSig({
    adId: ad,
    adName: name,
    height: height,
    key: apiKey,
    token: token,
    weight: weight,
    width: width,
    skippable: Number(req.body["skippable"]),
  });
  let data = {
    ad: ad,
    // clickurl: clickurl,
    // height: height,
    key: apiKey,
    method: "AS.Ad.edit",
    name: name,
    sig: sig,
    token: token,
    weight: weight,
    // skippable:Number(req.body['skippable'])
    // width: width
  };
  console.log(data, "check data sending");
  try {
    const editAd = await axios.post(`https://api.adspeed.com`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "*/*",
      },
    });
    console.log(editAd, "editAd");
    console.log(editAd.status, "editAdStatus");
    if (editAd.data.search("Error") == -1) {
      const updatedAd = await prisma.adVideo.update({
        where: {
          id: value.adVideoId,
        },
        data: {
          // adName: name,
          // adRes: editAd.data,

          adName: value.name,
          weight: value.weight,
          skipAd: value.skipAd,
          skippable: value.skippable == "" ? null : Number(value.skippable),
        },
      });
      console.log(updatedAd, "updatedAd");
    } else {
      return next(createHttpError("Error updating zone."));
    }
    await res.json({
      data: editAd.data,
    });
  } catch (err) {
    console.log(err, "err in get ads");
  }
}

async function generateWrapper({ name, length, videourl }) {
  const vast3 = createVast.v3();
  vast3
    .attachAd()
    .attachInLine()
    .addImpression("imp_link")
    .addAdSystem("Society")
    .addAdTitle(name)
    .attachCreatives()
    .attachCreative()
    .attachLinear()
    .attachTrackingEvents()
    .attachTracking("content", { event: "start" })
    .back()
    .addDuration(length)
    .attachMediaFiles()
    .attachMediaFile(videourl, {
      delivery: "streaming",
      type: "video/mp4",
      width: "600",
      height: "400",
    })
    .back()
    .attachIcons()
    .attachIcon({
      program: "my_program",
      width: "50",
      height: "50",
      xPosition: "bottom",
      yPosition: "left",
    })
    .attachStaticResource("ressource_link", { creativeType: "image/jpeg" });

  const render = vast3.toXml();
  return await render;
}

async function uploadWrapperVideo(req, res, next) {
  try {
    const form = formidable({ multiples: true });

    return form.parse(req, async (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }
      console.log("files", files);

      if (!files.video) {
        console.log("No Video field on form");
        next(createHttpError(400, "No Video field on form"));
      } else {
        // Generate a unique filename for the video
        const newFilename = files.video.newFilename + ".mp4";
        const videoPath = "./tempVideo/" + newFilename;

        // Move the uploaded video file to the temporary location
        // await fs.promises.rename(files.video.filepath, videoPath);
        await fs.promises.cp(files.video.filepath, videoPath, {
          recursive: true,
        });
        await fs.promises.rm(files.video.filepath, {
          recursive: true,
        });

        // Upload video to DigitalOcean Spaces
        const uploadParams = {
          Bucket: "wrapper-files",
          Key: newFilename,
          Body: fs.createReadStream(videoPath),
        };

        const uploadResult = await spaces
          .upload({
            ...uploadParams,
            ContentType: "video/mp4",
            //    give ACL to download video
            ACL: "public-read",
          })
          .promise();

        console.log(uploadResult.Location, "Upload result location");
        let checkvideoUrl = (videoUrl) => {
          if (!videoUrl.startsWith("https://temp-video.")) {
            videoUrl = "https://temp-video." + videoUrl;
          }
          // also check if/temp-video/temp-video/ remove  one /temp-video/
          if (videoUrl.includes("temp-video/temp-video/")) {
            videoUrl = videoUrl.replace(
              "temp-video/temp-video/",
              "temp-video/"
            );

            // check string sfo3 and replace with sfo3.cdn
            if (videoUrl.includes(`${process.env.REGION}`)) {
              videoUrl = videoUrl.replace(
                `${process.env.REGION}`,
                `${process.env.REGION}.cdn`
              );
            }
          }

          return videoUrl;
        };

        // const videoUrl = checkvideoUrl(uploadResult.Location);
        const videoUrl = uploadResult.Location;

        // Check if the upload was successful

        // Update the video link and processing status in the database
        await prisma.videoData.create({
          data: {
            videoId: newFilename,
            videoUrl: videoUrl + ".mp4",
          },
        });

        // send the video to the queue for processing
        console.log(videoUrl, "check videourl while uplloadin");

        await adsVideoQueue.add("videojob", {
          videoId: newFilename,
          videoUrl: videoUrl,
        });

        // Make a request to your server for further processing
        // This code is responsible for uploading a video to the server for processing. It is called by the /upload endpoint of the API.

        // request(
        //             `http://localhost:8000/?token=N7KTwCjYH4ZGwC4YSn3YXgxpj7x3FKj7kYTwt8EzH2ZnATUwqyUWxW5OHphO1rYJAq0pT7GJanadlA8O&videoName=${files.video.newFilename}`,
        //             function (error, response, body) {
        //               console.log('response', response);
        //               if (response?.statusCode === 200) {
        //                 res.json({
        //                   message: 'Video uploaded successfully!',
        //                   data: files.video,
        //                 });
        //                 res.end();
        //               } else {
        //                 res.status(500).json({
        //                   message: 'Video upload failed!',
        //                   data: files.video,
        //                 });
        //                 res.end();
        //               }
        //             },
        //           );
        //         } else {
        // Delete the temporary video file in case of failed upload
        await fs.promises.unlink(videoPath);

        res.status(200).json({
          message: "Video uploaded successfully!",
          data: { video: files.video, videourl: videoUrl },
        });

        res.end();
      }
    });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}
async function videoUpload(req, res, next) {
  let bucketId = req.tokenData.bucketId;
  AWS.config.update({
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
    endpoint: `https://${process.env.USER_BUCKET_URL}`,
    s3ForcePathStyle: true,
  });
  const spaces = new AWS.S3({
    signatureVersion: "v4",
    params: {
      acl: "public-read",
    },
  });
  try {
    const form = formidable({ multiples: true });

    return form.parse(req, async (err, fields, files) => {
      if (err) {
        next(err);
        return;
      }
      console.log("files", files);

      if (!files.video) {
        console.log("No Video field on form");
        next(createHttpError(400, "No Video field on form"));
      } else {
        const newFilename = files.video.newFilename + ".mp4";
        const videoPath = `./wrapper-files/` + newFilename;

        // await fs.promises.rename(files.video.filepath, videoPath);
        await fs.promises.cp(files.video.filepath, videoPath, {
          recursive: true,
        });
        await fs.promises.rm(files.video.filepath, {
          recursive: true,
        });

        console.log(newFilename, "newFilename");
        const uploadParams = {
          // Bucket: 'wrapper-files',
          Bucket: `${bucketId}`,
          Key: `${bucketId}/ads/${newFilename}`,
          Body: fs.createReadStream(videoPath),
        };

        const uploadResult = await spaces
          .upload({
            ...uploadParams,
            ContentType: "video/mp4",
            ACL: "public-read",
          })
          .promise();

        console.log(uploadResult.Location, "Location upload");
        let checkvideoUrl = (videoUrl) => {
          // if (!videoUrl.startsWith(`https://${bucketId}.`)) {
          //   videoUrl = `https://${bucketId}.` + videoUrl;
          // }
          // also check if/wrapper-files/wrapper-files/ remove  one /wrapper-files/
          if (videoUrl.includes(`${bucketId}/${bucketId}/`)) {
            videoUrl = videoUrl.replace(
              `${bucketId}/${bucketId}/`,
              `${bucketId}/`
            );
          }

          if (
            videoUrl.includes(
              `https://${process.env.REGION}.digitaloceanspaces.com/`
            )
          ) {
            videoUrl = videoUrl.replace(
              `https://${process.env.REGION}.digitaloceanspaces.com/`,
              `https://${bucketId}.${process.env.REGION}.digitaloceanspaces.com/`
            );
          }

          if (!videoUrl.includes(`https://${bucketId}`)) {
            videoUrl = `https://${bucketId}.${videoUrl}`;
          }

          //   // check string nyc3 and replace with nyc3.cdn
          //   if (videoUrl.includes('nyc3')) {
          //     videoUrl = videoUrl.replace('nyc3', 'sfo3');
          //   }
          // }
          // if (videoUrl.includes(`temp-video/${bucketId}/`)) {
          //   videoUrl = videoUrl.replace(
          //     `temp-video/${bucketId}/`,
          //     `${bucketId}/`,
          //   );
          // }

          // return `https://${bucketId}.${videoUrl}`;
          return videoUrl;
        };

        let videoUrl = checkvideoUrl(uploadResult.Location);
        console.log(videoUrl, "final videoUrl");
        // const videoUrl = `https://${bucketId}.${uploadResult.Location}`;

        await prisma.videoData.create({
          data: {
            videoId: newFilename,
            videoUrl: videoUrl,
          },
        });
        // send the video to the queue for processing
        console.log(videoUrl, "check videourl while uplloadin");

        // await adsVideoQueue.add('videojob', {
        //   videoId: newFilename,
        //   videoUrl: videoUrl,
        // });
        let storageUsed = await getBucketCurrentStorage(bucketId);
        console.log(storageUsed, "storageUsed");

        let usageTableRecord = await prisma.usageTable.findMany({
          where: {
            userId: Number(req.tokenData.userId),
            bucketId: bucketId,
          },
          orderBy: {
            createdAt: "desc",
          },
        });
        if (usageTableRecord.length > 0) {
          let bucketStorage = usageTableRecord[0].total;
          let left = Number(bucketStorage) - Number(storageUsed);

          let updatedusageRecord = await prisma.usageTable.update({
            where: {
              id: usageTableRecord[0].id,
            },
            data: {
              left: Number(left),
              used: Number(storageUsed),
            },
          });
          console.log(updatedusageRecord, "updatedusageRecord");
        }

        console.log(videoPath, "check video path unlinking");
        await fs.promises.unlink(videoPath);

        res.status(200).json({
          message: "Video uploaded successfully!",
          data: { video: files.video, videourl: videoUrl },
        });

        res.end();
      }
    });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}
module.exports = {
  create,
  videoUpload,
  creaVideoAds,
  createWrapperAd,
  getAdList,
  editAd,
  getAllAds,
  getAd,
  deleteAd,
  generateTokenToGetList,
  linkZoneToAd,
  md5,
};
