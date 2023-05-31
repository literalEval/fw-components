import { html, css, LitElement, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Recommender } from "./recommendor.js";
import { Parser } from "./parser.js";
import "./suggestion-menu.js";
import { Cursor } from "./cursor.js";

enum Expectation {
  VARIABLE,
  OPERATOR,
  UNDEF,
}

@customElement("formula-editor")
export class FormulaEditor extends LitElement {
  private _parser: Parser;

  constructor() {
    super();

    this._parser = new Parser(this.variables, this.mathematicalExpressions);
  }

  @property()
  content: string = "";

  @property()
  formattedContent: Element | null = null;

  @property()
  recommendations: string[] | null = null;

  @state()
  errorStr: string | null = null;

  @state()
  calculatedResult: number | null = null;

  // If this parseInput is called to add a recommendation, say by clicking,
  // browser removes focus from the input box. In that case, we have no way
  // of knowing where the cursor previously was, other than storing it somewhere.
  
  currentCursorPosition: number | null = null;

  variables = new Map([
    ["qib", 2],
    ["rii", 3],
    ["amog", 4],
    ["mohit", 0.1],
    ["mohini", 0.2],
    ["ravi", 7],
    ["ravipandey", 8],
  ]);
  mathematicalExpressions = new Set(["+", "-", "*", "/", "(", ")"]);

  styles = `
    #wysiwyg-editor {
      display: inline-block;
      border: none;
      padding: 4px;
    }

    #wysiwyg-editor:focus {
      border: none;
    }

    u.wysiwygInternals {
      text-decoration-color: red;
      text-decoration-style: wavy;
    }
  `;

  handleChange(event: InputEvent) {
    this.content = (event.target as HTMLDivElement).innerText;
    this.parseInput(null);
    (event.target as HTMLDivElement).focus();
  }

  onClickRecommendation(recommendation: string) {
    console.log(recommendation);

    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    this.parseInput(recommendation);
    this.currentCursorPosition = null;
  }

  parseInput(addRecommendation: string | null = null) {
    // TODO: Research if cursor-detection can work with shadow-root somehow

    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    this.currentCursorPosition = addRecommendation
      ? this.currentCursorPosition
      : Cursor.getCurrentCursorPosition(editor);

    const parseOutput = this._parser.parseInput(
      this.content,
      this.currentCursorPosition,
      addRecommendation
    );

    this.recommendations = parseOutput.recommendations;
    this.formattedContent = parseOutput.formattedContent;
    editor.innerHTML = parseOutput.formattedString!;

    if (addRecommendation) {
      this.content = (editor as HTMLDivElement).innerText;
      this.recommendations = null;
      this.currentCursorPosition = parseOutput.newCursorPosition;
    }

    Cursor.setCurrentCursorPosition(this.currentCursorPosition!, editor);
    editor?.focus();

    this.calculatedResult = this._parser.calculate(this.content);
    this.requestUpdate();
  }

  requestCalculate() {
    this.calculatedResult = this._parser.calculate(this.content);
    this.content = this._parser.addParens(this.content) ?? this.content;
    this.parseInput();
    this.requestUpdate();
  }

  // Disable shadow-root as it messes up cursor detection.
  createRenderRoot() {
    return this;
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this.parseInput(null);
  }

  render() {
    return html`
      <style>
        ${this.styles}
      </style>
      <div
        contenteditable
        id="wysiwyg-editor"
        style="min-width: 200px; height: 30px; border: 2px solid black;"
        spellcheck="false"
        @input=${this.handleChange}
      ></div>
      ${console.log(this.recommendations)}
      ${this.recommendations
        ? html`<suggestion-menu
            .recommendations=${this.recommendations.join(",")}
            .onClickRecommendation=${(e: any) => this.onClickRecommendation(e)}
          ></suggestion-menu>`
        : html``}
      <button @click=${this.requestCalculate}>Calculate</button>
      <p>${this.calculatedResult}</p>
    `;
  }
}
