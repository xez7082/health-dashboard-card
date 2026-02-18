/**
 * HEALTH DASHBOARD CARD – V101
 * Améliorations v2.3.0 :
 *   1. Throttling de updateSensors() — 500ms min entre chaque appel
 *   2. Sélecteur d'entités natif HA (ha-entity-picker) dans l'éditeur
 *   3. Animations de transition (fade + scale) au changement de profil
 *   4. Tooltip + dernière mise à jour au survol des capteurs
 *   5. Sparkline 7 jours sur chaque bloc capteur
 *   6. Historique de poids (panneau courbe SVG, toggle)
 */

// ─── Utilitaires ─────────────────────────────────────────────────────────────

function throttle(fn, delay) {
  let last = 0, timer = null;
  return function (...args) {
    const now = Date.now();
    const remaining = delay - (now - last);
    if (remaining <= 0) {
      clearTimeout(timer);
      last = now;
      fn.apply(this, args);
    } else {
      clearTimeout(timer);
      timer = setTimeout(() => { last = Date.now(); fn.apply(this, args); }, remaining);
    }
  };
}

function formatTime(isoString) {
  if (!isoString) return '—';
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return '—'; }
}

// ─── Carte principale ─────────────────────────────────────────────────────────

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._historyCache  = {};           // { entity: [{t, v}] }
    this._historyTimer  = null;
    this._showHistory   = false;
    this._throttledUpdate = null;
  }

  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }

  getCardSize() { return Math.ceil((this._config?.card_height || 600) / 50); }

  // ── Config ────────────────────────────────────────────────────────────────

  setConfig(config) {
    const newConfig = JSON.parse(JSON.stringify(config || {}));

    const baseProfile = (name) => ({
      name, sensors: [], start: 80, comfort: 75, ideal: 70, image: '', step_goal: 10000,
      imc_entity:  '', imc_name:  'IMC',        imc_icon:  'mdi:scale-bathroom',
      imc_x: 20,  imc_y: 20,  imc_w: 160, imc_h: 69, imc_font: 14,
      corp_entity: '', corp_name: 'Corpulence', corp_icon: 'mdi:human-male',
      corp_x: 20, corp_y: 35, corp_w: 160, corp_h: 69, corp_font: 14,
    });

    if (!newConfig.person1)      newConfig.person1      = baseProfile('Patrick');
    if (!newConfig.person2)      newConfig.person2      = baseProfile('Sandra');
    if (!newConfig.current_view) newConfig.current_view = 'person1';

    newConfig.card_height = newConfig.card_height || 600;
    newConfig.b_width     = newConfig.b_width     || 160;
    newConfig.b_height    = newConfig.b_height    || 69;
    newConfig.btn_x       = newConfig.btn_x       || 5;
    newConfig.btn_y       = newConfig.btn_y       || 3;
    newConfig.img_offset  = newConfig.img_offset  || 50;

    this._config = newConfig;
    this.render();
  }

  // ── HASS ─────────────────────────────────────────────────────────────────

  set hass(hass) {
    this._hass = hass;

    // [1] Throttle : max 1 appel toutes les 500ms
    if (!this._throttledUpdate) {
      this._throttledUpdate = throttle(() => this.updateSensors(), 500);
    }
    this._throttledUpdate();

    // [6] Historique : fetch immédiat puis toutes les 5 minutes
    if (!this._historyTimer) {
      this._fetchHistory();
      this._historyTimer = setInterval(() => this._fetchHistory(), 5 * 60 * 1000);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  _num(val, d = 0) { const n = parseFloat(val); return isNaN(n) ? d : n; }

  // ── [6] Historique de poids ───────────────────────────────────────────────

  async _fetchHistory() {
    if (!this._hass || !this._config) return;

    const view   = this._config.current_view;
    const pData  = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const start = new Date();
    start.setDate(start.getDate() - 7);
    const startStr = start.toISOString();

    const entities = [
      `sensor.withings_poids${suffix}`,
      ...(pData.sensors || []).map(s => s.entity).filter(Boolean),
    ];

    for (const entity of entities) {
      try {
        const result = await this._hass.callApi(
          'GET',
          `history/period/${startStr}?filter_entity_id=${entity}&minimal_response=true&no_attributes=true`
        );
        if (result?.[0]) {
          this._historyCache[entity] = result[0]
            .filter(s => s.state !== 'unavailable' && s.state !== 'unknown')
            .map(s => ({ t: new Date(s.last_changed).getTime(), v: parseFloat(s.state) }))
            .filter(s => !isNaN(s.v));
        }
      } catch (_) { /* entité absente ou API indisponible, on ignore */ }
    }

    this._renderSparklines();
    if (this._showHistory) this._renderWeightHistory();
  }

  // ── [5] Sparklines ────────────────────────────────────────────────────────

  _buildSparklineSVG(entity, w = 80, h = 20) {
    const data = this._historyCache[entity];
    if (!data || data.length < 2) return '';
    const vals = data.map(d => d.v);
    const min  = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    const pts = data.map((d, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((d.v - min) / range) * h;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;">
      <polyline points="${pts}" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
  }

  _renderSparklines() {
    if (!this.shadowRoot || !this._config) return;
    const view   = this._config.current_view;
    const pData  = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    const wEl = this.shadowRoot.getElementById('sparkline-weight');
    if (wEl) wEl.innerHTML = this._buildSparklineSVG(`sensor.withings_poids${suffix}`);

    (pData.sensors || []).forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`sparkline-${i}`);
      if (el) el.innerHTML = this._buildSparklineSVG(s.entity);
    });
  }

  // ── [6] Panneau historique poids ──────────────────────────────────────────

  _renderWeightHistory() {
    const panel = this.shadowRoot?.getElementById('history-panel');
    if (!panel) return;

    const view   = this._config.current_view;
    const suffix = view === 'person2' ? '_sandra' : '_patrick';
    const entity = `sensor.withings_poids${suffix}`;
    const data   = this._historyCache[entity];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    if (!data || data.length < 2) {
      panel.innerHTML = '<div style="color:rgba(255,255,255,0.45);text-align:center;padding:24px;font-size:12px;">Données non encore disponibles</div>';
      return;
    }

    const W = 300, H = 110;
    const vals = data.map(d => d.v);
    const minV = Math.min(...vals) - 0.3;
    const maxV = Math.max(...vals) + 0.3;
    const rng  = maxV - minV || 1;
    const PAD  = { l: 28, r: 12, t: 10, b: 22 };
    const iW   = W - PAD.l - PAD.r;
    const iH   = H - PAD.t - PAD.b;

    const toX = i  => PAD.l + (i / (data.length - 1)) * iW;
    const toY = v  => PAD.t + iH - ((v - minV) / rng) * iH;

    const pathPts = data.map((d, i) => `${toX(i).toFixed(1)},${toY(d.v).toFixed(1)}`);
    const linePath = pathPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p}`).join(' ');
    const areaPath = `${linePath} L${toX(data.length - 1).toFixed(1)},${(PAD.t + iH).toFixed(1)} L${toX(0).toFixed(1)},${(PAD.t + iH).toFixed(1)} Z`;

    // Axe Y : 3 niveaux
    const yTicks = [minV + 0.3, (minV + maxV) / 2, maxV - 0.3].map(v => ({
      v, y: toY(v).toFixed(1), label: v.toFixed(1),
    }));

    // Axe X : début, milieu, fin
    const xLabels = [0, Math.floor(data.length / 2), data.length - 1].map(i => ({
      x: toX(i).toFixed(1),
      label: new Date(data[i].t).toLocaleDateString([], { day: '2-digit', month: '2-digit' }),
    }));

    // Δ poids
    const delta = (vals[vals.length - 1] - vals[0]).toFixed(1);
    const deltaColor = parseFloat(delta) <= 0 ? '#4ade80' : '#f87171';

    panel.innerHTML = `
      <div style="padding:12px 14px 10px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <span style="font-size:11px;color:rgba(255,255,255,0.6);">Évolution du poids — 7 jours</span>
          <span style="font-size:12px;font-weight:900;color:${deltaColor};">${parseFloat(delta) > 0 ? '+' : ''}${delta} kg</span>
        </div>
        <svg width="100%" viewBox="0 0 ${W} ${H}" style="overflow:visible;">
          <defs>
            <linearGradient id="hg-${view}" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="${accent}" stop-opacity="0.28"/>
              <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Grille -->
          ${yTicks.map(t => `
            <line x1="${PAD.l}" y1="${t.y}" x2="${W - PAD.r}" y2="${t.y}" stroke="rgba(255,255,255,0.07)" stroke-width="1"/>
            <text x="${PAD.l - 4}" y="${parseFloat(t.y) + 3.5}" text-anchor="end" font-size="7.5" fill="rgba(255,255,255,0.35)">${t.label}</text>
          `).join('')}
          <!-- Aire -->
          <path d="${areaPath}" fill="url(#hg-${view})"/>
          <!-- Courbe -->
          <path d="${linePath}" fill="none" stroke="${accent}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Points clés -->
          ${[0, data.length - 1].map(i => `
            <circle cx="${toX(i).toFixed(1)}" cy="${toY(data[i].v).toFixed(1)}" r="3.5" fill="${accent}" stroke="#0f172a" stroke-width="1.5"/>
            <text x="${toX(i).toFixed(1)}" y="${(toY(data[i].v) - 6).toFixed(1)}" text-anchor="${i === 0 ? 'start' : 'end'}" font-size="8.5" font-weight="bold" fill="white">${data[i].v.toFixed(1)}kg</text>
          `).join('')}
          <!-- Axe X labels -->
          ${xLabels.map(l => `<text x="${l.x}" y="${H - 4}" text-anchor="middle" font-size="8" fill="rgba(255,255,255,0.4)">${l.label}</text>`).join('')}
        </svg>
      </div>
    `;
  }

  // ── Mise à jour des capteurs ──────────────────────────────────────────────

  updateSensors() {
    if (!this._hass || !this.shadowRoot || !this._config) return;

    const view   = this._config.current_view;
    const pData  = this._config[view];
    const suffix = view === 'person2' ? '_sandra' : '_patrick';

    // Poids + progression
    const stPoids = this._hass.states[`sensor.withings_poids${suffix}`];
    const stDiff  = this._hass.states[`sensor.difference_poids${suffix}`];

    if (stPoids) {
      const actuel  = this._num(stPoids.state);
      const depart  = this._num(pData.start);
      const ideal   = this._num(pData.ideal);
      const diffVal = stDiff ? stDiff.state : '0';
      const valF    = parseFloat(diffVal);

      const label = this.shadowRoot.getElementById('pointer-label');
      if (label) {
        label.innerHTML = `${actuel}kg <span style="color:${valF <= 0 ? '#4ade80' : '#f87171'};margin-left:4px;font-size:0.8em;">(${valF > 0 ? '+' : ''}${diffVal})</span>`;
      }

      const range = depart - ideal;
      const pct   = range !== 0 ? ((depart - actuel) / range) * 100 : 0;
      const ptr   = this.shadowRoot.getElementById('progression-pointer');
      if (ptr) ptr.style.left = `${Math.max(0, Math.min(100, pct))}%`;

      const cmf = this.shadowRoot.getElementById('mark-comfort');
      if (cmf) {
        const pctC = range !== 0 ? ((depart - this._num(pData.comfort)) / range) * 100 : 50;
        cmf.style.left = `${Math.max(0, Math.min(100, pctC))}%`;
      }
    }

    // [4] Helper : met à jour valeur + tooltip
    const setV = (valId, tipId, ent) => {
      const el  = this.shadowRoot.getElementById(valId);
      const tip = this.shadowRoot.getElementById(tipId);
      if (!ent || !this._hass.states[ent]) return;
      const s = this._hass.states[ent];
      if (el)  el.textContent  = `${s.state}${s.attributes.unit_of_measurement || ''}`;
      if (tip) tip.textContent = `${ent}\nMàJ : ${formatTime(s.last_changed)}`;
    };

    setV('imc-val',  'imc-tip',  pData.imc_entity);
    setV('corp-val', 'corp-tip', pData.corp_entity);

    // Pas
    const stSteps = this._hass.states[`sensor.withings_pas${suffix}`];
    if (stSteps) {
      const pctS  = Math.min(100, (this._num(stSteps.state) / this._num(pData.step_goal, 10000)) * 100);
      const path  = this.shadowRoot.getElementById('gauge-path');
      if (path) path.style.strokeDasharray = `${(pctS * 125.6) / 100}, 125.6`;
      const vP    = this.shadowRoot.getElementById('step-value');
      if (vP) vP.textContent = Number(stSteps.state).toLocaleString();
      // Animation objectif atteint
      const gauge = this.shadowRoot.getElementById('steps-gauge-wrap');
      if (gauge) gauge.classList.toggle('goal-reached', pctS >= 100);
    }

    // Capteurs génériques
    (pData.sensors || []).forEach((s, i) => {
      setV(`value-${i}`, `tip-${i}`, s.entity);
    });
  }

  // ── Rendu principal ───────────────────────────────────────────────────────

  render() {
    if (!this._config) return;
    const view   = this._config.current_view;
    const pData  = this._config[view];
    const accent = view === 'person1' ? '#38bdf8' : '#f43f5e';

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }

        .main-container {
          position: relative; width: 100%; height: ${this._config.card_height}px;
          background: #0f172a; border-radius: 12px; overflow: hidden;
          font-family: sans-serif; color: white;
        }

        /* [3] Transition fade+scale au changement de vue */
        .content-layer {
          position: absolute; inset: 0;
          animation: hd-fadein 0.35s cubic-bezier(.25,.46,.45,.94) both;
        }
        @keyframes hd-fadein {
          from { opacity: 0; transform: scale(0.975); }
          to   { opacity: 1; transform: scale(1); }
        }

        .bg-img {
          position: absolute; inset: 0;
          background: url('${pData.image}') center ${this._config.img_offset}% / cover no-repeat;
          opacity: 0.4; z-index: 1; pointer-events: none;
        }

        /* Topbar */
        .topbar { position: absolute; left: ${this._config.btn_x}%; top: ${this._config.btn_y}%; display: flex; gap: 10px; z-index: 100; }
        .btn {
          border: 1px solid rgba(255,255,255,0.2); padding: 8px 18px; border-radius: 20px;
          background: rgba(0,0,0,0.6); color: white; cursor: pointer; font-size: 12px; font-weight: bold;
          transition: background 0.25s, border-color 0.25s;
        }
        .btn.active { background: ${accent}; border-color: ${accent}; }

        /* [4] Blocs capteurs avec tooltip */
        .sensor-card {
          position: absolute; transform: translate(-50%, -50%);
          border-radius: 10px; background: rgba(15,23,42,0.85);
          border: 1px solid rgba(255,255,255,0.15);
          display: flex; flex-direction: column; justify-content: center; align-items: center;
          z-index: 10; padding: 4px 6px; backdrop-filter: blur(8px);
          cursor: default; transition: border-color 0.2s, transform 0.2s, box-shadow 0.2s;
        }
        .sensor-card:hover {
          border-color: ${accent};
          transform: translate(-50%, -50%) scale(1.05);
          box-shadow: 0 0 14px ${accent}44;
        }
        .tooltip {
          position: absolute; bottom: calc(100% + 8px); left: 50%;
          transform: translateX(-50%);
          background: rgba(0,0,0,0.92); color: #fff; font-size: 9.5px;
          padding: 5px 9px; border-radius: 7px; white-space: pre;
          pointer-events: none; opacity: 0; transition: opacity 0.15s;
          border: 1px solid ${accent}88; z-index: 200; min-width: 130px; text-align: left;
          line-height: 1.5;
        }
        .sensor-card:hover .tooltip { opacity: 1; }

        /* [5] Sparkline */
        .sparkline { margin-top: 4px; opacity: 0.75; }

        ha-icon { --mdc-icon-size: 26px; color: ${accent}; margin-bottom: 2px; }

        /* Jauge pas */
        .steps-gauge {
          position: absolute; top: 15px; right: 15px; width: 85px; height: 85px;
          z-index: 100; background: rgba(0,0,0,0.5); border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          transition: box-shadow 0.5s;
        }
        .steps-gauge.goal-reached { animation: hd-pulse 1.5s ease-in-out infinite; }
        @keyframes hd-pulse {
          0%,100% { box-shadow: 0 0 8px ${accent}; }
          50%      { box-shadow: 0 0 24px ${accent}, 0 0 48px ${accent}44; }
        }
        .steps-data { position: absolute; text-align: center; }
        .steps-gauge svg { transform: rotate(-90deg); width: 74px; height: 74px; }
        .meter { fill: none; stroke: ${accent}; stroke-width: 4.5; stroke-linecap: round; transition: stroke-dasharray 1s ease; }

        /* Barre de progression */
        .rule-container { position: absolute; bottom: 45px; left: 50%; transform: translateX(-50%); width: 90%; height: 80px; z-index: 30; }
        .rule-track     { position: relative; width: 100%; height: 8px; background: rgba(255,255,255,0.1); border-radius: 4px; margin-top: 40px; }
        .rule-fill      { position: absolute; height: 100%; background: linear-gradient(90deg,#f87171,#fbbf24,#4ade80); border-radius: 4px; width: 100%; opacity: 0.7; }
        .prog-pointer   { position: absolute; top: -14px; width: 3px; height: 36px; background: white; transition: left 1s ease; box-shadow: 0 0 12px white; z-index: 5; }
        .pointer-bubble { position: absolute; top: -42px; left: 50%; transform: translateX(-50%); background: white; color: black; padding: 4px 10px; border-radius: 8px; font-size: 13px; font-weight: 900; white-space: nowrap; border: 2px solid ${accent}; }
        .mark           { position: absolute; top: 12px; transform: translateX(-50%); font-size: 10px; font-weight: bold; text-align: center; line-height: 1.2; }
        .mark-confort   { position: absolute; top: -4px; width: 12px; height: 12px; background: #fbbf24; border: 2px solid #0f172a; border-radius: 50%; transform: translateX(-50%); z-index: 4; }

        /* [6] Panneau historique */
        .history-btn {
          position: absolute; bottom: 10px; right: 10px; z-index: 100;
          background: rgba(0,0,0,0.65); border: 1px solid ${accent}88;
          color: white; border-radius: 20px; padding: 4px 14px;
          font-size: 10px; cursor: pointer; transition: border-color 0.2s, background 0.2s;
        }
        .history-btn:hover { background: ${accent}22; border-color: ${accent}; }
        .history-panel {
          position: absolute; bottom: 38px; left: 4%; right: 4%;
          z-index: 50; background: rgba(10,18,35,0.96);
          border: 1px solid ${accent}88; border-radius: 12px;
          backdrop-filter: blur(14px);
          display: ${this._showHistory ? 'block' : 'none'};
          animation: hd-slidein 0.25s ease both;
        }
        @keyframes hd-slidein {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      </style>

      <div class="main-container">
        <div class="content-layer">

          <div class="bg-img"></div>

          <!-- Topbar -->
          <div class="topbar">
            <button id="bt1" class="btn ${view === 'person1' ? 'active' : ''}">${this._config.person1.name}</button>
            <button id="bt2" class="btn ${view === 'person2' ? 'active' : ''}">${this._config.person2.name}</button>
          </div>

          <!-- Jauge pas -->
          <div id="steps-gauge-wrap" class="steps-gauge">
            <svg viewBox="0 0 50 50">
              <circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="4.5"/>
              <circle id="gauge-path" class="meter" cx="25" cy="25" r="20" stroke-dasharray="0,125.6"/>
            </svg>
            <div class="steps-data">
              <span id="step-value" style="font-weight:900;font-size:10px;line-height:1;">--</span>
              <div style="font-size:8px;opacity:0.5;margin-top:1px;">pas</div>
            </div>
          </div>

          <!-- IMC -->
          <div class="sensor-card" style="left:${pData.imc_x}%;top:${pData.imc_y}%;width:${pData.imc_w}px;height:${pData.imc_h}px;">
            <span class="tooltip" id="imc-tip">—</span>
            <ha-icon icon="${pData.imc_icon}"></ha-icon>
            <div style="font-size:10px;opacity:0.75;">${pData.imc_name}</div>
            <div id="imc-val" style="font-weight:900;font-size:${pData.imc_font}px;">--</div>
          </div>

          <!-- Corpulence -->
          <div class="sensor-card" style="left:${pData.corp_x}%;top:${pData.corp_y}%;width:${pData.corp_w}px;height:${pData.corp_h}px;">
            <span class="tooltip" id="corp-tip">—</span>
            <ha-icon icon="${pData.corp_icon}"></ha-icon>
            <div style="font-size:10px;opacity:0.75;">${pData.corp_name}</div>
            <div id="corp-val" style="font-weight:900;font-size:${pData.corp_font}px;">--</div>
          </div>

          <!-- Capteurs génériques avec sparkline -->
          ${(pData.sensors || []).map((s, i) => `
            <div class="sensor-card" style="left:${s.x}%;top:${s.y}%;width:${this._config.b_width}px;min-height:${this._config.b_height}px;">
              <span class="tooltip" id="tip-${i}">—</span>
              <ha-icon icon="${s.icon || 'mdi:heart'}"></ha-icon>
              <div style="font-size:10px;opacity:0.75;">${s.name}</div>
              <div id="value-${i}" style="font-weight:900;">--</div>
              <div class="sparkline" id="sparkline-${i}"></div>
            </div>
          `).join('')}

          <!-- Barre de progression poids -->
          <div class="rule-container">
            <div class="rule-track">
              <div class="rule-fill"></div>
              <div id="progression-pointer" class="prog-pointer">
                <div id="pointer-label" class="pointer-bubble">--</div>
              </div>
              <div class="mark" style="left:0%;">DÉPART<br>${pData.start}kg</div>
              <div id="mark-comfort" class="mark" style="left:50%;color:#fbbf24;">
                <div class="mark-confort"></div>CONFORT<br>${pData.comfort}kg
              </div>
              <div class="mark" style="left:100%;">IDÉAL<br>${pData.ideal}kg</div>
            </div>
          </div>

          <!-- [6] Historique -->
          <button class="history-btn" id="history-btn">📈 Historique</button>
          <div class="history-panel" id="history-panel"></div>

        </div>
      </div>
    `;

    // Events
    this.shadowRoot.getElementById('bt1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); this._fetchHistory(); };
    this.shadowRoot.getElementById('bt2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); this._fetchHistory(); };
    this.shadowRoot.getElementById('history-btn').onclick = () => {
      this._showHistory = !this._showHistory;
      const panel = this.shadowRoot.getElementById('history-panel');
      if (!panel) return;
      panel.style.display = this._showHistory ? 'block' : 'none';
      if (this._showHistory) this._renderWeightHistory();
    };

    this.updateSensors();
    this._renderSparklines();
    if (this._showHistory) this._renderWeightHistory();
  }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}


// ─── Éditeur ─────────────────────────────────────────────────────────────────

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._activeTab = 'profile'; this._pickersReady = false; }

  // CORRECTION 1 : set hass ne doit JAMAIS appeler render().
  // HA injecte hass des dizaines de fois/sec → boucle de re-rendu qui plante l'éditeur.
  // On se contente de stocker hass et de mettre à jour .hass sur les pickers existants.
  set hass(hass) {
    this._hass = hass;
    // Mise à jour silencieuse des pickers déjà dans le DOM
    this.querySelectorAll('ha-entity-picker').forEach(p => { p.hass = hass; });
  }

  setConfig(config) { this._config = config; this.render(); }

  render() {
    if (!this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p = this._config[pKey];
    if (!p) return;

    this.innerHTML = `
      <style>
        .ed-box  { padding:12px; background:#1a1a1a; color:white; font-family:sans-serif; }
        .tabs    { display:flex; gap:4px; margin-bottom:12px; border-bottom:1px solid #444; }
        .tab     { padding:10px; cursor:pointer; background:#252525; border:none; color:#888; flex:1; font-size:11px; }
        .tab.active { background:#38bdf8; color:black; font-weight:bold; }
        .section { background:#252525; padding:15px; border:1px solid #444; border-radius:6px; }
        label    { color:#38bdf8; font-size:10px; font-weight:bold; display:block; margin-top:10px; }
        input    { width:100%; padding:8px; background:#333; color:white; border:1px solid #555; border-radius:4px; box-sizing:border-box; }
        .grid    { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .sub-sec { background:#111; padding:10px; border-radius:8px; margin-bottom:15px; border-left:3px solid #38bdf8; }
        .del-btn { width:100%; margin-top:10px; background:#f87171; border:none; color:white; padding:8px; border-radius:4px; cursor:pointer; }
        /* picker wrap : le fallback input est masqué dès que le picker est injecté */
        .picker-wrap { margin-top:6px; }
        .picker-wrap ha-entity-picker { display:block; }
        .picker-wrap ha-entity-picker ~ .fallback-ent { display:none; }
        ha-entity-picker { display:block; }
      </style>
      <div class="ed-box">

        <!-- Sélecteur de personne -->
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button style="flex:1;padding:10px;background:${pKey==='person1'?'#38bdf8':'#444'};border:none;color:${pKey==='person1'?'black':'white'};border-radius:6px;cursor:pointer;font-weight:bold;" id="t-p1">${this._config.person1.name}</button>
          <button style="flex:1;padding:10px;background:${pKey==='person2'?'#38bdf8':'#444'};border:none;color:${pKey==='person2'?'black':'white'};border-radius:6px;cursor:pointer;font-weight:bold;" id="t-p2">${this._config.person2.name}</button>
        </div>

        <!-- Onglets -->
        <div class="tabs">
          <button class="tab ${this._activeTab==='profile' ?'active':''}" id="tab-profile">PROFIL</button>
          <button class="tab ${this._activeTab==='health'  ?'active':''}" id="tab-health">SANTÉ</button>
          <button class="tab ${this._activeTab==='sensors' ?'active':''}" id="tab-sensors">CAPTEURS</button>
          <button class="tab ${this._activeTab==='design'  ?'active':''}" id="tab-design">DESIGN</button>
        </div>

        <div class="section">

          ${this._activeTab === 'profile' ? `
            <label>Nom</label>
            <input type="text" id="inp-name" value="${p.name}">
            <label>Image URL</label>
            <input type="text" id="inp-img" value="${p.image}">
            <div class="grid">
              <div><label>Départ (kg)</label><input type="number" id="inp-start" value="${p.start}"></div>
              <div><label>Confort (kg)</label><input type="number" id="inp-conf" value="${p.comfort}"></div>
              <div><label>Idéal (kg)</label><input type="number" id="inp-ideal" value="${p.ideal}"></div>
              <div><label>Objectif pas</label><input type="number" id="inp-sgoal" value="${p.step_goal}"></div>
            </div>
          ` : ''}

          ${this._activeTab === 'health' ? `
            <div class="sub-sec">
              <label>IMC — entité</label>
              <div class="picker-wrap" id="picker-imc-entity" data-field="imc_entity" data-value="${p.imc_entity||''}">
                <input type="text" class="fallback-ent" id="fb-imc" value="${p.imc_entity||''}" placeholder="sensor.mon_imc">
              </div>
              <div class="grid">
                <div><label>Nom affiché</label><input type="text" id="inp-imcn" value="${p.imc_name}"></div>
                <div><label>Icône MDI</label><input type="text" id="inp-imci" value="${p.imc_icon}"></div>
                <div><label>Largeur / Hauteur</label>
                  <div style="display:flex;gap:4px;">
                    <input type="number" id="inp-imcw" value="${p.imc_w}" placeholder="L">
                    <input type="number" id="inp-imch" value="${p.imc_h}" placeholder="H">
                  </div>
                </div>
                <div><label>Position X% / Y%</label>
                  <div style="display:flex;gap:4px;">
                    <input type="number" id="inp-imcx" value="${p.imc_x}" placeholder="X">
                    <input type="number" id="inp-imcy" value="${p.imc_y}" placeholder="Y">
                  </div>
                </div>
                <div><label>Taille police</label><input type="number" id="inp-imcf" value="${p.imc_font}"></div>
              </div>
            </div>

            <div class="sub-sec">
              <label>CORPULENCE — entité</label>
              <div class="picker-wrap" id="picker-corp-entity" data-field="corp_entity" data-value="${p.corp_entity||''}">
                <input type="text" class="fallback-ent" id="fb-corp" value="${p.corp_entity||''}" placeholder="sensor.ma_corpulence">
              </div>
              <div class="grid">
                <div><label>Nom affiché</label><input type="text" id="inp-corpn" value="${p.corp_name}"></div>
                <div><label>Icône MDI</label><input type="text" id="inp-corpi" value="${p.corp_icon}"></div>
                <div><label>Largeur / Hauteur</label>
                  <div style="display:flex;gap:4px;">
                    <input type="number" id="inp-corpw" value="${p.corp_w}" placeholder="L">
                    <input type="number" id="inp-corph" value="${p.corp_h}" placeholder="H">
                  </div>
                </div>
                <div><label>Position X% / Y%</label>
                  <div style="display:flex;gap:4px;">
                    <input type="number" id="inp-corpx" value="${p.corp_x}" placeholder="X">
                    <input type="number" id="inp-corpy" value="${p.corp_y}" placeholder="Y">
                  </div>
                </div>
                <div><label>Taille police</label><input type="number" id="inp-corpf" value="${p.corp_font}"></div>
              </div>
            </div>
          ` : ''}

          ${this._activeTab === 'sensors' ? `
            <div id="sensors-container">
              ${(p.sensors || []).map((s, i) => `
                <div class="sub-sec">
                  <div class="grid">
                    <div><label>Nom</label><input type="text" class="s-name" data-idx="${i}" value="${s.name}"></div>
                    <div><label>Icône MDI</label><input type="text" class="s-ico" data-idx="${i}" value="${s.icon||'mdi:heart'}"></div>
                  </div>
                  <label>Entité</label>
                  <div class="picker-wrap" id="picker-sensor-${i}" data-field="sensor" data-idx="${i}" data-value="${s.entity||''}">
                    <input type="text" class="fallback-ent s-ent" data-idx="${i}" value="${s.entity||''}" placeholder="sensor.mon_capteur">
                  </div>
                  <div class="grid">
                    <div><label>X %</label><input type="number" class="s-x" data-idx="${i}" value="${s.x}"></div>
                    <div><label>Y %</label><input type="number" class="s-y" data-idx="${i}" value="${s.y}"></div>
                  </div>
                  <button class="del-btn" data-idx="${i}">Supprimer</button>
                </div>
              `).join('')}
            </div>
            <button style="width:100%;padding:12px;background:#4ade80;border:none;font-weight:bold;border-radius:4px;cursor:pointer;" id="add-s">➕ AJOUTER UN CAPTEUR</button>
          ` : ''}

          ${this._activeTab === 'design' ? `
            <label>Hauteur de carte (px)</label>
            <input type="number" id="inp-ch" value="${this._config.card_height}">
            <label>Décalage image vertical (%)</label>
            <input type="number" id="inp-off" value="${this._config.img_offset}">
            <div class="grid">
              <div><label>Boutons X (%)</label><input type="number" id="inp-bx" value="${this._config.btn_x}"></div>
              <div><label>Boutons Y (%)</label><input type="number" id="inp-by" value="${this._config.btn_y}"></div>
            </div>
            <div class="grid">
              <div><label>Largeur blocs (px)</label><input type="number" id="inp-bw" value="${this._config.b_width}"></div>
              <div><label>Hauteur blocs (px)</label><input type="number" id="inp-bh" value="${this._config.b_height}"></div>
            </div>
          ` : ''}

        </div>
      </div>
    `;

    this._attachEvents(pKey);
    this._injectEntityPickers(pKey); // async — ne bloque pas le rendu
  }

  // ── Injection des ha-entity-picker ───────────────────────────────────────
  // CORRECTION 2 : attendre que ha-entity-picker soit défini avant de le créer.
  // CORRECTION 3 : try/catch + fallback input texte si le composant plante.

  async _injectEntityPickers(pKey) {
    // Attente que le composant natif HA soit disponible (timeout 3s)
    try {
      await Promise.race([
        customElements.whenDefined('ha-entity-picker'),
        new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000)),
      ]);
    } catch (_) {
      // ha-entity-picker indisponible → on garde les champs texte de secours
      return;
    }

    const makePicker = (wrap, onChanged) => {
      if (!wrap || !this._hass) return;
      try {
        const picker = document.createElement('ha-entity-picker');
        picker.hass             = this._hass;
        picker.value            = wrap.dataset.value || '';
        picker.label            = wrap.dataset.label || '';
        picker.allowCustomEntity = true;
        picker.addEventListener('value-changed', (e) => onChanged(e.detail.value));
        // CORRECTION 3 : innerHTML='' + appendChild au lieu de replaceChildren()
        // (replaceChildren non dispo sur certaines versions de HA / Webkit)
        wrap.innerHTML = '';
        wrap.appendChild(picker);
      } catch (err) {
        // Fallback silencieux : le champ texte de secours reste visible
        console.warn('[HealthDashboard] ha-entity-picker error:', err);
      }
    };

    // IMC
    makePicker(
      this.querySelector('#picker-imc-entity'),
      val => { this._config[pKey].imc_entity = val; this._fire(); }
    );
    // Corpulence
    makePicker(
      this.querySelector('#picker-corp-entity'),
      val => { this._config[pKey].corp_entity = val; this._fire(); }
    );
    // Capteurs génériques
    this.querySelectorAll('[id^="picker-sensor-"]').forEach(wrap => {
      const idx = parseInt(wrap.dataset.idx);
      makePicker(wrap, val => {
        if (this._config[pKey].sensors[idx]) {
          this._config[pKey].sensors[idx].entity = val;
          this._fire();
        }
      });
    });
  }

  // ── Events éditeur ────────────────────────────────────────────────────────

  _attachEvents(pKey) {
    // Onglets
    this.querySelectorAll('.tab').forEach(t => {
      t.onclick = () => { this._activeTab = t.id.replace('tab-', ''); this.render(); };
    });

    // Changement de personne
    this.querySelector('#t-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#t-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };

    // Helper bind générique
    const bind = (selector, field, isRoot = false) => {
      const el = this.querySelector(selector);
      if (!el) return;
      el.onchange = (e) => {
        const val = el.type === 'number' ? parseFloat(e.target.value) : e.target.value;
        if (isRoot) this._config[field] = val;
        else this._config[pKey][field] = val;
        this._fire();
      };
    };

    if (this._activeTab === 'profile') {
      bind('#inp-name',  'name');      bind('#inp-img',   'image');
      bind('#inp-start', 'start');     bind('#inp-conf',  'comfort');
      bind('#inp-ideal', 'ideal');     bind('#inp-sgoal', 'step_goal');
    }

    if (this._activeTab === 'health') {
      // Fallback text inputs (actifs si ha-entity-picker absent)
      const fbImc = this.querySelector('#fb-imc');
      if (fbImc) fbImc.onchange = (e) => { this._config[pKey].imc_entity = e.target.value; this._fire(); };
      const fbCorp = this.querySelector('#fb-corp');
      if (fbCorp) fbCorp.onchange = (e) => { this._config[pKey].corp_entity = e.target.value; this._fire(); };

      bind('#inp-imcn',  'imc_name');   bind('#inp-imci',  'imc_icon');
      bind('#inp-imcw',  'imc_w');      bind('#inp-imch',  'imc_h');
      bind('#inp-imcx',  'imc_x');      bind('#inp-imcy',  'imc_y');
      bind('#inp-imcf',  'imc_font');
      bind('#inp-corpn', 'corp_name');  bind('#inp-corpi', 'corp_icon');
      bind('#inp-corpw', 'corp_w');     bind('#inp-corph', 'corp_h');
      bind('#inp-corpx', 'corp_x');     bind('#inp-corpy', 'corp_y');
      bind('#inp-corpf', 'corp_font');
    }

    if (this._activeTab === 'design') {
      bind('#inp-ch',  'card_height', true); bind('#inp-off', 'img_offset', true);
      bind('#inp-bx',  'btn_x',  true);      bind('#inp-by',  'btn_y',  true);
      bind('#inp-bw',  'b_width', true);      bind('#inp-bh',  'b_height', true);
    }

    if (this._activeTab === 'sensors') {
      // [BUG 2 FIX] parseInt() sur data-idx
      this.querySelectorAll('.s-name').forEach(el => el.onchange = (e) => { this._config[pKey].sensors[parseInt(el.dataset.idx)].name   = e.target.value; this._fire(); });
      this.querySelectorAll('.s-ico') .forEach(el => el.onchange = (e) => { this._config[pKey].sensors[parseInt(el.dataset.idx)].icon   = e.target.value; this._fire(); });
      this.querySelectorAll('.s-ent') .forEach(el => el.onchange = (e) => { this._config[pKey].sensors[parseInt(el.dataset.idx)].entity = e.target.value; this._fire(); });
      this.querySelectorAll('.s-x')   .forEach(el => el.onchange = (e) => { this._config[pKey].sensors[parseInt(el.dataset.idx)].x      = parseFloat(e.target.value); this._fire(); });
      this.querySelectorAll('.s-y')   .forEach(el => el.onchange = (e) => { this._config[pKey].sensors[parseInt(el.dataset.idx)].y      = parseFloat(e.target.value); this._fire(); });

      this.querySelectorAll('.del-btn').forEach(btn => btn.onclick = () => {
        this._config[pKey].sensors.splice(parseInt(btn.dataset.idx), 1);
        this._fire(); this.render();
      });

      const addS = this.querySelector('#add-s');
      if (addS) addS.onclick = () => {
        if (!this._config[pKey].sensors) this._config[pKey].sensors = [];
        this._config[pKey].sensors.push({ name: 'Nouveau', entity: '', x: 50, y: 50, icon: 'mdi:heart' });
        this._fire(); this.render();
      };
    }
  }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', { detail: { config: this._config }, bubbles: true, composed: true }));
  }
}

// ─── Enregistrement ───────────────────────────────────────────────────────────

customElements.define('health-dashboard-card',        HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: 'health-dashboard-card', name: 'Health Dashboard V2.3.1' });
