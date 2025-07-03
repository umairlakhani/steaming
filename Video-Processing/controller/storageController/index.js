const { PrismaClient, SubscriptionStatus } = require('@prisma/client');
const prisma = new PrismaClient();
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const client = new AWS.S3({
  region: process.env.REGION,
  endpoint: new AWS.Endpoint(`https://${process.env.USER_BUCKET_URL}`),
  accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
  secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
  signatureVersion: 'v4'
});


async function createSpacesBucket() {
  const bucketName = 'media-buckets'; // your existing bucket
  const folderId = uuidv4(); // this becomes the folder name
  const folderKey = `users/${folderId}/`; // key must end with /

  try {
    await client 
      .putObject({
        Bucket: bucketName,
        Key: folderKey,
        Body: '', // empty file
        ACL: 'private',
      })
      .promise();

    console.log(`Folder '${folderKey}' created successfully in bucket '${bucketName}'`);
    return folderId;
  } catch (err) {
    console.error('Failed to create folder:', err);
    throw err;
  }
}
async function getBucketStorageUsage(req, res, next) {
  const userId = req.params['id'];
  const bucketName = 'media-buckets'; // Your fixed bucket name
  const prefix = `users/${userId}/`; // User's folder path

  try {
    let totalStorageSize = 0;
    let continuationToken;

    // Handle pagination (in case there are many files)
    do {
      const listObjectsResponse = await client
        .listObjectsV2({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
        .promise();

      listObjectsResponse.Contents.forEach((object) => {
        totalStorageSize += object.Size;
      });

      continuationToken = listObjectsResponse.IsTruncated
        ? listObjectsResponse.NextContinuationToken
        : null;

    } while (continuationToken);

    console.log(totalStorageSize, 'totalStorageSize');
    return totalStorageSize;
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    throw error;
  }
}

async function getBucketCurrentStorage(folderId) {
  const bucketName = 'media-buckets'; // Your fixed bucket
  const oneMb = 1048576;
  const prefix = `users/${folderId}/`; // Folder path prefix

  try {
    let totalStorageSize = 0;
    let continuationToken;

    do {
      const listObjectsResponse = await client
        .listObjectsV2({
          Bucket: bucketName,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
        .promise();

      if (listObjectsResponse.Contents) {
        listObjectsResponse.Contents.forEach((object) => {
          totalStorageSize += object.Size;
        });
      }

      continuationToken = listObjectsResponse.IsTruncated
        ? listObjectsResponse.NextContinuationToken
        : null;

    } while (continuationToken);

    const totalInMB = (totalStorageSize / oneMb).toFixed(2);
    console.log(`${prefix} used: ${totalInMB} MB`);
    return totalInMB;
  } catch (error) {
    console.error('Error getting folder storage:', error);
    throw error;
  }
}


async function userEligibleToUpload(userId, currentStorageInMB, uploadingFileSizeInMB) {
  console.log(userId, "check userId");

  const subscription = await prisma.subscriptions.findMany({
    where: {
      userId,
      status: SubscriptionStatus.active,
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      subscriptionPlan: true,
    },
  });

  let planStorageInMB;

  if (subscription.length > 0) {
    planStorageInMB = subscription[0].subscriptionPlan.storage * 1024; // Assuming storage is in GB
    console.log(planStorageInMB, "planStorageInMB from subscription");
  } else {
    planStorageInMB = parseFloat(process.env.FREE_STORAGE) || 500; // Default fallback if not set
    console.log(planStorageInMB, "planStorageInMB from FREE_STORAGE");
  }

  const remainingStorage = planStorageInMB - Number(currentStorageInMB);
  console.log(remainingStorage, "remainingStorage in MB");
  console.log(uploadingFileSizeInMB, "uploadingFileSizeInMB");

  const canUpload = remainingStorage >= uploadingFileSizeInMB;

  return {
    canUpload,
    planStorageInMB: roundTo3Decimals(planStorageInMB),
  };
}

function roundTo3Decimals(num) {
  return Math.round(num * 1000) / 1000;
}


async function updateStorage(bucketId, currentStorageMB, uploadingFileSizeMB, planStorageMB) {
  console.log(roundTo3Decimals(currentStorageMB), "currentStorage");
  console.log(roundTo3Decimals(uploadingFileSizeMB), "uploadingFileSize");
  console.log(roundTo3Decimals(planStorageMB), "planStorageMB");

  const updatedStorage = roundTo3Decimals(currentStorageMB + uploadingFileSizeMB);
  console.log(updatedStorage, 'updatedStorage');

  const difference = roundTo3Decimals(planStorageMB - updatedStorage);

  // Fetch the latest storage record for the bucket
  const storageRecords = await prisma.usageTable.findMany({
    where: { bucketId },
    orderBy: { createdAt: 'desc' },
  });

  let updatedStorageRecord;

  if (storageRecords.length > 0) {
    // Update existing record
    updatedStorageRecord = await prisma.usageTable.update({
      where: { id: storageRecords[0].id },
      data: {
        used: updatedStorage,
        left: difference,
      },
    });
  } else {
    // No record found: create a new one
    updatedStorageRecord = await prisma.usageTable.create({
      data: {
        bucketId,
        used: updatedStorage,
        left: difference,
      },
    });
  }

  return updatedStorageRecord;
}

async function updateStorageAfterDelete(bucketId, currentStorageMB, deletingFileSizeBytes, planStorageMB) {
  console.log(bucketId, "bucketId");
  console.log(currentStorageMB, "currentStorageMB");
  console.log(deletingFileSizeBytes, "deletingFileSizeBytes");
  console.log(planStorageMB, "planStorageMB");

  const deletingFileSizeMB = deletingFileSizeBytes / 1048576;
  console.log(deletingFileSizeMB, "deletingFileSizeMB");

  const usageTableRecords = await prisma.usageTable.findMany({
    where: { bucketId },
    orderBy: { createdAt: 'desc' },
  });

  if (usageTableRecords.length === 0) {
    throw new Error(`No storage usage record found for bucketId: ${bucketId}`);
  }

  const updatedStorageUsed = roundTo3Decimals(currentStorageMB - deletingFileSizeMB);
  const updatedStorageLeft = roundTo3Decimals(planStorageMB - updatedStorageUsed);

  const updatedRecord = await prisma.usageTable.update({
    where: { id: usageTableRecords[0].id },
    data: {
      used: updatedStorageUsed,
      left: updatedStorageLeft,
    },
  });

  return updatedRecord;
}

//test purpose start
async function createPreSignedUrl(req, res, next) {
  try {
    const signedUrl = await createPresignedUrlWithClient();
    console.log(signedUrl, "check signed url");
    // Return the signed URL to client as JSON or any other desired response
    return res.json({ url: signedUrl });
  } catch (err) {
    console.error(err, "check err");
    // Send error response to client
    return res.status(500).json({ message: "Failed to create pre-signed URL", error: err.message });
  }
}

const createPresignedUrlWithClient = () => {
  const command = new GetObjectCommand({ Bucket: 'my-new-space', Key: 'my-new-space/videos/360p/33dc46fb639acc2a688796f00.m3u8' });
  return getSignedUrl(checkSigS3, command, { expiresIn: 600 * 24 });
};
//test purpose ends

const createPresignedUrlWithClientFunc = async (bucket, key, time) => {
  const command = new GetObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(checkSigS3, command, { expiresIn: Number(time) });
};

const createPreSignedUrlFunc = async (bucket, key, time) => {
  try {
    const url = await createPresignedUrlWithClientFunc(bucket, key, time);
    console.log(url, "check signed url");
    return url;
  } catch (err) {
    console.error(err, "check err");
    throw err; // re-throw so calling function can handle it
  }
};

const createPresignedUrlWithClientUploadFunc = async (bucket, key, time) => {
  const command = new PutObjectCommand({ Bucket: bucket, Key: key });
  return await getSignedUrl(client, command, { expiresIn: time });
};


module.exports = {
  createSpacesBucket,
  getBucketStorageUsage,
  getBucketCurrentStorage,
  userEligibleToUpload,
  updateStorage,
  updateStorageAfterDelete
}