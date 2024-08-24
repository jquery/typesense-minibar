<p align="center"><img src="assets/logo-text.svg" height="100" alt="minibar"></p>

<div align="center">

[![Continuous integration](https://github.com/jquery/typesense-minibar/actions/workflows/CI.yaml/badge.svg)](https://github.com/jquery/typesense-minibar/actions/workflows/CI.yaml?query=event%3Apush+branch%3Amain)
[![Test coverage](https://img.shields.io/badge/coverage-95%25-brightgreen.svg)](https://jquery.github.io/typesense-minibar/coverage/)
[![Tested with QUnit](https://img.shields.io/badge/tested_with-qunit-9c3493.svg)](https://qunitjs.com/)

</div>

**minibar** is a fast 2kB autocomplete search bar for [Typesense](https://typesense.org/). It is an alternative to Algolia DocSearch, InstantSearch, autocomplete-js, typesense-docsearch.js, and typesense-js.

## Features

* **Dependency-free**, vanilla JavaScript
* **Small size**, 2kB transfer size
* **Progressive enhancement**, works without JavaScript
* **Responsive**, mobile-first layout
* **Accessible**, keyboard navigation, arrow keys, close on `Esc` or outside click
* **Fast**, leverages preconnect (Resource Hints), LRU memory cache
* **Easy to install**, fully declarative via HTML (zero-code setup!)
* **Web Component** ready
* **CSP ready** compatible with strict [CSP security](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP) settings

## Getting started

**[Demo](https://jquery.github.io/typesense-minibar/)**

```html
<typesense-minibar data-origin="" data-collection="" data-key="">
  <form role="search" action="https://duckduckgo.com">
    <input type="search" name="q" placeholder="Search..." autocomplete="off">
    <input type="hidden" name="sites" value="example.org">
  </form>
</typesense-minibar>
```

```html
<link rel="stylesheet" href="typesense-minibar.css">
<script defer type="module" src="typesense-minibar.js"></script>
```

Distribution:

* **jsDelivr** ([browse](https://cdn.jsdelivr.net/npm/typesense-minibar@1.3.4/)):<br>[typesense-minibar.js](https://cdn.jsdelivr.net/npm/typesense-minibar@1.3.4/typesense-minibar.js), [typesense-minibar.css](https://cdn.jsdelivr.net/npm/typesense-minibar@1.3.4/typesense-minibar.css)
* **UNPKG** ([browse](https://unpkg.com/browse/typesense-minibar@1.3.4/)):<br>[typesense-minibar.js](https://unpkg.com/typesense-minibar@1.3.4/typesense-minibar.js), [typesense-minibar.css](https://unpkg.com/typesense-minibar@1.3.4/typesense-minibar.css)
* npm: [typesense-minibar](https://www.npmjs.com/package/typesense-minibar)
  ```shell
  npm i --save typesense-minibar
  ```
  ```js
  // CommonJS
  require('typesense-minibar');
  // ESM
  import 'typesense-minibar';
  ```

## API

### Markup

As HTML custom element (aka Web Component):

```html
<typesense-minibar data-origin="" data-collection="" data-key="">
  <form role="search" action="https://duckduckgo.com">
    <input type="search" name="q" placeholder="Search..." autocomplete="off">
    <input type="hidden" name="sites" value="example.org">
  </form>
</typesense-minibar>
```

`<typesense-minibar><form>…</form></typesense-minibar>` is equivalent to `<form class="tsmb-form">`,
which you can also use directly:

```html
<form role="search" action="https://duckduckgo.com" class="tsmb-form"
    data-origin=""
    data-collection=""
    data-key=""
>
  <input type="search" name="q" placeholder="Search..." autocomplete="off">
  <input type="hidden" name="sites" value="example.org">
</form>
```

### Configuration

Set these attributes on `<typesense-minibar>` or `<form class="tsmb-form">`:

* ***data-origin*** (Required): Base URL to your Typesense server.

  Include the `https://` or `http://` protocol, and (if non-default) the port number.

  Example: `https://typesense.example.org`

* ***data-collection*** (Required): Which collection to query.

  Equal to the `"index_name"` in your `docsearch.config.json` file. If you index your websites
  with something other than [docsearch-scraper](https://github.com/typesense/typesense-docsearch-scraper),
  set this to the name of your Typesense collection ([Typesense API](https://typesense.org/docs/0.24.1/api/collections.html)).

  Example: `example_mine`

* ***data-key*** (Required): Search-only API key ([Typesense API](https://typesense.org/docs/0.24.1/api/api-keys.html#generate-scoped-search-key)).

  Example: `write000less000do000more0`

* [***data-slash***=true] (Optional): Focus the input field if the `/` slash key is pressed.

  When enabled, a `keydown` event listener is added to `document`. Key presses in `<input>` or `<textarea>` elements are safely ignored. If multiple search forms are initiatilised on the same page, the first has precedence.

  Set `data-slash="false"` to disable this feature.

* [***data-group***=false] (Optional): Group results under category headings.

  By default, search results render in a flat list, with the `lvl0` field
  as the page title, where `lvl0` typicaly selects h1, `lvl1` selects h2,
  and so on.

  To group results by category, configure [docsearch-scraper](https://github.com/typesense/typesense-docsearch-scraper)
  with `lvl0` selecting the category (not the `h1`). And `lvl1` should then
  instead select your `h1` page titles.

  Set `data-group="true"` to enable this feature.

* [***data-foot***=false] (Optional): Include a "Search by Typesense" link in the footer.

  Set `data-foot="true"` to enable this feature. When enabled, a plaintext link is added,
  styled using the Typesense brand color.

  Include [typesense-minibar-foot.css](./typesense-minibar-foot.css) to render the official
  Typesense wordmark instead.

* [***data-search-params***=""] (Optional): Modify search query parameters.

  Each key-value pair will be added as a search query parameter, or will override the default value.
  This property must be a valid URL parameters sequence, e.g. `"key1=value1&key2=value2"`.

  Refer to [typesense-minibar.js](./typesense-minibar.js) for the default search query parameters.
  Refer to [Typesense documentation](https://typesense.org/docs/0.24.1/api/search.html#search-parameters)
  for all the valid parameters.

* [***data-no-results***="No results for '{}'."] (Optional): The message to display when no results are found.

  The sequence of 2 curly brackets `{}` will be substituted with the queried text.

### Styling and theming

The accompanying stylesheet exposes **CSS variables** that you can override to
tweak styles, without writing custom CSS. Alternatively, you can target stable
selectors based on the **semantic HTML**.

Refer to [Style API](./API-Style.md) for the CSS variable names and selectors.

## Compatibility

| typesense-minibar | typesense-server | typesense-docsearch-scraper
|--|--|--
| 1.0.x | >= 0.24 | >= 0.6.0.rc1 <!-- adds "group_by=url_without_anchor" --> (Tested upto: 0.9.1)

### Browser support

The below matrix describes support for the _enhanced_ JavaScript experience. The HTML experience falls back to submitting a form to DuckDuckGo, and works in all known browsers (including  IE 6 and Netscape Navigator).

| Browser | Policy | Version
|--|--|--
| Firefox | Current and previous version,<br>Current and previous ESR | Firefox 74+ (2020)
| Chrome | Last three years | Chrome 80+ (2020)
| Edge | Last three years | Edge 80+ (2020)
| Opera | Last three years | Opera 67+ (2020)
| Safari | Last three years | Safari 13.1 (2020)
| iOS | Last three years | iOS 13.4 (2020)

<sup>Notable feature requirements: ES6 syntax, ES2020 Optional chaining, ES2022 Async functions, DOM NodeList-forEach.</sup>

Practical implications:

| OS | Supported from | Running
|--|--|--
| Android | [Moto G4](https://en.wikipedia.org/wiki/Moto_G4) (2016) | Android 7.0 with Chrome 80+
| Android | [Samsung Galaxy S7](https://en.wikipedia.org/wiki/Samsung_Galaxy_S7) (2016) | Android 7.0 - 8.0
| Android | [Samsung Galaxy A5](https://en.wikipedia.org/wiki/Samsung_Galaxy_A5_(2016)) (2016) | Android 7.0
| Android | [Google Pixel 1](https://en.wikipedia.org/wiki/Pixel_(1st_generation)) (2016) | Android 7.0
| iOS | [iPhone 6S](https://en.wikipedia.org/wiki/IPhone_6S) (2015) | iOS 13.4 (2020) upto iOS 15 (2022)
| Linux | Debian 9 Stretch (2018) | `firefox-esr` 91
| Linux | Debian 10 Buster (2019) | `firefox-esr` 102, `chromium` 90)
| Linux | Ubuntu 18.04 LTS (2018) | current `firefox`, current `chromium-browser`
| macOS | OS X 10.9 Mavericks (2013-2016) | Firefox 78 ESR (2020)<br>(Safari 7 default unsupported)
| macOS | OS X 10.13 Mavericks (2017-2020) | Firefox 78 ESR (2020), Chrome 80+<br>(Safari 11 default unsupported)
| macOS | OS X 10.15 Catalina (2019-2022) | Safari 13.1, Firefox 78 ESR (2020), Chrome 80+
| Windows | Windows 7 (2009) or later | current Edge, current Firefox

Notes:
* [Firefox release schedule](https://whattrainisitnow.com/calendar/)
* [iOS 16 dropped support](https://en.wikipedia.org/wiki/IOS_16#Supported_devices)
* [Google Chrome requires Android 7.0 and macOS 10.13](https://support.google.com/chrome/a/answer/7100626?hl=en)
* [Firefox 48 last to support OS X 10.6-10.8](https://www.mozilla.org/en-US/firefox/48.0/releasenotes/)
* [Firefox 78 last to support OS X 10.9-10.11](https://www.mozilla.org/en-US/firefox/78.0/releasenotes/)

## FAQ: Troubleshooting

* Why is the form not interactive if I insert it later?

  If you create or insert the element dynamically with JavaScript, it is recommended to write the form as a web component instead, like so:
  ```html
  <typesense-minibar>
    <form ..>..</form>
  </typesense-minibar>
  ```

  Web components automatically activate the relevant JavaScript, no matter when they are inserted on the page.

  By default, typesense-minibar.js also makes sure that any `<form class="tsmb-form">` elements on the page are hydrated and activated. This should catch any static element on the page (i.e. before "document ready", or the DOMContentLoaded event). This works internally by levering the fact that script execution is naturally deferred until the document is ready, via the `defer` and `type="module"` attributes on the `<script>` tag.

* How does this prevent JavaScript errors in older browsers? What about ES5?

  If you load typesense-minibar.js standalone, make sure you have the `type="module"` attribute on the `<script>` tag. Scripts with this type are naturally ignored by older browsers. The element works fine **without JavaScript**, following the principles of [progressive enhancement](https://en.wikipedia.org/wiki/Progressive_enhancement). This technique is analogous to "[cutting the mustard](https://responsivenews.tumblr.com/post/18948466399/cutting-the-mustard)".

## Feedback

For questions, bug reports, or feature requests, use the [Issue tracker](https://github.com/jquery/typesense-minibar/issues).
