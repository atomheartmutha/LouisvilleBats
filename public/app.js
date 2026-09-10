document.addEventListener('DOMContentLoaded', async () => {
  const geminiStatusEl = document.getElementById('gemini-status');
  const testPromptInput = document.getElementById('test-prompt');
  const testBtn = document.getElementById('test-btn');
  const testResultEl = document.getElementById('test-result');

  // Check health endpoint
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.geminiConfigured) {
      geminiStatusEl.textContent = 'API Key Detected';
      geminiStatusEl.className = 'badge ready';
    } else {
      geminiStatusEl.textContent = 'Key Not Set in .env';
      geminiStatusEl.className = 'badge warning';
    }
  } catch (err) {
    geminiStatusEl.textContent = 'Server Offline';
    geminiStatusEl.className = 'badge error';
  }

  // Test Gemini API button
  testBtn.addEventListener('click', async () => {
    const prompt = testPromptInput.value.trim();
    if (!prompt) return;

    testBtn.disabled = true;
    testBtn.textContent = 'Sending...';
    testResultEl.className = 'result-box';
    testResultEl.textContent = 'Waiting for response...';

    try {
      const res = await fetch('/api/gemini/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();

      if (data.error) {
        testResultEl.textContent = `⚠️ ${data.error}`;
        testResultEl.className = 'result-box warning';
      } else {
        testResultEl.textContent = `🤖 Gemini: "${data.text}"`;
        testResultEl.className = 'result-box success';
      }
    } catch (err) {
      testResultEl.textContent = `Error: ${err.message}`;
      testResultEl.className = 'result-box error';
    } finally {
      testBtn.disabled = false;
      testBtn.textContent = 'Send Test Prompt';
    }
  });
});
