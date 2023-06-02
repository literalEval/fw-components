"use strict";
class Parser {
    static calculate(variables, formula) {
        let mappedFormula = "";
        let tokens = formula.split(/[\s,]+/);
        for (let token of tokens) {
            if (!variables.has(token)) {
                return null;
            }
            let isVariable = this.variables.has(word);
            let isOperator = this.mathematicalExpressions.has(word);
            let isNumber = Number.parseFloat(word);
        }
    }
}
//# sourceMappingURL=calculator.js.map