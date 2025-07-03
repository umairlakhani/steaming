const pm2InstanceId = Number(process.env.NODE_APP_INSTANCE) || 0;
console.log("pm2InstanceId",pm2InstanceId)
const config = {
    server: {
        secret: process.env.SERVER_SECRET,
        port : process.env.SERVER_PORT
    },
    rtmp_server: {
        rtmp: {
            port: 1936 + pm2InstanceId,
            chunk_size: 60000,
            gop_cache: true,
            ping: 60,
            ping_timeout: 30
        },
        http: {
            port:process.env.HTTP_PORT,
            mediaroot: '../server/media',
            allow_origin: '*'
        },
        trans: {
            ffmpeg: process.env.FFMPEG_LOCATION,
            tasks: [
                {
                    app: 'live',
                    hls: true,
                    hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                    dash: true,
                    dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
                }
            ]
        }
    }
};

module.exports = config;
