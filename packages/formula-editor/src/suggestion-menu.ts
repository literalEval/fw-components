import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("suggestion-menu")
export class SuggestionMenu extends LitElement {
  @property()
  recommendations: string = "";

  //   createRenderRoot() {
  //     return this;
  //   }

  render() {
    return html`
      <div style="min-width: 50px; border: 2px solid red;">
        <ul>
          ${this.recommendations.split(',').map((recommendation) => {
            return html`<li>${recommendation}</li>`;
          })}
        </ul>
      </div>
    `;
  }
}
