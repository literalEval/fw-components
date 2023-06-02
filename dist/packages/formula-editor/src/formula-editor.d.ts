import { LitElement, PropertyValueMap } from "lit";
import "./suggestion-menu.js";
export declare class FormulaEditor extends LitElement {
    private _parser;
    constructor();
    content: string;
    formattedContent: Element | null;
    recommendations: string[] | null;
    errorStr: string | null;
    calculatedResult: number | null;
    currentCursorPosition: number | null;
    variables: Map<string, number>;
    mathematicalExpressions: Set<string>;
    styles: string;
    handleChange(event: InputEvent): void;
    onClickRecommendation(recommendation: string): void;
    parseInput(addRecommendation?: string | null): void;
    requestCalculate(): void;
    createRenderRoot(): this;
    protected firstUpdated(_changedProperties: PropertyValueMap<any> | Map<PropertyKey, unknown>): void;
    render(): import("lit-html").TemplateResult<1>;
}
