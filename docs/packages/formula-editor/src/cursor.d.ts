export declare class Cursor {
    static getCurrentCursorPosition(parentElement: any): number;
    static setCurrentCursorPosition(chars: number, element: any): void;
    static _createRange(node: any, chars: any, range: any): any;
    static _isChildOf(node: any, parentElement: any): boolean;
}
