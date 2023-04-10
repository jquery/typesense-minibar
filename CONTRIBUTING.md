# Contribute to typesense-minibar

## How it works

* Cut the mustard using `type="module"`.

## API

```js
tsminibar(document.querySelector('#myform'))`
```

Function parameters:

* `{HTMLElement} form`: The element must have `data-origin`, `data-collection`, and `data-key`, attributes; and contain a descendent of `<input type="search">`.
* `{Object} [options]`: (Optional)
  * `{boolean} [options.slash=true]`: Focus the input field if the `/` slash key is pressed outside any input or textarea element. When enabled, a `keydown` event listener is added to `document`. If multiple search forms are initiatilised on the same page, the first one bound with `slash=true` will "win".

## Development

Start local server for the demo:

```
python3 -m http.server 4100
```

Open <http://localhost:4100/demo/>
