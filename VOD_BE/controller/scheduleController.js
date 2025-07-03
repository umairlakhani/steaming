const createHttpError = require('http-errors');
const Joi = require('joi');
const { PrismaClient } = require('@prisma/client');
const prisma = require('../prisma/client');
const { response } = require('../app');

// Create a schedule

exports.createSchedule = async (req, res, next) => {
  const schema = Joi.object({
    scheduleVideoData: Joi.array().items(
      Joi.object({
        videoId: Joi.string().required(),
        startTimestamp: Joi.date().required(),
        endTimestamp: Joi.date().required(),
      }),
    ).required(),
  });
  console.log(req.params['id'], "req.params['id']")
  console.log(req.query['matchStart'], "req.query['matchStart']")
  const { error } = schema.validate(req.body);
  if (error) {
    return next(createHttpError.BadRequest(error));
  }
  const schedulesCount = await prisma.scheduleVideo.count()

  const getScheduleVideoData = await prisma.scheduleVideoData.findMany({
    where: {
      scheduleId: Number(req.params['id']),
      startTimestamp: {
        gte: req.query['matchStart'],
        lte: req.query['matchEnd']
      }
    }
  })
  console.log(getScheduleVideoData.length, "getScheduleVideoData.length")
  await prisma.scheduleVideoData.deleteMany({
    where: {
      scheduleId: Number(req.params['id']),
      startTimestamp: {
        gte: req.query['matchStart'],
        lte: req.query['matchEnd']
      }
    }
  })
  // }
  const { scheduleVideoData } = req.body;
  const scheduleVideoDataArray = await scheduleVideoData.map((data) => {
    return {
      scheduleId: Number(req.params['id']),
      videoId: data.videoId,
      startTimestamp: data.startTimestamp,
      endTimestamp: data.endTimestamp,
    };
  });
  const scheduleVideoDataResult = await prisma.scheduleVideoData.createMany({
    data: scheduleVideoDataArray,
  });
  await res.json({
    scheduleVideoDataResult
  });


};

exports.saveSchedule = async (req, res, next) => {
  console.log(req.body, "check req.body")

  let data = { ...req.body, userId: req.tokenData.userId }
  const schedule = await prisma.scheduleVideo.create({
    data: data,
  })
  res.json({
    data: { id: schedule.id },
    message: "Schedule created successfully"
  })
}



const getSch = async () => {

}

// Update a schedule
exports.updateSchedule = async (req, res, next) => {
  // filter out the scheduleVideoData delete all properties except videoId startTimestamp endTimestamp
  console.log(req.body, 'req.body');
  const schema = Joi.object({
    name: Joi.string().required(),
    description: Joi.string().required(),
    scheduleVideoData: Joi.array().items(
      Joi.object({
        videoId: Joi.string().required(),
        startTimestamp: Joi.date().required(),
        endTimestamp: Joi.date().required(),
      }),
    ),
  });
  const { error } = schema.validate(req.body);
  if (error) {
    return next(createHttpError.BadRequest(error));
  }
  const { name, description } = req.body;
  const id = parseInt(req.params.id);

  // Update ScheduleVideo
  const updatedScheduleVideo = await prisma.scheduleVideo.update({
    where: { id },
    data: { name, description },
  });

  // Update ScheduleVideoData
  const { scheduleVideoData } = req.body;
  const scheduleVideoDataArray = scheduleVideoData.map((data) => ({
    scheduleId: id,
    videoId: data.videoId,
    startTimestamp: data.startTimestamp,
    endTimestamp: data.endTimestamp,
  }));

  const updatedScheduleVideoData = await prisma.scheduleVideoData.deleteMany({
    where: { scheduleId: id },
  });

  const createdScheduleVideoData = await prisma.scheduleVideoData.createMany({
    data: scheduleVideoDataArray,
  });

  res.json({
    scheduleVideo: updatedScheduleVideo,
    scheduleVideoDataResult: createdScheduleVideoData,
  });
};

// get all schedules with pagination
exports.getAllSchedules = async (req, res, next) => {
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '20');
  const name = (req.query.name || '').replace(/\s/g, '').toLowerCase();

  const schedules = await prisma.scheduleVideo.findMany({
    skip: page - 1 >= 0 ? (page - 1) * limit : 0,
    take: limit,

    where: {
      userId: req.tokenData.userId,
      name: {
        contains: name,
      },
      deleted: false
    },
    include: {
      scheduleData: {
        include: {
          video: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });


  res.json({
    data: schedules,
    count: schedules.length,
  });
};



// get Single schedule
exports.getSchedule = async (req, res, next) => {
  console.log(req.query.date, "req.query.date")

  const id = parseInt(req.params.id);


  let schedule;
  if (req.query.date) {
    let date = req.query.date
    const queryDate = new Date(date);
    const startDate = new Date(queryDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(queryDate);
    endDate.setHours(23, 59, 59, 999);
    console.log(startDate, "check startDate")

    schedule = await prisma.scheduleVideo.findUnique({
      where: {
        id: id,
      },
      include: {
        scheduleData: {
          where: {
            startTimestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            video: true,
          },
        },
      },

    });
  } else {
    schedule = await prisma.scheduleVideo.findUnique({
      where: {
        id: id,
      },
      include: {
        scheduleData: {
          include: {
            video: true,
          },
        },
      },

    });
  }

  res.json(schedule);
};

// delete a schedule
exports.deleteSchedule = async (req, res, next) => {
  // first delete the scheduleData

  const scheduleData = await prisma.scheduleVideoData.deleteMany({
    where: {
      scheduleId: parseInt(req.params.id),
    },
  });

  const schedule = await prisma.scheduleVideo.update({
    where: {
      id: parseInt(req.params.id),
    },
    data: { deleted: true }
  });

  res.json(schedule);
};

exports.getVideoByDateTime = async (req, res, next) => {
  const { dateTime } = req.query;

  const targetDateTime = new Date(dateTime);

  const schedule = await prisma.scheduleVideo.findFirst({
    where: {
      scheduleVideoData: {
        some: {
          startTimestamp: {
            lte: targetDateTime,
          },
          endTimestamp: {
            gte: targetDateTime,
          },
        },
      },
    },
    include: {
      scheduleVideoData: {
        include: {
          video: true,
        },
      },
    },
  });

  if (!schedule) {
    return res
      .status(404)
      .json({ message: 'No video scheduled at the given date and time.' });
  }

  const video = schedule.scheduleVideoData.find((data) => {
    return (
      data.startTimestamp <= targetDateTime &&
      data.endTimestamp >= targetDateTime
    );
  });

  if (!video) {
    return res
      .status(404)
      .json({ message: 'No video found at the given date and time.' });
  }

  res.json(video);
};
const checkStatus = async (id) => {
  const currentTimestamp = new Date().toISOString();
  let data = await prisma.scheduleVideoData.findFirst({
    where: {
      scheduleId: id,
      startTimestamp: {
        lte: currentTimestamp
      },
      endTimestamp: {
        gte: currentTimestamp
      }
    }
  })
  console.log(data, "cjecl data")
  if (data) {
    return await { status: "onAir", startTimestamp: data.startTimestamp }
  } else {
    let data = await prisma.scheduleVideoData.findFirst({
      where: {
        scheduleId: id,
        startTimestamp: {
          gte: currentTimestamp
        },
      }
    })
    if (data) {
      console.log(data, "data will onair")
      return { status: "willOnAir", startTimestamp: data.startTimestamp }
    } else {
      console.log(data, "data onaired")
      return { status: "onAired", startTimestamp: "" }
    }

  }

}
exports.getAllPublicSchedules = async (req, res, next) => {
  // console.log("getall")

  const currentDate = new Date();
  currentDate.setHours(currentDate.getHours() - 2);
  const isoDate = currentDate.toISOString();

  let id = Number(req.params['id'])
  const page = parseInt(req.query.page || '1');
  const limit = parseInt(req.query.limit || '20');
  let query = {
    skip: page - 1 >= 0 ? (page - 1) * limit : 0,
    take: limit,
    where: {
      schedule: {
        userId: id
      },
      startTimestamp: {
        gte: isoDate
      }
    },
    select: {
      schedule: true,
      video: true,
    },
    distinct: ['scheduleId'],
    orderBy: {
      createdAt: 'desc',
    },
  }
  let [data, count] = await prisma.$transaction([
    prisma.scheduleVideoData.findMany(query),
    prisma.scheduleVideoData.count({ where: query.where })
  ])
  // console.log(data,"data")
  for (let [index, value] of data.entries()) {
    console.log(index, "check index")
    // console.log(value['schedule'].id,"value.scheduleId")
    let status = await checkStatus(value['schedule'].id)
    console.log(status, "check status")
    console.log(status.status, "check status.status")
    // console.log(status.status,"check status")
    if (status.status == "onAir") {
      console.log("onair")
      data[index] = { ...data[index], onAir: true, willOnAir: false, startTimestamp: status.startTimestamp }
    }
    if (status.status == 'willOnAir') {
      console.log("will onair")

      data[index] = { ...data[index], onAir: false, willOnAir: true, startTimestamp: status.startTimestamp }
    }
    if (status.status != 'willOnAir' && status.status != "onAir") {
      console.log("past")
      // console.log("else")
      data[index] = { ...data[index], onAir: false, willOnAir: false, startTimestamp: status.startTimestamp }
    }
    // else{
    //   console.log("past")
    //   // console.log("else")
    //   // data[index] = {...data[index],onAir:false,willOnAir:false,startTimestamp:status.startTimestamp}
    // }
    // console.log(index, value);
  }
  // let data = await prisma.scheduleVideoData.findMany(query)
  console.log(data, "check data end")
  return await res.status(200).json({ data: { results: data, totalRecords: count } });

}

exports.getUserPublicLiveStream = async (req, res, next) => {
  let id = Number(req.params['id'])
  let data = await prisma.liveStreaming.findFirst({
    where: {
      userId: id,
      endTime: null
    }
  })
  console.log(data, "check data")
  await res.json({
    data: data
  })
}

exports.getScheduleStatus = async (req, res, next) => {
  let id = Number(req.params['id'])
  const currentTimestamp = new Date().toISOString();
  let data = await prisma.scheduleVideoData.findFirst({
    where: {
      scheduleId: id,
      startTimestamp: {
        lte: currentTimestamp
      },
      endTimestamp: {
        gte: currentTimestamp
      }
    }
  })
  if (data) {
    console.log(data, "data on air")
    res.json({
      data: {
        onAir: true, willOnAir: false, startTimestamp: data.startTimestamp
      }
    })
  } else {
    let data = await prisma.scheduleVideoData.findFirst({
      where: {
        scheduleId: id,
        startTimestamp: {
          gte: currentTimestamp
        },
      }
    })
    if (data) {
      console.log(data, "data will onair")

      res.json({
        data: {
          onAir: false, willOnAir: true, startTimestamp: data.startTimestamp
        }
      })
    } else {
      console.log(data, "data onaired")
      res.json({
        data: {
          onAir: false, willOnAir: false, startTimestamp: data.startTimestamp
        }
      })
    }

  }

}
exports.scheduleDataGet = async (req, res, next) => {
  console.log(req.query['id'], "check req ")

  try {
    let scheduleData;
    if (req.query['id'] == undefined) {
      scheduleData = await prisma.scheduleVideoData.findMany({});
    } else {
      scheduleData = await prisma.scheduleVideoData.findMany({
        where: {
          scheduleId: Number(req.query['id'])
        },
        include: {
          schedule: true
          //   scheduleId:true
        }
      });
    }

    return await res.status(200).json({ data: scheduleData });
  } catch (error) {
    console.log(error);
    return next(createHttpError());
  }
}
exports.processSlots = async (req, res, next) => {
  let apiSlots = []
  let currentTime = req.body['currentTime']
  let endTime = req.body['endTimeInSeconds']
  console.log(req.body['currentTime'], "req.body['currentTime']")
  console.log(req.body['endTimeInSeconds'], "req.body['endTimeInSeconds']")
  console.log(req.body['dateString'], "req.body['dateString']")
  console.log(await timeToSeconds(req.body['videos'][0].length), "await timeToSeconds(req.body['videos'][0].length)")
  while (currentTime < endTime && ((endTime - currentTime) > (await timeToSeconds(req.body['videos'][0].length)))) {
    for (const video of req.body['videos']) {
      const videoDuration = await timeToSeconds(video.length);
      // console.log(await videoDuration,"videoDuration")
      if (currentTime + videoDuration <= endTime) {
        console.log(currentTime + videoDuration <= endTime, "currentTime + videoDuration <= endTime ")
        let startSecToTime = await secondsToTime(currentTime)
        let endSecToTime = await secondsToTime(currentTime + videoDuration)
        // console.log(await startSecToTime,"startSecToTime")
        // console.log(await endSecToTime,"endSecToTime")
        apiSlots.push({
          video: video,
          videoId: video.videoId,
          startTimestamp: await check(await startSecToTime, req.body['dateString']),
          endTimestamp: await check(await endSecToTime, req.body['dateString']),
        })
        currentTime += videoDuration;
      }
    }
  }
  console.log("finished data apislots")
  return await res.json({
    data: apiSlots
  })
}
timeToSeconds = async (time) => {
  const [hours, minutes, seconds] = await time.split(':').map(Number);
  return await hours * 3600 + minutes * 60 + seconds;
}
check = async (timestring, datestring) => {
  const dateObj = new Date(datestring);
  // console.log(dateObj, "check dateobj")
  // console.log(await timestring, "check timestring")
  const [hours, minutes, seconds] = await timestring.split(':');
  dateObj.setHours(hours);
  dateObj.setMinutes(minutes);
  dateObj.setSeconds(seconds);
  // console.log(hours,"hours")
  // console.log(minutes,"minutes")
  // console.log(seconds,"seconds")
  // console.log(dateObj, "check dateobj")
  const isoString = dateObj.toISOString();
  return isoString
}
secondsToTime = async (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = await seconds % 60;
  // console.log(hours,"hours")
  // console.log(minutes,"minutes")
  // console.log(remainingSeconds,"remainingSeconds")
  return `${await padZero(hours)}:${await padZero(minutes)}:${await padZero(remainingSeconds)}`;
}

padZero = async (num) => {
  return await num.toString().padStart(2, '0');
}
