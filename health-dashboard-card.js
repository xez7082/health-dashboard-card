// ==============================================
// HEALTH DASHBOARD CARD – VERSION V3.2
// ==============================================

class HealthDashboardCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = null;
    this._hass = null;
    this.currentPerson = "person1";
  }

  static getConfigElement() {
    return document.createElement("health-dashboard-card-editor");
  }

  static getStubConfig() {
    return {
      person1: { 
        name: "Homme", 
        gender: "male", 
        image: "/local/health-dashboard/male-silhouette.png", 
        sensors: [
          { entity: "sensor.time", name: "Heure", icon: "⏰", x: 50, y: 20, color: "#2196f3" }
        ] 
      },
      person2: { 
        name: "Femme", 
        gender: "female", 
        image: "/local/health-dashboard/female-silhouette.png", 
        sensors: [
          { entity: "sensor.date", name: "Date", icon: "📅", x: 50, y: 30, color: "#e91e63" }
        ] 
      },
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error("Configuration invalide : person1 et person2 requis");
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

  getCardSize() {
    return 7;
  }

  updateSensors() {
    if (!this._hass || !this._config) return;

    const person = this._config[this.currentPerson];
    if (!person || !person.sensors) return;

    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.querySelector(`#value-${i}`);
      if (!el) return;
      
      const state = this._hass.states[s.entity];
      if (state) {
        const unit = state.attributes.unit_of_measurement || "";
        el.textContent = `${state.state} ${unit}`.trim();
      } else {
        el.textContent = "N/A";
      }
    });
  }

  render() {
    if (!this._config) return;

    const person = this._config[this.currentPerson];
    const defaultImage = person.gender === "female" 
      ? "/local/health-dashboard/female-silhouette.png"
      : "/local/health-dashboard/male-silhouette.png";
    
    const imageUrl = person.image || defaultImage;

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }

        .card {
          position: relative;
          width: 100%;
          height: 650px;
          overflow: hidden;
          border-radius: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .bg {
          position: absolute;
          inset: 0;
          background-image: url('${imageUrl}');
          background-position: center center;
          background-size: contain;
          background-repeat: no-repeat;
          opacity: 0.4;
          pointer-events: none;
        }

        .topbar {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 12px;
          z-index: 10;
        }

        .btn-person {
          border: none;
          padding: 12px 24px;
          border-radius: 25px;
          cursor: pointer;
          color: white;
          font-weight: bold;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .btn-person:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.2);
        }

        .male { background: linear-gradient(135deg, #2196f3, #1976d2); }
        .female { background: linear-gradient(135deg, #e91e63, #c2185b); }
        .active { outline: 3px solid white; outline-offset: 2px; }

        .person-name {
          position: absolute;
          top: 80px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 32px;
          font-weight: bold;
          color: rgba(255, 255, 255, 0.95);
          text-shadow: 2px 2px 8px rgba(0, 0, 0, 0.5);
          z-index: 5;
        }

        .sensor {
          position: absolute;
          transform: translate(-50%, -50%);
          background: white;
          border-radius: 12px;
          padding: 12px 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          cursor: move;
          transition: all 0.3s ease;
          min-width: 120px;
          text-align: center;
          z-index: 8;
        }

        .sensor:hover { transform: translate(-50%, -50%) scale(1.05); box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3); }

        .sensor-icon { font-size: 28px; margin-bottom: 4px; }
        .sensor-name { font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
        .sensor-value { font-size: 18px; font-weight: bold; color: white; margin-top: 4px; }

        @media (max-width: 768px) {
          .person-name { font-size: 24px; top: 60px; }
          .sensor { min-width: 100px; padding: 10px 12px; }
          .sensor-icon { font-size: 24px; }
          .sensor-value { font-size: 16px; }
        }
      </style>

      <div class="card">
        <div class="bg"></div>
        <div class="topbar">
          <button id="p1" class="btn-person male ${this.currentPerson === "person1" ? "active" : ""}">
            ${this._config.person1.name}
          </button>
          <button id="p2" class="btn-person female ${this.currentPerson === "person2" ? "active" : ""}">
            ${this._config.person2.name}
          </button>
        </div>
        <div class="person-name">${person.name}</div>
        ${(person.sensors || []).map((s, i) => `
          <div class="sensor" id="sensor-${i}" 
               style="left: ${s.x||50}%; top: ${s.y||50}%; background: ${s.color||'#2196f3'};">
            <div class="sensor-icon">${s.icon||"📊"}</div>
            <div class="sensor-name" style="color: ${this.getContrastColor(s.color||'#2196f3')}">${s.name||s.entity}</div>
            <div class="sensor-value" id="value-${i}">--</div>
          </div>
        `).join("")}
      </div>
    `;

    this.shadowRoot.getElementById("p1").onclick = () => { this.currentPerson = "person1"; this.render(); this.updateSensors(); };
    this.shadowRoot.getElementById("p2").onclick = () => { this.currentPerson = "person2"; this.render(); this.updateSensors(); };

    this.enableDrag();
    this.updateSensors();
  }

  getContrastColor(hexColor) {
    const hex = hexColor.replace('#','');
    const r = parseInt(hex.substr(0,2),16);
    const g = parseInt(hex.substr(2,2),16);
    const b = parseInt(hex.substr(4,2),16);
    const brightness = (r*299 + g*587 + b*114)/1000;
    return brightness>155?'#333':'#fff';
  }

  enableDrag() {
    const person = this._config[this.currentPerson];
    person.sensors?.forEach((s,i)=>{
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      if(!el) return;
      el.onmousedown = (e)=>{
        e.preventDefault();
        el.style.cursor='grabbing';
        const move=(ev)=>{
          const rect=this.shadowRoot.querySelector(".card").getBoundingClientRect();
          const x=((ev.clientX-rect.left)/rect.width)*100;
          const y=((ev.clientY-rect.top)/rect.height)*100;
          s.x=Math.max(5,Math.min(95,x));
          s.y=Math.max(5,Math.min(95,y));
          el.style.left=s.x+"%";
          el.style.top=s.y+"%";
        };
        const up=()=>{
          el.style.cursor='move';
          window.removeEventListener("mousemove",move);
          window.removeEventListener("mouseup",up);
          this.dispatchEvent(new CustomEvent('config-changed',{
            detail:{config:this._config},
            bubbles:true,composed:true
          }));
        };
        window.addEventListener("mousemove",move);
        window.addEventListener("mouseup",up);
      };
    });
  }
}

// ======================================================
// EDITOR – V3.2 avec preview live et positionnement
// ======================================================

class HealthDashboardCardEditor extends HTMLElement {
  constructor(){
    super();
    this._config=null;
    this._hass=null;
    this.currentTab="person1";
  }

  set hass(hass){ this._hass=hass; }

  setConfig(config){
    this._config={
      person1: config.person1||{name:"Homme",gender:"male",image:"",sensors:[]},
      person2: config.person2||{name:"Femme",gender:"female",image:"",sensors:[]}
    };
    this.render();
  }

  configChanged(){
    const event=new CustomEvent("config-changed",{detail:{config:this._config},bubbles:true,composed:true});
    this.dispatchEvent(event);
  }

  render(){
    if(!this._config) return;
    const person=this._config[this.currentTab];
    const defaultImage = person.gender==='female'?'/local/health-dashboard/female-silhouette.png':'/local/health-dashboard/male-silhouette.png';
    const imageUrl = person.image || defaultImage;

    this.innerHTML=`
      <style>
        .editor{padding:16px;}
        .tabs{display:flex;gap:8px;margin-bottom:16px;border-bottom:2px solid #e0e0e0;padding-bottom:8px;}
        .tab-btn{padding:10px 20px;border:none;background:#f5f5f5;cursor:pointer;border-radius:8px 8px 0 0;font-weight:500;transition:all 0.2s;}
        .tab-btn:hover{background:#e0e0e0;}
        .tab-btn.active{background:#667eea;color:white;}
        .section{background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:16px;}
        .section-title{font-size:16px;font-weight:bold;margin-bottom:12px;color:#333;}
        .field{margin-bottom:12px;}
        .field input, .field select{width:100%;padding:8px 12px;border:1px solid #ddd;border-radius:6px;font-size:14px;box-sizing:border-box;}
        .field input:focus, .field select:focus{outline:none;border-color:#667eea;}
        .sensor-list{margin-top:12px;}
        .sensor-item{background:white;border:2px solid #ddd;border-radius:8px;padding:16px;margin-bottom:12px;position:relative;}
        .sensor-header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid #eee;}
        .sensor-number{font-weight:bold;font-size:16px;color:#667eea;}
        .btn-remove{background:#ff5252;color:white;border:none;padding:6px 12px;border-radius:6px;cursor:pointer;font-size:12px;font-weight:500;}
        .btn-remove:hover{background:#ff1744;}
        .btn-add{width:100%;padding:12px;background:#667eea;color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:500;margin-top:8px;}
        .btn-add:hover{background:#5568d3;}
        .info-box{background:#e3f2fd;border-left:4px solid #2196f3;padding:12px;margin-bottom:16px;border-radius:4px;font-size:13px;}
        .color-picker-wrapper{display:flex;align-items:center;gap:8px;}
        .color-picker{width:60px;height:36px;border:1px solid #ddd;border-radius:6px;cursor:pointer;}
        .color-value{flex:1;font-size:12px;color:#666;}
        .preview-section{background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:16px;}
        .preview-container{position:relative;width:100%;height:500px;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);border-radius:12px;overflow:hidden;}
        .preview-bg{position:absolute;inset:0;background-image:url('${imageUrl}');background-position:center center;background-size:contain;background-repeat:no-repeat;opacity:0.4;}
        .preview-sensor{position:absolute;transform:translate(-50%,-50%);background:white;border-radius:10px;padding:8px 12px;box-shadow:0 3px 8px rgba(0,0,0,0.2);min-width:100px;text-align:center;font-size:12px;cursor:pointer;transition:all 0.2s;}
        .preview-sensor:hover{transform:translate(-50%,-50%) scale(1.1);box-shadow:0 4px 12px rgba(0,0,0,0.3);}
        .preview-sensor-icon{font-size:24px;margin-bottom:2px;}
        .preview-sensor-name{font-size:10px;font-weight:600;text-transform:uppercase;}
        .preview-sensor-xy{font-size:9px;color:#999;margin-top:2px;}
        small{display:block;margin-top:4px;font-size:11px;color:#999;}
        .position-fields{background:#fff3e0;border:1px solid #ffb74d;border-radius:6px;padding:12px;margin-top:8px;}
        .position-fields label{color:#e65100;font-weight:bold;}
      </style>

      <div class="editor">
        <div class="info-box">💡 Astuce : utilisez la prévisualisation ci-dessous pour positionner les capteurs.</div>
        <div class="tabs">
          <button class="tab-btn ${this.currentTab==='person1'?'active':''}" data-tab="person1">👤 ${this._config.person1.name}</button>
          <button class="tab-btn ${this.currentTab==='person2'?'active':''}" data-tab="person2">👤 ${this._config.person2.name}</button>
        </div>
        <div class="preview-section">
          <div class="section-title">📸 Prévisualisation du positionnement</div>
          <div class="preview-container" id="preview-container"></div>
        </div>
        <div class="section">
          <div class="section-title">Informations de base</div>
          <div class="field"><label>Prénom</label><input type="text" class="input-name" value="${person.name||''}" placeholder="Ex: Jean"></div>
          <div class="field"><label>Genre</label><select class="select-gender"><option value="male" ${person.gender==='male'?'selected':''}>Homme</option><option value="female" ${person.gender==='female'?'selected':''}>Femme</option></select></div>
          <div class="field"><label>Image de fond</label><input type="text" class="input-image" value="${person.image||''}" placeholder="/local/health-dashboard/silhouette.png"><small>Laissez vide pour l'image par défaut</small></div>
        </div>
        <div class="section">
          <div class="section-title">Capteurs de santé</div>
          <div class="sensor-list">${this.renderSensors(person.sensors||[])}</div>
          <button class="btn-add">➕ Ajouter un capteur</button>
        </div>
      </div>
    `;

    this.attachListeners();
    this.updatePreview();
  }

  renderSensors(sensors){
    if(!sensors||sensors.length===0) return '<p style="color:#999;font-size:13px;margin:0;">Aucun capteur configuré</p>';
    return sensors.map((s,i)=>`
      <div class="sensor-item" data-index="${i}">
        <div class="sensor-header"><span class="sensor-number">📍 Capteur ${i+1}</span><button class="btn-remove" data-index="${i}">🗑️ Supprimer</button></div>
        <div class="field"><label>🔗 Entité</label><input type="text" class="sensor-entity" data-index="${i}" value="${s.entity||''}" placeholder="sensor.poids"></div>
        <div class="field"><label>📝 Nom</label><input type="text" class="sensor-name" data-index="${i}" value="${s.name||''}" placeholder="Poids"></div>
        <div class="field"><label>😊 Icône</label><input type="text" class="sensor-icon" data-index="${i}" value="${s.icon||''}" maxlength="4"></div>
        <div class="field"><label>🎨 Couleur</label><div class="color-picker-wrapper"><input type="color" class="sensor-color color-picker" data-index="${i}" value="${s.color||'#2196f3'}"><span class="color-value">${s.color||'#2196f3'}</span></div></div>
        <div class="position-fields">
          <label>📍 Position</label>
          <div class="field-row">
            <div class="field" style="margin:0;"><label>← X (%) →</label><input type="number" class="sensor-x" data-index="${i}" value="${s.x||50}" min="5" max="95" step="1"><small>5=Gauche • 50=Centre • 95=Droite</small></div>
            <div class="field" style="margin:0;"><label>↑ Y (%) ↓</label><input type="number" class="sensor-y" data-index="${i}" value="${s.y||50}" min="5" max="95" step="1"><small>5=Haut • 50=Centre • 95=Bas</small></div>
          </div>
        </div>
      </div>
    `).join('');
  }

  attachListeners(){
    const tabButtons=this.querySelectorAll(".tab-btn");
    tabButtons.forEach(btn=>{btn.onclick=()=>{this.currentTab=btn.dataset.tab;this.render();};});

    const nameInput=this.querySelector(".input-name");
    const genderSelect=this.querySelector(".select-gender");
    const imageInput=this.querySelector(".input-image");

    if(nameInput) nameInput.oninput=e=>{this._config[this.currentTab].name=e.target.value;this.configChanged(); this.updatePreview();}
    if(genderSelect) genderSelect.onchange=e=>{this._config[this.currentTab].gender=e.target.value;this.configChanged(); this.updatePreview();}
    if(imageInput) imageInput.oninput=e=>{this._config[this.currentTab].image=e.target.value;this.configChanged(); this.updatePreview();}

    const addBtn=this.querySelector(".btn-add");
    if(addBtn) addBtn.onclick=()=>{
      this._config[this.currentTab].sensors.push({entity:'',name:'',icon:'📊',color:'#2196f3',x:50,y:50});
      this.configChanged(); this.render();
    };

    this.querySelectorAll(".btn-remove").forEach(btn=>{
      btn.onclick=()=>{const i=parseInt(btn.dataset.index);this._config[this.currentTab].sensors.splice(i,1);this.configChanged();this.render();}
    });

    const updateField=(selector,field,renderPreview=true)=>{
      this.querySelectorAll(selector).forEach(input=>{
        input.oninput=e=>{
          const i=parseInt(e.target.dataset.index);
          this._config[this.currentTab].sensors[i][field]=field==='color'?e.target.value: (field==='x'||field==='y'?parseFloat(e.target.value):e.target.value);
          if(field==='color'){const v=e.target.parentElement.querySelector('.color-value'); if(v)v.textContent=e.target.value;}
          this.configChanged();
          if(renderPreview)this.updatePreview();
        };
      });
    };

    updateField(".sensor-entity",'entity',false);
    updateField(".sensor-name",'name');
    updateField(".sensor-icon",'icon');
    updateField(".sensor-color",'color');
    updateField(".sensor-x",'x');
    updateField(".sensor-y",'y');
  }

  updatePreview(){
    const person=this._config[this.currentTab];
    const container=this.querySelector("#preview-container");
    if(!container) return;
    const defaultImage = person.gender==='female'?'/local/health-dashboard/female-silhouette.png':'/local/health-dashboard/male-silhouette.png';
    const imageUrl = person.image||defaultImage;

    container.innerHTML=`
      <div class="preview-bg" style="background-image:url('${imageUrl}')"></div>
      ${(person.sensors||[]).map((s,i)=>`
        <div class="preview-sensor" style="left:${s.x||50}%;top:${s.y||50}%;background:${s.color||'#2196f3'}">
          <div class="preview-sensor-icon">${s.icon||'📊'}</div>
          <div class="preview-sensor-name">${s.name||('Capteur '+(i+1))}</div>
          <div class="preview-sensor-xy">X: ${Math.round(s.x||50)}% Y: ${Math.round(s.y||50)}%</div>
        </div>
      `).join('')}
    `;
  }
}

// ========================
// Enregistrement
// ========================

customElements.define("health-dashboard-card",HealthDashboardCard);
customElements.define("health-dashboard-card-editor",HealthDashboardCardEditor);

window.customCards = window.customCards||[];
window.customCards.push({
  type:"health-dashboard-card",
  name:"Health Dashboard Card",
  description:"Carte de suivi santé avec positionnement et prévisualisation",
  preview:true
});

console.info("%c HEALTH-DASHBOARD-CARD %c v3.2 ","color:white;background:#667eea;font-weight:bold;","color:#667eea;background:white;font-weight:bold;");
