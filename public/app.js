document.addEventListener('DOMContentLoaded', async () => {
  const geminiStatusEl = document.getElementById('gemini-status');
  const loadRosterBtn = document.getElementById('load-roster-btn');
  const rosterGrid = document.getElementById('roster-grid');
  const testPlayerName = document.getElementById('test-player-name');
  const generatePersonaBtn = document.getElementById('generate-persona-btn');
  const personaResult = document.getElementById('persona-result');

  // Check health endpoint
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    if (data.geminiConfigured) {
      geminiStatusEl.textContent = 'API Key Active';
      geminiStatusEl.className = 'badge ready';
    } else {
      geminiStatusEl.textContent = 'Mock / Offline Mode';
      geminiStatusEl.className = 'badge warning';
    }
  } catch (err) {
    geminiStatusEl.textContent = 'Offline';
    geminiStatusEl.className = 'badge error';
  }

  // Load Backyard Baseball characters from MLB Stats API
  loadRosterBtn.addEventListener('click', async () => {
    loadRosterBtn.disabled = true;
    loadRosterBtn.textContent = 'Loading Stats API...';
    rosterGrid.innerHTML = '<p class="loading-msg">Fetching Louisville Bats Triple-A data from MLB Stats API...</p>';

    try {
      const res = await fetch('/api/bats/characters');
      const data = await res.json();
      const chars = data.characters || [];

      rosterGrid.innerHTML = '';
      chars.forEach(p => {
        const card = document.createElement('div');
        card.className = 'backyard-card';
        card.innerHTML = `
          <div class="card-cap">🧢 #${p.jerseyNumber}</div>
          <h4 class="player-name">${p.fullName}</h4>
          <span class="pos-badge">${p.primaryPosition} • Louisville Bats</span>
          
          <div class="skill-bars">
            <div class="skill-row">
              <span>Batting:</span>
              <div class="bar-container"><div class="bar-fill" style="width: ${p.backyardStats.batting * 10}%"></div></div>
              <span>${p.backyardStats.batting}/10</span>
            </div>
            <div class="skill-row">
              <span>Running:</span>
              <div class="bar-container"><div class="bar-fill run" style="width: ${p.backyardStats.running * 10}%"></div></div>
              <span>${p.backyardStats.running}/10</span>
            </div>
            <div class="skill-row">
              <span>Pitching:</span>
              <div class="bar-container"><div class="bar-fill pitch" style="width: ${p.backyardStats.pitching * 10}%"></div></div>
              <span>${p.backyardStats.pitching}/10</span>
            </div>
            <div class="skill-row">
              <span>Fielding:</span>
              <div class="bar-container"><div class="bar-fill field" style="width: ${p.backyardStats.fielding * 10}%"></div></div>
              <span>${p.backyardStats.fielding}/10</span>
            </div>
          </div>

          <div class="raw-stat-pill">
            Real MiLB Stats: ${p.rawStats.battingAvg} AVG &bull; ${p.rawStats.homeRuns} HR &bull; ${p.rawStats.stolenBases} SB
          </div>
        `;
        rosterGrid.appendChild(card);
      });
    } catch (err) {
      rosterGrid.innerHTML = `<p class="error-msg">Error loading roster: ${err.message}</p>`;
    } finally {
      loadRosterBtn.disabled = false;
      loadRosterBtn.textContent = '⚾ Refresh Bats Characters';
    }
  });

  // Generate Backyard Kid Persona using Gemini
  generatePersonaBtn.addEventListener('click', async () => {
    const name = testPlayerName.value.trim() || 'Buddy Bat';
    generatePersonaBtn.disabled = true;
    generatePersonaBtn.textContent = 'Generating with Gemini...';
    personaResult.className = 'result-box';
    personaResult.textContent = 'Calling Gemini to write kid persona & superpower...';
    personaResult.classList.remove('hidden');

    try {
      const res = await fetch('/api/gemini/backyard-persona', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerName: name,
          position: 'OF',
          stats: { avg: '.310', hr: '16', sb: '20' }
        })
      });
      const data = await res.json();
      personaResult.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${data.text}</pre>`;
      personaResult.className = 'result-box success';
    } catch (err) {
      personaResult.textContent = `Error: ${err.message}`;
      personaResult.className = 'result-box error';
    } finally {
      generatePersonaBtn.disabled = false;
      generatePersonaBtn.textContent = '✨ Generate Backyard Persona';
    }
  });
});
