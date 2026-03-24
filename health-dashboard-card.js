/**
 * HEALTH DASHBOARD CARD – V2.5.0
 * RÉINTÉGRATION TOTALE : SENSORS, COULEURS, CERCLES, BACKGROUND, TAILLE
 */

class HealthDashboardCard extends HTMLElement {
  constructor() { super(); this.attachShadow({ mode: 'open' }); }
  static getConfigElement() { return document.createElement('health-dashboard-card-editor'); }
  
  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config));
    if (!this._config.current_view) this._config.current_view = 'person1';
    this.render();
  }

  set hass(hass) { this._hass = hass; this.update(); }

  update() {
    if (!this._hass || !this.shadowRoot || !this._config) return;
    const view = this._config.current_view;
    const p = this._config[view];
    
    // Mise à jour valeurs texte
    const updateVal = (id, ent) => {
      const el = this.shadowRoot.getElementById(id);
      if(el && ent && this._hass.states[ent]) el.textContent = this._hass.states[ent].state;
    };
    updateVal('imc-v', p.imc_entity);
    updateVal('corp-v', p.corp_entity);
    (p.sensors || []).forEach((s, i) => updateVal(`s-${i}`, s.entity));
  }

  render() {
    const v = this._config.current_view;
    const p = this._config[v];
    const r = this._config.card_round || 12;
    
    this.shadowRoot.innerHTML = `
      <style>
        .main { position: relative; width: 100%; height: ${this._config.card_height || 500}px; background: #0f172a; border-radius: ${r}px; overflow: hidden; }
        .bg { position: absolute; inset:0; background: url('${p.image || ''}') center/cover; opacity: 0.4; }
        .box { position: absolute; transform: translate(-50%, -50%); background: rgba(0,0,0,0.6); padding: 10px; text-align:center; color: white; border-width: 2px; border-style: solid; box-sizing: border-box; }
      </style>
      <div class="main">
        <div class="bg"></div>
        <div class="box" style="left:${p.imc_x}%; top:${p.imc_y}%; width:${p.imc_w}px; height:${p.imc_h}px; border-radius:${p.imc_circle?'50%':r+'px'}; border-color:${p.imc_bc};">
           <div style="font-size:10px">${p.imc_name}</div><div id="imc-v">--</div>
        </div>
        <div class="box" style="left:${p.corp_x}%; top:${p.corp_y}%; width:${p.corp_w}px; height:${p.corp_h}px; border-radius:${p.corp_circle?'50%':r+'px'}; border-color:${p.corp_bc};">
           <div style="font-size:10px">${p.corp_name}</div><div id="corp-v">--</div>
        </div>
        ${(p.sensors || []).map((s, i) => `
           <div class="box" style="left:${s.x}%; top:${s.y}%; width:${s.w}px; height:${s.h}px; border-radius:${s.circle?'50%':r+'px'}; border-color:${s.bc};">
             <div style="font-size:10px">${s.name}</div><div id="s-${i}">--</div>
           </div>
        `).join('')}
      </div>
    `;
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor() { super(); this._tab = 'sensors'; }
  setConfig(config) { this._config = JSON.parse(JSON.stringify(config)); this.render(); }

  render() {
    const v = this._config.current_view;
    const p = this._config[v];
    this.innerHTML = `
      <style>
        .pnl { padding:10px; color:white; font-family:sans-serif; }
        .sec { background:#222; padding:10px; margin-bottom:10px; border-radius:6px; }
        input { width: 100%; margin-bottom: 5px; }
        .grid { display:grid; grid-template-columns:1fr 1fr; gap:5px; }
      </style>
      <div class="pnl">
        <select id="person-sel"><option value="person1">${this._config.person1.name}</option><option value="person2">${this._config.person2.name}</option></select>
        <div class="sec">
          <label>URL Image</label><input type="text" data-f="image" value="${p.image}">
          <label>Hauteur Totale</label><input type="number" id="ch" value="${this._config.card_height}">
        </div>
        
        <div class="sec">
          <label>IMC (Entité, Nom, Couleur Bord, Rond?)</label>
          <ha-entity-picker .hass="${this._hass}" .value="${p.imc_entity}" data-f="imc_entity"></ha-entity-picker>
          <input type="text" data-f="imc_name" value="${p.imc_name}">
          <input type="text" data-f="imc_bc" value="${p.imc_bc}">
          <input type="checkbox" data-f="imc_circle" ${p.imc_circle?'checked':''}> Rond
        </div>

        <div class="sec">
          <label>Capteurs</label>
          ${(p.sensors || []).map((s, i) => `
            <div style="border-bottom:1px solid #444; margin-bottom:5px;">
              <ha-entity-picker .hass="${this._hass}" .value="${s.entity}" data-idx="${i}" data-f="entity"></ha-entity-picker>
              <div class="grid"><input type="number" data-idx="${i}" data-f="x" value="${s.x}"><input type="number" data-idx="${i}" data-f="y" value="${s.y}"></div>
              <input type="checkbox" data-idx="${i}" data-f="circle" ${s.circle?'checked':''}> Rond
            </div>
          `).join('')}
          <button id="add">Ajouter Capteur</button>
        </div>
      </div>
    `;
    this._attach();
  }

  _attach() {
    this.querySelectorAll('input').forEach(el => el.onchange = (e) => {
       const p = this._config[this._config.current_view];
       if(el.dataset.idx !== undefined) p.sensors[el.dataset.idx][el.dataset.f] = el.type==='checkbox'?el.checked:el.value;
       else this._config[el.dataset.f] ? (this._config[el.dataset.f] = el.value) : (p[el.dataset.f] = el.value);
       this._fire();
    });
    this.querySelector('#person-sel').onchange = (e) => { this._config.current_view = e.target.value; this._fire(); this.render(); };
    this.querySelector('#add').onclick = () => { this._config[this._config.current_view].sensors.push({name:'New', entity:'', x:50, y:50, w:80, h:80, bc:'white', circle:false}); this._fire(); this.render(); };
  }
  _fire() { this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: this._config }, bubbles: true, composed: true })); }
}

customElements.define('health-dashboard-card', HealthDashboardCard);
customElements.define('health-dashboard-card-editor', HealthDashboardCardEditor);
