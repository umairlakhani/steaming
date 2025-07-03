var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
var cookieSession = require("cookie-session");
// const bodyParser = require("body-parser");
const helmet = require("helmet");
var http = require("http");
// const fileUpload = require("express-fileupload");
let broadcaster;
const  timeout = require('connect-timeout');

const authenticateRouter = require("./routes/authenticate");
const channelRouter = require("./routes/channel");
const bandwidthRouter = require("./routes/bandwidth");
const usersRouter = require("./routes/users");
const videoRouter = require("./routes/video");
const editorRouter = require("./routes/editor");
const videoStreamRouter = require("./routes/streamer");
const scheduleRouter = require("./routes/schedule");
const adspeedRouter = require("./routes/adspeed");
const zoneRouter = require("./routes/zone");
const liveStreamingRouter = require("./routes/livestreaming");
const subscriptionPlanRouter = require("./routes/subscriptionPlan")
const storageRouter = require("./routes/storage")
const subscriptionRouter = require("./routes/buysubscription")
const analyticsRouter = require("./routes/analytics")
const cors = require("cors");
require("dotenv").config();

const { authorization, authenticate } = require("./common/authentication");
const { handleWebhook } = require("./controller/buySubscriptionController");
// const { socketResponse: analyticsSocketResponse } = require("./controller/bandwidthController");



var app = express();
app.use((req, res, next) => {
  req.setTimeout(10 * 60 * 1000); // 10 minutes timeout for each request
  next();
});
var corsOptions = {
  origin: "http://localhost:4200",
  // optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors({
  origin: ["http://localhost:4200", "http://localhost:5173", "https://dev.mediapilot.io","http://192.168.18.185:4200"],
  credentials:true,
  optionsSuccessStatus: 200
}));

app.use(timeout(2147483647));
app.use(haltOnTimedout);

function haltOnTimedout(req, res, next){
  if (!req.timedout) next();
}

// app.use(helmet());
app.post('/api/webhook',express.raw({type: 'application/json'}),handleWebhook)
app.use(express.json());

app.disable("x-powered-by");

app.use(cookieParser());

app.use(
  cookieSession({
    name: "session",
    keys: ["testKey"],

    // Cookie Options
    cookie: {
      secure: true,
      httpOnly: true,
      domain: "example.com",
      path: "foo/bar",
      expires: 24 * 60 * 60 * 1000 * 30, // 30 days
    },
  })
);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

// router.post('/webhook',buySubscriptionController.handleWebhook)

// app.use('/api/subscriptions/webhook', express.json({ type: 'application/json' }));
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "app")));
app.use(express.static(path.join(__dirname, "dist/vodand-live-stream-fe")));
// app.use('/api/subscriptions/create-payment-intent',bodyParser.raw({type: 'application/json'}))
// app.use(bodyParser.urlencoded());
// app.use(bodyParser.json());
// app.use(
//   fileUpload({
//     useTempFiles: true,
//     tempFileDir: "/tmp/",
//   })
// );

app.use("/api/authenticate", authenticateRouter, authenticate);
app.use("/api/channel", authorization, channelRouter);
app.use("/api/users", usersRouter, authenticate);
app.use("/api/video", videoRouter);
app.use("/api/editor", authorization, editorRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/video", videoStreamRouter);
app.use("/api/adspeed", authorization, adspeedRouter);
app.use("/api/zone", authorization, zoneRouter);
app.use("/api/livestreaming", liveStreamingRouter);
app.use("/api/subscriptionPlan", subscriptionPlanRouter);
app.use("/api/storage", storageRouter);
app.use("/api/subscriptions", subscriptionRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/bandwidth",bandwidthRouter );

app.use(
  "/tempVideo/:token",
  (req, res, next) => {
    if (
      req.params.token !==
      "N7KTwCjYH4ZGwC4YSn3YXgxpj7x3FKj7kYTwt8EzH2ZnATUwqyUWxW5OHphO1rYJAq0pT7GJanadlA8O"
    ) {
      return res.status(401).json({ message: "Access not allowed!" });
    }
    next();
  },
  express.static(path.join(__dirname, "tempVideo"))
);
app.use("/profileImages/", express.static(path.join(__dirname, "userImage")));
app.use("/channelImage/", express.static(path.join(__dirname, "channelImage")));
app.get("/temp/video/player", function (req, res) {
  res.sendFile(path.join(__dirname + "/temp.html"));
});
app.get("/test", function (req, res) {
  res.send({
    name: "asdd",
  });
});
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "dist/vodand-live-stream-fe/index.html"));
});


// app.get('api/socket.io/socket.io.js', function(req, res){
//   // this assumes you have a folder within your root named socket.io
//   // and that it contains socket.io.js,
//   res.sendFile(__dirname + '/socket.io/socket.io.js');
// })
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // console.log({req}, {res});
  
  // console.log(err, "Error in app");
  // set locals, only providing error in development
  // res.locals.message = err.message;
  // res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500).json({
    message: err.message || "Internal server error",
  });
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
module.exports = app;
