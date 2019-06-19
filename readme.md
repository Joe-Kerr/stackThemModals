# StackThemModals: modal stack controller

Modal elemets are all around the place, be it popups, tooltips, context menus, widgets like colour pickers, and so on. So technically, for every element you needed to set up a document click listener, check whether clicks went inside or outside the element, evaluate what to do if there are modal elements on top of modal elements, etc.

Since this is far from being just a one-liner, it makes sense to provide this as a separate service.


## Features
- Only one listener for all modal elements.
- Knows what modals to close if multiples are opened.


## Requirements

- Web browser


## Install

**1)**
```
npm install @joe_kerr/stackthemmodals
```

**2)**

```
import modalStack from "./where_you_put_it/src/index.js";
```

or

```
const modalStack  = require("./where_you_put_it/dist/stackThemModals.common.js");
```

or

```
<html> <script src=""./where_you_put_it/dist/stackThemModals.browser.js""></script>
```


## Use

### push(`<dom node>` element, `<func>` callback, config)

Adds modal behaviour to the given element. Calls the callback if clicked outside of the element.

By default, when there are multiple modal elements, clicking outside of element A but within element B only destroys modal behaviour for A.

#### `<obj>`config

- `<bool>`stopPropagation: Should the modal click listener consume the event.

### forcePop(`<bool>`stack)

Cancels the modal behaviour - before it was clicked outside - of the last element (default) or, if the parameter is true, empties the entire stack.

Notice, just to be clear, you only need to call forcePop if you do not want to wait for the user to click outside of the modal. E.g.: if a user selects an option in a select box which should close the underlying modal container.


## Notes
- More options #todo.


## Versions

### 1.0.2
- - Fixed: ohh, I see now: https://github.com/webpack/webpack/issues/7646

### 1.0.1 
- Public release.


## Copyright

MIT (c) Joe Kerr 2019
