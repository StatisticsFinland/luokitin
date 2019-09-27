import { html, PolymerElement } from "/node_modules/@polymer/polymer/polymer-element.js";
import '../node_modules/whatwg-fetch/fetch.js'

// Old and not working.

class TkLuokitushaku extends PolymerElement {

  static get template() {
    return html`
    <style>    
    #body {
      visibility: visible
    }
    </style>
    <div id="body">
      <div id="classificationSearch" style="padding-bottom: 10px;">
        <h4>Hae luokitusta:</h4>
        <iron-input bind-value="{{classificationSearch}}">
          <input id="classificationSearch" is="iron-input" placeholder="Hae...">
        </iron-input>
      </div>
      <ul>
      <template id="resultList" is="dom-repeat" items="{{classifications}}">
        <li class="collapsible" id="{{item.localId}}" name="{{item.name}}">{{item.name}} <button class="btnShowMore">+</button><template is="dom-if" if="{{pickable}}"><button class="btn">Valitse</button></template>
          <ul class="content" hidden>
            <li>Kuvaus: {{item.description}}</li>  
          </ul>
        </li>
      </template>
    </ul>
    </div>
      `;
  }

  static get properties() {
    return {
      classificationSearch: String,
      classification: String,
      classifications: Array,
      pickable: {
        type: Boolean,
      },
      language: {
        type: String,
        value: "fi",
        notify: true,
        reflectToAttribute: true,
      }
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this.addEventListener('keyup', this.search.bind(this));
    this.classifications = []
  }

  search(event) {
    if (event.keyCode === 13) {
      this.fetchData(this.classificationSearch.toLowerCase())
    }
  }

  _hiddenChanged() {
    if (this.hidden == true) {
      this.$.body.setAttribute("hidden", true)
    }
  }

  fetchData(searchParam) {
    let url = "https://data.stat.fi/api/classifications/v2/search/classifications?searchParam=" + searchParam + "&content=data&meta=max&lang=fi"
    console.log("Haetaan luokitukset osoitteesta " + url)
    fetch(url)
      .then((response) => {
        return response.json();
      })
      .then((json) => {
        this.addToClassifications(json)
      })
    setTimeout(this.addClickEventToButtons.bind(this, this), 1000);
  }

  addToClassifications(json) {
    for (let item of json) {
      item.name = item.classificationName[0].name
      item.description = item.classificationDescription[0].description
      this.push("classifications", item)
    }
  }

  addClickEventToButtons() {
    let isPickable = false
    if (this.pickable == true) {
      isPickable = true
      let chooseButtons = this.shadowRoot.querySelectorAll(".btn")
      chooseButtons.forEach(button => {
        button.addEventListener('click', function () {
          console.log(button.parentNode.id)
          window.dispatchEvent(new CustomEvent('tk-luokitushaku-luokitus', {
            detail: { localId: button.parentNode.id, name: button.parentNode.name }
          }))
        });
      });
    }
    let index = 4 //ul .content location
    if (isPickable == true) {
      index = 5
    }
    let showMoreButtons = this.shadowRoot.querySelectorAll(".btnShowMore")
    showMoreButtons.forEach(button => {
      button.addEventListener('click', function () {
        if (button.textContent == "+") {
          button.parentNode.childNodes[index].removeAttribute("hidden")
          button.textContent = "-"
        } else {
          button.parentNode.childNodes[index].setAttribute("hidden", true)
          button.textContent = "+"
        }
      });
    });
  }

  _versionChanged(newValue, oldValue) {
    if (this.version == true) {
      this.$.version.removeAttribute("hidden")
    }
  }
}

window.customElements.define('tk-luokitushaku', TkLuokitushaku);

