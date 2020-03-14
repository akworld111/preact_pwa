# Kegtron reference implementation


## Mobile app structure

The mobile app is a preact web app (https://preactjs.com/). Preact constructs
Web UI dynamically from the hierarchy of JavaScript objects `preact.h`.
The hierarchy of `h` objects is rendered into the HTML:

```javascript
var a = h('div', {class: 'foo bar'}, 'hello', ' ', 'world');
window.onload = function() {
  preact.render(h(App.Main), document.body);
};
```

The snipped above will be rendered into the following HTML:

```HTML
...
<body><div class="foo bar">hello world</div></body>
```

The `h` signature is `h(htmlTag, htmlAttributes, children...)`. Children
could be strings, or other `h` objects - thus, a hierarchy could be
constructed by nesting `h` objects.

The main reason for using an intermediate object tree is to handle UI state.
In Preact, state handling is pure JS, simple and easy. There are couple of
object callback functions that are called by preact's state handling
machine. They are documented at https://preactjs.com/guide/v8/api-reference/#lifecycle-methods
The idiomatic JS3 usage, applied in the web app code, is as follows:

```javascript
var obj = function(props) {
  var self = this;
  self.componentDidMount = function() {  // Called when placed into DOM
    self.setState({ foo: 'bar' });
  };
  self.render = function(props, state) {
    // When we click on div, append '.' to the div content
    var onclick = function(ev) { self.setState({ foo: state.foo + '.' }); };
    return h('div', {onClick: onclick }, state.foo);
  };
};
```

That's the core of the whole UI.

The UI uses axios library to fetch data from mDash - again, the fetched data
is stored in the object's state, and the UI is rendered according to the
state changes:

```javascript
var obj = function(props) {
  var self = this;
  self.componentDidMount = function() {   // Called when placed into DOM
    self.setState({ somedata: [] });      // Data not loaded yet
    axios.get(url).then(function(res) {
      self.setState({ somedata: res.data });  // Data loaded, update state
    });
  };
  self.render = function(props, state) {
    // First, state.data is an empty array, so nothing is rendered.
    // But when data is fetched, state changes, and render() is called again,
    // it'll re-render the UI according to a new state, with new data.
    return h('div', {}, state.data.map(function(elem) { // Show data
      return h('div', {}, elem);
    }));
  };
};
```

Note that is is possible to use inline HTML code instead of `h()` calls,
but that requires JS6 support from the browser side, and thus might not
work on older browsers. 
