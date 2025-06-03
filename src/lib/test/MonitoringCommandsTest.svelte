<script lang="ts">
  import { onMount } from 'svelte';
  import { commands } from '../bindings';
  import type { MonitoredPath, UserSettings } from '../bindings';

  let testResults: string[] = $state([]);
  let isRunning = $state(false);
  let settings: UserSettings | null = $state(null);

  function addTestResult(message: string) {
    testResults.push(`[${new Date().toLocaleTimeString()}] ${message}`);
  }

  async function runTests() {
    if (isRunning) return;
    
    isRunning = true;
    testResults = [];
    
    try {
      addTestResult('Starting monitoring commands integration test...');

      // Test 1: Load initial settings
      addTestResult('Test 1: Loading user settings...');
      const loadResult = await commands.loadUserSettings();
      if (loadResult.status === 'ok') {
        settings = loadResult.data;
        addTestResult(`✓ Settings loaded: ${settings.monitored_paths.length} paths`);
      } else {
        addTestResult(`✗ Failed to load settings: ${loadResult.error}`);
        return;
      }

      // Test 2: Check monitoring status for a non-existent path
      addTestResult('Test 2: Checking status for non-monitored path...');
      const statusResult1 = await commands.checkPathMonitoringStatus('/test/non-existent.org');
      if (statusResult1.status === 'ok') {
        addTestResult(`✓ Non-monitored path status: ${statusResult1.data}`);
      } else {
        addTestResult(`✗ Failed to check status: ${statusResult1.error}`);
      }

      // Test 3: Add a test monitored path
      addTestResult('Test 3: Adding a test monitored path...');
      const newPath: MonitoredPath = {
        path: '/test/example.org',
        path_type: 'File',
        parse_enabled: true
      };
      
      const addPathResult = await commands.addMonitoredPath(newPath);
      if (addPathResult.status === 'ok') {
        settings = addPathResult.data;
        addTestResult(`✓ Path added: ${settings.monitored_paths.length} total paths`);
      } else {
        addTestResult(`✗ Failed to add path: ${addPathResult.error}`);
        return;
      }

      // Test 4: Check monitoring status for the added path
      addTestResult('Test 4: Checking status for monitored path...');
      const statusResult2 = await commands.checkPathMonitoringStatus('/test/example.org');
      if (statusResult2.status === 'ok') {
        addTestResult(`✓ Monitored path status: ${statusResult2.data}`);
        if (!statusResult2.data) {
          addTestResult('⚠ Warning: Path was added but is not showing as monitored');
        }
      } else {
        addTestResult(`✗ Failed to check status: ${statusResult2.error}`);
      }

      // Test 5: Disable the path
      addTestResult('Test 5: Disabling parsing for the monitored path...');
      const disableResult = await commands.setPathParseEnabled('/test/example.org', false);
      if (disableResult.status === 'ok') {
        settings = disableResult.data;
        const path = settings.monitored_paths.find(p => p.path === '/test/example.org');
        addTestResult(`✓ Path parsing disabled: parse_enabled=${path?.parse_enabled}`);
      } else {
        addTestResult(`✗ Failed to disable path: ${disableResult.error}`);
      }

      // Test 6: Check monitoring status for the disabled path
      addTestResult('Test 6: Checking status for disabled path...');
      const statusResult3 = await commands.checkPathMonitoringStatus('/test/example.org');
      if (statusResult3.status === 'ok') {
        addTestResult(`✓ Disabled path status: ${statusResult3.data}`);
        if (statusResult3.data) {
          addTestResult('⚠ Warning: Disabled path is still showing as monitored');
        }
      } else {
        addTestResult(`✗ Failed to check status: ${statusResult3.error}`);
      }

      // Test 7: Re-enable the path
      addTestResult('Test 7: Re-enabling parsing for the monitored path...');
      const enableResult = await commands.setPathParseEnabled('/test/example.org', true);
      if (enableResult.status === 'ok') {
        settings = enableResult.data;
        const path = settings.monitored_paths.find(p => p.path === '/test/example.org');
        addTestResult(`✓ Path parsing re-enabled: parse_enabled=${path?.parse_enabled}`);
      } else {
        addTestResult(`✗ Failed to re-enable path: ${enableResult.error}`);
      }

      // Test 8: Final status check
      addTestResult('Test 8: Final status check...');
      const statusResult4 = await commands.checkPathMonitoringStatus('/test/example.org');
      if (statusResult4.status === 'ok') {
        addTestResult(`✓ Final path status: ${statusResult4.data}`);
      } else {
        addTestResult(`✗ Failed to check final status: ${statusResult4.error}`);
      }

      // Test 9: Remove the test path
      addTestResult('Test 9: Removing the test path...');
      const removeResult = await commands.removeMonitoredPath('/test/example.org');
      if (removeResult.status === 'ok') {
        settings = removeResult.data;
        addTestResult(`✓ Path removed: ${settings.monitored_paths.length} total paths`);
      } else {
        addTestResult(`✗ Failed to remove path: ${removeResult.error}`);
      }

      // Test 10: Final status check after removal
      addTestResult('Test 10: Status check after removal...');
      const statusResult5 = await commands.checkPathMonitoringStatus('/test/example.org');
      if (statusResult5.status === 'ok') {
        addTestResult(`✓ Status after removal: ${statusResult5.data}`);
        if (statusResult5.data) {
          addTestResult('⚠ Warning: Removed path is still showing as monitored');
        }
      } else {
        addTestResult(`✗ Failed to check status after removal: ${statusResult5.error}`);
      }

      addTestResult('🎉 All tests completed!');

    } catch (error) {
      addTestResult(`💥 Unexpected error: ${error}`);
    } finally {
      isRunning = false;
    }
  }

  async function clearSettings() {
    if (isRunning) return;
    
    try {
      addTestResult('Clearing all settings...');
      const clearResult = await commands.clearUserSettings();
      if (clearResult.status === 'ok') {
        addTestResult('✓ Settings cleared successfully');
        settings = { monitored_paths: [] };
      } else {
        addTestResult(`✗ Failed to clear settings: ${clearResult.error}`);
      }
    } catch (error) {
      addTestResult(`💥 Error clearing settings: ${error}`);
    }
  }
</script>

<div class="p-6 max-w-4xl mx-auto">
  <h1 class="text-2xl font-bold mb-4">Monitoring Commands Integration Test</h1>
  
  <div class="mb-4 flex gap-2">
    <button 
      onclick={runTests} 
      disabled={isRunning}
      class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
    >
      {isRunning ? 'Running Tests...' : 'Run Tests'}
    </button>
    
    <button 
      onclick={clearSettings} 
      disabled={isRunning}
      class="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
    >
      Clear Settings
    </button>
    
    <button 
      onclick={() => testResults = []}
      class="px-4 py-2 bg-gray-500 text-white rounded"
    >
      Clear Log
    </button>
  </div>

  {#if settings}
    <div class="mb-4 p-4 bg-gray-100 rounded">
      <h2 class="font-semibold mb-2">Current Settings:</h2>
      <div class="text-sm">
        <div>Monitored Paths: {settings.monitored_paths.length}</div>
        <div>Parse Enabled Paths: {settings.monitored_paths.filter(p => p.parse_enabled).length}</div>
        {#if settings.monitored_paths.length > 0}
          <details class="mt-2">
            <summary class="cursor-pointer font-medium">View Paths</summary>
            <ul class="mt-1 ml-4">
              {#each settings.monitored_paths as path}
                <li class="text-xs">
                  {path.path} ({path.path_type}, parse_enabled: {path.parse_enabled})
                </li>
              {/each}
            </ul>
          </details>
        {/if}
      </div>
    </div>
  {/if}

  <div class="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
    {#if testResults.length === 0}
      <div class="text-gray-400">Click "Run Tests" to start the monitoring commands integration test...</div>
    {:else}
      {#each testResults as result}
        <div class="mb-1">{result}</div>
      {/each}
    {/if}
  </div>
</div>