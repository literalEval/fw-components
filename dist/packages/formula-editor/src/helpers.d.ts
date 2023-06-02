export declare class Stack<Type> {
    private _inner;
    push(item: Type): void;
    pop(): Type | undefined;
    top(): Type | undefined;
    empty(): boolean;
    print(): void;
}
export declare class Queue<Type> {
    private _inner;
    private _head;
    private _tail;
    enqueue(item: Type): void;
    dequeue(): Type | undefined;
    peek(): Type;
    empty(): boolean;
    print(): void;
}
export declare enum Expectation {
    VARIABLE = 0,
    OPERATOR = 1,
    UNDEF = 2
}
