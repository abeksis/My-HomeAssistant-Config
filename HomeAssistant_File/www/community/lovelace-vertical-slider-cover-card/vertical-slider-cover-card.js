/*
 * Author        : duytruong
 * Github        : https://github.com/konnectedvn
 * Description   : 
 * Date          : 01 Feb 2021 08:44:30+07:00
 * Based on      : github.com/DBuit/hass-smart-home-panel-card (Thanks to DBuit!)
 */
console.info("%c [konnected.vn] Vertical Slider Cover Card  \n%c Version v0.1.5","color: red; font-weight: bold; background: black", "color: white; font-weight: bold; background: dimgray");
import {
    LitElement,
    html,
    css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";
class VerticalSliderCoverCard extends LitElement {
  
  static get properties() {
    return {
      hass: {},
      config: {},
      active: {},
      sliderVal: { type: Array }
    };
  }
  
  constructor() {
    super();
    this.sliderVal = [];
  }
  
  render() {
    var primaryTextColor = "var(--primary-text-color)";
    var icon = this.config.icon ? this.config.icon : "mdi:blinds";
    var iconSize = this.config.iconSize ? this.config.iconSize: "28px";
    var iconColor = this.config.iconColor ? this.config.iconColor : primaryTextColor;

    var positionWidth = this.config.positionWidth ? this.config.positionWidth : "100px";
    var positionHeight = this.config.positionHeight ? this.config.positionHeight : "300px";
    var showName = this.config.showName ? this.config.showName : true;
    var showPosition = this.config.showPosition ? this.config.showPosition : true;
    var switchWidth = this.config.switchWidth ? this.config.switchWidth : positionWidth;
    var switchHeight = this.config.switchHeight ? this.config.switchHeight : switchWidth;
    var showSwitch = this.config.showSwitch;
    var switchFontColor = this.config.switchFontColor ? this.config.switchFontColor : primaryTextColor;
    var gapWidth = this.config.gapWidth ? this.config.gapWidth : "50px";
    
    var countText = this.config.countText ? this.config.countText : "covers open";
    var countTextFontColor = this.config.countTextFontColor ? this.config.countTextFontColor : primaryTextColor;
    var openBaseline = this.config.closedBaseline ? this.config.closedBaseline : 0;
    var entityCounter = 0;
    
    var showButton = this.config.showButton ? this.config.showButton : false;
    var buttonText = this.config.buttonText ? this.config.buttonText : "Home";
    var buttonPath = this.config.buttonPath ? this.config.buttonPath : "/lovelace/0";
    var buttonService = this.config.buttonService ? this.config.buttonService: "";
    var buttonData = this.config.buttonData ? this.config.buttonData : "";
    var buttonFontColor = this.config.buttonFontColor ? this.config.buttonFontColor : primaryTextColor;
    
    var background = this.config.background ? this.config.background : "transparent";
    var sideColor1 = this.config.sideColor1 ? this.config.sideColor1 : "#ffcccc";
    var sideColor2 = this.config.sideColor2 ? this.config.sideColor2 : '#b30000';
    var switchColor = this.config.switchColor ? this.config.switchColor : sideColor2;
    var closedColor = this.config.closedColor ? this.config.closedColor : "hsl(0, 0%, 20%)";
    var openColor = this.config.openColor ? this.config.openColor : "hsl(0, 0%, 90%, 0.6)";
    var panelType = this.config.panelType;
    var showSidebar = this.config.showSidebar;
    var titleSize = this.config.titleSize ? this.config.titleSize : "40px";
    var titleFontColor = this.config.titleFontColor ? this.config.titleFontColor : primaryTextColor;
    
    return html`
        <ha-card>
        <div class="page" style="background:${background};">
        
          <div class="side" style="${this._panelSize(panelType)};--show-sidebar:${this._showFlex(showSidebar)};--sideColor-1:${sideColor1};--sideColor-2:${sideColor2};">
            <div class="header">
              
            </div>
            <div class="center">
              <div class="icon">
                <ha-icon style="--mdc-icon-size:${iconSize};--icon-color:${iconColor};" icon="${icon}" />
              </div>
              <h1 style="--title-size:${titleSize};--title-font-color:${titleFontColor};">${this.config.title}</h1>
              <h3 style="--count-font-color:${countTextFontColor};">${this._stateCount(openBaseline)} ${countText}</h3>
            </div>
            <div class="bottom">
                ${showButton ? html`<button class="back-btn" style="--button-size:${this._buttonFont(titleSize,buttonText)}px;--button-font-color:${buttonFontColor};" @click=${e => this._navigate(buttonPath,buttonService,buttonData)}>${buttonText}</button>` : html``}
            </div>
          </div>
          
          <div class="main">
            <div class="inner-main">
            ${this.config.entities.map(ent => {
            	entityCounter++;
                var switchValue = 0;
                const stateObj = this.hass.states[ent.entity];
                switch(stateObj.state) {
                    case 'open':
                        switchValue = 100;
                        break;
                    case 'closed':
                        switchValue = 0;
                        break;
                    default:
                        switchValue = 0;
                }
                return stateObj ? html`
                    <div class="cover" style="--cover-width:${this._coverSize(positionWidth,gapWidth,panelType)};--center-slider:${this._centerSliders(panelType)};">
                      <div class="cover-slider">
                        <p class="cover-name" style="--show-name: ${this._showBlock(showName)};--cover-fontSize: ${this._coverNameFont(positionWidth,gapWidth)}px;">${ent.name || stateObj.attributes.friendly_name}</p>
                        ${stateObj.attributes.supported_features > 6 ? html`
                            <p class="cover-position" style="--show-position: ${this._showBlock(showPosition)};--cover-fontSize: ${parseInt(positionWidth.replace(/px/,"")) / 4 - (parseInt(positionWidth.replace(/px/,"")) - 60) / 4}px;">${this._coverPosition(stateObj.state, stateObj.attributes.current_position, stateObj.entity_id)}</p>
                            <div class="range-holder" style="--slider-height: ${positionHeight};--closed-color: ${closedColor};">
                              <input type="range" class="${stateObj.state}" style="--slider-width: ${positionWidth};--slider-height: ${positionHeight};--closed-color: ${closedColor};--open-color: ${openColor};" .value="${stateObj.state === "closed" ? 0 : Math.round(stateObj.attributes.current_position)}" @input=${e => this._sliderChange(e.target.value, stateObj.entity_id)}} @change=${e => this._setPosition(stateObj.entity_id, e.target.value, ent.script)}>
                            </div>
                        ` : html`
                            <h4>${stateObj.state}</h4>
                            <div class="switch-holder" style="--switch-height: ${switchHeight};">
                              <input type="range" class="${stateObj.state}" style="--switch-width: ${switchWidth};--switch-height: ${switchHeight};" value="0" min="0" max="1" .value="${switchValue}" @change=${e => this._switch(stateObj)}>
                            </div>
                        `}
                        <div class="toggle" style="--show-switch: ${this._showFlex(showSwitch)};">
                            <input ?checked=${stateObj.state == "open"} type="checkbox" id="toggle${entityCounter}" class="toggle-btn" @change=${e => this._switch(stateObj)} />
                            <label for="toggle${entityCounter}" style="--switch-width: ${switchWidth};--switch-height: ${switchHeight};--switch-font-color: ${switchFontColor};--switch-color: ${switchColor};--switch-labelSize: ${parseInt(switchWidth.replace(/px/,"")) / 5}px;"><span></span></label>
                        </div>
                      </div>
                    </div>
                `: html``;
            })}
            </div>
          </div>
        </div>
        </ha-card>
    `;
  }
  
  updated() {}
  
  _sliderChange(value, entity_id){
    this.sliderVal[entity_id] = {val: value, active: true};
    this.requestUpdate();
  }
  
  _coverPosition(coverState, coverPos, entity_id){
  	  if (coverState === "closed") {
      		return '0';
      } else if (typeof this.sliderVal[entity_id] === 'undefined' || !this.sliderVal[entity_id]['active']) {
        	return Math.round(coverPos);
	  } else {
	  	    return this.sliderVal[entity_id]['val'];
	  }
  }
  
  _setPosition(entity_id, value, script) {
  	  if (this.hass.states[entity_id].attributes.current_position === value) {
  	  	  return;
  	  }
      this.hass.callService("cover", "set_cover_position", {
          entity_id: entity_id,
          position: value
      });
      this.sliderVal[entity_id]['active'] = false;
      if (script) {
        this.hass.callService("script", "turn_on", {
    		entity_id: script
        });
      }
  }
  
  _stateCount(baseline) {
      let count = 0;
      this.config.entities.map(ent => {
          const stateObj = this.hass.states[ent.entity];
          if(stateObj.state === "open" && baseline === 0) {
              count++;
          } else if (stateObj.attributes.current_position >= baseline && baseline > 0) {
              count++;
          }
      })
      return count;
  }
  
  _panelSize(panelType) {
    let sideWidth = 40;
    if (panelType === true) {
	  sideWidth = 30;
    }
  	return "--side-width:" + sideWidth + "px";
  }
  
  _showFlex(showSidebar) {
    if (showSidebar === false) {
      return "none";
    }
    return "flex";
  }

  _showBlock(confValue) {
      if(confValue === false) {
          return "none";
      }
      return "block";
  }

  _coverSize(positionWidth, gapWidth, panelType) {
    if (panelType === false) {
      return (parseInt(positionWidth.replace(/px/,"")) + parseInt(gapWidth.replace(/px/,""))) + "px";
    } else {
      return "50%";
    }
  }
  
  _buttonFont(titleSize,buttonText) {
    let fieldSize = parseInt(titleSize.replace(/px/,"")) * this.config.title.length;
    let buttonSize = fieldSize / buttonText.length;
    return buttonSize * 0.5;
  }
  
  _centerSliders(panelType) {
    if (panelType === true) {
      return "0 auto";
    } else {
      return "0";
    }
  }
  
  _coverNameFont(positionWidth, gapWidth) {
    let maxLength = 0;
    this.config.entities.map(ent => {
          const stateObj = this.hass.states[ent.entity];
          let name = ent.name || stateObj.attributes.friendly_name;
          if(name.length > maxLength) {
              maxLength = name.length;
          }
      })
    let fontsize = parseInt(positionWidth.replace(/px/,""));
    if (parseInt(gapWidth.replace(/px/,"")) > 50) {
        fontsize = fontsize + (parseInt(gapWidth.replace(/px/,"")) / 2);
    } else {
        fontsize = fontsize + parseInt(gapWidth.replace(/px/,""));
    }
    return ((( fontsize - 4 ) / maxLength) * 1.8) | 0;
  }
  
  _switch(state) {
      this.hass.callService("cover", "stop_cover", {
        entity_id: state.entity_id    
      });
  }
  
  _navigate(path,service,data) {
    if (service.length === 0) {
      window.location.href = path;
    } else {
      let domain = service.split(".",2)[0];
      let ser = service.split(".",2)[1];
      this.hass.callService(domain,ser, {
        entity_id: data
      });
    }
  }
  
  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    if (!config.title) {
      throw new Error("You need to define a title");
    }
    for (var i = 0, len = config.entities.length; i < len; i++) {
      if (config.entities[i].entity === undefined) {
        throw new Error(config.entities[i] + " is INVALID! Should be object: - entity: " + config.entities[i] + ".");
      }
    }
    this.config = config;
  }
  getCardSize() {
    return this.config.entities.length + 1;
  }
  
  static get styles() {
    return css`
   		:host([is-panel]) ha-card {
      	  left: 50;
      	  top: 0;
          width: 100%;
          height: 100%;
          position: absolute;
        }
        ha-card {
      	  overflow: hidden;
      	  width: 100%;
      	  height: 100%;
      	  display: flex;
      	  justify-content: center;
    	}
        .page {
          width:100%;
          height:100%;
          display:flex;
          flex-direction: row;
        }
        .page > .side {
          padding: 10px;
          width: var(--side-width)%;
          display:var(--show-sidebar);
          flex-direction:column;
          background: rgb(28,122,226);
          background: linear-gradient(145deg, var(--sideColor-1) 0%, var(--sideColor-2) 90%);
          justify-content:space-between;
        }
        .side .header {
        }
        .side .center {
          display:flex;
          flex-direction:column;
        }
        .side .center .icon {
          display:block;
          overflow:hidden;
          text-align:center;
        }
        .side .center .icon ha-icon {
          color:var(--icon-color);
        }
        .side .center  h1 {
          color:var(--title-font-color);
          margin:10px 0 0 5px;
          font-weight:400;
          font-size: var(--title-size);
          line-height: var(--title-size);
          text-align: center;
        }
        .side .center  h3 {
          color:var(--count-font-color);
          margin:5px 0 5px 0;
          font-size: 120%;
          font-weight: 400;
          line-height: 100%;
          text-align: center;
        }
        
        .side .bottom {
        }
        
        .back-btn {
          border:2px solid var(--button-font-color);
          color:var(--button-font-color);
          background:transparent;
          font-size:var(--button-size);
          border-radius: 4px;
          width:100%;
          display:block;
          padding: 10px 0;
        }
        
        .page > .main {
          width:100%;
          overflow-x:scroll;
          padding-bottom: 0px;
          -ms-overflow-style: none;  /* IE and Edge */
  		  scrollbar-width: none;  /* Firefox */
         }
        .page > .main::-webkit-scrollbar {
  		  display: none;
		}
        .page > .main > .inner-main {
          display:flex;
          flex-direction:row;
          align-items:center;
          height:100%;
          margin: auto;
          padding-right: 0px;
        }
        .page > .main > .inner-main > .cover {
          width: var(--cover-width);
          display:inline-block;
          margin: var(--center-slider);
          padding-bottom: 0px;
        }
        
        .cover .icon {
          margin: 0 auto;
          text-align:center;
          display:block;
          height: 50px;
          width: 50px;
          color: rgba(255,255,255,0.3);
          font-size: 30px;
          padding-top:5px;
        }
        .cover .icon ha-icon {
          width: 30px;
          height: 30px;
          text-align:center;
        }
        .cover .icon.on ha-icon {
          fill: #f7d959;
        }
        h2 {
          color: #FFF;
          display: block;
          font-weight: 300;
          margin-bottom: 10px;
          text-align: center;
          font-size:20px;
          margin-top:0;
        }
        
        h3 {
          color: #FFF;
          display: block;
          font-weight: 300;
          margin-top: 5px;
          margin-bottom: 5px;
          text-align: center;
          font-size:18px;
        }
        
        .cover-name {
          display: var(--show-name);
          font-weight: 300;
          margin-top: calc(var(--cover-fontSize) / 3);
          margin-bottom: calc(var(--cover-fontSize) / 2);
          text-align: center;
          font-size: var(--cover-fontSize);
        }
        .cover-position {
          display: var(--show-position);
          font-weight: 300;
          margin-top: calc(var(--cover-fontsize) / 2);
          margin-bottom: var(--cover-fontsize);
          text-align: center;
          font-size: var(--cover-fontSize);
        }
        .cover-slider .cover-name, .cover-position {
          color: var(--primary-text-color);
        }
        
        h4 {
          color: var(--primary-text-color);
          display: block;
          font-weight: 300;
          margin-bottom: 20px;
          text-align: center;
          font-size:16px;
          margin-top:0;
        }
        .cover-position:after {
          content: "%";
          padding-left: 1px;
        }
        
        .range-holder {
          height: var(--slider-height);
          position:relative;
          display: block;
        }
        .range-holder input[type="range"] {
          outline: 0;
          border: 0;
          border-radius: 4px;
          width: var(--slider-height);
          margin: 0;
          transition: box-shadow 0.2s ease-in-out;
          -webkit-transform:rotate(270deg);
          -moz-transform:rotate(270deg);
          -o-transform:rotate(270deg);
          -ms-transform:rotate(270deg);
          transform:rotate(270deg);
          overflow: hidden;
          height: var(--slider-width);
          -webkit-appearance: none;
          background-color: var(--closed-color);
          position: absolute;
          top: calc(50% - (var(--slider-width) / 2));
          right: calc(50% - (var(--slider-height) / 2));
        }
        .range-holder input[type="range"]::-webkit-slider-runnable-track {
          height: var(--slider-width);
          -webkit-appearance: none;
          color: var(--open-color);
          margin-top: 0px;
          transition: box-shadow 0.2s ease-in-out;
        }
        .range-holder input[type="range"]::-webkit-slider-thumb {
          width: calc((var(--slider-width) / 5) + 2px);
          border-right:8px solid var(--closed-color);
          border-left:8px solid var(--closed-color);
          border-top:20px solid var(--closed-color);
          border-bottom:20px solid var(--closed-color);
          -webkit-appearance: none;
          height: var(--slider-width);
          cursor: ew-resize;
          background: var(--closed-color);
          box-shadow: -350px 0 0 350px var(--open-color), inset 0 0 0 80px var(--open-color);
          border-radius: 0;
          transition: box-shadow 0.2s ease-in-out;
          position: relative;
          top: 0;
        }
        // .range-holder input[type="range"].on::-webkit-slider-thumb {
        //     border-color: #1c7ae2;
        //     box-shadow: -350px 0 0 350px #1c7ae2, inset 0 0 0 80px #FFF;
        // }
        
        .switch-holder {
          height: var(--switch-height);
          position:relative;
          display: block;
        }
        .switch-holder input[type="range"] {
          outline: 0;
          border: 0;
          border-radius: 4px;
          width: calc(var(--switch-height) - 20px);
          margin: 0;
          transition: box-shadow 0.2s ease-in-out;
          -webkit-transform: rotate(270deg);
          -moz-transform: rotate(270deg);
          -o-transform: rotate(270deg);
          -ms-transform: rotate(270deg);
          transform: rotate(270deg);
          overflow: hidden;
          height: calc(var(--switch-width) - 20px);
          -webkit-appearance: none;
          background-color: var(--switch-color);
          color: var(--switch-font-color);
          padding: 10px;
          position: absolute;
          top: calc(50% - (var(--switch-width) / 2));
          right: calc(50% - (var(--switch-height) / 2));
        }
        .switch-holder input[type="range"]::-webkit-slider-runnable-track {
          height: calc(var(--switch-width) - 20px);
          -webkit-appearance: none;
          color: var(--switch-color);
          margin-top: -1px;
          transition: box-shadow 0.2s ease-in-out;
        }
        .switch-holder input[type="range"]::-webkit-slider-thumb {
          width: calc(var(--switch-height) / 2);
          -webkit-appearance: none;
          height: calc(var(--switch-width) - 20px);
          cursor: ew-resize;
          background: var(--switch-color);
          color: var(--switch-font-color);
          transition: box-shadow 0.2s ease-in-out;
          box-shadow: -340px 0 0 350px #4d4d4d, inset 0 0 0 80px #969696;
          position: relative;
          top: 0;
          border-radius: 4px;
        }
        // .switch-holder input[type="range"].on::-webkit-slider-thumb {
        //     box-shadow: -340px 0 0 350px #4d4d4d, inset 0 0 0 80px #1c7ae2;
        // }
        .toggle {
          margin-top: 20px;
          margin-bottom: 10px;
          display: var(--show-switch);
          align-items: center;
          justify-content: center;
        }
        .toggle > input.toggle-btn {
          display: none;
        }
        .toggle > input.toggle-btn + label {
          border: 1px solid #FFF;
          background: transparent;
          width: var(--switch-width);
          height: var(--switch-height);
          text-align:center;
          line-height: var(--switch-height);
          cursor: pointer;
          border-radius: 4px;
          color: var(--switch-font-color);
          display:block;
          font-size:var(--switch-labelSize);
        }
        .toggle > input.toggle-btn + label:active,
        .toggle > input.toggle-btn + label {
          background: var(--switch-color);
          border-color: var(--switch-color);
        }
        .toggle > input.toggle-btn + label> span:before {
          content: 'STOP';
        }
    `;
  }  
  
}
customElements.define('vertical-slider-cover-card', VerticalSliderCoverCard);