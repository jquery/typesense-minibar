<p align="center"><img src="/assets/logo-text.svg" height="100" alt="minibar"></p>

<div align="center">

[![Continuous integration](https://github.com/Krinkle/typesense-minibar/actions/workflows/CI.yaml/badge.svg)](https://github.com/Krinkle/typesense-minibar/actions/workflows/CI.yaml?query=event%3Apush+branch%3Amain)
[![Test coverage](https://img.shields.io/badge/coverage-88%25-brightgreen.svg)](https://github.com/Krinkle/typesense-minibar/actions/workflows/CI.yaml?query=event%3Apush+branch%3Amain)
[![Tested with QUnit](https://img.shields.io/badge/tested_with-qunit-9c3493.svg)](https://qunitjs.com/)

</div>

**minibar** is a fast 2kB autocomplete search bar. It is an alternative to typesense-js (), typesense-docsearch.js, Algolia DocSearch.js, Autocomplete, and Instantsearch.

## Features

* **Dependency-free**, vanilla JavaScript
* **Small size**, 2kB transfer size
* **Progressive enhancement**, works without JavaScript
* **Responsive**, mobile-first layout
* **Accessible**, keyboard navigation, arrow keys, close on `Esc` or outside click
* **Fast**, leverages preconnect (Resource Hints), LRU memory cache
* **Easy to install**, fully declarative via HTML (no-code setup!)

## Getting started

```html
<form role="search" class="tsmb-form"
      data-origin="https://typesense.example"
      data-collection="example_data"
      data-key="xxx-searchonly-api-key">
  <input type="search">
</form>
```

```html
<script defer type="module" src="typesense-minibar.js"></script>
<link rel="stylesheet" href="typesense-minibar.css">
```

## Compatibility

| typesense-minibar | typesense-server | typesense-docsearch-scraper
|--|--|--
| 1.0 | >= 0.24 | 0.6.0.rc1 <!-- adds "group_by=url_without_anchor" -->

## Browser support

| Browser | Policy | Version
|--|--|--
| Firefox | Current and previous version,<br>Current and previous ESR | Firefox 74+ (2020)
| Chrome | Last three years | Chrome 80+ (2020)
| Edge | Last three years | Edge 80+ (2020)
| Opera | Last three years | Opera 67+ (2020)
| Safari | Last three years | Safari 13.1 (2020)
| iOS | Last three years | iOS 13.4 (2020)

<sup>Technical feature requirements: ES6 Classes, ES2020 Optional chaining, ES2022 Async functions, DOM NodeList-forEach.</sup>

Practical implications:

| OS | Supported from | Running
|--|--|--
| Android | [Moto G4](https://en.wikipedia.org/wiki/Moto_G4) (2016) | Android 7.0 with Chrome 80+
| Android | [Samsung Galaxy S7](https://en.wikipedia.org/wiki/Samsung_Galaxy_S7) (2016) | Android 7.0 - 8.0
| Android | [Samsung Galaxy A5](https://en.wikipedia.org/wiki/Samsung_Galaxy_A5_(2016)) (2016) | Android 7.0
| Android | [Google Pixel 1](https://en.wikipedia.org/wiki/Pixel_(1st_generation)) (2016) | Android 7.0
| iOS | [iPhone 6S](https://en.wikipedia.org/wiki/IPhone_6S) (2015) | iOS 13.4 (2020) upto iOS 15 (2022)
| Linux | Debian 9 Stretch (2018) | [firefox-esr 91](https://packages.debian.org/oldoldstable/firefox-esr)
| Linux | Debian 10 Stretch (2019) | [firefox-esr 102](https://packages.debian.org/oldstable/firefox-esr), [chromium 90](https://packages.debian.org/oldstable/chromium)
| Linux | Ubuntu 18.04 LTS (2018) | current [firefox](https://packages.ubuntu.com/bionic/firefox), current [chromium-browser](https://packages.ubuntu.com/bionic/chromium-browser)
| macOS | OS X 10.9 Mavericks (2013-2016) | Firefox 78 ESR (2020)<br>(Safari 7 default unsupported)
| macOS | OS X 10.13 Mavericks (2017-2020) | Firefox 78 ESR (2020), Chrome 80+<br>(Safari 11 default unsupported)
| macOS | OS X 10.15 Catalina (2019-2022) | Safari 13.1, Firefox 78 ESR (2020), Chrome 80+
| Windows | Windows 7 (2009) | current Edge, current Firefox

Notes:
* [Firefox release schedule](https://whattrainisitnow.com/calendar/)
* [iOS 16 dropped support](https://en.wikipedia.org/wiki/IOS_16#Supported_devices)
* [Google Chrome requires Android 7.0 and macOS 10.13](https://support.google.com/chrome/a/answer/7100626?hl=en)
* [Firefox 48 last to support OS X 10.6-10.8](https://www.mozilla.org/en-US/firefox/48.0/releasenotes/)
* [Firefox 78 last to support OS X 10.9-10.11](https://www.mozilla.org/en-US/firefox/78.0/releasenotes/)
