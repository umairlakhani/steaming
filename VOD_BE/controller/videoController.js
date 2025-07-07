const Joi = require("joi");
const { PrismaClient, Prisma, VideoType } = require("@prisma/client");
const formidable = require("formidable");
const util = require("util");
const fs = require("fs");
const { getVideoDurationInSeconds } = require("get-video-duration");
const request = require("request");
const prisma = require('../prisma/client');
const AWS = require("aws-sdk");
const AWS2 = require("aws-sdk");
const { v4: uuidv4 } = require("uuid");
const createHttpError = require("http-errors");
require("dotenv").config();
const {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
} = require("@aws-sdk/client-s3");
const {
  getSignedUrl,
  S3RequestPresigner,
} = require("@aws-sdk/s3-request-presigner");
const { default: axios } = require("axios");

var paperspace_node = require("paperspace-node");

var paperspace = paperspace_node({
  apiKey: process.env.PAPERSPACE_APIKEY,
});

const checkSigS3 = new S3Client({
  region: process.env.REGION,
  endpoint: new AWS.Endpoint(`https://${process.env.USER_BUCKET_URL}`),
  credentials: {
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
  },
  signatureVersion: "v4",
});
// Configure AWS SDK with your DigitalOcean Spaces credentials
AWS.config.update({
  accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY, // Replace with your DigitalOcean Spaces access key
  secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY, // Replace with your DigitalOcean Spaces secret key
  endpoint: process.env.DIGITAL_OCEAN_TEMP_URL_KEY, // Replace with your DigitalOcean Spaces endpoint
  s3ForcePathStyle: true,
});

const { Queue, Worker } = require("bullmq");
const {
  createPreSignedUrlFunc,
  createPresignedUrlWithClientUploadFunc,
  getBucketCurrentStorage,
  userEligibleToUpload,
  updateStorage,
  updateStorageAfterDelete,
} = require("./storageController");
const redisConfig = require("../utils/redisConfig");
const { calculateSizes } = require("../utils/ffmpeg");
// const { HTTPError } = require('got');

const videoQueue = new Queue("videoQueue", {
  connection: redisConfig,
});
// const session = new AWS.Session();

// Create a new instance of the S3 service
const spaces = new AWS.S3({
  signatureVersion: "v4",
  params: {
    acl: "public-read",
  },
});

async function update(req, res, next) {
  const schema = Joi.object({
    id: Joi.number().required(),
    Title: Joi.string().min(1).max(200).required(),
    // videoId: Joi.string().min(1).max(200).required(),
    // size: Joi.number().required(),
    // length: Joi.required(),
    description: Joi.string().min(1).max(1500),
    type: Joi.string().required(),
    preRoll: Joi.boolean().required(),
    postRoll: Joi.boolean().required(),
    midRoll: Joi.boolean().required(),
    intervalType: Joi.optional(),
    interval: Joi.optional(),
    channelId: Joi.number().required(),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    return next(createHttpError(400, error.message));
  }
  const { intervalType, interval, id, ...rest } = value;
  try {
    const id = value.id;

    delete value.id;
    let videoObj;

    if (value.midRoll) {
      videoObj = {
        ...rest,
        midRollConfig: {
          interval: `${interval}`,
          intervalType: `${intervalType}`,
        },
      };
    } else {
      videoObj = {
        ...rest,
        midRollConfig: {},
      };
    }

    var video = await prisma.video.update({
      where: {
        id: id,
      },
      data: videoObj,
    });

    return res.status(200).json({ message: "Video updated successfully!" });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

async function archive(req, res, next) {
  const schema = Joi.object({
    id: Joi.number().required(),
    published: Joi.boolean().required(),
    archive: Joi.boolean().required(),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    return next(createHttpError(400, error.message));
  }

  try {
    var video = await prisma.video.update({
      where: {
        id: value.id,
      },
      data: {
        archived: value.archive,
        published: value.published,
      },
    });

    return res
      .status(200)
      .json({ message: "Video archive status updated successfully!" });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

async function remove(req, res, next) {
  const schema = Joi.object({
    id: Joi.number().required(),

    deleted: Joi.boolean().required(),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    return next(createHttpError(400, error.message));
  }
  let bucketId = req.tokenData.bucketId;
  try {
    var video = await prisma.video.update({
      where: {
        id: value.id,
      },
      data: {
        deleted: value.deleted,
      },
    });

    const schedule = await prisma.scheduleVideoData.deleteMany({
      where: {
        videoId: video.videoId,
      },
    });
    let subscriptions = await prisma.subscriptions.findMany({
      where: {
        userId: req.tokenData.userId,
      },
      include: {
        subscriptionPlan: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    let planStorageInMbs;
    if (subscriptions.length > 0) {
      console.log(subscriptions[0], "subscriptions[0]");
      let planStorage = subscriptions[0].subscriptionPlan.storage;
      console.log(planStorage, "planStorage");
      planStorageInMbs = planStorage * 1024;
      console.log(planStorageInMbs, "planStorageInMbs");
    } else {
      planStorageInMbs = 51200;
    }

    // console.log(storageAfterUpdate,"storageAfterUpdate")
    console.log("deleted from databse")

    const folderPath = `media-buckets/users/${req.tokenData.userId}/videos/${video.videoId}/`;
    let check = await deleteFilesWithId(process.env.DO_BUCKET_NAME || "media-buckets", folderPath);
    let currentStorage = await getBucketCurrentStorage(req.tokenData.bucketId);
    if (check) {
      const storageAfterUpdate = await updateStorageAfterDelete(
        req.tokenData.bucketId,
        currentStorage,
        video.size,
        planStorageInMbs
      );
      return await res
        .status(200)
        .json({ message: "Video delete status updated successfully!" });
    }
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

async function deleteFilesWithId(bucketName, prefix) {

  console.log("Deleting files with prefix:", prefix);
    const s3 = new AWS.S3({
    endpoint: `https://${process.env.USER_BUCKET_URL}`,
    accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
    secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
  });

  return new Promise((resolve, reject) => {
    s3.listObjectsV2({ Bucket: bucketName, Prefix: prefix }, (err, data) => {
      if (err) {
        console.error("Error listing objects:", err);
        return reject(err);
      }

      if (!data.Contents || data.Contents.length === 0) {
        console.log("No files found with the specified prefix.");
        return resolve(true);
      }

      const filesToDelete = data.Contents.map((object) => ({ Key: object.Key }));

      const deleteParams = {
        Bucket: bucketName,
        Delete: {
          Objects: filesToDelete,
        },
      };

      s3.deleteObjects(deleteParams, (err, deleteData) => {
        if (err) {
          console.error("Error deleting objects:", err);
          return reject(err);
        }

        console.log(`${filesToDelete.length} files deleted from ${prefix}`);
        resolve(true);
      });
    });
  });
}

async function getVideo(req, res, next) {
  console.log("req.query.id", req.params.id);

  console.log("after schema");

  var video = await prisma.video.findUnique({
    where: {
      id: parseInt(req.params.id),
    },
  });
  console.log(video);

  return res.status(200).json({ data: { data: video } });
}

async function getUserPublicVideos(req, res, next) {
  console.log(parseInt(req.query.limit), "parseInt(req.query.limit");
  const title = (req.query.title || "").replace(/\s/g, "").toLowerCase();
  const page = parseInt(req.query.page || "1");
  const limit = parseInt(req.query.limit || "10");

  // let data;

  const query = {
    skip: page - 1 >= 0 ? (page - 1) * limit : 0,
    take: limit,
    where: {
      userId: parseInt(req.params.id),
      type: VideoType.PUBLIC,
      Title: {
        contains: title || "",
      },
      deleted: false,
      published: true,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      channel: true,
    },
  };
  const [data, count] = await prisma.$transaction([
    prisma.video.findMany(query),
    prisma.video.count({ where: query.where }),
  ]);
  //  data = await prisma.video.findMany({
  //   where: {
  //     userId: parseInt(req.params.id),
  //     type: VideoType.PUBLIC,
  //     Title: {
  //       contains: title || ''
  //     },
  //     deleted: false
  //   }
  // })
  // if (req.tokenData !== undefined) {
  //   let verifyUser = Number(req.tokenData.userId) == Number(req.params.id)
  //   let data;
  //   if (verifyUser) {
  //     console.log("verified")
  //     data = await prisma.video.findMany({
  //       where: {
  //         userId: parseInt(req.params.id),
  //         type: VideoType.PUBLIC,
  //         Title: {
  //           contains: title || ''
  //         },
  //         deleted: false
  //       }
  //     })
  //   } else {
  //     console.log("not verified")
  //     data = await prisma.video.findMany({
  //       where: {
  //         userId: parseInt(req.params.id),
  //         type: VideoType.PUBLIC,
  //         Title: {
  //           contains: title || ''
  //         },
  //         deleted: false
  //       }
  //     })
  //   }
  // } else {
  //   data = await prisma.video.findMany({
  //     where: {
  //       userId: parseInt(req.params.id),
  //       type: VideoType.PUBLIC,
  //       Title: {
  //         contains: title || ''
  //       },
  //       deleted: false
  //     }
  //   })
  // }
  // if (!data) {
  //   return next(createHttpError(400, "Not Found"));
  // }
  return res.status(200).json({ data: data, count: count });
}

async function changeType(req, res, next) {
  const schema = Joi.object({
    type: Joi.string().required(),
  });
  var { error, value } = schema.validate(req.body);

  if (error) {
    return next(createHttpError(400, error.message));
  }
  let id = req.params.id;
  let video = await prisma.video.findUnique({
    where: { id: Number(id) },
  });
  if (!video) {
    return next(createHttpError(404, error.message));
  }
  let updatedVideo = await prisma.video.update({
    where: { id: Number(id) },
    data: {
      type: req.body["type"],
    },
  });
  return res.status(200).json({ message: "Status updated successfully!" });

  // changeType
}

async function ownedListArchived(req, res, next) {
  try {
    // add search by title
    const title = (req.query.title || "").replace(/\s/g, "").toLowerCase();
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "6");

    const query = {
      skip: page - 1 >= 0 ? (page - 1) * limit : 0,
      take: limit,
      where: {
        userId: req.tokenData.userId,
        archived: true,
        Title: {
          contains: title || "",
        },
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        channel: true, // Include the channel reference
      },
    };
    const [getOwnedChannels, count] = await prisma.$transaction([
      prisma.video.findMany(query),
      prisma.video.count({ where: query.where }),
    ]);
    console.log(count, "check count");

    return res
      .status(200)
      .json({ data: { results: getOwnedChannels, totalRecords: count } });
  }catch (error) {
    console.error('Error in ownedListArchived:', error);
    if (error && error.stack) {
      console.error(error.stack);
    }
    return next(createHttpError());
  }
}

async function ownedListPublished(req, res, next) {
  console.log(req.tokenData.userId, "req.headers");
  try {
    const title = (req.query.title || "").replace(/\s/g, "").toLowerCase();
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "20");

    const query = {
      skip: page - 1 >= 0 ? (page - 1) * limit : 0,
      take: limit,
      where: {
        userId: req.tokenData.userId,
        archived: true,
        published: true,
        Title: {
          contains: title,
        },
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        channel: true, // Include the channel reference
      },
    };
    const [getOwnedChannels, count] = await prisma.$transaction([
      prisma.video.findMany(query),
      prisma.video.count({ where: query.where }),
    ]);

    return res
      .status(200)
      .json({ data: { results: getOwnedChannels, totalRecords: count } });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

async function ownedListCompleteArchived(req, res, next) {
  try {
    const query = {
      where: {
        userId: req.tokenData.userId,
        archived: true,
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        channel: true, // Include the channel reference
      },
    };
    const getOwnedChannels = await prisma.video.findMany(query);

    // Roku Standard Feed Format
    let rokuFeed = {
      providerName: "MediaPilot",
      lastUpdated: new Date().toISOString(),
      language: "en",
      movies: getOwnedChannels.map((video) => {
        let temp = JSON.parse(JSON.stringify(video));
        
        // Convert duration from HH:MM:SS to seconds for Roku
        function durationToSeconds(duration) {
          const [hours, minutes, seconds] = duration.split(":").map(Number);
          return hours * 3600 + minutes * 60 + seconds;
        }

        // Helper function to safely get date string
        function getDateString(dateValue) {
          if (dateValue instanceof Date) {
            return dateValue.toISOString().substring(0, 10);
          } else if (typeof dateValue === 'string') {
            return dateValue.substring(0, 10);
          } else {
            return new Date().toISOString().substring(0, 10);
          }
        }

        // Create Roku-standard movie object
        let rokuMovie = {
          id: temp.id.toString(),
          title: temp.Title,
          shortDescription: temp.description || "",
          longDescription: temp.description || "",
          thumbnail: temp.thumbnail,
          releaseDate: getDateString(temp.createdAt),
          content: {
            dateAdded: temp.createdAt,
            videos: [
              {
                url: temp.url360P,
                quality: "SD",
                videoType: "MP4",
              },
              {
                url: temp.url480P,
                quality: "SD",
                videoType: "MP4",
              },
              {
                url: temp.url720P,
                quality: "HD",
                videoType: "MP4",
              },
              {
                url: temp.url1080P,
                quality: "FHD",
                videoType: "MP4",
              }
            ],
            duration: durationToSeconds(temp.length),
            adBreaks: []
          }
        };

        // Handle Pre-roll ads
        if (temp.preRoll === true) {
          rokuMovie.content.adBreaks.push({
            time: 0,
            type: "preroll"
          });
        }

        // Handle Mid-roll ads
        if (temp.midRoll === true && temp.midRollConfig) {
          function createIntervals(totalLength, intervalType, interval) {
            const totalSeconds = durationToSeconds(totalLength);
            let videoInterval = Number(interval);
            const intervalInSeconds =
              intervalType === "min" ? videoInterval * 60 : videoInterval;

            const intervals = [];
            let currentTime = intervalInSeconds;

            while (currentTime < totalSeconds) {
              intervals.push({
                time: currentTime,
                type: "midroll"
              });
              currentTime += intervalInSeconds;
            }

            return intervals;
          }

          const intervals = createIntervals(
            temp.length,
            temp.midRollConfig.intervalType,
            temp.midRollConfig.interval
          );
          rokuMovie.content.adBreaks.push(...intervals);
        }

        // Handle Post-roll ads
        if (temp.postRoll === true) {
          rokuMovie.content.adBreaks.push({
            time: durationToSeconds(temp.length),
            type: "postroll"
          });
        }

        // Add Roku-specific fields
        rokuMovie.genres = ["Entertainment"];
        rokuMovie.rating = "TV-G";
        rokuMovie.actors = [];
        rokuMovie.directors = [];
        rokuMovie.categories = ["Movies"];

        return rokuMovie;
      })
    };

    return res.status(200).json({ data: { results: rokuFeed } });
  } catch (error) {
    console.error(error);
    return next(createHttpError());
  }
}

async function ownedListCompletePublished(req, res, next) {
  console.log(req.tokenData.userId, "req.headers");
  try {
    const query = {
      where: {
        userId: req.tokenData.userId,
        archived: true,
        published: true,
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        channel: true, // Include the channel reference
      },
    };
    const getOwnedChannels = await prisma.video.findMany(query);

    // Roku Standard Feed Format
    let rokuFeed = {
      providerName: "MediaPilot",
      lastUpdated: new Date().toISOString(),
      language: "en",
      movies: getOwnedChannels.map((video) => {
        let temp = JSON.parse(JSON.stringify(video));
        
        // Convert duration from HH:MM:SS to seconds for Roku
        function durationToSeconds(duration) {
          const [hours, minutes, seconds] = duration.split(":").map(Number);
          return hours * 3600 + minutes * 60 + seconds;
        }

        // Helper function to safely get date string
        function getDateString(dateValue) {
          if (dateValue instanceof Date) {
            return dateValue.toISOString().substring(0, 10);
          } else if (typeof dateValue === 'string') {
            return dateValue.substring(0, 10);
          } else {
            return new Date().toISOString().substring(0, 10);
          }
        }

        // Create Roku-standard movie object
        let rokuMovie = {
          id: temp.id.toString(),
          title: temp.Title,
          shortDescription: temp.description || "",
          longDescription: temp.description || "",
          thumbnail: temp.thumbnail,
          releaseDate: getDateString(temp.createdAt),
          content: {
            dateAdded: temp.createdAt,
            videos: [
              {
                url: temp.url360P,
                quality: "SD",
                videoType: "MP4",
              },
              {
                url: temp.url480P,
                quality: "SD",
                videoType: "MP4",
              },
              {
                url: temp.url720P,
                quality: "HD",
                videoType: "MP4",
              },
              {
                url: temp.url1080P,
                quality: "FHD",
                videoType: "MP4",
              }
            ],
            duration: durationToSeconds(temp.length),
            adBreaks: []
          }
        };

        // Handle Pre-roll ads
        if (temp.preRoll === true) {
          rokuMovie.content.adBreaks.push({
            time: 0,
            type: "preroll"
          });
        }

        // Handle Mid-roll ads
        if (temp.midRoll === true && temp.midRollConfig) {
          function createIntervals(totalLength, intervalType, interval) {
            const totalSeconds = durationToSeconds(totalLength);
            let videoInterval = Number(interval);
            const intervalInSeconds =
              intervalType === "min" ? videoInterval * 60 : videoInterval;

            const intervals = [];
            let currentTime = intervalInSeconds;

            while (currentTime < totalSeconds) {
              intervals.push({
                time: currentTime,
                type: "midroll"
              });
              currentTime += intervalInSeconds;
            }

            return intervals;
          }

          const intervals = createIntervals(
            temp.length,
            temp.midRollConfig.intervalType,
            temp.midRollConfig.interval
          );
          rokuMovie.content.adBreaks.push(...intervals);
        }

        // Handle Post-roll ads
        if (temp.postRoll === true) {
          rokuMovie.content.adBreaks.push({
            time: durationToSeconds(temp.length),
            type: "postroll"
          });
        }

        // Add Roku-specific fields
        rokuMovie.genres = ["Entertainment"];
        rokuMovie.rating = "TV-G";
        rokuMovie.actors = [];
        rokuMovie.directors = [];
        rokuMovie.categories = ["Movies"];

        return rokuMovie;
      })
    };

    return res.status(200).json({ data: { results: rokuFeed } });
  } catch (error) {
    console.error(error);
    return next(createHttpError());
  }
}

async function ownedListSinglePublished(req, res, next) {
  try {
    const query = {
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        channel: true, // Include the channel reference
      },
    };
    const getOwnedChannel = await prisma.video.findUnique(query);
    console.log(getOwnedChannel, "getOwnedChannel");
    let temp = getOwnedChannel;
    
    // Convert duration from HH:MM:SS to seconds for Roku
    function durationToSeconds(duration) {
      const [hours, minutes, seconds] = duration.split(":").map(Number);
      return hours * 3600 + minutes * 60 + seconds;
    }

    // Helper function to safely get date string
    function getDateString(dateValue) {
      if (dateValue instanceof Date) {
        return dateValue.toISOString().substring(0, 10);
      } else if (typeof dateValue === 'string') {
        return dateValue.substring(0, 10);
      } else {
        return new Date().toISOString().substring(0, 10);
      }
    }

    // Create Roku-standard movie object
    let rokuMovie = {
      id: temp.id.toString(),
      title: temp.Title,
      shortDescription: temp.description || "",
      longDescription: temp.description || "",
      thumbnail: temp.thumbnail,
      releaseDate: getDateString(temp.createdAt),
      content: {
        dateAdded: temp.createdAt,
        videos: [
          {
            url: temp.url360P,
            quality: "SD",
            videoType: "MP4",
          },
          {
            url: temp.url480P,
            quality: "SD",
            videoType: "MP4",
          },
          {
            url: temp.url720P,
            quality: "HD",
            videoType: "MP4",
          },
          {
            url: temp.url1080P,
            quality: "FHD",
            videoType: "MP4",
          }
        ],
        duration: durationToSeconds(temp.length),
        adBreaks: []
      }
    };

    // Handle Pre-roll ads
    if (temp.preRoll === true) {
      rokuMovie.content.adBreaks.push({
        time: 0,
        type: "preroll"
      });
    }

    // Handle Mid-roll ads
    if (temp.midRoll === true && temp.midRollConfig) {
      function createIntervals(totalLength, intervalType, interval) {
        const totalSeconds = durationToSeconds(totalLength);
        let videoInterval = Number(interval);
        const intervalInSeconds =
          intervalType === "min" ? videoInterval * 60 : videoInterval;

        const intervals = [];
        let currentTime = intervalInSeconds;

        while (currentTime < totalSeconds) {
          intervals.push({
            time: currentTime,
            type: "midroll"
          });
          currentTime += intervalInSeconds;
        }

        return intervals;
      }

      const intervals = createIntervals(
        temp.length,
        temp.midRollConfig.intervalType,
        temp.midRollConfig.interval
      );
      rokuMovie.content.adBreaks.push(...intervals);
    }

    // Handle Post-roll ads
    if (temp.postRoll === true) {
      rokuMovie.content.adBreaks.push({
        time: durationToSeconds(temp.length),
        type: "postroll"
      });
    }

    // Add Roku-specific fields
    rokuMovie.genres = ["Entertainment"];
    rokuMovie.rating = "TV-G";
    rokuMovie.actors = [];
    rokuMovie.directors = [];
    rokuMovie.categories = ["Movies"];

    return res.status(200).json({ data: { result: rokuMovie } });
  } catch (error) {
    console.error(error);
    return next(createHttpError());
  }
}

async function ownedListPublishedProcessed(req, res, next) {
  try {
    const title = (req.query.title || "").replace(/\s/g, "").toLowerCase();
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");
    const query = {
      skip: page - 1 >= 0 ? (page - 1) * limit : 0,
      take: limit,
      where: {
        userId: req.tokenData.userId,
        archived: true,
        published: true,
        processing: false,
        // processing:true,
        Title: {
          contains: title,
        },
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        channel: true, // Include the channel reference
      },
    };
    // const getOwnedChannels = await prisma.video.findMany({

    // });
    const [getOwnedChannels, count] = await prisma.$transaction([
      prisma.video.findMany(query),
      prisma.video.count({ where: query.where }),
    ]);

    return res
      .status(200)
      .json({ data: { results: getOwnedChannels, totalRecords: count } });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

async function liveStreamingVideos(req, res, next) {
  try {
    const title = (req.query.title || "").replace(/\s/g, "").toLowerCase();
    const currentTimestamp = new Date().toISOString();
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");
    let query = {
      skip: page - 1 >= 0 ? (page - 1) * limit : 0,
      take: limit,
      where: {
        startTimestamp: {
          lte: currentTimestamp,
        },
        endTimestamp: {
          gte: currentTimestamp,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        startTimestamp: true,
        endTimestamp: true,
        video: true,
      },
    };

    const [getOwnedChannels, count] = await prisma.$transaction([
      prisma.scheduleVideoData.findMany(query),
      prisma.scheduleVideoData.count({ where: query.where }),
    ]);
    console.log(getOwnedChannels, "getOwnedChannels");
    return res
      .status(200)
      .json({ data: { results: getOwnedChannels, totalRecords: count } });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}
async function getLiveStreamingOnAir(req, res, next) {
  try {
    const title = (req.query.title || "").replace(/\s/g, "").toLowerCase();
    const page = parseInt(req.query.page || "1");
    const limit = parseInt(req.query.limit || "10");
    let query = {
      skip: page - 1 >= 0 ? (page - 1) * limit : 0,
      take: limit,
      where: {
        endTime: null,
      },
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    };
    const [data, count] = await prisma.$transaction([
      prisma.liveStreaming.findMany(query),
      prisma.liveStreaming.count({ where: query.where }),
    ]);
    console.log(data, "data");
    return res
      .status(200)
      .json({ data: { results: data, totalRecords: count } });
  } catch (err) {
    console.log(err);
    return next(createHttpError());
  }
}
async function isVideoOnAir(videoId) {
  const currentTimestamp = Date.now() / 1000;
  let allschedules = await prisma.scheduleVideoData.findMany({});
  for (const schedule of allschedules) {
    const startTimestamp = new Date(schedule.startTimestamp).getTime() / 1000;
    const endTimestamp = new Date(schedule.endTimestamp).getTime() / 1000;
    if (
      startTimestamp <= currentTimestamp &&
      currentTimestamp <= endTimestamp &&
      schedule.videoId === videoId
    ) {
      return true;
    }
  }
  return false;
}

async function create(req, res, next) {
  // Convert bucketId to string if it exists in the request body
  if (req.body.bucketId) {
    req.body.bucketId = String(req.body.bucketId);
  }

  const schema = Joi.object({
    Title: Joi.string().min(1).max(200).required(),
    videoId: Joi.string().min(1).max(200).required(),
    size: Joi.number().required(),
    length: Joi.required(),
    description: Joi.string().min(1).max(1500).required(),
    type: Joi.string().required(),
    profile_image: Joi.string().required(),
    bucketId: Joi.string().required(),
    videoUrl: Joi.string().required(),
    preRoll: Joi.boolean().required(),
    postRoll: Joi.boolean().required(),
    midRoll: Joi.boolean().required(),
    intervalType: Joi.optional(),
    channelId: Joi.number().required(),
    // .when('midRoll',{
    //   is:true,
    //   then:Joi.string().required(),
    //   otherwise:Joi.optional()
    // }),
    interval: Joi.optional(),
    // .when('midRoll',{
    //   is:true,
    //   then:Joi.string().required(),
    //   otherwise:Joi.optional()
    // }),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    console.log(error);
    return next(createHttpError(400, error.message));
  }

  value.userId = req.tokenData.userId;
  console.log(value, "check value");
  try {
    const { bucketId, videoUrl, intervalType, interval, ...rest } = value;
    let videoObj = {
      ...rest,
      midRollConfig: {
        interval: `${interval}`,
        intervalType: `${intervalType}`,
      },
    };
    console.log(videoObj, "videoObj");
    var video = await prisma.video.create({
      data: videoObj,
    });

    let obj = {
      videoId: value.videoId,
      videoUrl: value.videoUrl,
      bucketId: value.bucketId,
    };

    return res
      .status(200)
      .json({ message: "Video created successfully!", data: video });
  } catch (error) {
    console.log(error);
    return next(createHttpError(400, ""));
  }
}

async function videoUpload(req, res, next) {
  oneMb = 1048576;
  console.log(req.tokenData, "check tokebData");
  let bucketId = req.tokenData.bucketId; // Use userId for folder structure in Spaces
  try {
    console.log("in try");

    paperspace.machines.show(
      {
        machineId: process.env.PAPERSPACE_MACHINE_ID,
      },
      function (err, resp) {
        if (err) {
          console.log(err);
          return;
        }
        console.log(resp.state, "current state");
        if (resp.state === "ready") {
          uploadFile();
        } else {
          paperspace.machines.start(
            {
              machineId: process.env.PAPERSPACE_MACHINE_ID,
            },
            function (err, resp) {
              if (err) {
                console.log(err);
                return;
              }
              console.log(resp.state, "starting machine");
            }
          );
          setTimeout(uploadFile, 90000);
        }
      }
    );

    function uploadFile() {
      const form = formidable({
        multiples: true,
        maxFileSize: 500 * 1024 * 1024,
	timeout: 0,
      });
      return form.parse(req, async (err, fields, files) => {
        console.log(files, "check files");
        //  console.log(files.video.size/oneMb,"check files")

        console.log("now uploading files");
        console.log("video upload 511");
        if (err) {
          console.log(err, "error");
          next(err);
          return;
        }
        console.log("files", files);

        let newFilename;
        let videoPath;
        if (!files.video) {
          console.log("No Video field on form");
          return next(createHttpError(400, "No Video field on form"));
        }
        console.log("in video upload");
        // const newFilename = files.video.newFilename + '.mp4';
        newFilename = files.video.newFilename + ".mp4";

        // const videoPath = './tempVideo/' + newFilename;
        videoPath = "./tempVideo/" + newFilename;

        // await fs.promises.rename(files.video.filepath, videoPath);
        await fs.promises.cp(files.video.filepath, videoPath, {
          recursive: true,
        });
        await fs.promises.rm(files.video.filepath, {
          recursive: true,
        });

        let uploadingFileSize = await calculateSizes(videoPath);
        let totalStorage = await getBucketCurrentStorage(
          req.tokenData.bucketId
        );
        //  console.log(totalStorage,"totalStorage")
        let eligible = await userEligibleToUpload(
          req.tokenData.userId,
          totalStorage,
          uploadingFileSize
        );
        console.log(eligible, "eligible");
        if (!eligible.canUpload) {
          return await next(
            createHttpError(
              400,
              "You don't have enough storage to upload this file."
            )
          );
        }
        const uploadParams = {
          Bucket: "temp-video",
          Key: newFilename,
          Body: fs.createReadStream(videoPath),
        };
        uploadResult = await spaces
          .upload({
            ...uploadParams,
            ContentType: "video/mp4",
            //    give ACL to download video
            ACL: "public-read",
          })
          .promise();

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
        // const videoUrl = await checkvideoUrl(uploadResult.Location);
        const videoUrl = 'https://' + uploadResult.Location;
        console.log(videoUrl, "check videourl while uplloadin");
        try {
          await prisma.videoData.create({
            data: {
              videoId: newFilename,
              videoUrl: videoUrl,
            },
          });
        } catch (err) {
          console.error("error adding videoUrl in database:", err);
        }
        console.log(videoUrl, "check videourl while uplloadin");
        // let updatedStorage = await updateStorage(
        //   bucketId,
        //   totalStorage,
        //   uploadingFileSize,
        //   eligible.planStorageinMbs
        // );
        console.log("Storage will update after video processing");

        videoQueue.on("error", (error) => {
          console.log(`Queue error: ${error}`);
        });

        videoQueue.on("completed", (job, result) => {
          console.log(`Job ${job.id} completed with result :${result}`);
        });

        await videoQueue.add("videojob", {
          videoId: newFilename,
          videoUrl: videoUrl,
          bucketId: bucketId,
        });

        console.log(videoUrl, "check videoUrl");
        console.log(videoPath, "check videoPath");
        await fs.promises.unlink(videoPath);

        await res.status(200).json({
          message: "Video uploaded successfully!",
          data: { ...files.video, videoUrl: videoUrl, bucketId: bucketId },
        });
        await res.end();
      });
    }
  } catch (error) {
    console.log(error);

    return next(createHttpError());
  }
}

async function schedule(req, res, next) {
  const schema = Joi.object({
    videoId: Joi.string().min(1).max(200).required(),
    streamAt: Joi.date().required(),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    return next(createHttpError(400, error.message));
  }

  value.videoId = parseInt(value.videoId);

  var getVideo = await prisma.video.findMany({
    where: {
      userId: req.tokenData.userId,
      id: value.videoId,
    },
  });

  if (getVideo.length === 0) {
    return next(
      createHttpError(
        401,
        "Video does not exist or you don't have permission for this action!"
      )
    );
  }

  value.userId = req.tokenData.userId;

  try {
    var schedule = await prisma.schedule.create({
      data: value,
    });

    return res
      .status(200)
      .json({ message: "Schedule created successfully!", data: schedule });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

async function scheduleGet(req, res, next) {
  try {
    var schedule = await prisma.schedule.findMany({
      where: {
        userId: req.tokenData.userId,
      },
      include: {
        video: true,
      },
    });

    return res.status(200).json({ data: schedule });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

async function scheduleEdit(req, res, next) {
  const schema = Joi.object({
    scheduleId: Joi.string().min(1).max(200).required(),

    streamAt: Joi.date().required(),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    return next(createHttpError(400, error.message));
  }

  value.scheduleId = parseInt(value.scheduleId);

  var getSchedule = await prisma.schedule.findMany({
    where: {
      userId: req.tokenData.userId,
      id: value.scheduleId,
    },
  });

  if (getSchedule.length === 0) {
    return next(
      createHttpError(
        401,
        "Schedule does not exist or you don't have permission for this action!"
      )
    );
  }

  value.userId = req.tokenData.userId;

  try {
    var schedule = await prisma.schedule.update({
      where: {
        id: scheduleId,
      },
      data: value,
    });

    return res
      .status(200)
      .json({ message: "Schedule edited successfully!", data: schedule });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

async function scheduleDelete(req, res, next) {
  const schema = Joi.object({
    scheduleId: Joi.string().min(1).max(200).required(),
  });

  var { error, value } = schema.validate(req.body);

  if (error) {
    return next(createHttpError(400, error.message));
  }

  value.scheduleId = parseInt(value.scheduleId);

  var getSchedule = await prisma.schedule.findMany({
    where: {
      userId: req.tokenData.userId,
      id: value.scheduleId,
    },
  });

  if (getSchedule.length === 0) {
    return next(
      createHttpError(
        401,
        "Schedule does not exist or you don't have permission for this action!"
      )
    );
  }

  value.userId = req.tokenData.userId;

  try {
    var schedule = await prisma.schedule.delete({
      where: {
        id: value.scheduleId,
      },
    });

    return res
      .status(200)
      .json({ message: "Schedule deleted successfully!", data: schedule });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}

/// signed url start
const resolutions = ["360p", "480p", "720p", "1080p"];

async function createPreSignedUrl(bucket, key, expires) {
  console.log(`${bucket}` + "/" + `${key}`, "check ts chunks url bewfore sign");
  let command;
  const patternToCheck = /^https:\/\/[^\/]+\.com\//;
  const startsWithPattern = patternToCheck.test(key);

  if (startsWithPattern) {
    const regexPattern = /(https:\/\/[^\/]+\.com\/)/;
    const modifiedKey = key.replace(regexPattern, "");
    console.log(modifiedKey, "modifiedKey");
    command = new GetObjectCommand({ Bucket: bucket, Key: modifiedKey });
  } else {
    command = new GetObjectCommand({ Bucket: bucket, Key: key });
  }

  try {
    const url = await getSignedUrl(checkSigS3, command, { expiresIn: 432000 });
    console.log(url, "ts chunk presignedurl");
    return url.toString();
  } catch (err) {
    console.error("error getting preSignedUrl: ", err);
  }
}

async function processResolution(bucket, resolution, videoId, allKeys) {
  let m3u8Key;
  switch (resolution) {
    case "360p":
      m3u8Key = allKeys.key360;
      break;
    case "480p":
      m3u8Key = allKeys.key480;
      break;
    case "720p":
      m3u8Key = allKeys.key720;
      break;
    case "1080p":
      m3u8Key = allKeys.key1080;
      break;
    default:
      m3u8Key = allKeys.key360;
  }
  const preKey = m3u8Key?.match(/(.+\/\d+p)\//)[1];

  const expires = 3600;
  try {
    let originalM3u8 = await checkSigS3.send(
      new GetObjectCommand({ Bucket: bucket, Key: m3u8Key })
    );
    let responseData = [];
    await new Promise((resolve, reject) => {
      originalM3u8.Body.on("data", (chunk) => {
        responseData.push(chunk);
      });

      originalM3u8.Body.on("end", async () => {
        console.log(responseData, "responseData");
        const responseBodyBuffer = Buffer.concat(responseData);
        const responseBodyString = responseBodyBuffer.toString("utf8");

        if (responseBodyString.includes("https")) {
          await processResolution2(
            bucket,
            resolution,
            videoId,
            responseBodyString,
            allKeys
          );
        } else {
          const chunksToReplace =
            responseBodyString.match(/(\w+)_output\d+\.ts/g);
          console.log(chunksToReplace, "chunksToReplace");
          if (chunksToReplace && chunksToReplace.length > 0) {
            const preSignedUrlPromises = chunksToReplace.map((chunk) => {
              return createPreSignedUrl(bucket, `${preKey}/${chunk}`, expires);
            });

            const preSignedUrls = await Promise.all(preSignedUrlPromises);
            console.log(preSignedUrls, "preSignedUrls");
            let updatedM3u8 = responseBodyString;
            chunksToReplace.forEach((chunk, index) => {
              updatedM3u8 = updatedM3u8.replace(chunk, preSignedUrls[index]);
            });
            await checkSigS3.send(
              new PutObjectCommand({
                Bucket: bucket,
                Key: m3u8Key,
                Body: updatedM3u8,
              })
            );
          }
        }

        resolve();
      });
    });
  } catch (error) {
    console.error(`Error processing ${resolution}: ${error.message}`);
  }
}

async function processResolution2(
  bucket,
  resolution,
  videoId,
  responseBodyString,
  allKeys
) {
  let m3u8Key;
  switch (resolution) {
    case "360p":
      m3u8Key = allKeys.key360;
      break;
    case "480p":
      m3u8Key = allKeys.key480;
      break;
    case "720p":
      m3u8Key = allKeys.key720;
      break;
    case "1080p":
      m3u8Key = allKeys.key1080;
      break;
    default:
      m3u8Key = allKeys.key360;
  }
  const preKey = m3u8Key?.match(/(.+\/\d+p)\//)[1];
  const expires = 3600;
  try {
    await new Promise(async (resolve, reject) => {
      let originalM3u8 = await checkSigS3.send(
        new GetObjectCommand({ Bucket: bucket, Key: m3u8Key })
      );

      let chunksToReplace = responseBodyString.match(/https:\/\/[^\?]+\?/g);
      console.log(chunksToReplace, "chunksToReplace processResolution2");
      if (chunksToReplace && chunksToReplace.length > 0) {
        const preSignedUrlPromises = chunksToReplace.map((chunk) => {
          const matches = chunk.match(/p\/([^?]+\.ts)/);
          let extractedChunk;
          if (matches) {
            extractedChunk = matches[1];
            console.log("Extracted Chunk:", extractedChunk);
          } else {
            console.log("No match found");
          }
          const key1 = `${preKey}/${extractedChunk}`;
          return createPreSignedUrl(bucket, key1, expires);
          // const originalUrl = chunk.slice(0, -1); // Remove the trailing "?" character
          // return createPreSignedUrl(bucket, originalUrl, expires);
        });
        const preSignedUrls = await Promise.all(preSignedUrlPromises);
        console.log(preSignedUrls, "processresolution2 preSignedUrls");
        // chunksToReplace.forEach((chunk, index) => {
        //   console.log(chunk, "chunk inside forEach processresolution2")
        //   console.log(responseBodyString, "responseBodyString inside forEach")
        //   responseBodyString = responseBodyString.replace(
        //     chunk,
        //     preSignedUrls[index] + "?"
        //   );
        // });
        let urlsInResponseBodyString = [
          ...responseBodyString.matchAll(/https:\/\/[^\s]+GetObject/g),
        ];
        urlsInResponseBodyString = urlsInResponseBodyString.map((url) => {
          return url[0];
        });

        urlsInResponseBodyString.forEach((url, index) => {
          responseBodyString = responseBodyString.replace(
            url,
            preSignedUrls[index]
          );
        });

        console.log(responseBodyString, "responseBodyString to put back");
        await checkSigS3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: m3u8Key,
            Body: responseBodyString,
          })
        );
        resolve();
      }
    });
  } catch (error) {
    console.error(`Error processing ${resolution}: ${error.message}`);
  }
}

async function processResolutions(videoId, bucketId, allKeys) {
  const res = resolutions.map((resolution) => {
    console.log(resolution, "check resolution");
    return processResolution(bucketId, resolution, videoId, allKeys);
  });

  await Promise.all(res);
}

async function getVideoByVideoId(req, res, next) {
  // let bucketId = req.tokenData.bucketId
  var video = await prisma.video.findUnique({
    where: {
      videoId: req.params.id,
    },
    include: {
      user: true,
      channel: true,
    },
  });
  let bucketId = video.user.bucketId;
  console.log(video, "video");
  if (video.type == "PRIVATE" && video.userId != req.tokenData.userId) {
    return next(
      createHttpError(400, "You are not authorized to access this video.")
    );
  }

  let zone = await prisma.zones.findFirst({
    where: {
      userId: video.userId,
      type: "video",
    },
  });

  let storageRecord = await prisma.userBandwidth.findMany({
    where: {
      userId: req.tokenData.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  let videoResolSize = await prisma.videoDetail.findMany({
    where: {
      videoId: req.params.id,
    },
  });

  if (!storageRecord && video.userId != req.tokenData.userId) {
    return next(createHttpError(400, "upgrade your plan to watch this video"));
  }
  if (storageRecord <= 0 && video.userId != req.tokenData.userId) {
    return next(createHttpError(400, "upgrade your plan to watch this video"));
  }
  if (
    storageRecord[0]?.left < video.size / 1048576 + 100 &&
    video.userId != req.tokenData.userId
  ) {
    return next(
      createHttpError(
        400,
        "You dont have storage left upgrade your plan to watch this video"
      )
    );
  }
  async function extractKey(url) {
    const match = url.match(/^https:\/\/[^\/]+\/(.*)/);
    return match ? match[1] : null;
  }
  // let bucket = 'my-new-space'
  let key360 = await extractKey(video.url360P);
  let key480 = await extractKey(video.url480P);
  let key720 = await extractKey(video.url720P);
  let key1080 = await extractKey(video.url1080P);
  let allKeys = {
    key360,
    key480,
    key720,
    key1080,
  };
  console.log(key360);
  console.log(key480);
  console.log(key720);
  // let key360 = `${bucketId}/videos/360p/${req.params.id}.m3u8`;
  // let key480 = `${bucketId}/videos/480p/${req.params.id}.m3u8`;
  // let key720 = `${bucketId}/videos/720p/${req.params.id}.m3u8`;
  // let key = `hls-video-storage/streams/360p/${req.params.id}.m3u8`
  let time = 432000; //5 days

  await processResolutions(req.params.id, bucketId, allKeys);
  console.log("processResolutions done");
  console.log(process.env.DO_BUCKET_NAME, "process.env.DO_BUCKET_NAME");
  const [signedUrl360, signedUrl480, signedUrl720, signedUrl1080] = await Promise.all([
    createPreSignedUrlFunc(process.env.DO_BUCKET_NAME || 'media-buckets', key360, time),
    createPreSignedUrlFunc(process.env.DO_BUCKET_NAME || 'media-buckets',key480, time),
    createPreSignedUrlFunc(process.env.DO_BUCKET_NAME || 'media-buckets', key720, time),
    createPreSignedUrlFunc(process.env.DO_BUCKET_NAME || 'media-buckets', key1080, time),
  ]);
  console.log(signedUrl360, "signedUrl360");
  console.log(signedUrl480, "signedUrl480");
  console.log(signedUrl720, "signedUrl720");
  if (!zone) {
    return await res.status(200).json({
      data: {
        data: {
          ...video,
          videoResolSize,
          vastUrl: "",
          preSignedUrl360p: signedUrl360,
          preSignedUrl480p: signedUrl480,
          preSignedUrl720p: signedUrl720,
          preSignedUrl1080p: signedUrl1080,
        },
      },
    });
  }
  return await res.status(200).json({
    data: {
      data: {
        ...video,
        videoResolSize,
        vastUrl: zone.vastUrl,
        preSignedUrl360p: signedUrl360,
        preSignedUrl480p: signedUrl480,
        preSignedUrl720p: signedUrl720,
        preSignedUrl1080p: signedUrl1080,
      },
    },
  });

  // return await res.status(200).json({
  //   data: {
  //     data: {
  //       ...video,
  //       vastUrl: '',
  //       preSignedUrl360p: video.videoUrl,
  //       preSignedUrl480p: video.videoUrl,
  //       preSignedUrl720p: video.videoUrl

  //     }
  //   }
  // });
}

async function generateRokuManifest(req, res, next) {
  try {
    const query = {
      where: {
        userId: req.tokenData.userId,
        archived: true,
        published: true,
        deleted: false,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        channel: true,
      },
    };
    const getOwnedChannels = await prisma.video.findMany(query);

    // Roku Channel Manifest Format
    let rokuManifest = {
      providerName: "MediaPilot",
      lastUpdated: new Date().toISOString(),
      language: "en",
      categories: [
        {
          name: "Movies",
          query: "movies"
        }
      ],
      movies: getOwnedChannels.map((video) => {
        let temp = JSON.parse(JSON.stringify(video));
        
        function durationToSeconds(duration) {
          const [hours, minutes, seconds] = duration.split(":").map(Number);
          return hours * 3600 + minutes * 60 + seconds;
        }

        // Helper function to safely get date string
        function getDateString(dateValue) {
          if (dateValue instanceof Date) {
            return dateValue.toISOString().substring(0, 10);
          } else if (typeof dateValue === 'string') {
            return dateValue.substring(0, 10);
          } else {
            return new Date().toISOString().substring(0, 10);
          }
        }

        let rokuMovie = {
          id: temp.id.toString(),
          title: temp.Title,
          shortDescription: temp.description || "",
          longDescription: temp.description || "",
          thumbnail: temp.thumbnail,
          releaseDate: getDateString(temp.createdAt),
          content: {
            dateAdded: temp.createdAt,
            videos: [
              {
                url: temp.url360P,
                quality: "SD",
                videoType: "MP4",
              },
              {
                url: temp.url480P,
                quality: "SD",
                videoType: "MP4",
              },
              {
                url: temp.url720P,
                quality: "HD",
                videoType: "MP4",
              },
              {
                url: temp.url1080P,
                quality: "FHD",
                videoType: "MP4",
              }
            ],
            duration: durationToSeconds(temp.length),
            adBreaks: []
          }
        };

        // Handle ads with Roku-compatible format
        if (temp.preRoll === true) {
          rokuMovie.content.adBreaks.push({
            time: 0,
            type: "preroll",
            adUrl: "/api/ads/preroll" // Placeholder for ad server URL
          });
        }

        if (temp.midRoll === true && temp.midRollConfig) {
          function createIntervals(totalLength, intervalType, interval) {
            const totalSeconds = durationToSeconds(totalLength);
            let videoInterval = Number(interval);
            const intervalInSeconds =
              intervalType === "min" ? videoInterval * 60 : videoInterval;

            const intervals = [];
            let currentTime = intervalInSeconds;

            while (currentTime < totalSeconds) {
              intervals.push({
                time: currentTime,
                type: "midroll",
                adUrl: "/api/ads/midroll" // Placeholder for ad server URL
              });
              currentTime += intervalInSeconds;
            }

            return intervals;
          }

          const intervals = createIntervals(
            temp.length,
            temp.midRollConfig.intervalType,
            temp.midRollConfig.interval
          );
          rokuMovie.content.adBreaks.push(...intervals);
        }

        if (temp.postRoll === true) {
          rokuMovie.content.adBreaks.push({
            time: durationToSeconds(temp.length),
            type: "postroll",
            adUrl: "/api/ads/postroll" // Placeholder for ad server URL
          });
        }

        // Roku-specific metadata
        rokuMovie.genres = ["Entertainment"];
        rokuMovie.rating = "TV-G";
        rokuMovie.actors = [];
        rokuMovie.directors = [];
        rokuMovie.categories = ["Movies"];
        rokuMovie.tags = ["MediaPilot", "Streaming"];

        return rokuMovie;
      })
    };

    // Set response headers for Roku manifest
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-cache');
    
    return res.status(200).json(rokuManifest);
  } catch (error) {
    console.error(error);
    return next(createHttpError());
  }
}

module.exports = {
  create,
  update,
  archive,
  remove,
  ownedListArchived,
  ownedListPublished,
  ownedListCompleteArchived,
  ownedListCompletePublished,
  ownedListSinglePublished,
  videoUpload,
  schedule,
  scheduleGet,
  scheduleDelete,
  scheduleEdit,
  getVideo,
  getUserPublicVideos,
  changeType,
  ownedListPublishedProcessed,
  getVideoByVideoId,
  liveStreamingVideos,
  getLiveStreamingOnAir,
  generateRokuManifest,
};