#!/usr/bin/env node

/**
 * Module dependencies.
 */

var app = require('../app');
var debug = require('debug')('vodandlivestream:server');
var http = require('http');
var https = require('https');
var fs = require('fs');
var socketIO = require('socket.io')
var Server = require("socket.io");
const { initializeAnalyticsEvents } = require('../controller/bandwidthController')
// const { initializeWebRTCEvents } = require('../services/webrtcService');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3005');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server;
var io;

if (process.env.NODE_ENV == "production"){
  console.log("Prod")
  const privateKey = fs.readFileSync('/etc/letsencrypt/live/mediapilot.io/privkey.pem', 'utf8');
    const certificate = fs.readFileSync('/etc/letsencrypt/live/mediapilot.io/cert.pem', 'utf8');
    const ca = fs.readFileSync('/etc/letsencrypt/live/mediapilot.io/chain.pem', 'utf8');
    const credentials = {
        key: privateKey,
        cert: certificate,
        ca: ca
    };

     https.createServer(credentials, app).listen(443, () => {
        console.log('HTTPS Server running on port 443');
    });
    server = http.Server(function (req, res) {
      res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
      res.end();
    });

     io = new Server(server, {
      cors: {
        // origin: "http://localhost:4200",
        
        origin: ["https://dev.mediapilot.io","http://localhost:4200","http://192.168.18.185:4200"],
        methods: ["GET", "POST"]
      }
    });
    io.on("error", e => console.log(e));

  io.sockets.setMaxListeners(30)
    
} else {
  console.log("local")

  server = http.Server(app);
   io = socketIO(server, {
    cors: {
      // origin: "http://localhost:4200",
      origin: ["https://dev.mediapilot.io","http://localhost:4200"],
      methods: ["GET", "POST"]
    }
  });

//   io.on('connection', function(socket) {
//     console.log('client connected');

//     // listen for incoming data msg on this newly connected socket
//     socket.on('data',function (data) {
//         console.log(data, "RTC")
//         socket.emit('d-reci', data)
//     });

// });
  io.on("error", e => console.log(e));

  io.sockets.setMaxListeners(30)
}
/**
 * Listen on provided port, on all network interfaces.
 */

// server.listen(port);
server.listen(port,()=>{
  console.log("server listening to port",port)
})
server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {

  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);

}

// MODIFIED: New connection handler
io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id} - Calling initializers`);

  initializeAnalyticsEvents(socket, io); // For VOD analytics
  // initializeWebRTCEvents(socket, io); // Placeholder for future WebRTC features

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
    // Call any specific cleanup functions needed for analytics or WebRTC when a socket disconnects.
    // Note: initializeAnalyticsEvents already sets up its own 'disconnect' listener for analytics-specific cleanup.
  });
});
