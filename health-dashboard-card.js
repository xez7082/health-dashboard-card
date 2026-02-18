/**
 * HEALTH DASHBOARD CARD – V102
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
// Règles fondamentales pour un éditeur visuel HA fiable :
//   1. set hass() NE DOIT PAS appeler render() — HA injecte hass en continu.
//   2. Seul setConfig() déclenche render().
//   3. Pas de ha-entity-picker (trop fragile) — simples inputs texte.
//   4. Toujours utiliser oninput/onchange sur les éléments du DOM, jamais addEventListener
//      sur un innerHTML car les références sont perdues à chaque render().

class HealthDashboardCardEditor extends HTMLElement {
  constructor() {
    super();
    this._config    = null;
    this._hass      = null;
    this._activeTab = 'profile';
  }

  // HA injecte hass en permanence — on stocke seulement, pas de render().
  set hass(h) { this._hass = h; }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    this.render();
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  render() {
    if (!this._config) return;
    const pKey = this._config.current_view || 'person1';
    const p    = this._config[pKey];
    if (!p) return;

    const tab  = this._activeTab;
    const ac   = '#38bdf8';

    // Génération du contenu de l'onglet actif
    let tabContent = '';

    if (tab === 'profile') {
      tabContent = `
        <label>Nom</label>
        <input id="f-name" type="text" value="${this._esc(p.name)}">
        <label>Image URL</label>
        <input id="f-img" type="text" value="${this._esc(p.image)}">
        <div class="grid2">
          <div><label>Départ (kg)</label><input id="f-start" type="number" value="${p.start}"></div>
          <div><label>Confort (kg)</label><input id="f-conf"  type="number" value="${p.comfort}"></div>
          <div><label>Idéal (kg)</label><input id="f-ideal" type="number" value="${p.ideal}"></div>
          <div><label>Objectif pas</label><input id="f-sgoal" type="number" value="${p.step_goal}"></div>
        </div>
      `;
    }

    if (tab === 'health') {
      tabContent = `
        <div class="sub">
          <div class="sub-title">IMC</div>
          <label>Entité</label><input id="f-imce" type="text" value="${this._esc(p.imc_entity||'')}">
          <div class="grid2">
            <div><label>Nom</label><input id="f-imcn" type="text" value="${this._esc(p.imc_name)}"></div>
            <div><label>Icône</label><input id="f-imci" type="text" value="${this._esc(p.imc_icon)}"></div>
            <div><label>Largeur</label><input id="f-imcw" type="number" value="${p.imc_w}"></div>
            <div><label>Hauteur</label><input id="f-imch" type="number" value="${p.imc_h}"></div>
            <div><label>X (%)</label><input id="f-imcx" type="number" value="${p.imc_x}"></div>
            <div><label>Y (%)</label><input id="f-imcy" type="number" value="${p.imc_y}"></div>
            <div><label>Police</label><input id="f-imcf" type="number" value="${p.imc_font}"></div>
          </div>
        </div>
        <div class="sub">
          <div class="sub-title">CORPULENCE</div>
          <label>Entité</label><input id="f-corpe" type="text" value="${this._esc(p.corp_entity||'')}">
          <div class="grid2">
            <div><label>Nom</label><input id="f-corpn" type="text" value="${this._esc(p.corp_name)}"></div>
            <div><label>Icône</label><input id="f-corpi" type="text" value="${this._esc(p.corp_icon)}"></div>
            <div><label>Largeur</label><input id="f-corpw" type="number" value="${p.corp_w}"></div>
            <div><label>Hauteur</label><input id="f-corph" type="number" value="${p.corp_h}"></div>
            <div><label>X (%)</label><input id="f-corpx" type="number" value="${p.corp_x}"></div>
            <div><label>Y (%)</label><input id="f-corpy" type="number" value="${p.corp_y}"></div>
            <div><label>Police</label><input id="f-corpf" type="number" value="${p.corp_font}"></div>
          </div>
        </div>
      `;
    }

    if (tab === 'sensors') {
      const rows = (p.sensors || []).map((s, i) => `
        <div class="sub">
          <div class="grid2">
            <div><label>Nom</label><input class="sn" data-i="${i}" type="text" value="${this._esc(s.name)}"></div>
            <div><label>Icône</label><input class="si" data-i="${i}" type="text" value="${this._esc(s.icon||'mdi:heart')}"></div>
          </div>
          <label>Entité</label><input class="se" data-i="${i}" type="text" value="${this._esc(s.entity||'')}">
          <div class="grid2">
            <div><label>X (%)</label><input class="sx" data-i="${i}" type="number" value="${s.x}"></div>
            <div><label>Y (%)</label><input class="sy" data-i="${i}" type="number" value="${s.y}"></div>
          </div>
          <button class="del-btn" data-i="${i}">🗑 Supprimer</button>
        </div>
      `).join('');
      tabContent = `
        ${rows}
        <button id="btn-add" class="add-btn">➕ Ajouter un capteur</button>
      `;
    }

    if (tab === 'design') {
      tabContent = `
        <label>Hauteur carte (px)</label><input id="f-ch"  type="number" value="${this._config.card_height}">
        <label>Décalage image (%)</label><input id="f-off" type="number" value="${this._config.img_offset}">
        <div class="grid2">
          <div><label>Boutons X (%)</label><input id="f-bx" type="number" value="${this._config.btn_x}"></div>
          <div><label>Boutons Y (%)</label><input id="f-by" type="number" value="${this._config.btn_y}"></div>
          <div><label>Largeur blocs</label><input id="f-bw" type="number" value="${this._config.b_width}"></div>
          <div><label>Hauteur blocs</label><input id="f-bh" type="number" value="${this._config.b_height}"></div>
        </div>
      `;
    }

    this.innerHTML = `
      <style>
        :host { display: block; font-family: sans-serif; }
        .box  { padding: 12px; background: #1a1a1a; color: #fff; }

        /* Sélecteur personne */
        .person-bar { display: flex; gap: 8px; margin-bottom: 12px; }
        .person-bar button {
          flex: 1; padding: 10px; border: none; border-radius: 6px;
          cursor: pointer; font-weight: bold; font-size: 13px;
        }

        /* Onglets */
        .tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid #444; }
        .tab  { flex: 1; padding: 9px 4px; border: none; background: #252525; color: #888; cursor: pointer; font-size: 11px; }
        .tab.on { background: #38bdf8; color: #000; font-weight: bold; }

        /* Contenu */
        .section { background: #252525; padding: 14px; border: 1px solid #444; border-radius: 6px; }
        label { display: block; margin-top: 10px; margin-bottom: 3px; color: #38bdf8; font-size: 10px; font-weight: bold; }
        input[type=text], input[type=number] {
          width: 100%; padding: 8px; background: #333; color: #fff;
          border: 1px solid #555; border-radius: 4px; box-sizing: border-box; font-size: 13px;
        }
        .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }

        /* Blocs capteurs */
        .sub { background: #111; padding: 10px; border-radius: 8px; margin-bottom: 12px; border-left: 3px solid #38bdf8; }
        .sub-title { color: #38bdf8; font-size: 11px; font-weight: bold; margin-bottom: 6px; }
        .del-btn { margin-top: 10px; width: 100%; padding: 8px; background: #f87171; border: none; color: #fff; border-radius: 4px; cursor: pointer; }
        .add-btn { width: 100%; padding: 12px; background: #4ade80; border: none; color: #000; font-weight: bold; border-radius: 4px; cursor: pointer; }
      </style>
      <div class="box">
        <div class="person-bar">
          <button id="btn-p1" style="background:${pKey==='person1'?'#38bdf8':'#444'};color:${pKey==='person1'?'#000':'#fff'};">${this._config.person1.name}</button>
          <button id="btn-p2" style="background:${pKey==='person2'?'#38bdf8':'#444'};color:${pKey==='person2'?'#000':'#fff'};">${this._config.person2.name}</button>
        </div>
        <div class="tabs">
          <button class="tab ${tab==='profile' ?'on':''}" data-tab="profile">PROFIL</button>
          <button class="tab ${tab==='health'  ?'on':''}" data-tab="health">SANTÉ</button>
          <button class="tab ${tab==='sensors' ?'on':''}" data-tab="sensors">CAPTEURS</button>
          <button class="tab ${tab==='design'  ?'on':''}" data-tab="design">DESIGN</button>
        </div>
        <div class="section">${tabContent}</div>
      </div>
    `;

    this._bindEvents(pKey);
  }

  // ── Liaison des événements ─────────────────────────────────────────────────

  _bindEvents(pKey) {
    // Changement de personne
    this.querySelector('#btn-p1').onclick = () => { this._config.current_view = 'person1'; this._fire(); this.render(); };
    this.querySelector('#btn-p2').onclick = () => { this._config.current_view = 'person2'; this._fire(); this.render(); };

    // Changement d'onglet
    this.querySelectorAll('.tab').forEach(btn => {
      btn.onclick = () => { this._activeTab = btn.dataset.tab; this.render(); };
    });

    const tab = this._activeTab;
    const p   = this._config[pKey];

    // Helper : bind un input vers un champ de config
    const bind = (id, setter) => {
      const el = this.querySelector(id);
      if (!el) return;
      el.onchange = () => { setter(el.value); this._fire(); };
    };
    const bindNum = (id, setter) => {
      const el = this.querySelector(id);
      if (!el) return;
      el.onchange = () => { setter(parseFloat(el.value)); this._fire(); };
    };

    if (tab === 'profile') {
      bind('#f-name',  v => p.name      = v);
      bind('#f-img',   v => p.image     = v);
      bindNum('#f-start', v => p.start    = v);
      bindNum('#f-conf',  v => p.comfort  = v);
      bindNum('#f-ideal', v => p.ideal    = v);
      bindNum('#f-sgoal', v => p.step_goal = v);
    }

    if (tab === 'health') {
      bind('#f-imce',  v => p.imc_entity  = v);
      bind('#f-imcn',  v => p.imc_name    = v);
      bind('#f-imci',  v => p.imc_icon    = v);
      bindNum('#f-imcw', v => p.imc_w     = v);
      bindNum('#f-imch', v => p.imc_h     = v);
      bindNum('#f-imcx', v => p.imc_x     = v);
      bindNum('#f-imcy', v => p.imc_y     = v);
      bindNum('#f-imcf', v => p.imc_font  = v);
      bind('#f-corpe', v => p.corp_entity = v);
      bind('#f-corpn', v => p.corp_name   = v);
      bind('#f-corpi', v => p.corp_icon   = v);
      bindNum('#f-corpw', v => p.corp_w   = v);
      bindNum('#f-corph', v => p.corp_h   = v);
      bindNum('#f-corpx', v => p.corp_x   = v);
      bindNum('#f-corpy', v => p.corp_y   = v);
      bindNum('#f-corpf', v => p.corp_font= v);
    }

    if (tab === 'design') {
      bindNum('#f-ch',  v => this._config.card_height = v);
      bindNum('#f-off', v => this._config.img_offset  = v);
      bindNum('#f-bx',  v => this._config.btn_x       = v);
      bindNum('#f-by',  v => this._config.btn_y       = v);
      bindNum('#f-bw',  v => this._config.b_width     = v);
      bindNum('#f-bh',  v => this._config.b_height    = v);
    }

    if (tab === 'sensors') {
      if (!p.sensors) p.sensors = [];

      this.querySelectorAll('.sn').forEach(el => el.onchange = () => { p.sensors[+el.dataset.i].name   = el.value; this._fire(); });
      this.querySelectorAll('.si').forEach(el => el.onchange = () => { p.sensors[+el.dataset.i].icon   = el.value; this._fire(); });
      this.querySelectorAll('.se').forEach(el => el.onchange = () => { p.sensors[+el.dataset.i].entity = el.value; this._fire(); });
      this.querySelectorAll('.sx').forEach(el => el.onchange = () => { p.sensors[+el.dataset.i].x      = parseFloat(el.value); this._fire(); });
      this.querySelectorAll('.sy').forEach(el => el.onchange = () => { p.sensors[+el.dataset.i].y      = parseFloat(el.value); this._fire(); });

      this.querySelectorAll('.del-btn').forEach(btn => {
        btn.onclick = () => { p.sensors.splice(+btn.dataset.i, 1); this._fire(); this.render(); };
      });

      const addBtn = this.querySelector('#btn-add');
      if (addBtn) addBtn.onclick = () => {
        p.sensors.push({ name: 'Nouveau', entity: '', x: 50, y: 50, icon: 'mdi:heart' });
        this._fire(); this.render();
      };
    }
  }

  // ── Utilitaires ───────────────────────────────────────────────────────────

  // Échappe les guillemets dans les attributs value=""
  _esc(s) { return String(s).replace(/"/g, '&quot;'); }

  _fire() {
    this.dispatchEvent(new CustomEvent('config-changed', {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    }));
  }
}

// ─── Enregistrement ───────────────────────────────────────────────────────────

customElements.define('health-dashboard-card',        HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({ type: 'health-dashboard-card', name: 'Health Dashboard V2.3.2' });
