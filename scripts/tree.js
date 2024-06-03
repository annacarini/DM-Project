
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