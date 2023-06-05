export class Recommender {
    constructor(variables) {
        this._trie = new TrieNode();
        this._trie.insertAll();
        for (let variable of variables) {
            this.insert(variable[0]);
        }
    }
    insert(word, position = -1, node = undefined) {
        if (position == -1) {
            this.insert(word, 0, this._trie);
            return;
        }
        if (position == word.length) {
            node === null || node === void 0 ? void 0 : node.addChild("\0");
            return;
        }
        if (!node.getChild(word[position])) {
            node === null || node === void 0 ? void 0 : node.addChild(word[position]);
        }
        this.insert(word, position + 1, node.getChild(word[position]));
    }
    getRecommendation(word) {
        if (word.length < 2) {
            return null;
        }
        let recommendations = [];
        let currentPosition = 0;
        let currentNode = this._trie;
        while (currentNode && currentPosition < word.length) {
            currentNode = currentNode.getChild(word[currentPosition]);
            currentPosition++;
        }
        if (!currentNode) {
            return null;
        }
        this._traverseAndGet(recommendations, currentNode, word, currentPosition);
        return recommendations;
    }
    _traverseAndGet(recommendations, node, word, position, currentStr = "") {
        // if (currentStr != "") {
        //   recommendations.push(word + currentStr);
        // }
        // if (node.children.size == 0) {
        //   return;
        // }
        for (let child of node.children) {
            if (child[0] == "\0") {
                recommendations.push(word + currentStr);
                // return;
            }
            this._traverseAndGet(recommendations, child[1], word, position, currentStr + child[0]);
        }
    }
}
class TrieNode {
    constructor() {
        this._children = new Map();
    }
    get children() {
        return this._children;
    }
    insertAll() {
        const LOWERCASE_ASCII_BEGIN = 97;
        for (let char = 0; char < 26; char++) {
            this._children.set(String.fromCharCode(char + LOWERCASE_ASCII_BEGIN), new TrieNode());
        }
    }
    getChild(char) {
        return this._children.get(char);
    }
    addChild(char) {
        this._children.set(char, new TrieNode());
    }
}
//# sourceMappingURL=recommendor.js.js.map