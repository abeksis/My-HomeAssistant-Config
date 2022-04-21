import {
  LitElement,
  html,
  css
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

class GalleryCard extends LitElement {
  static get properties() {
    return {
      _hass: {},
      config: {},
      resources: {},
      currentResourceIndex: {}
    };
  }

  render() {
    const menuAlignment = (this.config.menu_alignment || "responsive").toLowerCase();

    return html`
        ${this.errors == undefined ? html`` :
         this.errors.map((error) => {
          return html`<hui-warning>${error}</hui-warning>`
         })}
        <ha-card .header=${this.config.title} class="menu-${menuAlignment}">
          ${this.currentResourceIndex == undefined || !(this.config.show_reload ?? false) ?
            html`` : html`<ha-progress-button class="btn-reload" @click="${ev => this._loadResources(this._hass)}">Reload</ha-progress-button>` }
          <div class="resource-viewer" @touchstart="${ev => this._handleTouchStart(ev)}" @touchmove="${ev => this._handleTouchMove(ev)}" @keydown="${ev => this._keyNavigation(ev)}">
            <figure style="margin:5px;">
              ${
                this._currentResource().isHass ?
                html`<hui-image @click="${ev => this._popupCamera(ev)}"
                    .hass=${this._hass}
                    .cameraImage=${this._currentResource().name}
                    .cameraView=${"live"}
                  ></hui-image>` :
                this._isImageExtension(this._currentResource().extension) ?
                html`<img @click="${ev => this._popupImage(ev)}" src="${this._currentResource().url}"/>` :
                html`<video controls src="${this._currentResource().url}#t=0.1" @loadedmetadata="${ev => this._videoMetadataLoaded(ev)}" @canplay="${ev => this._startVideo(ev)}"></video>`
              }
              <figcaption>${this._currentResource().caption} 
                ${this._isImageExtension(this._currentResource().extension) ?
                  html`` : html`<span class="duration"></span>` }
              </figcaption>
            </figure>  
            <button class="btn btn-left" @click="${ev => this._selectResource(this.currentResourceIndex-1)}">&lt;</button> 
            <button class="btn btn-right" @click="${ev => this._selectResource(this.currentResourceIndex+1)}">&gt;</button> 
          </div>
          <div class="resource-menu">
            ${this.resources.map((resource, index) => {
                return html`
                    <figure style="margin:5px;" id="resource${index}" data-imageIndex="${index}" @click="${ev => this._selectResource(index)}" class="${(index == this.currentResourceIndex) ? 'selected' : ''}">
                    ${
                      resource.isHass ?
                      html`<hui-image
                          .hass=${this._hass}
                          .cameraImage=${resource.name}
                          .cameraView=${"live"}
                        ></hui-image>` :
                      this._isImageExtension(resource.extension) ?
                      html`<img class="lzy_img" src="/local/community/gallery-card/placeholder.jpg" data-src="${resource.url}"/>` :
					            html`<video preload="none" data-src="${resource.url}#t=0.1" @loadedmetadata="${ev => this._videoMetadataLoaded(ev)}" @canplay="${ev => this._downloadNextMenuVideo()}"></video>`
                    }
                    <figcaption>${resource.caption} <span class="duration"></span></figcaption>
                    </figure>
                `;
            })}
          </div>
          <div id="imageModal" class="modal">
            <img class="modal-content" id="popupImage">
            <div id="popupCaption"></div>
          </div>
        </ha-card>
    `;
  }

  updated(changedProperties) {
    const arr = this.shadowRoot.querySelectorAll('img.lzy_img')
    arr.forEach((v) => {
        this.imageObserver.observe(v);
    })
    const varr = this.shadowRoot.querySelectorAll('video.lzy_video')
    varr.forEach((v) => {
        this.imageObserver.observe(v);
    })
    // changedProperties.forEach((oldValue, propName) => {
    //   console.log(`${propName} changed. oldValue: ${oldValue}`);
    // });
    this._downloadNextMenuVideo();
  }

  _downloadNextMenuVideo() {
    //let v = this.shadowRoot.querySelector(".resource-menu figure video[preload='none']");
    let v = this.shadowRoot.querySelector(".resource-menu figure video[data-src]");
    
    if (v)
    {
      v.src = v.dataset.src;
      v.removeAttribute("data-src");
      v.load();
    }
  }

  setConfig(config) {
    this.imageObserver = new IntersectionObserver((entries, imgObserver) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const lazyImage = entry.target
                //console.log("lazy loading ", lazyImage)
                lazyImage.src = lazyImage.dataset.src
            }
        })
    });
    if (!config.entity && !config.entities) {
      throw new Error("Required configuration for entities is missing");
    }

    this.config = config;
    if (this.config.entity) {
      if (!this.config.entities) {
        this.config = { ...this.config, entities: [] };
      }
      this.config.entities.push(this.config.entity);
      delete this.config.entity;
    }

    if (this._hass !== undefined)
      this._loadResources(this._hass);

    this._doSlideShow(true);
  }

  set hass(hass) {
    this._hass = hass;
    
    if (this.resources == null)
      this._loadResources(this._hass);
  }

  static getConfigElement() {
    return document.createElement("gallery-card-editor");
  }

  getCardSize() {
    return 1;
  }

  _isImageExtension(ext) {
    return(ext.match(/(jpeg|jpg|gif|png|tiff|bmp)$/) != null);
  }

  _doSlideShow(firstTime) {
    if (!firstTime)
      this._selectResource(this.currentResourceIndex+1, true);

    if (this.config.slideshow_timer) {
      var time = parseInt(this.config.slideshow_timer);
      if (!isNaN(time) && time > 0) {
        setTimeout(() => {this._doSlideShow();}, (time * 1000));
      }
    }
  }

  _selectResource(idx, fromSlideshow) {
    this.autoPlayVideo = true;

    var nextResourceIdx = idx;

    if (idx < 0)
      nextResourceIdx = this.resources.length - 1;
    else if (idx >= this.resources.length)
      nextResourceIdx = 0;

    this.currentResourceIndex = nextResourceIdx;

    if (fromSlideshow && this.parentNode && this.parentNode.tagName && this.parentNode.tagName.toLowerCase() == "hui-card-preview") {
      return;
    }

    var elt = this.shadowRoot.querySelector("#resource" + this.currentResourceIndex);
    if (elt)
      elt.scrollIntoView({behavior: "smooth", block: "nearest", inline: "nearest"});
  }

  _getResource(index) {
    if (this.resources !== undefined && index !== undefined && this.resources.length > 0) {
      return this.resources[index];
    }
    else {
      return {
        url: "",
        name: "",
        extension: "jpg",
        caption: index === undefined ? "Loading resources..." : "No images or videos to display",
        index: 0
      };
    }
  }

  _currentResource() {
    return this._getResource(this.currentResourceIndex);
  }

  _startVideo(evt) {
  	if (this.autoPlayVideo)
  		evt.target.play();
  }

  _videoMetadataLoaded(evt) {
    evt.target.parentNode.querySelector(".duration").innerHTML = "[" + this._getFormattedVideoDuration(evt.target.duration) + "]";    
  }

  _popupCamera(evt) {
    const event = new Event("hass-more-info", {
      bubbles: true,
      composed: true
    });
    event.detail = {entityId: this._currentResource().name};
    this.dispatchEvent(event);
  }

  _popupImage(evt) {
    var modal = this.shadowRoot.getElementById("imageModal");
    var modalImg = this.shadowRoot.getElementById("popupImage");
    var captionText = this.shadowRoot.getElementById("popupCaption");

    modal.style.display = "block";
    modalImg.src = this._currentResource().url;
    captionText.innerHTML = this._currentResource().caption;

    modal.onclick = function() {
      modal.style.display = "none";
    }
  }

  _getFormattedVideoDuration(duration) {
  	var minutes = parseInt(duration / 60);
    if (minutes < 10)
      minutes = "0" + minutes;

    var seconds = parseInt(duration % 60);
    seconds = "0" + seconds;
    seconds = seconds.substring(seconds.length - 2);
    
    return minutes + ":" + seconds;    
  }  
  
  _keyNavigation(evt) {
    switch(evt.code) {
      case "ArrowDown":
      case "ArrowRight":
        this._selectResource(this.currentResourceIndex+1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        this._selectResource(this.currentResourceIndex-1);
        break;
      default:
        // null
    }
  }

  _handleTouchStart(evt) {                                         
      this.xDown = evt.touches[0].clientX;                                      
      this.yDown = evt.touches[0].clientY;                                      
  }; 
  
  _handleTouchMove(evt) {
      if ( ! this.xDown || ! this.yDown ) {
          return;
      }
      var xUp = evt.touches[0].clientX;                                    
      var yUp = evt.touches[0].clientY;
      var xDiff = this.xDown - xUp;
      var yDiff = this.yDown - yUp;
  
      if ( Math.abs( xDiff ) > Math.abs( yDiff ) ) {/*most significant*/
          if ( xDiff > 0 ) {
          /* left swipe */ 
          this._selectResource(this.currentResourceIndex+1);
          evt.preventDefault();
          } else {
          /* right swipe */
          this._selectResource(this.currentResourceIndex-1);
          evt.preventDefault();
          }                       
      } else {
          if ( yDiff > 0 ) {
          /* up swipe */ 
          } else { 
          /* down swipe */
          }                                                                 
      }
      /* reset values */
      this.xDown = null;
      this.yDown = null;                                            
  };

  _loadResources(hass) {
    var commands = [];

    this.currentResourceIndex = undefined;
    this.resources = [];

    const maximumFilesPerEntity = this.config.maximum_files_per_entity ?? true;
    const maximumFiles = maximumFilesPerEntity ? this.config.maximum_files : undefined;
    const maximumFilesTotal = maximumFilesPerEntity ? undefined: this.config.maximum_files;
    const fileNameFormat = this.config.file_name_format;
    const captionFormat = this.config.caption_format;
    const captionLeadingZeros = this.config.caption_leading_zeros ?? false;
    const parsedDateSort = this.config.parsed_date_sort ?? false;
    const reverseSort = this.config.reverse_sort ?? true;

    this.config.entities.forEach(entity => {
      var entityId;
      var recursive = false;
      if (typeof entity === 'object') {
        entityId = entity.path;
        if (entity.recursive)
          recursive = entity.recursive;
      }
      else {
        entityId = entity;
      }

      if (entityId.substring(0, 15).toLowerCase() == "media-source://") {
        commands.push(this._loadMediaResource(hass, entityId, maximumFiles, fileNameFormat, captionFormat, captionLeadingZeros, recursive, reverseSort));
      }
      else {
        var entityState = hass.states[entityId];

        if (entityState == undefined) {
          commands.push(Promise.resolve({
            error: true,
            entity: entityId,
            message: "Invalid Entity ID"
          }));
        }
        else {
          if (entityState.attributes.entity_picture != undefined)
            commands.push(this._loadCameraResource(entityId, entityState));

          //Custom Files component
          if (entityState.attributes.fileList != undefined)
            commands.push(this._loadFilesResources(entityState.attributes.fileList, maximumFiles, fileNameFormat, captionFormat, captionLeadingZeros, reverseSort));

          //HA Folder component
          if (entityState.attributes.file_list != undefined)
            commands.push(this._loadFilesResources(entityState.attributes.file_list, maximumFiles, fileNameFormat, captionFormat, captionLeadingZeros, reverseSort));
        }
      }
    });

    Promise.all(commands).then(resources => {
      this.resources = resources.filter(result => !result.error).flat(Infinity);

      if (parsedDateSort) {        
        if (reverseSort) {
          this.resources.sort(function (x, y) { return y.date - x.date; });
        }
        else {
          this.resources.sort(function (x, y) { return x.date - y.date; });
        }
      }

      if (maximumFilesTotal != undefined && !isNaN(maximumFilesTotal) && maximumFilesTotal < this.resources.length) {
        //Keep only N total, but make sure camera resources remain
        this.resources = this.resources.filter(function(resource) {
          if (resource.isHass)
            return true;
          else if (this.count < maximumFilesTotal) {
            this.count++;
            return true;
          }
          else {
            return false;
          }
        }, {count: resources.filter(resource => resource.isHass).length});
      }

      this.currentResourceIndex = 0; 
      if (!(this.parentNode && this.parentNode.tagName && this.parentNode.tagName.toLowerCase() == "hui-card-preview")) {
        //Give the UI a second to refresh before setting focus, so that keypresses work
        setTimeout(() => {this.shadowRoot.querySelector('.resource-viewer button').focus();}, 1000);
      }

      this.errors = [];
      resources.filter(result => result.error).flat(Infinity).forEach(error => {
        this.errors.push(error.message + ' ' + error.entity)
        this._hass.callService('system_log', 'write', {
          message: 'Gallery Card Error:  ' + error.message + '   ' + error.entity
        });
      });
    });
  }

  _loadMediaResource(hass, contentId, maximumFiles, fileNameFormat, captionFormat, captionLeadingZeros, recursive, reverseSort) {
    return this._loadMedia(this, hass, contentId, maximumFiles, recursive, reverseSort)
      .then(values => {
        var resources = [];

        values.forEach(mediaItem => {
            var resource = this._createFileResource(mediaItem.authenticated_path, fileNameFormat, captionFormat, captionLeadingZeros);

            if (resource !== undefined) {
              resources.push(resource);
            }
          }
        );

        return resources;
      })
      .catch(function(e) {
        return {
          error: true,
          entity: contentId,
          message: e.message
        };
      });
  }

  _loadMedia(ref, hass, contentId, maximumFiles, recursive, reverseSort) {
    var mediaItem = {
      media_class: "directory",
      media_content_id: contentId
    };

    if (contentId.substring(contentId.length - 1, contentId.length) != "/" && contentId != "media-source://media_source") {
      mediaItem.media_content_id += "/";
    }

    return Promise.all(this._fetchMedia(ref, hass, mediaItem, recursive))
      .then(function(values) { 
        var mediaItems = values
          .flat(Infinity)
          .filter(function(item) {return item !== undefined})
          .sort(
            function (a, b) {
              if (a.title > b.title) {
                return 1;
              }
              if (a.title < b.title) {
                return -1;
              }
            return 0;
          });

        if (reverseSort)
          mediaItems.reverse();
          
        if (maximumFiles != undefined && !isNaN(maximumFiles) && maximumFiles < mediaItems.length) {
          mediaItems.length = maximumFiles;
        }        

        return Promise.all(mediaItems.map(function(mediaItem) {
          return ref._fetchMediaItem(hass, mediaItem.media_content_id)
            .then(function(auth) {
              return {
                ...mediaItem,
                authenticated_path: auth.url 
              };
            });
        }));
      });
  }

  _fetchMedia(ref, hass, mediaItem, recursive) {
    var commands = [];

    if (mediaItem.media_class == "directory") {
      if (mediaItem.children) {
        commands.push(
          ...mediaItem.children
          .filter(mediaItem => { 
            return (mediaItem.media_class == "video" || mediaItem.media_class == "image" || (recursive && mediaItem.media_class == "directory")) && mediaItem.title != "@eaDir/";
          })
          .map(mediaItem => {
            return Promise.all(ref._fetchMedia(ref, hass, mediaItem, recursive));
          }));
      }
      else {
        commands.push(
          ref._fetchMediaContents(hass, mediaItem.media_content_id)
          .then(mediaItem => {
            return Promise.all(ref._fetchMedia(ref, hass, mediaItem, recursive));
          })
        );
      }
    }

    if (mediaItem.media_class != "directory") {
      commands.push(Promise.resolve(mediaItem));
    }

    return commands;
  }

  _fetchMediaContents(hass, contentId) {
    return hass.callWS({
      type: "media_source/browse_media",
      media_content_id: contentId
    })
  }

  _fetchMediaItem(hass, mediaItemPath) {
    return hass.callWS({
      type: "media_source/resolve_media",
      media_content_id: mediaItemPath,
      expires: (60 * 60 * 3)  //3 hours
    })
  }

  _loadCameraResource(entityId, camera) {
    var resource = {
      url: camera.attributes.entity_picture,
      name: entityId,
      extension: "jpg",
      caption: camera.attributes.friendly_name ?? entityId,
      isHass: true
    }
  
    return Promise.resolve(resource);
  }

  _loadFilesResources(files, maximumFiles, fileNameFormat, captionFormat, captionLeadingZeros, reverseSort) {
    var resources = [];
    if (files) {
      files = files.filter(file => file.indexOf("@eaDir") < 0);

      if (reverseSort)
        files.reverse();

      if (maximumFiles != undefined && !isNaN(maximumFiles) && maximumFiles < files.length) {
        files.length = maximumFiles;
      }

      files.forEach(file => {
        var filePath = file;
        // /config/downloads/front_door/
        // /config/www/...
        var fileUrl = filePath.replace("/config/www/", "/local/");
        if (filePath.indexOf("/config/www/") < 0)
          fileUrl = "/local/" + filePath.substring(filePath.indexOf("/www/")+5);

        var resource = this._createFileResource(fileUrl, fileNameFormat, captionFormat, captionLeadingZeros);
        
        if (resource !== undefined) {
          resources.push(resource);
        }
      });
    }

    return Promise.resolve(resources);
  }

  _createFileResource(fileRawUrl, fileNameFormat, captionFormat, captionLeadingZeros) {
    var resource;

    var fileUrl = fileRawUrl.split("?")[0];
    var arfilePath = fileUrl.split("/");
    var fileName = arfilePath[arfilePath.length - 1];

    if (fileName != '@eaDir') {
      var arFileName = fileName.split(".");
      var ext = arFileName[arFileName.length - 1].toLowerCase();
      fileName = fileName.substring(0, fileName.length - ext.length - 1);
      fileName = decodeURIComponent(fileName);

      var fileCaption = "";
      var date = "";
      if (fileNameFormat === undefined || captionFormat === undefined)
          fileCaption = fileName;
      else {
        var tokens = ["%YYY", "%m", "%d", "%H", "%M", "%S", "%p"]
        fileCaption = captionFormat;

        var hr = 0;
        var year = 0;
        var month = 0;
        var day = 0;
        var hour = 0;
        var min = 0;
        var sec = 0;
        for (let token of tokens) {
          var searchIndex = fileNameFormat.indexOf(token);

          if (searchIndex >= 0) {
            var val = fileName.substring(searchIndex, searchIndex + token.length);
            if (token == "%YYY" ) year = parseInt(val);
            if (token == "%m" ) month = parseInt(val);
            if (token == "%d" ) day = parseInt(val);
            if (token == "%H" ) hour = parseInt(val);
            if (token == "%M" ) min = parseInt(val);
            if (token == "%S" ) sec = parseInt(val);
            if (token == "%H" && captionFormat.indexOf("%p") >= 0) {
              hr = parseInt(val);
              if (val == "00") val = 12;
              if (parseInt(val) > 12) val = parseInt(val) - 12;
              if (captionLeadingZeros)
                val = val.toString().padStart(2, '0');
            }
            if (!captionLeadingZeros && (token == "%m" || token == "%d" | token == "%H")) val = parseInt(val);
            fileCaption = fileCaption.replace(token, val);
          }
        }

        fileCaption = fileCaption.replace("%p", (hr > 11 ? "PM" : "AM"));
        
        if (year != 0 && month != 0 && day != 0) {
          date = new Date(year, month, day, hour, min, sec);
        }    
        
      }

      resource = {
        url: fileRawUrl,
        base_url: fileUrl,
        name: fileName,
        extension: ext,
        caption: fileCaption,
        index: -1,
        date: date
      };
    }

    return resource;
  }

  static get styles() {
    return css`
      .content {
        overflow: hidden;
      }
      .content hui-card-preview {
        max-width: 100%;
      }
      ha-card {
        height: 100%;
        overflow: hidden;
      }
      .btn-reload {
        float: right;
        margin-right: 25px;
        text-align: right;
      }
      figcaption {
        text-align:center;
        white-space: nowrap;
      }
      img, video {
        width: 100%;
        object-fit: contain;
      }
      .resource-viewer .btn {
        position: absolute;
        transform: translate(-50%, -50%);
        -ms-transform: translate(-50%, -50%);
        background-color: #555;
        color: white;
        font-size: 16px;
        padding: 12px 12px;
        border: none;
        cursor: pointer;
        border-radius: 5px;
        opacity: 0;
        transition: opacity .35s ease;
      }
      .resource-viewer:hover .btn {
        opacity: 1;
      }
      .resource-viewer .btn-left {
        left: 0%;
        margin-left: 25px;
      }
      .resource-viewer .btn-right {
        right: 0%;
        margin-right: -10px
      }
      figure.selected {
        opacity: 0.5;
      }
      .duration {
        font-style:italic;
      }
      @media all and (max-width: 599px) {
        .menu-responsive .resource-viewer {
          width: 100%;
        }
        .menu-responsive .resource-viewer .btn {
          top: 33%;
        }
        .menu-responsive .resource-menu {
          width:100%; 
          overflow-y: hidden;
          overflow-x: scroll;
          display: flex;
        }
        .menu-responsive .resource-menu figure {
          margin: 0px;
          padding: 12px;
        }
      }
      @media all and (min-width: 600px) {
        .menu-responsive .resource-viewer {
          float: left;
          width: 75%;
          position: relative;
        }
        .menu-responsive .resource-viewer .btn {
          top: 40%;
        }
                
        .menu-responsive .resource-menu {
          width:25%; 
          height: calc(100vh - 120px);
          overflow-y: scroll; 
          float: right;
        }
      }
      .menu-bottom .resource-viewer {
        width: 100%;
      }
      .menu-bottom .resource-viewer .btn {
        top: 33%;
      }
      .menu-bottom .resource-menu {
        width:100%; 
        overflow-y: hidden;
        overflow-x: scroll;
        display: flex;
      }
      .menu-bottom .resource-menu figure {
        margin: 0px;
        padding: 12px;
        width: 25%;
      }
      .menu-bottom .resource-viewer figure img,
      .menu-bottom .resource-viewer figure video {
        max-height: 70vh;
      }
      .menu-right .resource-viewer {
        float: left;
        width: 75%;
        position: relative;
      }
      .menu-right .resource-viewer .btn {
        top: 40%;
      }
              
      .menu-right .resource-menu {
        width:25%; 
        height: calc(100vh - 120px);
        overflow-y: scroll; 
        float: right;
      }
      .menu-left .resource-viewer {
        float: right;
        width: 75%;
        position: relative;
      }
      .menu-left .resource-viewer .btn {
        top: 40%;
      }
              
      .menu-left .resource-menu {
        width:25%; 
        height: calc(100vh - 120px);
        overflow-y: scroll; 
        float: left;
      }
      .menu-left .btn-reload {
        float: left;
        margin-left: 25px;
      }
      .menu-top {
        display: flex;
        flex-direction: column;
      }
      .menu-top .resource-viewer {
        width: 100%;
        order: 2
      }
      .menu-top .resource-viewer .btn {
        top: 45%;
      }
      .menu-top .resource-menu {
        width:100%; 
        overflow-y: hidden;
        overflow-x: scroll;
        display: flex;
        order: 1
      }
      .menu-top .resource-menu figure {
        margin: 0px;
        padding: 12px;
        width: 25%;
      }
      .menu-top .resource-viewer figure img,
      .menu-top .resource-viewer figure video {
        max-height: 70vh;
      }
      .menu-hidden .resource-viewer {
        width: 100%;
      }
      .menu-hidden .resource-viewer .btn {
        top: 33%;
      }
      .menu-hidden .resource-menu {
        width:100%; 
        overflow-y: hidden;
        overflow-x: scroll;
        display: none;
      }
      /* The Modal (background) */
      .modal {
        display: none; /* Hidden by default */
        position: fixed; /* Stay in place */
        z-index: 1; /* Sit on top */
        padding-top: 100px; /* Location of the box */
        left: 0;
        top: 0;
        width: 100%; /* Full width */
        height: 100%; /* Full height */
        overflow: auto; /* Enable scroll if needed */
        background-color: rgb(0,0,0); /* Fallback color */
        background-color: rgba(0,0,0,0.9); /* Black w/ opacity */
      }
      /* Modal Content (Image) */
      .modal-content {
        margin: auto;
        display: block;
        width: 80%;
        max-width: 700px;
      }
      /* Caption of Modal Image (Image Text) - Same Width as the Image */
      #popupCaption {
        margin: auto;
        display: block;
        width: 80%;
        max-width: 700px;
        text-align: center;
        color: #ccc;
        padding: 10px 0;
        height: 150px;
      }
      /* Add Animation - Zoom in the Modal */
      .modal-content, #popupCaption {
        animation-name: zoom;
        animation-duration: 0.6s;
      }
      @keyframes zoom {
        from {transform:scale(0)}
        to {transform:scale(1)}
      }
      /* 100% Image Width on Smaller Screens */
      @media only screen and (max-width: 700px){
        .modal-content {
          width: 100%;
        }
      }
    `;
  }
}
customElements.define("gallery-card", GalleryCard);

class GalleryCardEditor extends LitElement {
  static get properties() {
    return {
      _fileNameExample: {},
      _captionExample: {},
      _config: {},
      _mediaSourceEnabled: {},
      _addMediaOpened: {},
      _selectedMediaPath: {},
      _selectedMediaChildren: {}
    };
  }

  setConfig(config) {
    this._mediaSourceEnabled = (this.hass.config.components.indexOf("media_source") >= 0);
    if (this._mediaSourceEnabled)
      this._initMediaSelections();

    this._config = config;
    if (this._config.entity) {
      if (!this._config.entities) {
        this._config = { ...this._config, entities: [] };
      }
      this._config.entities.push(this._config.entity);
      delete this._config.entity;
    }

    this._fileNameExample =  "Your_File_Name";
    if (this._config.file_name_format && this._config.file_name_format != "") {
      this._fileNameExample = this.generateSampleText(this._config.file_name_format, true);
    }
    this._captionExample =  this._fileNameExample;
    if (this._config.file_name_format && this._config.file_name_format != ""
      && this._config.caption_format && this._config.caption_format != "") {
      this._captionExample = this.generateSampleText(this._config.caption_format, this._config.caption_leading_zeros);
    } 
  }

  configChanged(newConfig) {
    const event = new Event("config-changed", {
      bubbles: true,
      composed: true
    });
    event.detail = {config: newConfig};
    this.dispatchEvent(event);
  }

  get _title() {
    return this._config.title || "";
  }

  get _menuAlignment() {
    return this._config.menu_alignment || "Responsive";
  }

  get _entities() {
    return this._config.entities || [];
  }

  get _maximumFiles() {
    return this._config.maximum_files || "";
  }

  get _maximumFilesPerEntity() {
    return this._config.maximum_files_per_entity ?? true;
  }

  get _slideshowTimer() {
    return this._config.slideshow_timer || "";
  }

  get _fileNameFormat() {
    return this._config.file_name_format || "";
  }

  get _captionFormat() {
    return this._config.caption_format || "";
  }

  get _captionLeadingZeros() {
    return this._config.caption_leading_zeros || false;
  }

  get _parsedDateSort() {
    return this._config.parsed_date_sort ?? false;
  }

  get _reverseSort() {
    return this._config.reverse_sort ?? true;
  }  

  get _showReload() {
    return this._config.show_reload ?? false;
  }

  formatDate2Digits(str, zeroPad) {
    if (zeroPad) {
      var myString = "0" + str;
      return myString.slice(myString.length-2,myString.length);
    }
    else {
      return str;
    }
  }

  generateSampleText(formatString, zeroPad) {
    var d = new Date();
    var returnString = formatString;
    returnString = returnString.replace("%YYY", d.getFullYear());
    returnString = returnString.replace("%m", this.formatDate2Digits(d.getMonth() + 1, zeroPad));
    returnString = returnString.replace("%d", this.formatDate2Digits(d.getDate(), zeroPad));

    var hr = d.getHours();
    if (returnString.indexOf("%p") >= 0) {
      if (hr > 12)
        hr = hr - 12;
      if (hr == 0)
        hr = 12;
    }
    
    returnString = returnString.replace("%H", this.formatDate2Digits(hr, zeroPad));
    returnString = returnString.replace("%M", this.formatDate2Digits(d.getMinutes(), zeroPad));
    returnString = returnString.replace("%S", this.formatDate2Digits(d.getSeconds(), zeroPad));
    returnString = returnString.replace("%p", ((d.getHours()) > 11 ? "PM" : "AM"));

    return returnString;
  }

  render() {
    return html`
    <div class="card-config">
    ${this._addMediaOpened ?
      html`
        <mwc-dialog heading="Add a Media Source" id="addMediaDialog" open @closed="${this.closeAddMedia}" class="gallery-popup">
          <div>
            <paper-dropdown-menu style="flex-grow:1;">
              <paper-listbox selected="0" slot="dropdown-content" id="addMediaDD">
                <paper-item>${this._selectedMediaPath == "" ? "ALL MEDIA" : this._selectedMediaPath}</paper-item>
                ${this._selectedMediaChildren.map(directory => {
                  return html`<paper-item>${directory}</paper-item>`;
                })}
              </paper-listbox>
            </paper-dropdown-menu>
            <ha-icon-button @click="${this.browseDirectory}">
              <ha-icon icon="hass:folder-download"></ha-icon>
            </ha-icon-button>
            ${this._selectedMediaPath !== "" ? html`<ha-icon-button @click="${this.upDirectory}"><ha-icon icon="hass:folder-upload"></ha-icon></mwc-button>` : html``}
            </br>
            <ha-checkbox></ha-checkbox>Media in All Subdirectories<br/>
          </div>
          <mwc-button slot="primaryAction" dialogAction="ok" @click="${this.addMediaSource}">Add</mwc-button>
          <mwc-button slot="secondaryAction" dialogAction="cancel" @click="${this.closeAddMedia}">Cancel</mwc-button>
        </mwc-dialog>
        ` : html``
    }
    <div class="side-by-side">
      <div>
        <h4>${this.hass.localize(
          "ui.panel.lovelace.editor.card.generic.entities"
        )} (${this.hass.localize(
          "ui.panel.lovelace.editor.card.config.required"
        )})</h4>
        <div class="entity-list">
          ${this._entities.map((entity, index) => {
            var entityId;
            var recursive = false;
            if (typeof entity === 'object') {
              entityId = entity.path;
              if (entity.recursive)
                recursive = entity.recursive;
            }
            else {
              entityId = entity;
            }
            return html`
                <div style="display:flex; align-items: center;">
                  <ha-icon icon="hass:folder-image"></ha-icon>
                  <span style="flex-grow:1;">${entityId + (recursive ? ' (& subdirs)' : '')}</span>                  
                  <ha-icon-button .index="${index}" .moveDirection="${-1}" @click="${this._moveEntity}">
                    <ha-icon icon="hass:arrow-up"></ha-icon>
                  </ha-icon-button>
                  <ha-icon-button .index="${index}" .moveDirection="${1}" @click="${this._moveEntity}">
                    <ha-icon icon="hass:arrow-down"></ha-icon>
                  </ha-icon-button>
                  <ha-icon-button .index="${index}" @click="${this._deleteEntity}">
                    <ha-icon icon="hass:close"></ha-icon>
                  </ha-icon-button>
                </div>
            `;
          })} 
        </div>
        <div style="display:flex; align-items: center;">  
          <paper-dropdown-menu style="flex-grow:1;"
          @value-changed="${this._addEntity}">
            <paper-listbox slot="dropdown-content">
              ${Object.keys(this.hass.states).filter(entId => entId.startsWith('camera.') || this.hass.states[entId].attributes.fileList != undefined || this.hass.states[entId].attributes.file_list != undefined).sort().map(entId => html`
                    <paper-item>${entId}</paper-item>
                `)}
            </paper-listbox>
          </paper-dropdown-menu>
          ${this._mediaSourceEnabled ?
            html`<button @click="${this.showAddMedia}">Add Media Source</button>`
            : html``}
        </div>
      </div>
      <div>
        <paper-input
          .label="${this.hass.localize(
            "ui.panel.lovelace.editor.card.generic.title"
          )} (${this.hass.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value="${this._title}"
          .configValue="${"title"}"
          @value-changed="${this._valueChanged}"
        ></paper-input>
        <paper-dropdown-menu 
          .label="${"Alignment of Image/Video Menu"}
          (${this.hass.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value="${this._menuAlignment}" 
          .configValue="${"menu_alignment"}" 
          @value-changed="${this._valueChanged}" >
          <paper-listbox slot="dropdown-content">
            <paper-item>Responsive</paper-item>
            <paper-item>Left</paper-item>
            <paper-item>Right</paper-item>
            <paper-item>Top</paper-item>
            <paper-item>Bottom</paper-item>
            <paper-item>Hidden</paper-item>
          </paper-listbox>
        </paper-dropdown-menu><br/>
        <ha-checkbox
            .checked="${this._showReload}"
            .configValue = "${"show_reload"}"
            @click="${this._valueChanged}"
          ></ha-checkbox>Show Reload Button     
        <paper-input
          .label="${"Slideshow Time (seconds)"}
          (${this.hass.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value="${this._slideshowTimer}"
          .configValue="${"slideshow_timer"}"
          @value-changed="${this._valueChanged}"
        ></paper-input>          
        <paper-input
          .label="${"Maximum files"}
          (${this.hass.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value="${this._maximumFiles}"
          .configValue="${"maximum_files"}"
          @value-changed="${this._valueChanged}"
        ></paper-input>
        <ha-checkbox
            .checked="${this._maximumFilesPerEntity}"
            .configValue = "${"maximum_files_per_entity"}"
            @click="${this._valueChanged}"
          ></ha-checkbox>...per Entity<br/>
      </div>
    </div>
    <div class="side-by-side">
      <div class="instructions">
        Use the following placeholders to reformat the file name into the caption:
        <ul>
          <li>%YYY - A 4 digit year, e.g. 2019</li>
          <li>%m - The 2 digit month</li>
          <li>%d - The 2 digit day</li>
          <li>%H - The 2 digit hour</li>
          <li>%M - The 2 digit minute</li>
          <li>%S - The 2 digit seconds</li>
          <li>%p - 2 digits AM or PM (if included in caption_format, the output will be converted to 12 hour, if not the value will remain as the %H placeholder)</li>
        </ul>
      </div>
      <div>
        <paper-input
          .label="${"Format of File Names"}
          (${this.hass.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value="${this._fileNameFormat}"
          .configValue="${"file_name_format"}"
          @value-changed="${this._valueChanged}"
        ></paper-input>
        <div class="example">Your file names look like: ${this._fileNameExample}</div>        
        <paper-input
          .label="${"Format for Caption"}
          (${this.hass.localize(
            "ui.panel.lovelace.editor.card.config.optional"
          )})"
          .value="${this._captionFormat}"
          .configValue="${"caption_format"}"
          @value-changed="${this._valueChanged}"
        ></paper-input>
        <ha-checkbox
          .checked="${this._captionLeadingZeros}"
          .configValue = "${"caption_leading_zeros"}"
          @click="${this._valueChanged}"
        ></ha-checkbox>Include Leading Zeros in Caption
        <div class="example">Your captions will look like: ${this._captionExample}</div>
        <ha-checkbox
            .checked="${this._parsedDateSort}"
            .configValue = "${"parsed_date_sort"}"
            @click="${this._valueChanged}"
          ></ha-checkbox>Sort using Dates from Captions<br/>
        <ha-checkbox
            .checked="${this._reverseSort}"
            .configValue = "${"reverse_sort"}"
            @click="${this._valueChanged}"
          ></ha-checkbox>Reverse sort (newest first)<br/>
      </div>
    </div>
    `;
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }

    const target = ev.target;

    if (
      (target.configValue === "title" && target.value === this._title) 
    ) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        this._config = { ...this._config };
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? !target.checked : target.value,
        };
      }
    }

    this.configChanged(this._config);
  }

  _addEntity(ev) {
    if (ev.target.value) {
      var entities = Object.assign([], this._config.entities);
      entities.push(ev.target.value);

      this._config = {
        ...this._config,
        entities: entities
      };

      this.configChanged(this._config);
      ev.target.value = null;
    }
  }

  addMediaSource(ev) {
    var val = "media-source://media_source" + this._getSelectedValue(ev.target.parentNode.parentNode.parentNode);
    var checked = ev.target.parentNode.parentNode.querySelector("ha-checkbox").checked;

    var entities = Object.assign([], this._config.entities);
    entities.push({path: val, recursive: checked});

    this._config = {
      ...this._config,
      entities: entities
    };

    this.closeAddMedia();
    this.configChanged(this._config);  
  }

  showAddMedia() {
    this._addMediaOpened = true;
  }
  closeAddMedia() {
    this._addMediaOpened = false;
  }

  _fetchMediaContents() {    
    this.hass.callWS({
      type: "media_source/browse_media",
      media_content_id: "media-source://media_source" + this._selectedMediaPath
    }).then(mediaSource => {
      this._selectedMediaChildren = mediaSource.children
                                      .filter(function(item) {return item.media_class == "directory"})
                                      .map(mediaItem => {return mediaItem.media_content_id.replace("media-source://media_source", "");});
      if (this._addMediaOpened) {
        this.shadowRoot.querySelector(".card-config").querySelector("#addMediaDD").selected = undefined;
        this.shadowRoot.querySelector(".card-config").querySelector("#addMediaDD").selected = 0;
        
        this.shadowRoot.querySelector(".card-config").querySelector("paper-dropdown-menu").open();
      }
    });
  }

  _initMediaSelections() {
    this._addMediaOpened = false;

    this._selectedMediaPath = "";
    this._fetchMediaContents();  
  }

  browseDirectory(ev) {
    var ddVal = this._getSelectedValue(ev.target.parentNode.parentNode);

    if (ddVal != this._selectedMediaPath) {
      this._selectedMediaPath = ddVal;
      this._fetchMediaContents();
    }
  }

  upDirectory(ev) {
    if (this._selectedMediaPath != "") {
      var newVal = this._selectedMediaPath;
      if (newVal.substring(newVal.length - 2, newVal.length) == "/.") 
        newVal = newVal.substring(0, newVal.length - 2);
      if (newVal.substring(newVal.length - 1, newVal.length) == "/")
        newVal = newVal.substring(0, newVal.length - 1);
      newVal = newVal.substring(0, newVal.lastIndexOf("/") + 1);
      if (newVal == "/" || newVal == "/local/")
        newVal = "";

      this._selectedMediaPath = newVal;
      this._fetchMediaContents();
    }
  }

  _getSelectedValue(target) {
    //var dd = target.parentNode.firstChild.nextElementSibling;
    var dd = target.querySelector("paper-dropdown-menu");

    if (dd.value == "ALL MEDIA") {
      return "";
    }
    else {
      return dd.value;
    }
  }

  _moveEntity(ev) {
    var ctl = ev.target.parentNode;
    var index = ctl.index;
    var dir = ctl.moveDirection;

    if (index + dir >= 0 && index + dir < this._config.entities.length) {
      var entities = Object.assign([], this._config.entities);

      var e = entities[index];
      entities[index] = entities[index + dir];
      entities[index + dir] = e;

      this._config = {
        ...this._config,
        entities: entities
      };

      this.configChanged(this._config);
    }
  }

  _deleteEntity(ev) {
    var index = ev.target.index;
    var entities = Object.assign([], this._config.entities);
    entities.splice(index, 1);
    this._config = {
      ...this._config,
      entities: entities
    };

    this.configChanged(this._config);
  }

  static get styles() {
    return css`
      .side-by-side {
        display: flex;
      }
      .side-by-side > * {
        flex: 1;
        padding-right: 4px;
      }
      .entity-list {
        font-size: larger;
      }
      .instructions {
        font-size: x-small;
        border: solid 1px silver;
        background-color: whitesmoke;
        padding-left: 3px;
        margin-right: 8px;
      }
      .instructions ul {
        margin-top: 0px;
      }
      .example {
        font-size: small;
        font-style: italic;
      }
      .dialog-button {
        width:75px;
      }
      paper-dropdown-menu, ha-checkbox {
        vertical-align: middle;
      }
      .gallery-popup {
        --mdc-dialog-min-width: 375px;
        --mdc-dialog-max-width: 375px;
        --mdc-dialog-min-height: 250px;
        --mdc-dialog-max-height: 250px;
      }
    `;
  }
}

customElements.define("gallery-card-editor", GalleryCardEditor);
window.customCards = window.customCards || [];
window.customCards.push({
  type: "gallery-card",
  name: "Gallery Card",
  preview: false, // Optional - defaults to false
  description: "The Gallery Card allows for viewing multiple images/videos.  Requires the Files sensor availble at https://github.com/TarheelGrad1998" // Optional
});
