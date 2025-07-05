const { getCodecInfoFromRtpParameters } = require("./utils");

// File to create SDP text from mediasoup RTP Parameters
module.exports.createSdpText = (videoPorts) => {
  let {
    rtpAudioPort,
    rtpAudioRemotePort,
    rtcpAudioPort,
    rtcpAudioRemotePort,
    rtpVideoPort,
    rtpVideoRemotePort,
    rtcpVideoPort,
    rtcpVideoRemotePort,
  } = videoPorts;

  return `v=0
o=- 0 0 IN IP4 127.0.0.1
s=-
c=IN IP4 127.0.0.1
t=0 0
m=audio ${rtpAudioRemotePort} RTP/AVPF 111
a=rtcp:${rtcpAudioRemotePort}
a=rtpmap:111 opus/48000/2
a=fmtp:111 minptime=10;useinbandfec=1
m=video ${rtpVideoRemotePort} RTP/AVPF 96
a=rtcp:${rtcpVideoRemotePort}
a=rtpmap:96 VP8/90000`;
};
