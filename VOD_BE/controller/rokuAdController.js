const createHttpError = require("http-errors");
const Joi = require("joi");
const { PrismaClient } = require("@prisma/client");
const prisma = require('../prisma/client');
const createVast = require("vast-builder");

// Generate VAST response for Roku ads
async function generateVastResponse(req, res, next) {
  try {
    const { adType, videoId } = req.query;
    
    // Validate parameters
    const schema = Joi.object({
      adType: Joi.string().valid('preroll', 'midroll', 'postroll').required(),
      videoId: Joi.string().required()
    });

    const { error, value } = schema.validate(req.query);
    if (error) {
      return next(createHttpError(400, error.message));
    }

    // Get video information
    const video = await prisma.video.findUnique({
      where: { id: parseInt(videoId) },
      include: { channel: true }
    });

    if (!video) {
      return next(createHttpError(404, "Video not found"));
    }

    // Get ads based on type
    let ads = [];
    switch (adType) {
      case 'preroll':
        if (video.preRoll) {
          ads = await prisma.adSpeed.findMany({
            where: { userId: video.userId, type: { in: ['video', 'both'] } },
            take: 1
          });
        }
        break;
      case 'midroll':
        if (video.midRoll) {
          ads = await prisma.adSpeed.findMany({
            where: { userId: video.userId, type: { in: ['video', 'both'] } },
            take: 1
          });
        }
        break;
      case 'postroll':
        if (video.postRoll) {
          ads = await prisma.adSpeed.findMany({
            where: { userId: video.userId, type: { in: ['video', 'both'] } },
            take: 1
          });
        }
        break;
    }

    if (ads.length === 0) {
      // Return empty VAST if no ads
      const emptyVast = createVast.v3()
        .attachAd()
        .attachInLine()
        .addAdSystem("MediaPilot")
        .addAdTitle("No Ad Available")
        .attachCreatives()
        .attachCreative()
        .attachLinear()
        .addDuration("00:00:01")
        .attachMediaFiles()
        .attachMediaFile("", {
          delivery: "streaming",
          type: "video/mp4",
          width: "1",
          height: "1",
        });

      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(emptyVast.toXml());
    }

    const ad = ads[0];
    
    // Create VAST response
    const vast = createVast.v3()
      .attachAd()
      .attachInLine()
      .addImpression(`https://your-tracking-domain.com/impression?ad=${ad.id}`)
      .addAdSystem("MediaPilot")
      .addAdTitle(ad.name)
      .attachCreatives()
      .attachCreative()
      .attachLinear()
      .attachTrackingEvents()
      .attachTracking(`https://your-tracking-domain.com/start?ad=${ad.id}`, { event: "start" })
      .attachTracking(`https://your-tracking-domain.com/firstQuartile?ad=${ad.id}`, { event: "firstQuartile" })
      .attachTracking(`https://your-tracking-domain.com/midpoint?ad=${ad.id}`, { event: "midpoint" })
      .attachTracking(`https://your-tracking-domain.com/thirdQuartile?ad=${ad.id}`, { event: "thirdQuartile" })
      .attachTracking(`https://your-tracking-domain.com/complete?ad=${ad.id}`, { event: "complete" })
      .back()
      .addDuration(ad.length || "00:00:30")
      .attachMediaFiles()
      .attachMediaFile(ad.videourl, {
        delivery: "streaming",
        type: "video/mp4",
        width: "1280",
        height: "720",
      })
      .back()
      .attachIcons()
      .attachIcon({
        program: "MediaPilot",
        width: "50",
        height: "50",
        xPosition: "bottom",
        yPosition: "left",
      })
      .attachStaticResource("https://your-domain.com/icon.png", { creativeType: "image/png" });

    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(vast.toXml());

  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Internal server error"));
  }
}

// Get ad configuration for a specific video
async function getVideoAdConfig(req, res, next) {
  try {
    const { videoId } = req.params;
    
    const video = await prisma.video.findUnique({
      where: { id: parseInt(videoId) },
      select: {
        id: true,
        preRoll: true,
        midRoll: true,
        postRoll: true,
        midRollConfig: true
      }
    });

    if (!video) {
      return next(createHttpError(404, "Video not found"));
    }

    const adConfig = {
      videoId: video.id,
      ads: {
        preroll: video.preRoll,
        midroll: video.midRoll,
        postroll: video.postRoll
      },
      midrollConfig: video.midRollConfig
    };

    return res.status(200).json({ data: adConfig });

  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Internal server error"));
  }
}

// Update ad configuration for a video
async function updateVideoAdConfig(req, res, next) {
  try {
    const { videoId } = req.params;
    
    const schema = Joi.object({
      preRoll: Joi.boolean().optional(),
      midRoll: Joi.boolean().optional(),
      postRoll: Joi.boolean().optional(),
      midRollConfig: Joi.object({
        interval: Joi.number().min(1).optional(),
        intervalType: Joi.string().valid('min', 'sec').optional()
      }).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return next(createHttpError(400, error.message));
    }

    const updatedVideo = await prisma.video.update({
      where: { id: parseInt(videoId) },
      data: value
    });

    return res.status(200).json({ 
      message: "Ad configuration updated successfully",
      data: updatedVideo 
    });

  } catch (error) {
    console.error(error);
    return next(createHttpError(500, "Internal server error"));
  }
}

module.exports = {
  generateVastResponse,
  getVideoAdConfig,
  updateVideoAdConfig
}; 