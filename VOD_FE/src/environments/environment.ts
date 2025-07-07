// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // apiUrl: 'https://dev.mediapilot.io/api',
  // streamUrl: 'https://live.mediapilot.io',
  // UI_URL: 'https://dev.mediapilot.io',
  RTMP_URL: 'http://localhost:8000/live', 
  UI_URL: 'http://localhost:4200',
  // streamUrl: 'https://192.168.18.186:3000',
  backendUrl: 'http://localhost:3005',
  apiUrl: 'http://localhost:3005/api',
  streamUrl: 'http://localhost:3000/api',
  socketUrl:'http://localhost:3000',
  socketUrlBe:'http://localhost:3002',
  pollingInterVal:1000,
  thumbnailInterval:30000, //30 seconds
  // streamUrl: 'https://aws.mediapilot.io'
  // socketUrl: 'https://dev.mediapilot.io',
//  socketUrl: 'http://localhost:3000',
  // apiUrl: 'http://18.218.47.23:3000/api'
  // apiUrl: 'http://192.186.18.178:3000/api',
  stripePublishableKey:"pk_test_51RiHFFRWs4pkwtsrrGDyMNV6P518lbXnJ1hNGUNTd63ZFwunCArgjLaEg26ALYePzWgmPhdXuLREkeB18AvZnPGE00aTHnKIK7",
  
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.