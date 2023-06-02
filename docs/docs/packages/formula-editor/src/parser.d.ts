export class Parser {
    constructor(variables: any, mathematicalExpressions: any);
    operatorPrecedence: {
        "^": number;
        "/": number;
        "*": number;
        "+": number;
        "-": number;
    };
    mappedFormula: string;
    variables: any;
    mathematicalExpressions: any;
    _recommender: Recommender;
    parseInput(formula: any, prevCurPos?: null, recommendation?: null): {
        recommendations: null;
        formattedContent: null;
        formattedString: null;
        newCursorPosition: number;
        errorStr: null;
    };
    buildRPN(formula: any): Queue<any> | null;
    addParens(formula: any): any;
    calculate(formula: any): any;
}
import { Recommender } from "./recommendor.js";
import { Queue } from "./helpers.js";
