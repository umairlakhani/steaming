const Redis = require("ioredis");
const {
  PrismaClient,
} = require("@prisma/client");
const redisConfig = require("./redisConfig");
const prisma = new PrismaClient();
// Create a Redis client
const client = new Redis(redisConfig);
  console.log(client);
  // Event listener when the connection is closed
client.on('end', () => {
    console.log('Connection to Redis closed');
  });
  
  // Event listener when the connection is ready
  client.on('ready', () => {
    console.log('Redis connection is ready');
  });
// Function to save bandwidth data to Redis
function saveBandwidthData(data) {
    const { socketId } = data;
    const key = `liveAnalyticSocketId:${socketId}`;
  
    // Save data to Redis
    client.hset(key, data, (err, reply) => {
      if (err) {
        console.error(`Error saving data for liveAnalyticSocketId ${socketId}: ${err}`);
      } else {
        console.log(`Data saved for liveAnalyticSocketId ${socketId}: ${reply}`);
      }
    });
  }
  
  // Function to delete data on user disconnect
  function deleteDataOnDisconnect(socketId) {
    const key = `liveAnalyticSocketId:${socketId}`;
  
    // Delete data from Redis
    client.del(key, (err, reply) => {
      if (err) {
        console.error(`Error deleting data for liveAnalyticSocketId ${socketId}: ${err}`);
      } else {
        console.log(`Data deleted for liveAnalyticSocketId ${socketId}: ${reply}`);
      }
    });
  }
  
  // Function to log the last saved data
  async function logLastSavedData(analyticId) {
    const key = `liveAnalyticSocketId:${analyticId}`;
    await client.keys("liveAnalyticSocketId:*",async(err,data)=>{
      console.log("all data",data);
    })
    // Get data from Redis
    client.hgetall(key, async(err, data) => {
      if (err) {
        console.error(`Error retrieving data for liveAnalyticSocketId ${analyticId}: ${err}`);
      } else {
        console.log(`Last saved data for liveAnalyticSocketId ${analyticId}:`, data);
      if(Number(data.analyticId)>=0){
        console.log("Updating analytics")
        let storageRecord = await prisma.userBandwidth.findMany({
          where:{
            userId:Number(data.userId)
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        if(storageRecord.length>0){
           let updatedStorageRecord = await prisma.userBandwidth.update({
            where:{
              id:storageRecord[0].id
            },
            data:{
              used:{increment:Number(data.downloaded)},
              left:{decrement:Number(data.downloaded)}
            }
          })
        }
        var UpdateVideoAnalytic = await prisma.liveAnalytics.update({
          where:{
            id:Number(data.analyticId)
          },
          data: {
            bandwidth:Number(data.downloaded)
          } 
      });
 
      }
      }
    });
  }
  async function logAllLastSavedData(streamId) {
    const mainKey = `liveAnalyticSocketId:*`;
    await client.keys("liveAnalyticSocketId:*",async(err,data)=>{
      console.log("all data",data);
      data.forEach(async key=>{
        // Get data from Redis
    await client.hgetall(key, async(err, data) => {
      if (err) {
        console.error(`Error retrieving data for liveAnalyticSocketId ${streamId}: ${err}`);
      } else {
        console.log(`Last saved data for liveAnalyticSocketId ${streamId}:`, data);
      if(Number(data.analyticId)>=0 && data.streamingId==streamId){
        console.log("Updating analytics")
        let storageRecord = await prisma.userBandwidth.findMany({
          where:{
            userId:Number(data.userId)
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
        if(storageRecord.length>0){
           let updatedStorageRecord = await prisma.userBandwidth.update({
            where:{
              id:storageRecord[0].id
            },
            data:{
              used:{increment:Number(data.downloaded)},
              left:{decrement:Number(data.downloaded)}
            }
          })
        }
        var UpdateVideoAnalytic = await prisma.liveAnalytics.update({
          where:{
            id:Number(data.analyticId)
          },
          data: {
            bandwidth:Number(data.downloaded)
          } 
      });
           // Delete data from Redis
    client.del(key, (err, reply) => {
      if (err) {
        console.error(`Error deleting data for liveAnalyticSocketId ${key}: ${err}`);
      } else {
        console.log(`Data deleted for liveAnalyticSocketId ${key}: ${reply}`);
      }
    });
      }
      }
    });
      })
    })
    
  }

  module.exports={deleteDataOnDisconnect,logLastSavedData,saveBandwidthData,logAllLastSavedData}