# Contribute to typesense-minibar

## Implementation notes

* The `cache` Map lets us instantly display any previous result in the same browser tab. We follow the [LRU strategy](https://en.wikipedia.org/wiki/Least_recently_used).

  For example, if you type `a`, `app`, `apple`, `apples`, and backspace to a shorter previous query, we instantly show those previous results. (No time wasted waiting for re-download of the same results. It also saves client bandwidth and server load.) Or, if you think another word might yield better results and replace it with `banana`, and return to `apple` because that had a better one, we respond instantly.

  We keep up to 100 past results in memory. After that, we prioritize keeping the most recently shown data, and delete older unused results. We assume that you're most likely to return to what you've seen most recently. (Maybe not within the last 10, but within 100. Even if you do return to the very first after a hundred, you're likely to pass by more recent ones on the way there. All queries have equal cost.) When we store a new result, or when we re-use an old result, we delete it and re-set it, so that it goes to the "bottom" of the map.

  When it is time to delete an old result, we take a key from the "top" of the map, which is either the oldest and never used, or the least recently used.

  If we only add new results and reuse results as-is ([FIFO strategy](https://en.wikipedia.org/wiki/FIFO_(computing_and_electronics))), that may delete very recently used data.

* The styles for `typesense-minibar` as web component, and `.tsmb-form` class name are kept independent (that is, the web component does not auto-add the class name, nor does it otherwise rely on styles for the class name, and vice versa).

  This is done for two reasons:

  1. Avoid selector conflict for Style API.
     If we were to add `class="tsmb-form"` in the web component, it would mean `typesense-minibar form` and `.tsmb-form` both match. This makes the `typesense-minibar form` selector impsosible to override in CSS for downstream users, because our defaults for `.tsmb-form` (weight 0010) would continue to "win" the cascade, as being a stronger selector than `typesense-minibar form` (weight 0002).
  2. Avoid a FOUC.
     The element should render identically and without reflows both before and after JavaScript loads. During local development it's easy to miss a FOUC if it fixes itself once JavaScript loads. By not auto-correcting these, the bugs are more obvious and we fix them.

## Internal API

```js
tsminibar(document.querySelector('#myform'))`
```

Function parameters:

* `{HTMLElement} form`: The element must have `data-origin`, `data-collection`, and `data-key`, attributes; and contain a descendent of `<input type="search">`.

## Typesense API

The `highlight_full_fields` and `include_fields` query is compatible with the query in [typesense-docsearch.js:/DocSearchModal.tsx](https://github.com/typesense/typesense-docsearch.js/blob/3.4.0/packages/docsearch-react/src/DocSearchModal.tsx).

The backend response is documented at <https://typesense.org/docs/0.24.1/api/search.html>. In particular, we assume the following:

* `hit.document.hierarchy.*`: This is already HTML-escaped. HTML tags are stripped from the original content, and special characters are escaped with HTML entities.
* `hit.highlights[0].snippet`: This is also trusted HTML. Some words may be wrapped in a `<mark>` element, to highlight matching words.

## Development

Start local server for the demo:

```
python3 -m http.server 4100
```

Open <http://localhost:4100/demo/>

## Release process

1. Bump version numbers

```sh
export MINIBAR_VERSION=x.y.z
```
```sh
sed -i'.bak' "1s/typesense-minibar [0-9\.]*/typesense-minibar $MINIBAR_VERSION/" typesense-minibar* && \
sed -i'.bak' "s/minibar@[^/]*/minibar@$MINIBAR_VERSION/g" README.md && \
sed -i'.bak' 's/"version": "[^"]*"/"version": "'$MINIBAR_VERSION'"/' package.json && \
rm *.bak
```

2. Stage commit and push for review.

```sh
git add -p && \
git commit -m "Release $MINIBAR_VERSION" && \
git push origin HEAD:release
```

3. Merge once CI has passed, or test locally in a secure environment using `npm install-test`.

```sh
git push origin HEAD:main
```

Clean up old branch:

```sh
git push origin :release
git remote prune origin
```

4. Push signed tag to Git and publish to npm.

```sh
git tag -s $MINIBAR_VERSION -m "Release $MINIBAR_VERSION" && git push --tags
```
```sh
npm publish
```
