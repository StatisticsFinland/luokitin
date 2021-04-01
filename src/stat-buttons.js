import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';
import '@polymer/paper-button/paper-button.js';
import '@polymer/paper-styles/paper-styles.js';

class StatButtons extends PolymerElement {
    static get properties() {
        return {
            classificationName: String,
            language: {
                type: String,
                value: 'fi',
                notify: true,
                reflectToAttribute: true,
            },
            buttonContent: {
                type: Array,
                notify: true,
                value: {first: 'Rakennusluokitus 2018', second: 'Rakennusluokitusavain', third: 'Toimialaluokitusavain'},
            },
        };
    }

    connectedCallback() {
        super.connectedCallback();
        this.setLanguage();
    }

    setLanguage() {
        if (this.language === 'en') {
            this.buttonContent.first = 'Classification of Buildings 2018';
            this.buttonContent.second = 'Building Classification Correspondence Table';
            this.buttonContent.third = 'Industrial Classification Correspondence Table';
        } else if (this.language === 'sv') {
            this.buttonContent.first = 'Byggnadsklassificering 2018';
            this.buttonContent.second = 'Byggnadsklassificeringsnyckel';
            this.buttonContent.third = 'Näringsgrensindelningsnyckel';
        }
        this.notifyPath('buttonContent.first');
        this.notifyPath('buttonContent.second');
        this.notifyPath('buttonContent.third');
    }

    click(e) {
        let correspondenceClasses = false; // A variable to be attached in the event details to indicate whether correspondence tables need to be loaded or not.
        if (e.target.id != 'rakennus_1_20180712') {
            correspondenceClasses = true;
        }
        window.dispatchEvent(new CustomEvent('stat-classification', {
            detail: {classificationId: e.target.id, correspondenceClasses: correspondenceClasses},
        }));
        const buttons = this.shadowRoot.querySelectorAll('paper-button');
        buttons.forEach(button => {
            if (button != e.target) {
                this.removeAttribute(button, 'active');
            }
        });
    }

    // Might not work on IE and polyfills might not catch it.
    removeAttribute(obj, attr) {
        if (obj.hasAttribute(attr)) {
            obj.removeAttribute(attr);
        }
    }

    static get template() {
        return html`
            <style>
                paper-button {
                    background-color: #ececec;                    
                    color: black;                                
                    font-size: 0.9em;
                    @apply --shadow-elevation-2dp;      
                    margin-bottom: 10px;            
                    min-width: 250px;                   
                }
          
                @media (max-width:960px) {
                    paper-button {
                        width: 98%;
                    }
                }
          
                paper-button[active] {
                    background-color: #0073B0;
                    color: white;
                    @apply --shadow-elevation-4dp;                                              
                }
          
                paper-button:hover {
                    background-color: #e0effa;
                    color: black;      
                    @apply --shadow-elevation-4dp;                                                          
                }
          
                paper-button.disabled {
                    color: white;
                    background-color: bisque;
                }
              
                .stat-buttons-body {
                    visibility: visible;      
                }       
            </style>
            <div class="stat-buttons-body">
                <div class="classificationButtons">
                    <paper-button toggles active raised on-click="click" id="rakennus_1_20180712">{{buttonContent.first}}</paper-button>
                    <paper-button toggles raised on-click="click" id="rakennus_1_19940101">{{buttonContent.second}}</paper-button>
                    <paper-button toggles raised on-click="click" id="toimiala_1_20080101">{{buttonContent.third}}</paper-button>
                </div>  
            </div>
        `;
    }
}

window.customElements.define('stat-buttons', StatButtons);
