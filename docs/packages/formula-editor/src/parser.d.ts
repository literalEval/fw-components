import { Queue } from "./helpers.js";
export interface ParseOutput {
    recommendations: string[] | null;
    formattedContent: HTMLBodyElement | null;
    formattedString: string | null;
    newCursorPosition: number;
    errorStr: string | null;
}
export declare class Parser {
    constructor(variables: Map<string, number>, mathematicalExpressions: Set<string>);
    private _recommender;
    variables: Map<string, number>;
    mathematicalExpressions: Set<string>;
    operatorPrecedence: {
        [key: string]: number;
    };
    mappedFormula: string;
    parseInput(formula: string, prevCurPos?: number | null, recommendation?: string | null): ParseOutput;
    buildRPN(formula: string): Queue<string> | null;
    addParens(formula: string): string | null;
    calculate(formula: string): number | undefined;
}
