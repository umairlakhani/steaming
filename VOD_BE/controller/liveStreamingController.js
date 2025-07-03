var socketIO = require("socket.io");
const createHttpError = require("http-errors");
var app = require("../app");
var http = require("http");
const { PrismaClient } = require("@prisma/client");
const prisma = require('../prisma/client');
// import { name } from '../server';
// const obj  = require('../server');
const obj = require("../bin/www");
const fs = require("fs");
var path = require("path");
const Joi = require("joi");
const generateStreamKey = require("../utils/streaming");
const formidable = require("formidable");
const AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY, // Replace with your DigitalOcean Spaces access key
  secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY, // Replace with your DigitalOcean Spaces secret key
  endpoint: process.env.DIGITAL_OCEAN_TEMP_URL_KEY, // Replace with your DigitalOcean Spaces endpoint
  s3ForcePathStyle: true,
});

const spaces = new AWS.S3({
  signatureVersion: "v4",
  params: {
    acl: "public-read",
  },
});

async function getLiveStreaming(req, res, next) {
  let userId = req.params["id"];
  let broadcaster;
  let watcher;
  let connectedUsers = [];
  obj.io.of("/api").on("connection", (socket) => {
    console.log("Connected");
    socket.on(`broadcaster`, () => {
      broadcaster = socket.id;
      console.log(socket.id, "check broad id");
      socket.broadcast.emit(`broadcaster`);
      console.log(connectedUsers, "connectedUsers");
    });
    socket.on(`watcher`, () => {
      console.log(`route watcher`);
      connectedUsers.push(socket.id);
      console.log(connectedUsers, "Arr");
      watcher = socket.id;
      let obj = {
        socketId: socket.id,
        connectedUser: connectedUsers.length,
      };
      socket.to(broadcaster).emit(`watcher`, obj);
    });
    socket.on(`offer`, (id, message) => {
      console.log(`offer`);

      socket.to(id).emit(`offer`, socket.id, message);
    });
    socket.on(`answer`, (id, message) => {
      console.log(`answer `);

      socket.to(id).emit(`answer`, socket.id, message);
    });
    socket.on(`candidate`, (id, message) => {
      socket.to(id).emit(`candidate`, socket.id, message);
    });
    socket.on(`chatComponentClosed`, () => {
      console.log(`chatComponentClosed`);
      socket.to(broadcaster).emit(`chatComponentClosed`);
    });
    socket.on(`disconnect`, () => {
      connectedUsers.splice(0, 1);

      console.log(`route closed `);
      let obj = {
        socketId: socket.id,
        connectedUsers: connectedUsers.length,
      };
      socket.to(broadcaster).emit(`disconnectPeer`, obj);
      socket.to(watcher).emit(`chatComponentClosed`, socket.id);
      console.log(connectedUsers, "Arr discoonect");
    });

    socket.on(`disconnectWatcher`, () => {
      console.log(`Dispatcher closed`);
      console.log(connectedUsers, "Arr disconnect watcer");
    });
  });
  res.json({
    message: "Connected",
  });
}

const makeDirnameFilename = (name, chunk) => {
  const dirname = `./app/uploads/${name}`;
  const filename = `${dirname}/${chunk}.webm`;
  return [dirname, filename];
};

async function uploadLiveStream(req, res, next) {
  console.log("Upload endpoint working");
  try {
    const file = req.files.file;
    console.log(file, "FILE");
    const chunk_name = "0";
    const [dirname, filename] = makeDirnameFilename(
      req.body.name,
      chunk_name
      // req.body.chunk
    );
    if (fs.existsSync(dirname)) {
      //file exists
      if (fs.existsSync(filename)) {
        const list = fs
          .readdirSync(dirname)
          .filter((file) => fs.lstatSync(path.join(dirname, file)).isFile())
          .map((file) => ({
            file,
            mtime: fs.lstatSync(path.join(dirname, file)).mtime,
          }))
          .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

        console.log("list", list);
        const fil = list[0];
        console.log(fil.file.substr(0, fil.file.indexOf(".")));
        const file_ = `${dirname}/${parseInt(fil.file) + 1}.webm`;

        console.log(file_, "File");
        file.mv(file_);
        // file.mv(chunk_name);
        if (list.length > 3) {
          res.statusCode = 200;
          // res.setHeader("Content-Type", "application/json");
          res.json({ file_name: req.body.name });
        }
      } else {
        console.log(filename, "filename");
        file.mv(filename);
        res.statusCode = 200;
        // res.setHeader("Content-Type", "text/plain");
        res.json({ success: "true" });
      }

      console.log("Folder already exist");
    } else {
      console.log(req.body, "req.body");
      console.log(req.tokenData, "req.tokenData");
      try {
        const liveStreamRecord = await prisma.liveStreaming.create({
          data: {
            userId: req.tokenData.userId,
            isCompleted: false,
            streamingId: req.body.name,
            startTime: new Date().toISOString(),
          },
        });
      } catch (error) {
        console.log(error, "Errr");
      }
      fs.promises.mkdir(dirname, { recursive: true }).then(file.mv(filename));
      res.statusCode = 200;
      // res.setHeader("Content-Type", "text/plain");
      res.json({ success: "true" });
    }
  } catch (error) {
    console.log(error, "Upload Endpoint Error");
  }
}

async function downloadStream(req, res, next) {
  try {
    const query = req.query;
    const di_name = `./app/uploads/${query.name}`;
    const list = fs
      .readdirSync(di_name)
      .filter((file) => fs.lstatSync(path.join(di_name, file)).isFile())
      .map((file) => ({
        file,
        mtime: fs.lstatSync(path.join(di_name, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    console.log("list asd", list);
    // const fil = list[5].file.substr(0, list[5].file.indexOf("."));
    console.log(list, "Filll");

    const [dirname, filename] = makeDirnameFilename(query.name, query.chunk);
    console.log(query, "Query");
    fs.promises
      .readFile(filename)
      .then((file) => {
        console.log("FS then", "Query");
        res.statusCode = 200;
        res.write(file, "binary");
        res.end();
      })
      .catch((error) => {
        console.log("FS Catch", error);

        res.statusCode = 204;
        res.end();
      });
  } catch (error) {
    console.log(error, "Download Error");
  }
}

async function get_latest_chunk(req, res, next) {
  try {
    console.log(req.query, "check req.body");
    const findRecord = await prisma.liveStreaming.findUnique({
      where: {
        streamingId: String(req.query["name"]),
      },
    });
    console.log(findRecord, "findRecord");
    const updatedRecord = await prisma.liveStreaming.update({
      where: {
        streamingId: String(req.query["name"]),
      },
      data: {
        noOfUsers: findRecord.noOfUsers + 1,
      },
    });
    console.log(updatedRecord, "updatedRecord");
    const query = req.query;
    const di_name = `./app/uploads/${query.name}`;
    const list = fs
      .readdirSync(di_name)
      .filter((file) => fs.lstatSync(path.join(di_name, file)).isFile())
      .map((file) => ({
        file,
        mtime: fs.lstatSync(path.join(di_name, file)).mtime,
      }))
      .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    console.log("list asd", list);
    if (list && list.length > 3) {
      res.send(list[2].file.substr(0, list[2].file.indexOf(".")));
    }
  } catch (error) {
    console.log(error, "Error in getting chunk");
  }
}

async function terminateStream(req, res, next) {
  console.log(req.body, "req.body");
  // const getRecord = await prisma.liveStreaming.findUnique({where:{streamingId:req.body.name}})
  const liveStreamRecord = await prisma.liveStreaming.update({
    where: {
      streamingId: String(req.body.name),
    },
    data: { endTime: new Date().toISOString(), isCompleted: true },
  });
  console.log(liveStreamRecord, "liveStreamRecord");
  await res.json({
    message: "Live streaming ended",
  });
}

async function createLiveStream(req, res, next) {}

async function userLeft(req, res, next) {
  console.log(req.params["id"]);
  const record = await prisma.liveStreaming.findUnique({
    where: {
      streamingId: String(req.params["id"]),
    },
  });
  const updatedRecord = await prisma.liveStreaming.update({
    where: {
      streamingId: String(req.params["id"]),
    },
    data: {
      noOfUsers: record.noOfUsers - 1,
    },
  });
  res.json({
    message: "user left successfully",
  });
}
async function createLiveStreamRecord(req, res, next) {
  const schema = Joi.object({
    Title: Joi.string().required(),
    description: Joi.string().required(),
    time: Joi.string().required(),
  });
  const { error, value } = schema.validate(req.body);
  if (error) {
    return next(createHttpError.BadRequest(error));
  }
  let id = `${req.tokenData.userId}${value.time}`;
  const streamKey = await prisma.streamKey.findFirst({
    where: {
      userId: req.tokenData.userId,
    },
  });
  if (!streamKey) {
    return next(createHttpError.BadRequest("Stream key not found"));
  }
  // console.log(id, "id");
  let data = {
    userId: req.tokenData.userId,
    Title: value.Title,
    description: value.description,
    thumbnail: "",
    isCompleted: false,
    streamingId: id,
    startTime: new Date().toISOString(),
    streamKey: streamKey.streamKey,
  };
  console.log(data, "data");
  try {
    const liveStreamRecord = await prisma.liveStreaming.create({ data: data });
    console.log(liveStreamRecord, "liveStreamRecord");
    res.json({
      data: { streamId: id },
      message: "api request response",
    });
  } catch (err) {
    return next(createHttpError());
  }
}
async function getLiveStreamRecord(req, res, next) {
  try {
    const { streamingId } = req.params;
    const streamRecord = await prisma.liveStreaming.findUnique({
      where: {
        streamingId: streamingId,
      },
    });
    return res.status(200).send(streamRecord);
  } catch (error) {
    return next(createHttpError());
  }
}
async function updateLiveStreamThumbnail(req, res, next) {
  try {
    const bucketId = req.tokenData.bucketId;
    const form = formidable();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error(err, "error");
        return next(createHttpError());
      }

      const { streamId } = fields;
      if (!streamId) {
        console.error("No streamId");
        return next(createHttpError());
      }
      const thumbnailFile = files.thumbnail;
      const mimeType = thumbnailFile.mimetype;

      // Check if the MIME type indicates an image
      if (mimeType && mimeType.startsWith("image/")) {
        console.log("Uploaded file is an image");

        fs.readFile(thumbnailFile.filepath, async (readErr, data) => {
          if (readErr) {
            console.error("Error reading file:", readErr);
            return next(createHttpError());
          }

          // Upload image to DigitalOcean Spaces
          const uploadParams = {
            Bucket: bucketId,
            Key: `thumbnail/${streamId}.jpg`,
            Body: data,
            ACL: "public-read",
          };
          spaces.upload(uploadParams, async (uploadErr, uploadData) => {
            if (uploadErr) {
              console.error("Error uploading image:", uploadErr);
              return next(createHttpError());
            }

            console.log(
              "thumbnail uploaded successfully:",
              uploadData.Location
            );
            const updatedRecord = await prisma.liveStreaming.update({
              where: {
                streamingId: streamId,
              },
              data: {
                thumbnail: uploadData.Location,
              },
            });
          });
          res.json({
            data: { streamId: streamId },
            message: "Thumbnail updated",
          });
        });
      } else {
        console.log("Uploaded file is not an image");
        return next(createHttpError());
      }
    });
  } catch (err) {
    console.error(err, "err");
    return next(createHttpError());
  }
}

async function checkVideoOnAir(req, res, next) {
  const currentTimestamp = new Date().toISOString();
  let id = req.params["id"];
  let check = await prisma.scheduleVideoData.findFirst({
    where: {
      videoId: req.params["id"],
      startTimestamp: {
        lte: currentTimestamp,
      },
      endTimestamp: {
        gte: currentTimestamp,
      },
    },
  });
  console.log(check, "check");
  if (check) {
    res.json({ data: { onAir: true, startTimestamp: check.startTimestamp } });
  } else {
    res.json({ data: { onAir: false } });
  }
}

async function deleteLiveStreamById(req, res, next) {
  let id = req.params["id"];
  // try{
  let deleted = await prisma.liveStreaming.delete({
    where: {
      id: Number(id),
    },
  });
  console.log(deleted, "deleted");
}

async function generateStreamKeyForUser(req, res, next) {
  try {
    const { title, description, recorded } = req.body;
    const userId = req.tokenData.userId;
    const streamKey = generateStreamKey();
    const existKey = await prisma.streamKey.findFirst({
      where: { userId: Number(userId) },
    });
    if (!existKey) {
      const newStreamKey = await prisma.streamKey.create({
        data: {
          userId,
          streamKey: streamKey,
          title: title,
          description,
          recorded,
        },
      });
      res.json({ streamKey });
    } else {
      res.json({ streamKey: existKey.streamKey });
    }
  } catch (error) {
    console.error("Error generating stream key:", error);
    return null;
  }
}

async function getStreamKeyForUser(req, res, next) {
  try {
    const userId = req.tokenData.userId;
    const streamKey = await prisma.streamKey.findFirst({
      where: { userId: Number(userId) },
    });
    return res.json({ streamKey: streamKey?.streamKey || null });
  } catch (error) {
    console.error("Error getting stream key:", error);
    return res.json("error");
  }
}

module.exports = {
  getLiveStreaming,
  getStreamKeyForUser,
  getLiveStreamRecord,
  updateLiveStreamThumbnail,
  generateStreamKeyForUser,
  uploadLiveStream,
  downloadStream,
  get_latest_chunk,
  createLiveStream,
  terminateStream,
  userLeft,
  createLiveStreamRecord,
  checkVideoOnAir,
  deleteLiveStreamById,
};
