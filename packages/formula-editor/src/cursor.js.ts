export class Cursor {
  static getCurrentCursorPosition(parentElement: any) {
    let selection = window.getSelection(),
      charCount = -1,
      node;

    if (selection?.focusNode) {
      if (Cursor._isChildOf(selection.focusNode, parentElement)) {
        node = selection.focusNode;
        charCount = selection.focusOffset;

        while (node) {
          if (node === parentElement) {
            break;
          }

          if (node.previousSibling) {
            node = node.previousSibling;
            charCount += node.textContent?.length ?? 0;
          } else {
            node = node.parentNode;
            if (node === null) {
              break;
            }
          }
        }
      }
    }

    return charCount;
  }

  static setCurrentCursorPosition(chars: number, element: any) {
    if (chars >= 0) {
      var selection = window.getSelection();
      let range = Cursor._createRange(element, { count: chars }, undefined);

      if (range) {
        range.collapse(false);
        selection?.removeAllRanges();
        selection?.addRange(range);
      }
    }
  }

  static _createRange(node: any, chars: any, range: any) {
    if (!range) {
      range = document.createRange();
      range.selectNode(node);
      range.setStart(node, 0);
    }

    if (chars.count === 0) {
      range.setEnd(node, chars.count);
    } else if (node && chars.count > 0) {
      if (node.nodeType === Node.TEXT_NODE) {
        if (node.textContent.length < chars.count) {
          chars.count -= node.textContent.length;
        } else {
          range.setEnd(node, chars.count);
          chars.count = 0;
        }
      } else {
        for (var lp = 0; lp < node.childNodes.length; lp++) {
          range = Cursor._createRange(node.childNodes[lp], chars, range);

          if (chars.count === 0) {
            break;
          }
        }
      }
    }

    return range;
  }

  static _isChildOf(node: any, parentElement: any) {
    while (node !== null) {
      if (node === parentElement) {
        return true;
      }
      node = node.parentNode;
    }

    return false;
  }

  static getCaret = (element: any) => {
    const range = window.getSelection()!.getRangeAt(0);
    const prefix = range.cloneRange();
    prefix.selectNodeContents(element);
    prefix.setEnd(range.endContainer, range.endOffset);
    return prefix.toString().length;
  };

  static setCaret = (pos: any, parent: any) => {
    for (const node of parent.childNodes) {
      if (node.nodeType == Node.TEXT_NODE) {
        if (node.length >= pos) {
          const range = document.createRange();
          const sel = window.getSelection()!;
          range.setStart(node, pos);
          range.collapse(true);
          sel.removeAllRanges();
          sel.addRange(range);
          return -1;
        } else {
          pos = pos - node.length;
        }
      } else {
        pos = this.setCaret(pos, node);
        if (pos < 0) {
          return pos;
        }
      }
    }
    return pos;
  };

  static getCursorRect() {
    return window.getSelection()?.getRangeAt(0)?.getClientRects()[0];
  }
}
