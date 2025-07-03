module.exports = {
    apps : [
        {
          name: "dev_mediapilot",
          script: "./bin/www",
          instances: 2,
          exec_mode: "cluster",
          watch: false,
          increment_var : 'PORT',
          env: {
              "PORT": 80,
              "NODE_ENV": "production"
          }
        }
    ]
  }