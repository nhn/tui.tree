var TreeNode = require('../src/js/treeNode');

describe('TreeNode', function() {
  var node;
  var parentId = 0;
  var data = {
    title: 'My node',
    state: 'closed'
  };

  beforeEach(function() {
    node = new TreeNode(data, parentId);
  });

  it('should set/get/toggle its state', function() {
    expect(node.getState()).toEqual('closed');

    node.setState('opened');
    expect(node.getState()).toEqual('opened');

    node.setState('asdf');
    expect(node.getState()).toEqual('opened');

    node.toggleState();
    expect(node.getState()).toEqual('closed');
  });

  it('should add/remove/replace by childId(s)', function() {
    node.addChildId(4);
    expect(node.getChildIds()).toContain(4);

    node.removeChildId(4);
    expect(node.getChildIds()).not.toContain(4);

    node.replaceChildIds([4, 5, 6]);
    expect(node.getChildIds()).toEqual([4, 5, 6]);
  });

  it('should add/remove a node by data', function() {
    expect(node.getAllData()).toEqual(
      expect.objectContaining({
        title: 'My node'
      })
    );

    node.setData({ newData: 'data2' });
    expect(node.getAllData()).toEqual(
      expect.objectContaining({
        title: 'My node',
        newData: 'data2'
      })
    );

    node.removeData('title', 'newData');
    expect(node.getAllData().title).toBeUndefined();
    expect(node.getAllData().newData).toBeUndefined();
  });

  it('"isLeaf" should return true if a node is leaf', function() {
    expect(node.isLeaf()).toBe(true);

    node.addChildId(4);
    expect(node.isLeaf()).toBe(false);
  });

  it('"isRoot" should return true if a node is root', function() {
    expect(node.isRoot()).toBe(false);

    node.setParentId(null);
    expect(node.isRoot()).toBe(true);
  });

  it('"constructor.setIdPrefix and _stampId" should set node id', function() {
    TreeNode.setIdPrefix('new-tree-node-');
    node = new TreeNode(data, parentId);

    expect(node.getId()).toContain('new-tree-node-');
  });

  it('children property in "setData" should be ignored', function() {
    node.setData({ children: [] });

    expect(node.getData('children')).toBeUndefined();
  });

  it('"getChildIndex()" should return index number of child node', function() {
    var index;

    node.replaceChildIds(['1', '2', '3']);

    index = node.getChildIndex('2');

    expect(index).toEqual(1);
  });

  it('"insertChildId()" should add the node id in the position corresponding to the index ', function() {
    var ids;

    node.replaceChildIds(['node-a', 'node-b', 'node-c']);
    node.insertChildId('node-d', 1);

    ids = node.getChildIds();

    expect(ids).toEqual(['node-a', 'node-d', 'node-b', 'node-c']);
  });

  it('"moveChildId()" should change the node id position', function() {
    var ids;

    node.replaceChildIds(['node-a', 'node-b', 'node-c', 'node-d']);

    node.moveChildId('node-d', 1);
    ids = node.getChildIds();
    expect(ids).toEqual(['node-a', 'node-d', 'node-b', 'node-c']);

    node.moveChildId('node-a', 3);
    ids = node.getChildIds();
    expect(ids).toEqual(['node-d', 'node-b', 'node-a', 'node-c']);

    node.moveChildId('node-c', 0);
    ids = node.getChildIds();
    expect(ids).toEqual(['node-c', 'node-d', 'node-b', 'node-a']);
  });
});
