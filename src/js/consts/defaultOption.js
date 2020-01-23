/**
 * @fileoverview Set default value of options
 * @author NHN. FE dev Lab <dl_javascript@nhn.com>
 */

/**
 * A default values for tree
 * @const
 * @type {Object}
 * @property {array} data - A data to be used on tree
 * @property {string} nodeDefaultState - Node state
 * @property {string} nodeIdPrefix - Node id prefix
 * @property {object} stateLabel - State label in node
 *  @property {string} stateLabel.opened - '-'
 *  @property {string} stateLabel.closed - '+'
 * @property {object} template - Template html for the nodes.
 *  @property {string} template.internalNode - Template html for internal node.
 *  @property {string} template.leafNode - Template html for leaf node.
 * @property {object} classNames - Class names of elements in tree
 *  @property {string} openedClass - Class name for opened node
 *  @property {string} closedClass - Class name for closed node
 *  @property {string} nodeClass - Class name for node
 *  @property {string} leafClass - Class name for leaf node
 *  @property {string} subtreeClass  - Class name for subtree in internal node
 *  @property {string} toggleBtnClass - Class name for toggle button in internal node
 *  @property {string} textClass - Class name for text element in a node
 */
module.exports = {
  data: [],
  nodeDefaultState: 'closed',
  stateLabels: {
    opened: '-',
    closed: '+'
  },
  nodeIdPrefix: 'tui-tree-node-',
  classNames: {
    nodeClass: 'tui-tree-node',
    leafClass: 'tui-tree-leaf',
    openedClass: 'tui-tree-opened',
    closedClass: 'tui-tree-closed',
    subtreeClass: 'tui-js-tree-subtree',
    toggleBtnClass: 'tui-js-tree-toggle-btn',
    textClass: 'tui-js-tree-text',
    btnClass: 'tui-tree-content-wrapper'
  },
  template: {
    internalNode:
      '<div class="tui-tree-content-wrapper">' +
      '<button type="button" class="tui-tree-toggle-btn {{toggleBtnClass}}">' +
      '<span class="tui-ico-tree"></span>' +
      '{{stateLabel}}' +
      '</button>' +
      '<span class="tui-tree-text {{textClass}}">' +
      '<span class="tui-tree-ico tui-ico-folder"></span>' +
      '{{text}}' +
      '</span>' +
      '</div>' +
      '<ul class="tui-tree-subtree {{subtreeClass}}">{{children}}</ul>',
    leafNode:
      '<div class="tui-tree-content-wrapper">' +
      '<span class="tui-tree-text {{textClass}}">' +
      '<span class="tui-tree-ico tui-ico-file"></span>' +
      '{{text}}' +
      '</span>' +
      '</div>'
  },
  indent: 23, // value of default css,
  usageStatistics: true
};
