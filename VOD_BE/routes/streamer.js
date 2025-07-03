const https = require('https');
var express = require('express');
var router = express.Router();
const { PrismaClient } = require("@prisma/client");
const prisma = require('../prisma/client');

router.get('/vod/:id/:url', (req, res) => {
    const start = Date.now();

    res.setHeader('Content-Type', 'application/octet-stream');
    // console.log(`https://hls-video-storage.nyc3.cdn.digitaloceanspaces.com/${req.params.id}%2F${req.params.url}`);
    https.get(`https://hls-video-storage.nyc3.cdn.digitaloceanspaces.com/${req.params.id}%2F${req.params.url}`, (stream) => {
        stream.pipe(res);
        res.stream = {
            headers: stream.headers
        };
    });
    res.on('finish', async () => {
        const size = res.stream.headers['content-length'];
        const duration = Date.now() - start;
        const time = duration / 1000;
        const bandwidth = (size / duration) * 1000;

        await prisma.manualEvents.create({
            data: {
                eventType: "video_package_stream",
                version: 0,
                deviceId: '0',
                userIP: 'my_server',
                userAgent: 'node_server',
                locationCity: 'my_server',
                locationTimeZone: 'my_server',
                dataJson: {
                    videoId: req.params.id,
                    videoUrl: req.params.url,
                    path: req.params.id + '/' + req.params.url,
                    bandwidth,
                    duration,
                    size,
                    time,
                    streamHeader: res.stream,
                    reqHeaders: req.headers
                }
            }
        });

        // Save the streaming time and length to your database or analytics service
    });
});

module.exports = router;