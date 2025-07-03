const { checkAndGenerateThumbnail } = require('../../../thumbnail');
const cronScheduleOBS = process.env.CRON_SCHEDULE_OBS;

const CronJob = require('cron').CronJob,
    axios = require('axios'),
    helpers = require('./helpers'),
    config = require('../config/default'),
    port = config.rtmp_server.http.port;
const ThumbnailGeneratorFunction =()=> {
    console.log("check 1 minute to generate thumbnails");
    axios.get('http://127.0.0.1:' + port + '/api/streams')
        .then(response => {
            let streams = response.data;
            if (typeof (streams['live'] !== undefined)) {
                let live_streams = streams['live'];
                for (let stream in live_streams) {
                    if (!live_streams.hasOwnProperty(stream)) continue;
                    helpers.generateStreamThumbnail(stream);
                }
            }
        })
        .catch(error => {
            console.log(error);
        });
}
const thumbnailGenerator = new CronJob(cronScheduleOBS,ThumbnailGeneratorFunction
, null, false);

module.exports = {thumbnailGenerator};