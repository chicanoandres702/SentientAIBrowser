import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

const BACKGROUND_FETCH_TASK = 'background-fetch-swagbucks';

// Simulated raw API check to avoid spinning up the WebView in the background
const checkSwagbucksForSurveys = async (): Promise<boolean> => {
    try {
        console.log("Simulating lightweight headless poll to Swagbucks API...");
        // A real implementation would fetch the endpoint using persistent cookies.
        // e.g. await fetch('https://www.swagbucks.com/surveys/api/list', { headers: { Cookie: '...' }});

        // Simulating finding a goldmine survey 10% of the time
        const foundHighYieldSurvey = Math.random() > 0.9;

        if (foundHighYieldSurvey) {
            console.log("High yield survey detected via daemon!");
            // Here we would configure local Push Notifications (e.g. expo-notifications)
            // to alert the user: "New 150 SB Survey Found! Tap to execute AI Workflow."
            return true;
        }

        return false;
    } catch (e) {
        console.error("Headless poll failed", e);
        return false;
    }
};

// Define the core background task
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    const now = Date.now();
    console.log(\`Background fetch triggered at: \${new Date(now).toISOString()}\`);

  try {
    const hasNewData = await checkSwagbucksForSurveys();
    
    if (hasNewData) {
      // Data found and notification sent.
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } else {
      // No new surveys, tell OS we succeeded but nothing changed.
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }
  } catch (error) {
    console.error("Error running background fetch task:", error);
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

// Register the task to run every ~15 minutes
export async function registerBackgroundFetchAsync() {
  console.log("Registering background daemon...");
  return BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15 * 60, // 15 minutes is minimum on most Android versions
    stopOnTerminate: false,   // Keeps running if app is swiped away
    startOnBoot: true,        // Automatically restart when phone reboots
  });
}

// Unregister the task
export async function unregisterBackgroundFetchAsync() {
  console.log("Stopping background daemon...");
  return BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
}
