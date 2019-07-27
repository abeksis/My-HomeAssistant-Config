class ColumnCard extends HTMLElement {
  constructor() {
    super();
    // Make use of shadowRoot to avoid conflicts when reusing
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
      #columns {
        display: flex;
        flex-direction: row;
        justify-content: center;
      }
      .column {
        flex-basis: 0;
        flex-grow: 1;
        max-width: 500px;
        overflow-x: hidden;
      }
      .column > *:first-child {
        margin-top: 0;
      }
      .column > * {
        display: block;
        margin: 4px 4px 8px;
      }
      </style>
      `;

    this.cols = document.createElement('div');
    this.cols.setAttribute("id", "columns");
    this.shadowRoot.appendChild(this.cols);

    this.columns = 0;
    this._cards = [];
  }

  setConfig(config) {
    this.config = config;
    if (!config || !config.cards || !Array.isArray(config.cards)) {
      throw new Error('Card config incorrect');
    }

    // The cards are created here in order to allow finding their height later
    // hui-view.js recreated the cards whenever the number of columns change, but that didn't work for me.
    // There might be some bad side effects of this, but I haven't encountered any so far.
    // Heads up, though...
    this._cards = config.cards.map((item) => {
      let element;
      if (item.type.startsWith("custom:")){
        element = document.createElement(`${item.type.substr("custom:".length)}`);
      } else {
        element = document.createElement(`hui-${item.type}-card`);
      }
      element.setConfig(item);
      if(this.hass)
        element.hass = this.hass;
      return element;
    });

    window.addEventListener('resize', (event) => {this._updateColumns()});
    window.setTimeout((event) => {this._updateColumns()}, 10);
  }

  _updateColumns() {
    let numcols = Math.max(1,Math.floor(this.cols.clientWidth/300));
    if(numcols != this.columns) {
      this.columns = numcols
      this._createColumns();
    }
  }

  _createColumns() {
    // This code is copied more or less verbatim from hui-view.js in home-assistant.
    // https://github.com/home-assistant/home-assistant-polymer/blob/master/src/panels/lovelace/hui-view.js
    // The credit for anything good you find here goes to the home-assistant team.
    const root = this.cols;
    // Remove old columns
    while (root.lastChild) {
      root.removeChild(root.lastChild);
    }

    // Prepare a number of new columns
    let columns = [];
    const columnEntityCount =  [];
    for(let i = 0; i < this.columns; i++) {
      columns.push([]);
      columnEntityCount.push(0);
    }

    function getColumnIndex(size) {
      // Find the shortest column
      let minIndex = 0;
      for (let i = 0; i < columnEntityCount.length; i++) {
        if (columnEntityCount[i] < 5) {
          minIndex = i;
          break;
        }
        if (columnEntityCount[i] < columnEntityCount[minIndex]) {
          minIndex = i;
        }
      }
      columnEntityCount[minIndex] += size;
      return minIndex;
    }

    // Go through each card and find which column to place it in (the shortest one)
    this._cards.forEach((el) => {
      this.appendChild(el);
      const cardSize = typeof el.getCardSize === 'function' ? el.getCardSize() : 1;
      columns[getColumnIndex(cardSize)].push(el);
    });

    this.columnEntityCount = columnEntityCount

    // Remove any empty columns
    columns = columns.filter(val => val.length > 0);

    // Actually place the cards in the columns
    columns.forEach((column) => {
      const columnEl = document.createElement('div');
      columnEl.classList.add('column');
      column.forEach(el => columnEl.appendChild(el));
      root.appendChild(columnEl);
    });
  }

  set hass(hass) {
    // console.log(hass);
    this._cards.forEach(item => {
      item.hass = hass;
    });
  }

  getCardSize() {
    return Math.max(this.columnEntityCount);
  }
}
customElements.define('column-card', ColumnCard);
