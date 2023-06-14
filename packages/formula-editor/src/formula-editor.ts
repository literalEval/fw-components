import { html, LitElement, PropertyValueMap } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { FormulaEditorStyles } from "./styles/formula-editor-styles.js";
import { TextButtonStyles } from "../../styles/src/button-styles.js";
import { Parser } from "./parser.js";
import { Cursor } from "./cursor.js";
import "./suggestion-menu.js";

@customElement("formula-editor")
export class FormulaEditor extends LitElement {
  private _parser: Parser;

  constructor() {
    super();

    this._parser = new Parser(this.variables, this.minSuggestionLen);
  }

  protected firstUpdated(
    _changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>
  ): void {
    this._parser = new Parser(this.variables, this.minSuggestionLen);
  }

  /**
   * These `states` and `properties` can't be defined as `static get properties`,
   * because TS doesn't support that.
   * @see https://github.com/lit/lit-element/issues/414
   */

  @state()
  _content: string = "";

  @state()
  _formattedContent: Element | null = null;

  @state()
  _recommendations: string[] | null = null;

  @state()
  _errorStr: string | null = null;

  @state()
  _calculatedResult: number | null = null;

  /**
   * If `parseInput` is called to add a recommendation, say by clicking,
   * browser removes focus from the input box. In that case, we have no way
   * of knowing where the cursor previously was, other than storing it somewhere.
   */

  @state()
  currentCursorPosition: number | null = null;

  @state()
  currentCursorRect: DOMRect | undefined = undefined;

  @property({
    type: Map<string, number>,
    converter: {
      fromAttribute: (value) => {
        if (value) {
          return new Map<string, number>(JSON.parse(value));
        }
      },
      toAttribute: (value: Map<string, number>) => {
        return JSON.stringify(Array.from(value.entries()));
      },
    },
  })
  variables = new Map();

  @property()
  minSuggestionLen: number = 2;

  handleChange(event: InputEvent) {
    console.log(event);
    event.preventDefault();
    console.log(this.variables);
    this._content = (event.target as HTMLDivElement).innerText;
    this.parseInput();
    (event.target as HTMLDivElement).focus();
  }

  onClickRecommendation(recommendation: string) {
    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    this.parseInput(recommendation);
    this.currentCursorPosition = null;
  }

  parseInput(addRecommendation: string | null = null) {
    let editor = document.getElementById("wysiwyg-editor");
    if (!editor) return;

    this.currentCursorPosition = addRecommendation
      ? this.currentCursorPosition
      : // : Cursor.getCurrentCursorPosition(editor);
        Cursor.getCaret(editor);

    const parseOutput = this._parser.parseInput(
      this._content,
      this.currentCursorPosition,
      addRecommendation
    );

    this._recommendations = parseOutput.recommendations;
    this._formattedContent = parseOutput.formattedContent;
    this._errorStr = parseOutput.errorStr;
    editor.innerHTML = parseOutput.formattedString!;
    this._content = (editor as HTMLDivElement).innerText;

    if (addRecommendation) {
      this._recommendations = null;
      this.currentCursorPosition = parseOutput.newCursorPosition;
    }

    // Cursor.setCurrentCursorPosition(this.currentCursorPosition!, editor);
    Cursor.setCaret(this.currentCursorPosition!, editor);
    editor?.focus();

    this.currentCursorRect = Cursor.getCursorRect();

    this.requestUpdate();
  }

  requestCalculate() {
    if (this._parser.parseInput(this._content).errorStr) {
      return;
    }

    const calculatedResult = this._parser.calculate(this._content);

    this._content = this._parser.addParens(this._content) ?? this._content;
    this.parseInput();

    this._calculatedResult = calculatedResult ?? NaN;
    this._errorStr =
      calculatedResult == undefined
        ? "Division by zero encountered"
        : this._errorStr;

    this._recommendations = null;
    this.requestUpdate();
  }

  requestFormat() {
    this._content = this._parser.addParens(this._content) ?? this._content;
    this.parseInput();
    this._recommendations = null;
    this.requestUpdate();
  }

  // Disable shadow-root as it messes up cursor detection.
  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <style>
        ${FormulaEditorStyles}
        ${TextButtonStyles}
      </style>
      <div
        contenteditable
        id="wysiwyg-editor"
        spellcheck="false"
        @input=${this.handleChange}
      ></div>
      ${this._recommendations
        ? html`<div
            style="
              position: absolute; 
              left: ${this.currentCursorRect?.left + "px"}; 
              top: ${(this.currentCursorRect?.top ?? 0) +
            window.scrollY +
            "px"};
            "
          >
            <suggestion-menu
              .recommendations=${this._recommendations}
              .onClickRecommendation=${(e: any) =>
                this.onClickRecommendation(e)}
            ></suggestion-menu>
          </div>`
        : html``}
      <div id="wysiwyg-err" class="${this._errorStr ?? "wysiwyg-no-err"}">
        ${this._errorStr ?? "No Errors"}
      </div>
      <button class="primary-text-button" @click=${this.requestCalculate}>
        Calculate
      </button>
      <button class="primary-text-button" @click=${this.requestFormat}>
        Format
      </button>
      <p>${this._calculatedResult}</p>
    `;
  }
}
