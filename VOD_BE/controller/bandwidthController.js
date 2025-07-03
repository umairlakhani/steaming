const { PrismaClient } = require("@prisma/client");
const { Prisma } = require("@prisma/client");

const {
  saveBandwidthData,
  logLastSavedData,
  deleteDataOnDisconnect,
} = require("../utils/bandwidth");
const prisma = new PrismaClient();

const initializeAnalyticsEvents = (socket, io) => {
  console.log("User connected for analytics:", socket.id);

  socket.on("videoStarted", async (data) => {
    console.log("Video Started");
    console.log(data);
    const { videoId, userId, latitude, longitude, platform } = data;
    
    try {
      const video = await prisma.video.findUnique({
        where: {
          videoId: videoId,
        },
        include: {
          user: true,
        },
      });

      if (!video) {
        console.error("Video not found:", videoId);
        return;
      }

      // Check if analytics record already exists for this user and video
      let videoAnalytic = await prisma.videoAnalytics.findFirst({
        where: {
          videoId: videoId,
          userId: Number(userId),
        },
      });

      if (!videoAnalytic) {
        // Create new record only if one doesn't exist
        videoAnalytic = await prisma.videoAnalytics.create({
          data: {
            videoId,
            userId: Number(userId),
            latitude: parseFloat(latitude) || null,
            longitude: parseFloat(longitude) || null,
            platform,
            playTime: 0,
            bandwidth: 0
          },
        });
        console.log("Created new analytics record:", videoAnalytic.id);
      } else {
        // Update existing record with new location data
        videoAnalytic = await prisma.videoAnalytics.update({
          where: {
            id: videoAnalytic.id
          },
          data: {
            latitude: parseFloat(latitude) || null,
            longitude: parseFloat(longitude) || null,
          },
        });
        console.log("Updated existing analytics record:", videoAnalytic.id);
      }
      
      socket.emit("analyticId", { analyticId: videoAnalytic.id });
    } catch (error) {
      console.error("Error handling video analytics:", error);
    }
  });

  socket.on("updatePlayTime", async (data) => {
    console.log("Updating play time:", data);
    const { analyticId, playTime } = data;
    
    try {
      const currentAnalytics = await prisma.videoAnalytics.findUnique({
        where: { id: analyticId }
      });

      if (!currentAnalytics) {
        console.error("Analytics record not found:", analyticId);
        return;
      }

      // Update with the maximum play time seen
await prisma.videoAnalytics.update({
  where: {
    id: analyticId,
  },
  data: {
    playTime: BigInt(
      Math.floor(
        Math.max(
          parseFloat(playTime),
          parseFloat(currentAnalytics.playTime.toString())
        )
      )
    )
  },
});
      console.log("Updated play time for analyticId:", analyticId);
    } catch (error) {
      console.error("Error updating play time:", error);
    }
  });

  socket.on("bandwidth", async (data) => {
    console.log("Bandwidth update received:", data);
    const { analyticId, downloaded } = data;
    
    try {
      const currentAnalytics = await prisma.videoAnalytics.findUnique({
        where: { id: analyticId }
      });

      if (!currentAnalytics) {
        console.error("Analytics record not found:", analyticId);
        return;
      }

      // Update with the maximum bandwidth seen
      await prisma.videoAnalytics.update({
        where: {
          id: analyticId,
        },
        data: {
          bandwidth: Math.max(parseFloat(downloaded), currentAnalytics.bandwidth || 0)
        },
      });
      console.log("Updated bandwidth for analyticId:", analyticId);
    } catch (error) {
      console.error("Error updating bandwidth:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected");
    console.log(socket.id, "socket.id");

    logLastSavedData(socket.id);
    deleteDataOnDisconnect(socket.id);
  });
};

const startAnalytic = async (req, res, next) => {
  console.log(req.body, "check req.body");
};

module.exports = { startAnalytic, initializeAnalyticsEvents };
