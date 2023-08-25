# Contribute to typesense-minibar

## How it works

* Cut the mustard using `type="module"`.

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
sed -i'.bak' "s/typesense-minibar [0-9\.]*/typesense-minibar $MINIBAR_VERSION/" typesense-minibar* && \
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
