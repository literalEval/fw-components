import { LitElement, html } from "lit";
import { customElement } from "lit-element";
import { FormulaEditor } from "../../packages/formula-editor/src/formula-editor";

@customElement("showcase-gallery")
class ShowcaseGallery extends LitElement {
  fm = new FormulaEditor();

  render() {
    html` <formula-editor></formula-editor> `;
  }
}
