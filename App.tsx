import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Switch, SafeAreaView, Alert } from 'react-native';
import { useState, useRef } from 'react';
import { HeadlessWebView, HeadlessWebViewRef } from './src/components/HeadlessWebView';
import { PromptInterface } from './src/components/PromptInterface';
import { WorkflowManager } from './src/components/WorkflowManager';
import { registerBackgroundFetchAsync, unregisterBackgroundFetchAsync } from './src/services/BackgroundScannerService';

export default function App() {
  const [showWebView, setShowWebView] = useState(false);
  const [isDaemonRunning, setIsDaemonRunning] = useState(false);
  const [activeUrl, setActiveUrl] = useState('https://www.google.com');
  const webViewRef = useRef<HeadlessWebViewRef>(null);

  const handleExecutePrompt = (prompt: string) => {
    console.log(`Executing AI Logic for Prompt: "${prompt}"`);
    // Trigger the invisible DOM Scanner
    webViewRef.current?.scanDOM();

    if (prompt.toLowerCase().includes('swagbucks')) {
      setActiveUrl('https://www.swagbucks.com/p/login');
      setShowWebView(true);
    }
  };

  const handleSelectWorkflow = (workflowName: string) => {
    console.log(`Loading Saved Workflow: "${workflowName}"`);
    if (workflowName.includes('Swagbucks')) {
      setActiveUrl('https://www.swagbucks.com/p/login');
      setShowWebView(true);
    }
  };

  const handleDomMapReceived = (map: any) => {
    console.log("Received AI DOM Map. Node count:", map.length);
    // In a future issue, this map + the user prompt will be sent to the LLM API to decide the next action.
    Alert.alert("AI DOM Map Received", \`Found \${map.length} interactable nodes ready for LLM processing.\`);
  };

  const toggleDaemon = async () => {
    if (isDaemonRunning) {
      await unregisterBackgroundFetchAsync();
    } else {
      await registerBackgroundFetchAsync();
    }
    setIsDaemonRunning(!isDaemonRunning);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>AI Mobile Browser</Text>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Background Daemon</Text>
          <Switch value={isDaemonRunning} onValueChange={toggleDaemon} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Show Browser UI</Text>
          <Switch value={showWebView} onValueChange={(val) => setShowWebView(val)} />
        </View>
      </View>

      <WorkflowManager onSelectWorkflow={handleSelectWorkflow} />

      <View style={styles.webViewWrapper}>
        <HeadlessWebView 
          ref={webViewRef}
          isVisible={showWebView} 
          url={activeUrl}
          onDomMapReceived={handleDomMapReceived}
        />
      </View>
      
      <PromptInterface onExecutePrompt={handleExecutePrompt} />
      
      <StatusBar style="auto" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingTop: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 15,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#333',
  },
  webViewWrapper: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  }
});
