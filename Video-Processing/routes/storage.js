const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const AWS = require('aws-sdk');

// Configure AWS
const s3 = new AWS.S3({
  endpoint: `https://${process.env.REGION}.digitaloceanspaces.com`,
  accessKeyId: process.env.DIGITAL_OCEAN_ACCESS_KEY,
  secretAccessKey: process.env.DIGITAL_OCEAN_SECRET_KEY,
});

// Get bucket space usage
router.get('/bucket-space', async (req, res) => {
  try {
    const params = {
      Bucket: process.env.DO_BUCKET_NAME
    };

    const data = await s3.getBucketLocation(params).promise();
    
    // Get bucket metrics
    const metrics = await s3.listObjects(params).promise();
    
    let totalSize = 0;
    if (metrics.Contents) {
      totalSize = metrics.Contents.reduce((acc, obj) => acc + obj.Size, 0);
    }

    res.json({
      success: true,
      data: {
        location: data.LocationConstraint,
        totalSize: totalSize,
        totalSizeInMB: (totalSize / (1024 * 1024)).toFixed(2)
      }
    });
  } catch (error) {
    console.error('Error getting bucket space:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error getting bucket space'
    });
  }
});

module.exports = router; 