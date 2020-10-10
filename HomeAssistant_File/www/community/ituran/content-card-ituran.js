class ContentCardIturan extends HTMLElement {
  constructor() {
    super();  
    this.constMap = undefined;
    this.lastRefresh = 0;
  }
    
  
  set hass(hass) {
      
    if(new Date().getTime() - this.lastRefresh < 1000*120){
        return;
    }
      
    if (!this.content) {
      const card = document.createElement('ha-card');
      card.header = 'Ituran';
      this.content = document.createElement('div');
      this.content.style.padding = '0 16px 16px';
      card.appendChild(this.content);
      this.appendChild(card);
    }

    const entityId = this.config.entity;
    const state = hass.states[entityId];
    const stateStr = state ? state.state : 'unavailable';
    const attr = state.attributes
    this.carName = attr.friendly_name;
    this.location = attr.address;
    this.plate = attr.plate;
    this.map = attr.google_embedded;
    this.lastRefresh = new Date().getTime();
    this.milage = attr.milage;
    

    this.content.innerHTML = `
      Car: ${this.carName}
      <br><br>
      Location: ${this.location}
      <br><br>
      Plate: ${this.plate}
      <br><br>
      Milage: ${this.milage}
      <br><br>
      <iframe src="${this.map}" width="460" height="500"></ iframe>
      <br><br>
      
    `;
  }

  setConfig(config) {
    if (!config.entity) {
      throw new Error('You need to define an entity');
    }
    this.config = config;
  }

  // The height of your card. Home Assistant uses this to automatically
  // distribute all cards over the available columns.
  getCardSize() {
    return 7;
  }
}

customElements.define('content-card-ituran', ContentCardIturan);
