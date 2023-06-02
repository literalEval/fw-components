export class Stack {
    constructor() {
        this._inner = [];
    }
    push(item) {
        this._inner.push(item);
    }
    pop() {
        return this._inner.pop();
    }
    top() {
        return this._inner.at(-1);
    }
    empty() {
        return this._inner.length == 0;
    }
    print() {
        console.log(this._inner);
    }
}
export class Queue {
    constructor() {
        this._inner = {};
        this._head = 0;
        this._tail = 0;
    }
    enqueue(item) {
        this._inner[this._tail] = item;
        this._tail++;
    }
    dequeue() {
        if (this._tail === this._head)
            return undefined;
        const element = this._inner[this._head];
        delete this._inner[this._head];
        this._head++;
        return element;
    }
    peek() {
        return this._inner[this._head];
    }
    empty() {
        return this._head == this._tail;
    }
    print() {
        console.log(this._inner);
    }
}
export var Expectation;
(function (Expectation) {
    Expectation[Expectation["VARIABLE"] = 0] = "VARIABLE";
    Expectation[Expectation["OPERATOR"] = 1] = "OPERATOR";
    Expectation[Expectation["UNDEF"] = 2] = "UNDEF";
})(Expectation || (Expectation = {}));
//# sourceMappingURL=helpers.js.map