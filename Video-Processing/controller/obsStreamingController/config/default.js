const pm2InstanceId = Number(process.env.NODE_APP_INSTANCE) || 0;

const config = {
    server: {
        secret: process.env.SERVER_SECRET || 'default_secret',
        port: process.env.SERVER_PORT || 3000
    },
    rtmp_server: {
        rtmp: {
            port: 1935, // Standard RTMP port - don't add pm2InstanceId
            chunk_size: 60000,
            gop_cache: true,
            ping: 60,
            ping_timeout: 30
        },
        http: {
            port: process.env.HTTP_PORT || 8000,
            mediaroot: './media', // Fixed path
            allow_origin: '*'
        },
        trans: {
            ffmpeg: process.env.FFMPEG_LOCATION || 'ffmpeg',
            tasks: [
                {
                    app: 'live',
                    hls: true,
                    hlsFlags: '[hls_time=2:hls_list_size=3:hls_flags=delete_segments]',
                    dash: false, // Disable DASH to reduce complexity
                    dashFlags: '[f=dash:window_size=3:extra_window_size=5]'
                }
            ]
        }
    }
};

module.exports = config;