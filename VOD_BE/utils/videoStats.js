const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const _ = require("lodash");
const wc = require("which-country");

async function getVideoAnalyticsForUserVideos(userId, startDate, endDate) {
  try {
    console.log("Fetching video analytics for user:", userId, "from", startDate, "to", endDate);

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("Invalid startDate or endDate provided");
      throw new Error("Invalid startDate or endDate");
    }

    const videoAnalytics = await prisma.videoAnalytics.findMany({
      where: {
        video: {
          userId,
        },
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        video: {
          include: {
            channel: {
              select: {
                name: true,
              },
            },
          },
          // select: {
          //   Title: true,
          //   include: {
          //     channel: {
          //       select: {
          //         name: true,
          //       },
          //     },
          //   },
          // },
        },
      },
    });

    if (!videoAnalytics || videoAnalytics.length === 0) {
      console.log("No video analytics found for given criteria");
      return {
        analyticsResult: [],
        totalUniqueViews: 0,
        dailyViews: {},
        dailyBandwidth: {},
        percentages: {},
        dailyPlayTime: {},
        dailyAvgPlayTime: {},
        combinedData: [],
      };
    }

    const uniqueViewsMap = {};
    videoAnalytics.forEach((analytic) => {
      if (analytic.videoId && analytic.createdAt && analytic.createdAt.toISOString) {
        const { userId: currentUserId, videoId, createdAt } = analytic;
        if (!uniqueViewsMap[videoId]) {
          uniqueViewsMap[videoId] = { users: new Map(), dates: new Set() };
        }
        if (!uniqueViewsMap[videoId].users.has(currentUserId)) {
          uniqueViewsMap[videoId].users.set(currentUserId, createdAt);
          uniqueViewsMap[videoId].dates.add(createdAt.toISOString().split("T")[0]);
        }
      } else {
        console.warn("Skipping analytic record due to missing videoId or invalid createdAt:", analytic);
      }
    });

    const getSafeDateString = (item) => {
      if (item && item.createdAt && typeof item.createdAt.toISOString === 'function') {
        return item.createdAt.toISOString().split("T")[0];
      }
      return 'unknown_date';
    };

    const dailyBandwidth = _.chain(videoAnalytics)
      .groupBy(getSafeDateString)
      .mapValues((items) => _.sumBy(items, (x) => parseFloat(x.bandwidth) || 0))
      .value();

    const dailyPlayTime = _.chain(videoAnalytics)
      .groupBy(getSafeDateString)
      .mapValues((items) => _.sumBy(items, (x) => parseFloat(x.playTime) || 0))
      .value();

    const dailyAvgPlayTime = _.chain(videoAnalytics)
      .groupBy(getSafeDateString)
      .mapValues((items) => {
        const totalPlayTime = _.sumBy(items, (x) => parseFloat(x.playTime) || 0);
        const numberOfEntries = items.length;
        return numberOfEntries > 0 ? parseFloat((totalPlayTime / numberOfEntries).toFixed(2)) : 0;
      })
      .value();

    const roundedBandwidth = _.mapValues(dailyBandwidth, (val) => parseFloat(val.toFixed(2)) || 0);

    const analyticsResult = Object.keys(uniqueViewsMap).map((videoId) => ({
      videoId,
      uniqueViews: uniqueViewsMap[videoId].users.size,
      firstViewDates: Array.from(uniqueViewsMap[videoId].users.values()).map((date) =>
        date.toISOString().split("T")[0]
      ),
    }));

    let totalUniqueViews = 0;
    analyticsResult.forEach((view) => {
      totalUniqueViews += view.uniqueViews;
    });

    const dailyViews = {};
    analyticsResult.forEach((video) => {
      video.firstViewDates.forEach((date) => {
        dailyViews[date] = (dailyViews[date] || 0) + 1;
      });
    });

    const countries = videoAnalytics.map((data) => {
      if (data.longitude != null && data.latitude != null) {
        try {
          const country = wc([data.longitude, data.latitude]);
          return country ? country : "Unknown";
        } catch (e) {
          console.warn(`Error getting country for coords: ${data.longitude}, ${data.latitude}`, e);
          return "Unknown";
        }
      }
      return "Unknown";
    });

    const countryCounts = countries.reduce((counts, country) => {
      counts[country] = (counts[country] || 0) + 1;
      return counts;
    }, {});

    const totalOccurrences = Object.values(countryCounts).reduce((a, b) => a + b, 0);
    const percentages = {};
    for (const country in countryCounts) {
      if (totalOccurrences > 0) {
        percentages[country] = ((countryCounts[country] / totalOccurrences) * 100).toFixed(2);
      } else {
        percentages[country] = "0.00";
      }
    }

    const videoData = {};
    videoAnalytics.forEach((item) => {
      if (!item.videoId) return;
      if (!videoData[item.videoId]) {
        videoData[item.videoId] = {
          title: item.video && item.video.Title ? item.video.Title : "Unknown Title",
          channelName: item.video && item.video.channel ? item.video.channel.name : "Unknown Channel",
          totalPlayTime: 0,
          totalBandwidth: 0,
          totalEntries: 0,
        };
      }
      videoData[item.videoId].totalPlayTime += parseFloat(item.playTime) || 0;
      videoData[item.videoId].totalBandwidth += parseFloat(item.bandwidth) || 0;
      videoData[item.videoId].totalEntries++;
    });

    analyticsResult.forEach((item) => {
      if (videoData[item.videoId]) {
        videoData[item.videoId].uniqueViews = item.uniqueViews;
      }
    });

    const combinedData = Object.keys(videoData).map((videoId) => {
      const { title, totalPlayTime, totalBandwidth, uniqueViews = 0, channelName } = videoData[videoId];
      const averagePlayTime = uniqueViews > 0 ? totalPlayTime / uniqueViews : 0;
      return {
        channelName,
        Title: title,
        "Total Time": totalPlayTime.toFixed(2),
        "Average Time": averagePlayTime.toFixed(2),
        "Band Consumed": totalBandwidth.toFixed(2),
        uniqueViews,
      };
    });

    return {
      analyticsResult,
      totalUniqueViews,
      dailyViews,
      dailyBandwidth: roundedBandwidth,
      percentages,
      dailyPlayTime,
      dailyAvgPlayTime,
      combinedData,
    };
  } catch (error) {
    console.error("Critical Error in getVideoAnalyticsForUserVideos:", error.message, error.stack);
    throw error;
  }
}

module.exports = { getVideoAnalyticsForUserVideos };
