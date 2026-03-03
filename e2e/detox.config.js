// Detox configuration for Android
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  specs: 'e2e',
  behavior: {
    init: {
      reinstallApp: true,
      exposeGlobals: true,
    },
  },
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug',
      device: {
        avdName: 'Pixel_3a_API_30_x86', // Change to your device name if needed
      },
    },
  },
  devices: {
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_3a_API_30_x86', // Change to your device name if needed
      },
    },
  },
};
