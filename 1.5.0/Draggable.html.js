tui.util.defineNamespace("fedoc.content", {});
fedoc.content["Draggable.html"] = "<div id=\"main\" class=\"main\">\n\n\n\n\n<section>\n\n<header>\n    \n        <h2>\n        \n        Draggable\n        \n        \n        </h2>\n        \n            <div class=\"class-description\"><p>Draggable</p></div>\n        \n    \n</header>\n\n<article>\n    \n    <div class=\"container-overview\">\n    \n        \n<div class=\"\">\n<dt>\n    \n        <h4 class=\"name\" id=\"Draggable\">\n            <span class=\"type-signature\"></span>new Draggable<span class=\"signature\">(tree, options)</span><span class=\"type-signature\"></span>\n            \n                <div class=\"container-source method\">\n                    <code>file</code>,\n                    <code>line 47</code>\n                </div>\n            \n        </h4>\n\n        \n    \n</dt>\n<dd>\n\n    \n    <div class=\"description\">\n        <p>Set the tree draggable</p>\n    </div>\n    \n\n    \n\n    \n\n    \n\n    \n    <div class=\"container-params\">\n        <div class=\"params\">\n\n<table class=\"params\">\n    <thead>\n    <tr>\n        \n        <th>Name</th>\n        \n\n        <th>Type</th>\n\n        \n\n        \n\n        <th class=\"last\">Description</th>\n    </tr>\n    </thead>\n\n    <tbody>\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>tree</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\"><a href=\"Tree.html\">Tree</a></span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Tree</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>options</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">Object</span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Options</p>\n                <h6>Properties:</h6>\n                \n\n<table class=\"params\">\n    <thead>\n    <tr>\n        \n        <th>Name</th>\n        \n\n        <th>Type</th>\n\n        \n\n        \n\n        <th class=\"last\">Description</th>\n    </tr>\n    </thead>\n\n    <tbody>\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>useHelper</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">boolean</span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Using helper flag</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>helperPos</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">Object</span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Helper position</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>rejectedTagNames</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">Array.&lt;string></span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>No draggable tag names</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>rejectedClassNames</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">Array.&lt;string></span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>No draggable class names</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>autoOpenDelay</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">number</span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Delay time while dragging to be opened</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>isSortable</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">boolean</span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Flag of whether using sortable dragging</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>hoverClassName</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">string</span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Class name for hovered node</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>lineClassName</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">string</span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Class name for moving position line</p></td>\n        </tr>\n\n    \n\n        <tr>\n            \n                <td class=\"name first\"><code>lineBoundary</code></td>\n            \n\n            <td class=\"type\">\n            \n                \n<span class=\"param-type\">Object</span>\n\n\n            \n            </td>\n\n            \n\n            \n\n            <td class=\"description last\"><p>Boundary value for visible moving line</p></td>\n        </tr>\n\n    \n    </tbody>\n</table>\n            </td>\n        </tr>\n\n    \n    </tbody>\n</table></div>\n    </div>\n    \n\n    \n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dd>\n</div>\n\n    \n    </div>\n    \n\n    \n\n    \n\n    \n\n     \n\n    \n\n    \n    <div class=\"container-members\">\n        <h3 class=\"subsection-title\">Members</h3>\n\n        <dl>\n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"autoOpenDelay\">\n        <span class=\"type-signature\"></span>autoOpenDelay<span class=\"type-signature\"> :number</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 138</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Delay time while dragging to be opened</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">number</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"currentNodeId\">\n        <span class=\"type-signature\"></span>currentNodeId<span class=\"type-signature\"> :string</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 90</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Dragging element's node id</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">string</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"helperElement\">\n        <span class=\"type-signature\"></span>helperElement<span class=\"type-signature\"> :HTMLElement</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 72</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Drag helper element</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">HTMLElement</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"helperPos\">\n        <span class=\"type-signature\"></span>helperPos<span class=\"type-signature\"> :Object</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 132</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Helper position</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">Object</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"hoverClassName\">\n        <span class=\"type-signature\"></span>hoverClassName<span class=\"type-signature\"> :string</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 150</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Class name for mouse overed node</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">string</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"hoveredElement\">\n        <span class=\"type-signature\"></span>hoveredElement<span class=\"type-signature\"> :HTMLElement</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 96</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Current mouse overed element</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">HTMLElement</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"isSortable\">\n        <span class=\"type-signature\"></span>isSortable<span class=\"type-signature\"> :boolean</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 144</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Flag of whether using sortable dragging</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">boolean</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"lineBoundary\">\n        <span class=\"type-signature\"></span>lineBoundary<span class=\"type-signature\"> :Object</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 162</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Boundary value for visible moving line</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">Object</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"lineClassName\">\n        <span class=\"type-signature\"></span>lineClassName<span class=\"type-signature\"> :string</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 156</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Class name for moving position line</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">string</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"movingLineType\">\n        <span class=\"type-signature\"></span>movingLineType<span class=\"type-signature\"> :string</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 102</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Moving line type (&quot;top&quot; or &quot;bottom&quot;)</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">string</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"rejectedClassNames\">\n        <span class=\"type-signature\"></span>rejectedClassNames<span class=\"type-signature\"></span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 120</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Class name list for rejecting to drag</p>\n    </div>\n    \n\n    <!--\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"rejectedTagNames\">\n        <span class=\"type-signature\"></span>rejectedTagNames<span class=\"type-signature\"></span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 114</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Tag list for rejecting to drag</p>\n    </div>\n    \n\n    <!--\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"timer\">\n        <span class=\"type-signature\"></span>timer<span class=\"type-signature\"> :number</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 108</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Invoking time for setTimeout()</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">number</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"tree\">\n        <span class=\"type-signature\"></span>tree<span class=\"type-signature\"> :<a target=\"body\" href=\"Tree.html\">Tree</a></span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 66</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Tree data</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\"><a href=\"Tree.html\">Tree</a></span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"useHelper\">\n        <span class=\"type-signature\"></span>useHelper<span class=\"type-signature\"> :boolean</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 126</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Using helper flag</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">boolean</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"userSelectPropertyKey\">\n        <span class=\"type-signature\"></span>userSelectPropertyKey<span class=\"type-signature\"> :string</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 78</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Selectable element's property</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">string</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    <h4 class=\"name\" id=\"userSelectPropertyValue\">\n        <span class=\"type-signature\"></span>userSelectPropertyValue<span class=\"type-signature\"> :string</span>\n        \n        <div class=\"container-source members\">\n            <code>file</code>,\n            <code>line 84</code>\n        </div>\n        \n    </h4>\n\n    \n</dt>\n<dd>\n    \n    <div class=\"description\">\n        <p>Selectable element's property value</p>\n    </div>\n    \n\n    <!--\n    \n        <h5>Type:</h5>\n        <ul>\n            <li>\n                \n<span class=\"param-type\">string</span>\n\n\n            </li>\n        </ul>\n    \n    -->\n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n</dd>\n</div>\n\n        </dl>\n    </div>\n    \n\n    \n    <div class=\"container-methods\">\n        <h3 class=\"subsection-title\">Methods</h3>\n\n        <dl>\n            \n<div class=\"tui-hidden\">\n<dt>\n    \n        <h4 class=\"name\" id=\".getAPIList\">\n            <span class=\"type-signature\"><span class=\"icon green\">static</span> </span>getAPIList<span class=\"signature\">()</span><span class=\"type-signature\"> &rarr; {Array.&lt;string>}</span>\n            \n                <div class=\"container-source method\">\n                    <code>file</code>,\n                    <code>line 54</code>\n                </div>\n            \n        </h4>\n\n        \n    \n</dt>\n<dd>\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n    <div class=\"container-returns\">\n        <div class=\"returns\">\n        <h5>Returns:</h5>\n        <div class=\"details\">\n        \n                \n<div class=\"param-desc\">\n    <p>API list of Draggable</p>\n</div>\n\n            \n        </div>\n        </div>\n    </div>\n    \n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dd>\n</div>\n\n        \n            \n<div class=\"tui-hidden\">\n<dt>\n    \n        <h4 class=\"name\" id=\"destroy\">\n            <span class=\"type-signature\"></span>destroy<span class=\"signature\">()</span><span class=\"type-signature\"></span>\n            \n                <div class=\"container-source method\">\n                    <code>file</code>,\n                    <code>line 176</code>\n                </div>\n            \n        </h4>\n\n        \n    \n</dt>\n<dd>\n\n    \n    <div class=\"description\">\n        <p>Disable this module</p>\n    </div>\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n\n<dl class=\"details\">\n\n    \n\n    \n\n    <!--\n    \n    -->\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dl>\n\n\n\n    \n\n    \n\n    \n\n    \n\n    \n\n    \n</dd>\n</div>\n\n        </dl>\n    </div>\n    \n\n    \n\n    \n</article>\n\n</section>\n\n\n\n</div>"