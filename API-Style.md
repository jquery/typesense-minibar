[< Back to README](./README.md)

# Style API

We support two approaches to styling.

## CSS variables

You can **override CSS variables** that we expose, and change them to your preferred value.

This works best for making minor changes, such as changing the link and
highlight color, or creating a dark mode. Copy or import the [typesense-minibar.css](./typesense-minibar.css)
stylesheet, then override any of the below variables from your own stylesheet.

Note: Set variables on the `.tsmb-form` selector only. The variables are
automatically picked up by the internal more specific selectors.
You don't have to write any custom CSS rules!

Text sizes:
* `--tsmb-size-base`: Size of input text, group headings, and major whitespace.
* `--tsmb-size-sm`: Size of search results (title and excerpt), icon text (slash), and minor whitespace.
* `--tsmb-size-input`: Height of input field.

Misc sizes:
* `--tsmb-size-edge`: Line thickness of edges, e.g. border-width.
* `--tsmb-size-radius`: Roundness, e.g. border-radius.
* `--tsmb-size-highlight`: Line thickness of cursor highlight, e.g. border-left-width.
* `--tsmb-size-listbox-width`: The maximum width of the listbox. The minimum is the width of the input field.
* `--tsmb-size-listbox-max-height`: The maximum height of the listbox.
* `--tsmb-size-listbox-right`: Set to `0` to create a right-aligned listbox that expands to the left.

Base layout, for idle or inactive input field:
* `--tsmb-color-base-background`: Background color, e.g. white in lightmode.
* `--tsmb-color-base30`: Hard constrast (for input text), e.g. dark grey in lightmode.
* `--tsmb-color-base50`: Medium contrast (for input placeholder), e.g. medium grey in lightmode.
* `--tsmb-color-base90`: Subtle contrast (for lines, slash icon), e.g. light pastel in lightmode.

Active layout, for active input field and result box. Defaults to the same colors as above.
* `--tsmb-color-focus-background`: Background color, e.g. white in lightmode.
* `--tsmb-color-focus30`: Hard contrast (focussed input text).
* `--tsmb-color-focus50`: Medium contrast (for search result excerpt, focussed placeholder, footer).
* `--tsmb-color-focus90`: Subtle contrast (for result borders).

Primary colors, by default only used in the active layout:
* `--tsmb-color-primary30`: Hard contrast, for colorful dark background or dark text.
* `--tsmb-color-primary50`: Medium contrast, for colorful links or buttons.
* `--tsmb-color-primary90`: Subtle contrast, for selection background.

Example:

```css
/* Dark theme for inactive input field. */
.tsmb-form {
  --tsmb-color-base-background: #691c69;
  --tsmb-color-base30: #390f39;
  --tsmb-color-base50: #c090c0;
  --tsmb-color-base90: #c090c0;
}
```

## Semantic HTML

Alternatively, you can opt-out of the accompanying stylesheet and make your own!
In that case, we recommend you target the documented selectors below.

| Selector | Description
| --- | :---
| `.tsmb-form--slash …` | Pressing a slash will activate this form. Use as basis for longer selectors.<br/><br/>This selector matches after the JavaScript code has run, unless configured with `data-slash=false`). This ensures you can safely use it to create a slash icon, and trust that it won't be displayed if JavaScript failed, was unsupported, or was disabled.<br><br>**Example**: `.tsmb-form--slash:not(:focus-within)::after { content: '/'; }`
| `.tsmb-form--open` | The form currently has an open result box.
| `.tsmb-form[data-group=true] …` | Override styled when using grouped results. Use as basis for longer selectors.
| `.tsmb-form input[type=search]`<br><br>`.tsmb-form input[type=search]::placeholder` | Input field.
| `.tsmb-form [role=listbox]` | Dropdown menu, populated with either one or more search results, or `.tsmb-empty`. When the results are closed, this element is hidden by setting the native `hidden` attribute.
| `.tsmb-form [role=option]`<br><br>`.tsmb-form [role=option][aria-selected=true]` | Search result.
| `.tsmb-form [role=option] a` | Clickable portion of result (title + content). This covers the full search result, except when results are grouped, then the first result in a group additionally contains `.tsmb-suggestion_group` outside the clickable portion.
| `.tsmb-form [role=option] mark` | Matching characters or words, e.g. in the excerpt.
| `.tsmb-suggestion_group` | Group heading, may appear if the form is configured with `data-group=true`.
| `.tsmb-suggestion_title` | Page title and optionally heading breadcrumbs to the matching paragraph.
| `.tsmb-suggestion_content` | Page excerpt, typically a matching sentence.
| `.tsmb-empty`                                                                                           <!-- min-width --> | Placeholder when there are no results.
| `.tsmb-icon-close` | SVG injected by JavaScript. Hidden by default. A click handler is bound that will close the results. It is recommended to make this visible only when results are visible.<br><br>**Example**:<br><code>.tsmb-form--open .tsmb-icon-close { display: block !important; }</code>

Example DOM, stripped of internal details:

```html
<form role="search" data-origin="…" data-collection="…" data-key="…"
      class="tsmb-form"
>
	<input type="search">

	<div role="listbox">
		<div role="option" aria-selected="true">
			<a href="…">
				<div class="tsmb-suggestion_title">…</div>
				<div class="tsmb-suggestion_content">…</div>
			</a>
		</div>
		<div role="option">…</div>
	</div>

	<svg class="tsmb-icon-close">…</svg>
</form>
```

Example DOM, when using `data-group=true`:

```html
<form role="search" data-origin="…" data-collection="…" data-key="…"
      class="tsmb-form"
      data-group="true"
>
	<input type="search">

	<div role="listbox">
		<div role="option">
			<div class="tsmb-suggestion_group">My Group</div>
			<a href="…">…</a>
		</div>
		<div role="option">
			<a href="…">…</a>
		</div>
		<div role="option">
			<div class="tsmb-suggestion_group">My Second Group</div>
			<a href="…">…</a>
		</div>
	</div>

	<svg class="tsmb-icon-close">…</svg>
</form>
```

Example DOM, when using `data-foot=true`:

```html
<form role="search" data-origin="…" data-collection="…" data-key="…"
      class="tsmb-form"
      data-foot="true"
>
	<input type="search">

	<div role="listbox">
		<div role="option">…</div>
		<div role="option">…</div>
		<a class="tsmb-foot" href="https://typesense.org" title="Search by Typesense"></a>
	</div>

	<svg class="tsmb-icon-close">…</svg>
</form>
```
