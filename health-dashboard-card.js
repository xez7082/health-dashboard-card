// HEALTH DASHBOARD CARD – VERSION STABLE V3

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
      person1: { name: "Homme", gender: "male", image: "/local/health-dashboard/male.png", sensors: [] },
      person2: { name: "Femme", gender: "female", image: "/local/health-dashboard/female.png", sensors: [] }
    };
  }

  setConfig(config) {
    if (!config.person1 || !config.person2) {
      throw new Error("Configuration invalide : person1 et person2 requis");
    }

    this._config = config;
    if(!this._config.person1.sensors) this._config.person1.sensors = [];
    if(!this._config.person2.sensors) this._config.person2.sensors = [];

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
    person.sensors.forEach((s, i) => {
      const el = this.shadowRoot.querySelector(`#value-${i}`);
      if (!el) return;
      const state = this._hass.states[s.entity];
      el.textContent = state ? `${state.state} ${state.attributes.unit_of_measurement || ''}`.trim() : 'N/A';
    });
  }

  getContrastColor(hex) {
    const c = hex.replace('#', '');
    const r = parseInt(c.substr(0,2),16), g = parseInt(c.substr(2,2),16), b = parseInt(c.substr(4,2),16);
    return (r*299+g*587+b*114)/1000 > 155 ? '#333' : '#fff';
  }

  render() {
    if (!this._config) return;
    const person = this._config[this.currentPerson];
    const defaultImage = person.gender==='female'?'/local/health-dashboard/female.png':'/local/health-dashboard/male.png';
    const imageUrl = person.image || defaultImage;

    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;}
        .card{position:relative;width:100%;height:650px;border-radius:20px;overflow:hidden;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);}
        .bg{position:absolute;inset:0;background-image:url('${imageUrl}');background-size:contain;background-position:center;background-repeat:no-repeat;opacity:0.4;pointer-events:none;}
        .topbar{position:absolute;top:16px;right:16px;display:flex;gap:12px;z-index:10;}
        .btn-person{border:none;padding:12px 24px;border-radius:25px;cursor:pointer;color:white;font-weight:bold;transition:all 0.3s;box-shadow:0 4px 6px rgba(0,0,0,0.1);}
        .male{background:linear-gradient(135deg,#2196f3,#1976d2);}
        .female{background:linear-gradient(135deg,#e91e63,#c2185b);}
        .active{outline:3px solid white;outline-offset:2px;}
        .person-name{position:absolute;top:80px;left:50%;transform:translateX(-50%);font-size:32px;font-weight:bold;color:white;text-shadow:2px2px8px rgba(0,0,0,0.5);z-index:5;}
        .sensor{position:absolute;transform:translate(-50%,-50%);border-radius:12px;padding:12px 16px;cursor:move;min-width:120px;text-align:center;z-index:8;transition:all 0.3s;}
        .sensor:hover{transform:translate(-50%,-50%) scale(1.05);box-shadow:0 6px 16px rgba(0,0,0,0.3);}
        .sensor-icon{font-size:28px;margin-bottom:4px;}
        .sensor-name{font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:4px;}
        .sensor-value{font-size:18px;font-weight:bold;color:white;}
      </style>
      <div class="card">
        <div class="bg"></div>
        <div class="topbar">
          <button id="p1" class="btn-person male ${this.currentPerson==='person1'?'active':''}">${this._config.person1.name}</button>
          <button id="p2" class="btn-person female ${this.currentPerson==='person2'?'active':''}">${this._config.person2.name}</button>
        </div>
        <div class="person-name">${person.name}</div>
        ${(person.sensors||[]).map((s,i)=>`<div class="sensor" id="sensor-${i}" style="left:${s.x||50}%;top:${s.y||50}%;background:${s.color||'#2196f3'}">
          <div class="sensor-icon">${s.icon||'📊'}</div>
          <div class="sensor-name" style="color:${this.getContrastColor(s.color||'#2196f3')};">${s.name||s.entity}</div>
          <div class="sensor-value" id="value-${i}">--</div>
        </div>`).join('')}
      </div>
    `;

    this.shadowRoot.getElementById("p1").onclick=()=>{this.currentPerson='person1';this.render();};
    this.shadowRoot.getElementById("p2").onclick=()=>{this.currentPerson='person2';this.render();};

    this.enableDrag();
    this.updateSensors();
  }

  enableDrag() {
    const person = this._config[this.currentPerson];
    person.sensors.forEach((s,i)=>{
      const el = this.shadowRoot.getElementById(`sensor-${i}`);
      if(!el) return;
      el.onmousedown=(e)=>{
        e.preventDefault(); el.style.cursor='grabbing';
        const move=(ev)=>{
          const rect=this.shadowRoot.querySelector('.card').getBoundingClientRect();
          s.x=Math.max(5,Math.min(95,(ev.clientX-rect.left)/rect.width*100));
          s.y=Math.max(5,Math.min(95,(ev.clientY-rect.top)/rect.height*100));
          el.style.left=s.x+'%'; el.style.top=s.y+'%';
        };
        const up=()=>{el.style.cursor='move';window.removeEventListener('mousemove',move);window.removeEventListener('mouseup',up);
          this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));
        };
        window.addEventListener('mousemove',move);
        window.addEventListener('mouseup',up);
      };
    });
  }
}

class HealthDashboardCardEditor extends HTMLElement {
  constructor(){super();this._config=null;this._hass=null;this.currentTab='person1';}
  set hass(h){this._hass=h;}
  setConfig(c){this._config={person1:c.person1||{name:'Homme',gender:'male',image:'',sensors:[]},person2:c.person2||{name:'Femme',gender:'female',image:'',sensors:[]}};this.render();}
  configChanged(){this.dispatchEvent(new CustomEvent('config-changed',{detail:{config:this._config},bubbles:true,composed:true}));}
  render(){
    if(!this._config) return;
    const person=this._config[this.currentTab];
    this.innerHTML=`<div class="editor">
      <div class="field"><label>Prénom</label><input type="text" class="input-name" value="${person.name||''}"></div>
      <div class="field"><label>Genre</label><select class="select-gender"><option value="male" ${person.gender==='male'?'selected':''}>Homme</option><option value="female" ${person.gender==='female'?'selected':''}>Femme</option></select></div>
      <div class="field"><label>Image</label><input type="text" class="input-image" value="${person.image||''}"></div>
      <div class="sensor-list">${(person.sensors||[]).map((s,i)=>`<div class="sensor-item" data-index="${i}"><label>Nom</label><input class="sensor-name" data-index="${i}" value="${s.name||''}"><label>Icône</label><input class="sensor-icon" data-index="${i}" value="${s.icon||''}"><label>Couleur</label><input type="color" class="sensor-color" data-index="${i}" value="${s.color||'#2196f3'}"><label>X %</label><input type="number" class="sensor-x" data-index="${i}" value="${s.x||50}"><label>Y %</label><input type="number" class="sensor-y" data-index="${i}" value="${s.y||50}"></div>`).join('')}</div>
      <button class="btn-add">Ajouter Capteur</button>
    </div>`;
    this.attachListeners();
  }
  attachListeners(){
    this.querySelector('.input-name')?.addEventListener('input',e=>{this._config[this.currentTab].name=e.target.value;this.configChanged();});
    this.querySelector('.select-gender')?.addEventListener('change',e=>{this._config[this.currentTab].gender=e.target.value;this.configChanged();});
    this.querySelector('.input-image')?.addEventListener('input',e=>{this._config[this.currentTab].image=e.target.value;this.configChanged();});
    this.querySelector('.btn-add')?.addEventListener('click',()=>{this._config[this.currentTab].sensors.push({name:'',icon:'📊',color:'#2196f3',x:50,y:50});this.configChanged();this.render();});
    this.querySelectorAll('.sensor-name').forEach(i=>i.addEventListener('input',e=>{this._config[this.currentTab].sensors[parseInt(e.target.dataset.index)].name=e.target.value;this.configChanged();}));
    this.querySelectorAll('.sensor-icon').forEach(i=>i.addEventListener('input',e=>{this._config[this.currentTab].sensors[parseInt(e.target.dataset.index)].icon=e.target.value;this.configChanged();}));
    this.querySelectorAll('.sensor-color').forEach(i=>i.addEventListener('input',e=>{this._config[this.currentTab].sensors[parseInt(e.target.dataset.index)].color=e.target.value;this.configChanged();}));
    this.querySelectorAll('.sensor-x').forEach(i=>i.addEventListener('input',e=>{this._config[this.currentTab].sensors[parseInt(e.target.dataset.index)].x=parseFloat(e.target.value);this.configChanged();}));
    this.querySelectorAll('.sensor-y').forEach(i=>i.addEventListener('input',e=>{this._config[this.currentTab].sensors[parseInt(e.target.dataset.index)].y=parseFloat(e.target.value);this.configChanged();}));
  }
}

customElements.define("health-dashboard-card",HealthDashboardCard);
customElements.define("health-dashboard-card-editor",HealthDashboardCardEditor);
window.customCards=window.customCards||[];
window.customCards.push({type:"health-dashboard-card",name:"Health Dashboard Card",description:"Carte santé avec positionnement et preview",preview:true});
