// HEALTH DASHBOARD CARD – VERSION V3 CORRIGÉE

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._config = null;
    this._hass = null;
    this.currentPerson = 'person1';
  }

  static getConfigElement() {
    return document.createElement('health-dashboard-card-editor');
  }

  static getStubConfig() {
    return {
      person1: { 
        name: 'Homme', 
        gender: 'male', 
        image: '/local/health-dashboard/male-silhouette.png', 
        sensors: [
          { entity: 'sensor.time', name: 'Heure', icon: '⏰', x: 70, y: 20, color: '#2196f3' }
        ] 
      },
      person2: { 
        name: 'Femme', 
        gender: 'female', 
        image: '/local/health-dashboard/female-silhouette.png', 
        sensors: [
          { entity: 'sensor.date', name: 'Date', icon: '📅', x: 70, y: 30, color: '#e91e63' }
        ] 
      },
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error('Configuration invalide : person1 et person2 requis');
    }
    if (!config.person1.sensors) config.person1.sensors = [];
    if (!config.person2.sensors) config.person2.sensors = [];
    this._config = config;
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    this.updateSensors();
  }

  getCardSize() { return 7; }

  updateSensors() {
    if (!this._hass || !this._config) return;
    const person = this._config[this.currentPerson];
    if (!person?.sensors) return;

    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.getElementById(`value-${i}`);
      if (!el) return;
      const state = this._hass.states[s.entity];
      el.textContent = state ? `${state.state} ${state.attributes.unit_of_measurement || ''}`.trim() : 'N/A';
    });
  }

  render() {
    if (!this._config) return;
    const person = this._config[this.currentPerson];
    const defaultImage = person.gender === 'female' 
      ? '/local/health-dashboard/female-silhouette.png'
      : '/local/health-dashboard/male-silhouette.png';
    const imageUrl = person.image || defaultImage;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        .card { position: relative; width: 100%; height: 650px; overflow: hidden; border-radius: 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .bg { position: absolute; inset: 0; background-image: url('${imageUrl}'); background-position: center center;
              background-size: contain; background-repeat: no-repeat; opacity: 0.4; pointer-events: none; }
        .topbar { position: absolute; top: 16px; right: 16px; display: flex; gap: 12px; z-index: 10; }
        .btn-person { border: none; padding: 12px 24px; border-radius: 25px; cursor: pointer; color: white;
                     font-weight: bold; font-size: 14px; transition: all 0.3s ease;
                     box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .btn-person:hover { transform: translateY(-2px); box-shadow: 0 6px 12px rgba(0,0,0,0.2); }
        .male { background: linear-gradient(135deg, #2196f3, #1976d2); }
        .female { background: linear-gradient(135deg, #e91e63, #c2185b); }
        .active { outline: 3px solid white; outline-offset: 2px; }
        .person-name { position: absolute; top: 80px; left: 50%; transform: translateX(-50%);
                       font-size: 32px; font-weight: bold; color: rgba(255,255,255,0.95);
                       text-shadow: 2px 2px 8px rgba(0,0,0,0.5); z-index: 5; }
        .sensor { position: absolute; transform: translate(-50%, -50%); background: white;
                  border-radius: 12px; padding: 12px 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                  cursor: move; transition: all 0.3s ease; min-width: 120px; text-align: center; z-index: 8; }
        .sensor:hover { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 6px 16px rgba(0,0,0,0.3); }
        .sensor-icon { font-size: 28px; margin-bottom: 4px; }
        .sensor-name { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .sensor-value { font-size: 18px; font-weight: bold; color: white; margin-top: 4px; }
      </style>
      <div class="card">
        <div class="bg"></div>
        <div class="topbar">
          <button id="p1" class="btn-person male ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn-person female ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="person-name">${person.name}</div>
        ${(person.sensors||[]).map((s,i)=>`
          <div class="sensor" id="sensor-${i}" style="left:${s.x||50}%;top:${s.y||50}%;background:${s.color||'#2196f3'};">
            <div class="sensor-icon">${s.icon||'📊'}</div>
            <div class="sensor-name" style="color:${this.getContrastColor(s.color||'#2196f3')};">${s.name||s.entity}</div>
            <div class="sensor-value" id="value-${i}">--</div>
          </div>`).join('')}
      </div>
    `;

    this.shadowRoot.getElementById('p1').onclick = ()=>{ this.currentPerson='person1'; this.render(); };
    this.shadowRoot.getElementById('p2').onclick = ()=>{ this.currentPerson='person2'; this.render(); };

    this.enableDrag();
    this.updateSensors();
  }

  getContrastColor(hex){
    const h=hex.replace('#','');
    const r=parseInt(h.substr(0,2),16);
    const g=parseInt(h.substr(2,2),16);
    const b=parseInt(h.substr(4,2),16);
    const br=(r*299+g*587+b*114)/1000;
    return br>155?'#333':'#FFF';
  }

  enableDrag(){
    const person=this._config[this.currentPerson];
    person.sensors?.forEach((s,i)=>{
      const el=this.shadowRoot.getElementById(`sensor-${i}`);
      if(!el) return;
      el.onmousedown=(e)=>{
        e.preventDefault(); el.style.cursor='grabbing';
        const move=(ev)=>{
          const rect=this.shadowRoot.querySelector('.card').getBoundingClientRect();
          const x=((ev.clientX-rect.left)/rect.width)*100;
          const y=((ev.clientY-rect.top)/rect.height)*100;
          s.x=Math.max(5,Math.min(95,x)); s.y=Math.max(5,Math.min(95,y));
          el.style.left=s.x+'%'; el.style.top=s.y+'%';
        };
        const up=()=>{
          el.style.cursor='move';
          window.removeEventListener('mousemove',move);
          window.removeEventListener('mouseup',up);
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
        };
        window.addEventListener('mousemove',move);
        window.addEventListener('mouseup',up);
      };
    });
  }
}

// ÉDITEUR V3 CORRIGÉ
class HealthDashboardCardEditor extends HTMLElement {
  constructor(){ super(); this._config=null; this._hass=null; this.currentTab='person1'; }
  set hass(h){ this._hass=h; }

  setConfig(config){
    this._config={
      person1: config.person1||{name:'Homme',gender:'male',image:'',sensors:[]},
      person2: config.person2||{name:'Femme',gender:'female',image:'',sensors:[]}
    };
    this.render();
  }

  configChanged(){
    this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
  }

  render(){
    if(!this._config) return;
    const person=this._config[this.currentTab];
    const defaultImage=person.gender==='female'?'/local/health-dashboard/female-silhouette.png':'/local/health-dashboard/male-silhouette.png';
    const imageUrl=person.image||defaultImage;

    this.innerHTML=`
      <style>
        .editor{padding:16px;}.tabs{display:flex;gap:8px;margin-bottom:16px;}
        .tab-btn{padding:10px 20px;border:none;background:#f5f5f5;cursor:pointer;border-radius:8px 8px 0 0;font-weight:500;}
        .tab-btn.active{background:#667eea;color:white;}
        .section{background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:16px;}
        .field{margin-bottom:12px;}
        .field input,.field select{width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;}
        .sensor-list{margin-top:12px;}
        .sensor-item{background:white;border:2px solid #ddd;border-radius:8px;padding:16px;margin-bottom:12px;}
        .sensor-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;}
        .btn-remove{background:#ff5252;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;}
        .btn-add{width:100%;padding:12px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;margin-top:8px;}
      </style>
      <div class="editor">
        <div class="tabs">
          <button class="tab-btn ${this.currentTab==='person1'?'active':''}" data-tab="person1">👤 ${this._config.person1.name}</button>
          <button class="tab-btn ${this.currentTab==='person2'?'active':''}" data-tab="person2">👤 ${this._config.person2.name}</button>
        </div>
        <div class="section">
          <div class="field"><label>Prénom</label><input type="text" class="input-name" value="${person.name||''}"></div>
          <div class="field"><label>Genre</label><select class="select-gender"><option value="male" ${person.gender==='male'?'selected':''}>Homme</option><option value="female" ${person.gender==='female'?'selected':''}>Femme</option></select></div>
          <div class="field"><label>Image de fond</label><input type="text" class="input-image" value="${person.image||''}" placeholder="/local/health-dashboard/silhouette.png"></div>
        </div>
        <div class="section">
          <div class="sensor-list">
            ${this.renderSensors(person.sensors||[])}
          </div>
          <button class="btn-add">➕ Ajouter un capteur</button>
        </div>
      </div>
    `;

    this.attachListeners();
  }

  renderSensors(sensors){
    if(!sensors.length) return '<p style="color:#999;font-size:13px;">Aucun capteur configuré</p>';
    return sensors.map((s,i)=>`
      <div class="sensor-item" data-index="${i}">
        <div class="sensor-header"><span>Capteur ${i+1}</span><button class="btn-remove" data-index="${i}">🗑️ Supprimer</button></div>
        <div class="field"><label>Entité</label><input type="text" class="sensor-entity" data-index="${i}" value="${s.entity||''}"></div>
        <div class="field"><label>Nom affiché</label><input type="text" class="sensor-name" data-index="${i}" value="${s.name||''}"></div>
        <div class="field"><label>Icône</label><input type="text" class="sensor-icon" data-index="${i}" value="${s.icon||''}" maxlength="4"></div>
        <div class="field"><label>Couleur</label><input type="color" class="sensor-color" data-index="${i}" value="${s.color||'#2196f3'}"></div>
        <div class="field"><label>X (%)</label><input type="number" class="sensor-x" data-index="${i}" value="${s.x||50}" min="5" max="95"></div>
        <div class="field"><label>Y (%)</label><input type="number" class="sensor-y" data-index="${i}" value="${s.y||50}" min="5" max="95"></div>
      </div>`).join('');
  }

  attachListeners(){
    this.querySelectorAll('.tab-btn').forEach(btn=>btn.onclick=()=>{this.currentTab=btn.dataset.tab;this.render();});
    const person=this._config[this.currentTab];

    const nameInput=this.querySelector('.input-name'); if(nameInput) nameInput.oninput=e=>{person.name=e.target.value;this.configChanged();};
    const genderSelect=this.querySelector('.select-gender'); if(genderSelect) genderSelect.onchange=e=>{person.gender=e.target.value;this.configChanged(); this.render();};
    const imageInput=this.querySelector('.input-image'); if(imageInput) imageInput.oninput=e=>{person.image=e.target.value;this.configChanged(); this.render();};

    this.querySelector('.btn-add').onclick=()=>{
      person.sensors.push({entity:'',name:'',icon:'📊',color:'#2196f3',x:50,y:50});
      this.configChanged(); this.render();
    };

    this.querySelectorAll('.btn-remove').forEach(btn=>btn.onclick=()=>{
      const index=parseInt(btn.dataset.index); person.sensors.splice(index,1); this.configChanged(); this.render();
    });

    this.querySelectorAll('.sensor-entity').forEach(input=>input.oninput=e=>{const i=parseInt(e.target.dataset.index);person.sensors[i].entity=e.target.value;this.configChanged();});
    this.querySelectorAll('.sensor-name').forEach(input=>input.oninput=e=>{const i=parseInt(e.target.dataset.index);person.sensors[i].name=e.target.value;this.configChanged();});
    this.querySelectorAll('.sensor-icon').forEach(input=>input.oninput=e=>{const i=parseInt(e.target.dataset.index);person.sensors[i].icon=e.target.value;this.configChanged();});
    this.querySelectorAll('.sensor-color').forEach(input=>input.oninput=e=>{const i=parseInt(e.target.dataset.index);person.sensors[i].color=e.target.value;this.configChanged();});
    this.querySelectorAll('.sensor-x').forEach(input=>input.oninput=e=>{const i=parseInt(e.target.dataset.index);person.sensors[i].x=parseFloat(e.target.value);this.configChanged();});
    this.querySelectorAll('.sensor-y').forEach(input=>input.oninput=e=>{const i=parseInt(e.target.dataset.index);person.sensors[i].y=parseFloat(e.target.value);this.configChanged();});
  }
}

customElements.define('health-dashboard-card',HealthDashboardCard);
customElements.define('health-dashboard-card-editor',HealthDashboardCardEditor);

window.customCards=window.customCards||[]
