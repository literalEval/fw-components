import { html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("suggestion-menu")
export class SuggestionMenu extends LitElement {
  @property()
  recommendations: string = "";

  @property()
  onClickRecommendation: Function = (recommendation: string) => {
    // console.log(e);
  };

  // Disable shadow-root as it messes up cursor detection.
  createRenderRoot() {
    return this;
  }

  handleKeydown(event: KeyboardEvent, recommendation: string) {
    if (event.code == "Enter") {
      event.preventDefault();
      event.stopPropagation();
      this.onClickRecommendation(recommendation);
    }
  }

  render() {
    return html`
      <div style="min-width: 50px; border: 2px solid red;">
        <ul>
          ${this.recommendations.split(",").map((recommendation) => {
            return html`<li
              tabindex="0"
              @click=${(e: any) => this.onClickRecommendation(recommendation)}
              @keydown=${(e: any) => this.handleKeydown(e, recommendation)}
            >
              ${recommendation}
            </li>`;
          })}
        </ul>
      </div>
    `;
  }
}
