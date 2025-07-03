const createHttpError = require('http-errors');
const Joi = require('joi');
const { PrismaClient, Prisma, SubscriptionStatus } = require("@prisma/client");
const { default: axios } = require('axios');
const { generateSig } = require('./usersController');
const { generateTokenToGetList, linkZoneToAd } = require('./adSpeedController');
const crypto = require('crypto');
const { DOMParser, XMLSerializer } = require('xmldom');
const prisma = require('../prisma/client');

const apiKey = process.env.ADSPEED_API_KEY;
const secretKey = process.env.ADSPEED_SECRET_KEY;

 const videoType = {
    broadcasting: 'broadcasting',
    video: 'video'
}
async function createAdSpeedZone(req, res, next) {
    const schema = Joi.object({
        zoneName: Joi.string().required(),
        description: Joi.optional().default(""),
        type: Joi.string().required(),
        secondaryZone: Joi.optional().default(""),
    })

    var { error, value } = schema.validate(req.body);
    if (error) {
        return next(createHttpError(400, error.message));
    }

    const signature = await generateSig({ descr: "qwerty", name: value.zoneName, method: 'AS.Zones.create' })
    console.log(signature, 'sig')
    let data = {}
    data.descr = "qwerty";
    data.key = apiKey;
    data.method = 'AS.Zones.create';
    data.name = value.zoneName;
    data.sig = signature;
    data.type = value.type;

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
        console.log(await zoneId, "check zone id extracted")
        await prisma.zones.create({
            data: {
                userId: req.tokenData.userId,
                zoneRes: createdZone.data,
                adSpeedZoneId: zoneId,
                zoneName: value.zoneName,
                description: value.description,
                secondaryZone: value.secondaryZone,
                type: value.type

            }
        })
        res.json({
            message: "Zone created successfully"
        })
    }
    catch (err) {
        console.log(err, "err in create zone")
        return next(createHttpError(err.message));

    }
}

async function getUserZones(req, res, next) {
    const title = (req.query.title || '').replace(/\s/g, '').toLowerCase();
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    let query = {
        skip: page - 1 >= 0 ? (page - 1) * limit : 0,
        where: {
            userId: req.tokenData.userId,
            zoneName: {
                contains: title || ''
            }
        },
        orderBy: {
            createdAt: 'desc',
        },
    }
    const [data, count] = await prisma.$transaction([
        prisma.zones.findMany(query),
        prisma.zones.count({ where: query.where })
    ]);
    return res.status(200).json({ data: data, count: count })

}

async function getZoneById(req, res, next) {
    let id = req.params['id']
    let zone = await prisma.zones.findFirst({
        where: {
            id: Number(id)
        }
    })
    await res.json({
        data: zone
    })
}

async function generateSigToGetAllAds({ zone, token, name, secondary, descr }) {

    async function generateSignature(params) {
        const sortedParams = Object.keys(params)
            .sort()
            .reduce((acc, key) => {
                acc[key] = params[key];
                return acc;
            }, {});
        const queryString = new URLSearchParams(sortedParams).toString();
        console.log(secretKey, "secretKey")
        const message = secretKey + queryString;
        const signature = crypto.createHash('md5').update(message).digest('hex');
        return signature;
    }
    const sig = await generateSignature({
        // descr: descr,
        key: apiKey,
        method: 'AS.Zone.edit',
        name: name,
        // secondary: secondary,
        token: token,
        zone: zone
    });
    // console.log(sig, "signature")
    return sig
}

async function EditZones(req, res, next) {
    const schema = Joi.object({
        zoneName: Joi.string().required(),
        description: Joi.optional().default(""),
        type: Joi.string().required(),
        secondaryZone: Joi.optional().default(""),
    })

    var { error, value } = schema.validate(req.body);
    if (error) {
        return next(createHttpError(400, error.message));
    }

    let id = req.params['id']
    let zoneExists = await prisma.zones.findFirst({
        where: {
            id: Number(id)
        }
    })
    if (!zoneExists) {
        return next(createHttpError(404, "Zone does not exist"));
    }
    console.log(zoneExists, "zoneExists")
    let token = await generateTokenToGetList({
        zoneId: zoneExists.adSpeedZoneId,
        zoneName: zoneExists.zoneName,

    })
    console.log(value.secondaryZone, "value.secondaryZone")
    let signature = await generateSigToGetAllAds({
        key: apiKey,
        name: value.zoneName,
        // optimizer: 'none',
        // secondary: value.secondaryZone,
        // secondary: '',
        token: token,
        zone: zoneExists.adSpeedZoneId,

    })
    console.log(token, "token")
    console.log(signature, "signature")
    try {

        let data = {
            key: apiKey,
            method: 'AS.Zone.edit',
            sig: signature,
            name: value.zoneName,
            // optimizer: 'none',
            // secondary: value.secondaryZone,
            // secondary: '',
            token: token,
            zone: zoneExists.adSpeedZoneId,

        };
        const adspeedUpdatedZone = await axios.post(`https://api.adspeed.com`, data, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'Accept': '*/*'
            },
        })
        console.log(adspeedUpdatedZone, "adspeedUpdatedZone")
        console.log(adspeedUpdatedZone.data.search('Error'), "adspeedUpdatedZone.data.search('Error')")
        if (adspeedUpdatedZone.data.search('Error') == -1) {
            let updatedZone = await prisma.zones.update({
                where: {
                    id: zoneExists.id
                },
                data: value
            })
        }

        await res.json({
            message: "Zone updated successfully"
        })
    } catch (err) {
        console.log(err, "err in update ads")
        return next(createHttpError(err.message));

    }
}

async function linkAdToZone(req, res, next) {
    console.log("link ad to zone")
    const schema = Joi.object({
        adId: Joi.string().required(),
        adName: Joi.string().required(),
        zoneId: Joi.string().required(),
        zoneName: Joi.string().required(),
    })

    var { error, value } = schema.validate(req.body);
    if (error) {
        return next(createHttpError(400, error.message));
    }
    let adExists = await prisma.adVideo.findFirst({
        where: {
            adspeedAdId: adId
        }
    })
    if (!adExists) {
        return next(createHttpError('Ad Video does not exists.'));
    }
    let zoneExists = await prisma.zones.findFirst({
        where: {
            adSpeedZoneId: zoneid
        }
    })
    if (!zoneExists) {
        return next(createHttpError('Zone does not exists.'));
    }

    // let zone = await prisma.adVideo.findFirst({
    //     where:{
    //         zone:{
    //             id:Number(id)
    //         }
    //     }
    // })
    let resp = await linkZoneToAd({
        adId: value.adId,
        adName: value.adName,
        zoneName: value.zoneName,
        zoneId: value.zoneId
    })
    if (resp.search('Error') == -1) {
        let updatedZone = await prisma.adVideo.update({
            where: {
                id: adExists.id
            },
            data: {
                zoneId: zoneExists.id
            }
        })
        console.log(resp, "check resp")
        await res.json({
            message: 'Successfully ad linked to zone'
        })
    } else {
        return next(createHttpError('Error linking to zone .'));
    }

}

async function checkZoneExists(req, res, next) {
    let id = req.params['id']
    let zone = await prisma.adVideo.findFirst({
        where: {
            zone: {
                id: Number(id)
            }
        }
    })
    console.log(zone, "check zone")
    await res.json({
        data: zone
    })
}

async function ZoneTag(req, res, next) {
    let videoId = req.params['id']
    let type;
    let video = await prisma.liveStreaming.findFirst({
        where: {
            streamingId: videoId
        }
    })
    if (video) {
        type = videoType.broadcasting
    } else {
        type = videoType.video
    }
    let zone = await prisma.zones.findFirst({
        where: {
            userId: req.tokenData.userId,
            type: type
        }
    })
    // https://g.adspeed.net/ad.php?do=vast&zid=124177&oid=28121&wd=-1&ht=-1&vastver=3&cb=1696326311
    let content = zone.adSpeedZoneId + zone.zoneName
    let token = await md5(content)
    
    let signature = await generateSignatureForZoneTag({
        zoneId:zone.adSpeedZoneId,
        token:token
    })
    const tag = await axios
        .get(`https://api.adspeed.com?key=${apiKey}&method=AS.Zone.getAdTag&token=${token}&zone=${zone.adSpeedZoneId}&sig=${signature}`)
    console.log(tag, "tag")
    let zoneTag = await removeResponseTag(tag)
    await res.json({
        data:zoneTag
    })
}

async function ExtractZoneTag({zoneId,zoneName}) {
    // let type;
    // let video = await prisma.liveStreaming.findFirst({
    //     where: {
    //         streamingId: videoId
    //     }
    // })
    // if (video) {
    //     type = videoType.broadcasting
    // } else {
    //     type = videoType.video
    // }
    // let zone = await prisma.zones.findFirst({
    //     where: {
    //         userId: req.tokenData.userId,
    //         type: type
    //     }
    // })
    let content = zoneId + zoneName
    let token = await md5(content)
    
    let signature = await generateSignatureForZoneTag({
        zoneId:zoneId,
        token:token
    })
    const tag = await axios
        .get(`https://api.adspeed.com?key=${apiKey}&method=AS.Zone.getAdTag&token=${token}&zone=${zoneId}&sig=${signature}`)
    console.log(tag, "tag")
    let zoneTag = await removeResponseTag(tag.data)
    let decodedZoneTag = await decodeAdsSpeedResponse(zoneTag)
    let zoneVastUrl = await extractUrl(decodedZoneTag)
    return zoneVastUrl
}
async function md5(content) {
    return crypto.createHash('md5').update(content).digest('hex')
  }
async function removeResponseTag(xml) {
    const responseStartTag = '<Response>';
    const responseEndTag = '</Response>';
  
    const startIndex = xml.indexOf(responseStartTag);
    const endIndex = xml.indexOf(responseEndTag) + responseEndTag.length;
  
    const responseContent = xml.substring(startIndex + responseStartTag.length, endIndex - responseEndTag.length);
    return await responseContent;
}
// async function decodeAdsSpeedResponse(escapedXmlString) {
//     const decodedXmlString = await escapedXmlString
//         .replace(/&lt;/g, '<')
//         .replace(/&gt;/g, '>')
//         .replace(/&quot;/g, '"')
//         .replace(/&amp;/g, '&');

//     const parser = new DOMParser();
//     const xmlDoc = parser.parseFromString(decodedXmlString, 'text/xml');

//     const serializer = new XMLSerializer();
//     const formattedXmlString = serializer.serializeToString(xmlDoc);

//     return formattedXmlString;
// }
async function decodeAdsSpeedResponse(escapedXmlString) {
    const decodedXmlString = await escapedXmlString
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&');

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(decodedXmlString, 'text/xml');

    const serializer = new XMLSerializer();
    const formattedXmlString = serializer.serializeToString(xmlDoc);

    return formattedXmlString;
}
async function generateSignatureForZoneTag({ zoneId, token }) {
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
        key: apiKey,
        method: 'AS.Zone.getAdTag',
        token: token,
        zone: zoneId
    });
    return sig
}

async function extractUrl(servingCode){
    var regex = /zid=(\d+)&oid=(\d+)&wd=(-?\d+)&ht=(-?\d+)/;
    var match = servingCode.match(regex);
    console.log(match,"ceheck match")
    if (match) {
      var currentTimeUTC = new Date().getTime();
      var vastUrl = `//g.adspeed.net/ad.php?do=vast&zid=${match[1]}&oid=${match[2]}&wd=${match[3]}&ht=${match[4]}&vastver=3&cb=${currentTimeUTC}`;
      return vastUrl
    } else {
      return ''
    }
}

async function getUserLiveStreamTag(req, res, next) {
    let streamId = req.params['id']
    let record = await prisma.liveStreaming.findFirst({
        where:{
            streamingId:streamId
        },
        include:{
            user:{
                include:{
                    zones:{
                        where:{
                            type:'broadcasting'
                        }
                    }
                }
            }
        }
    })
    console.log(record,"check record")
    // console.log(record.user.zones[0].vastUrl,"record")

    if(record && record.user.zones.length>0){
        console.log("record exists")
        await res.json({
            data:{
                tagUrl:record.user.zones[0].vastUrl
            }
        })
    }else{
        await res.json({
            data:{
                tagUrl:''
            }
        })
    }
}



module.exports = {
    createAdSpeedZone,
    getUserZones,
    getUserZones,
    getZoneById,
    EditZones,
    linkAdToZone,
    checkZoneExists,
    ZoneTag,
    ExtractZoneTag,
    getUserLiveStreamTag
}