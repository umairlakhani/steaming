const { PrismaClient } = require("@prisma/client");
const { createLiveStreamRecord } = require("../liveStreamingController");
const {
  getStreamKeyFromDatabase,
  deleteStreamKeyFromDatabase,
  isValidStreamKey,
  blockStreamKey,
  getStreamKeyFromStreamPath,
  endStream,
} = require("../utils/streaming");
const { donePublish, prePublish } = require("./nms");

const NodeMediaServer = require("node-media-server"),
  config = require("./config/default").rtmp_server,
  helpers = require("./helpers/helpers");

let nms = new NodeMediaServer(config);

nms.on("prePublish",prePublish);

nms.on("donePublish",donePublish);

module.exports = nms;
