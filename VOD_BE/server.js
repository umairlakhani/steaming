#!/usr/bin/env node

/**
 * Module dependencies.
 */
var app = require('./app')
// var app1 = express()
var debug = require('debug')('vodandlivestream:server');
var http = require('http');
var socketIO = require('socket.io')
var server;

// Increase timeout to 10 minutes (600000 ms)


// const { Server } = require("socket.io");
let broadcaster;
let watcher;
/**
 * Get port from environment and store in Express.
 */
var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// const port = 3000

/**
 * Create HTTP server.
 */

// const server = http.createServer(app)

server = http.Server(app);
// Increase timeout to 10 minutes (600000 ms)
server.keepAliveTimeout = 10 * 60 * 1000; // 10 minutes
server.headersTimeout = 10 * 60 * 1000 + 5000;
server.setTimeout(600000);

// server.listen(5000);

// const io = socketIO(server, {
//   cors: {
//     // origin: "http://localhost:4200",
//     origin: ["https://dev.mediapilot.io/api","http://localhost:4200"],
//     methods: ["GET", "POST"]
//   }
// });
const io = socketIO(server, {
  cors: {
    // origin: "http://localhost:4200",
    origin: ["https://dev.mediapilot.io/api","http://localhost:4200"],
    methods: ["GET", "POST"]
  }
});

io.on("error", e => console.log(e));
// io.on("error", e => console.log(e));
// io.on("connection", socket => {
//   console.log("Connected")
//   // socket.on("broadcaster", () => {
//   //   broadcaster = socket.id;
//   //   socket.broadcast.emit("broadcaster");
//   // });
//   // socket.on("watcher", () => {
//   //   console.log("route watcher")
//   //   watcher = socket.id
//   //   socket.to(broadcaster).emit("watcher", socket.id);
//   // });
//   // socket.on("offer", (id, message) => {
//   //   console.log("offer ")

//   //   socket.to(id).emit("offer", socket.id, message);
//   // });
//   // socket.on("answer", (id, message) => {
//   //   console.log("answer ")

//   //   socket.to(id).emit("answer", socket.id, message);
//   // });
//   // socket.on("candidate", (id, message) => {
//   //   // console.log("candidate ", message)

//   //   socket.to(id).emit("candidate", socket.id, message);
//   // });
//   // socket.on("chatComponentClosed", () => {
//   //   console.log("chatComponentClosed")
//   //   socket.to(broadcaster).emit("chatComponentClosed"); 
//   // });
//   // socket.on("disconnect", () => {
//   //   console.log("route closed ")
//   //   socket.to(broadcaster).emit("disconnectPeer", socket.id);
//   //   socket.to(watcher).emit("chatComponentClosed", socket.id);
//   //   // socket.to(broadcaster).emit("disconnectWatcher", socket.id);

//   // });
 
//   // socket.on("disconnectWatcher", () => {
//   //   console.log("Dispatcher closed")
//   // })
// });
// io.sockets.on("connection", socket => {
//   console.log(socket, "Socket connection")
//   socket.on("broadcaster", () => {
//     broadcaster = socket.id;
//     socket.broadcast.emit("broadcaster");
//   });
//   socket.on("watcher", () => {
//     console.log("watcher")
//     socket.to(broadcaster).emit("watcher", socket.id);
//   });
//   socket.on("offer", (id, message) => {
//     console.log("offer")

//     socket.to(id).emit("offer", socket.id, message);
//   });
//   socket.on("answer", (id, message) => {
//     console.log("answer")

//     socket.to(id).emit("answer", socket.id, message);
//   });
//   socket.on("candidate", (id, message) => {
//     socket.to(id).emit("candidate", socket.id, message);
//   });
//   socket.on("disconnect", () => {
//     console.log("disconnect route")
//     socket.to(broadcaster).emit("disconnectPeer", socket.id);
//   });
// });
/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`Server is running on port ${port}`));

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
  console.log('listening')
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

// exports.io = io;
exports.io = io;

