
// Source (che ho modificato levando le key):
// https://www.30secondsofcode.org/js/s/data-structures-tree/


class TreeNode {
    constructor(value, parent = null) {
        this.value = value;
        this.parent = parent;
        this.children = [];
    }
  
    get isLeaf() {
        return this.children.length === 0;
    }
  
    get hasChildren() {
        return !this.isLeaf;
    }


    getValueOfAllChildren() {
        var res = this.value;

        if (this.children.length < 1)
            return res;
        else {
            for (var i = 0; i < this.children.length; i++) {
                res = res.concat(this.children[i].getValueOfAllChildren());
            }
        }
        return res;
    }
}
  
class Tree {
    constructor(value) {
        this.root = new TreeNode(value);
    }
  
    *preOrderTraversal(node = this.root) {
        yield node;
        if (node.children.length) {
            for (let child of node.children) {
                yield* this.preOrderTraversal(child);
            }
        }
    }
  
    *postOrderTraversal(node = this.root) {
        if (node.children.length) {
            for (let child of node.children) {
                yield* this.postOrderTraversal(child);
            }
        }
        yield node;
    }
  
    insert(parentNode, value) {
        parentNode.children.push(new TreeNode(value, parentNode));
        return true;
    }
  
    remove(nodeToRemove) {
        for (let node of this.preOrderTraversal()) {
            const filtered = node.children.filter(child => child !== nodeToRemove);
            if (filtered.length !== node.children.length) {
                node.children = filtered;
                return true;
            }
        }
        return false;
    }
}