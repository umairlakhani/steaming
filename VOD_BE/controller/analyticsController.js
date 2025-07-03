const { PrismaClient } = require("@prisma/client");
const prisma = require('../prisma/client');
require("dotenv").config();
const createHttpError = require("http-errors");
const { getVideoAnalyticsForUserVideos } = require("../utils/videoStats");

async function getAnalyticsData(req, res, next) {
  try {
    const { userId } = req.tokenData;
    const { startDate, endDate } = req.params;

    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log('Calling getVideoAnalyticsForUserVideos with:', { userId, start, end });

    const videoAnalytics = await getVideoAnalyticsForUserVideos(userId, start, end);

    console.log('Received videoAnalytics:', videoAnalytics);

    res.json({ videoAnalytics });
  } catch (error) {
    console.error('Error in getAnalyticsData:', error);
    next(createHttpError(500, "Internal Server Error"));
  }
}

async function getData(req, res, next) {
  try {
    const bucketId = req.params.id;

    const user = await prisma.user.findMany({
      where: { bucketId },
    });

    console.log(user, "user");

    const usageTableRecords = await prisma.usageTable.findMany({
      where: { bucketId },
      include: {
        subscription: {
          select: {
            subscriptionPlan: true,
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const userBandwidthRecords = await prisma.userBandwidth.findMany({
      where: { userId: user[0]?.id },
      include: {
        subscription: {
          select: {
            subscriptionPlan: true,
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log(usageTableRecords[0], "usageTableRecords");
    console.log(userBandwidthRecords[0], "userBandwidthRecords");

    if (usageTableRecords.length > 0) {
      const jsonFrom = usageTableRecords[0]?.from.toString();
      const jsonTo = usageTableRecords[0]?.to.toString();
      const jsonTotal = usageTableRecords[0]?.total.toString();
      const jsonFromBandwidth = userBandwidthRecords[0]?.from.toString() || "0";
      const jsonToBandwidth = userBandwidthRecords[0]?.to.toString() || "0";
      const jsonTotalBandwidth =
        userBandwidthRecords[0]?.total.toString() || "0";

      console.log(jsonTo, "jsonTo");

      const bandwidth = userBandwidthRecords[0]
        ? {
            ...userBandwidthRecords[0],
            from: jsonFromBandwidth,
            to: jsonToBandwidth,
            total: jsonTotalBandwidth,
          }
        : null;

      const data = {
        ...usageTableRecords[0],
        from: jsonFrom,
        to: jsonTo,
        total: jsonTotal,
        bandwidth,
      };

      res.json({ data });
    } else {
      res.json({ data: null });
    }
  } catch (error) {
    next(createHttpError(500, "Internal Server Error"));
  }
}

module.exports = {
  getData,
  getAnalyticsData,
};
