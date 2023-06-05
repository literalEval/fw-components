import { html, css, LitElement, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { Parser } from "./parser.js";
import { Cursor } from "./cursor.js";
import "./suggestion-menu.js";

@customElement("formula-editor")
export class FormulaEditor extends LitElement {
  private _parser: Parser;

  constructor() {
    super();

    this._parser = new Parser(this.variables, this.mathematicalExpressions);
  }

  @state()
  content: string = "";

  @state()
  formattedContent: Element | null = null;

  @state()
  recommendations: string[] | null = null;

  @state()
  errorStr: string | null = null;

  @state()
  calculatedResult: number | null = null;

  // If this parseInput is called to add a recommendation, say by clicking,
  // browser removes focus from the input box. In that case, we have no way
  // of knowing where the cursor previously was, other than storing it somewhere.

  currentCursorPosition: number | null = null;

  @property()
  variables = new Map([
    ["a", 2],
    ["b", 3.0000002],
    ["c", 4],
    ["xyz", 0],
    ["sus", -420420420420],
    ["qwe", -0.000000000002],
    ["qib", 1000000000000],
    ["rii", -0.1000000001],
  ]);
  mathematicalExpressions = new Set(["+", "-", "*", "/"]);

  styles = `
    #wysiwyg-editor {
      display: inline-block;
      border: none;
      padding: 4px;
    }

    #wysiwyg-editor:focus {
      border: none;
    }

    .wysiwygInternals.error {
      text-decoration: underline;
      text-decoration-color: red;
    }

    .wysiwygInternals.bracket {
      color: #AA3731;
    }

    .wysiwygInternals.operator {
      font-weight: bold;
      color: #777777;
    }
  `;

  handleChange(event: InputEvent) {
    this.content = (event.target as HTMLDivElement).innerText;
    this.parseInput();
    console.log("handel change called");
    (event.target as HTMLDivElement).focus();
  }

  onClickRecommendation(recommendation: string) {
    // console.log(recommendation);

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
    // console.log(this.recommendations);
    this.formattedContent = parseOutput.formattedContent;
    this.errorStr = parseOutput.errorStr;
    editor.innerHTML = parseOutput.formattedString!;
    this.content = (editor as HTMLDivElement).innerText;

    if (addRecommendation) {
      this.recommendations = null;
      this.currentCursorPosition = parseOutput.newCursorPosition;
    }

    Cursor.setCurrentCursorPosition(this.currentCursorPosition!, editor);
    editor?.focus();

    // this.calculatedResult = this._parser.calculate(this.content)!;
    this.requestUpdate();
  }

  requestCalculate() {
    this.calculatedResult = this._parser.calculate(this.content)!;
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
    // this.parseInput(null);
  }

  render() {
    return html`
      <style>
        ${this.styles}
      </style>
      <div
        contenteditable
        id="wysiwyg-editor"
        style="min-width: 200px; height: 30px; border: 0px solid black; outline: 1px solid black;"
        spellcheck="false"
        @input=${this.handleChange}
      ></div>
      ${this.recommendations
        ? html`<suggestion-menu
            .recommendations=${this.recommendations.join(",")}
            .onClickRecommendation=${(e: any) => this.onClickRecommendation(e)}
          ></suggestion-menu>`
        : html``}
      <button @click=${this.requestCalculate}>Calculate</button>
      <p style="color: red;">${this.errorStr}</p>
      <p>${this.calculatedResult}</p>
      <div>
        ["a", 2],<br />
        ["b", 3.0000002],<br />
        ["c", 4],<br />
        ["xyz", 0],<br />
        ["sus", -420420420420],<br />
        ["qwe", -0.000000000002],<br />
        ["qib", 1000000000000],<br />
        ["rii", -0.1000000001]
      </div>
    `;
  }
}
