/* eslint-env qunit */
/* eslint-disable no-new, quotes */

QUnit.config.testTimeout = 1000;

const API_RESP_EMPTY = {};
const API_RESP_TITLE_MATCH = {
  grouped_hits: [{
    hits: [{
      document: {
        url: 'https://example.test/page',
        hierarchy: {
          lvl0: 'Page'
        }
      },
      highlights: []
    }]
  }]
};
const API_RESP_FULL_MATCH_SOMETHING = {
  grouped_hits: [{
    hits: [{
      document: {
        url: 'https://example.test/some',
        hierarchy: {
          lvl0: 'Some',
          lvl1: 'Thing'
        }
      },
      highlights: [{
        snippet: 'Foo <mark>something</mark> baz.'
      }]
    }]
  }]
};
const API_RESP_FULL_MATCH_SOME = {
  grouped_hits: [{
    hits: [{
      document: {
        url: 'https://example.test/some',
        hierarchy: {
          lvl0: 'Some'
        }
      },
      highlights: [{
        snippet: 'First <mark>some</mark> foo.'
      }]
    }]
  }]
};
const API_RESP_MULTIPLE = {
  grouped_hits: [{
    hits: [{
      document: {
        url: 'https://example.test/a',
        hierarchy: {
          lvl0: 'Person'
        }
      },
      highlights: []
    }]
  }, {
    hits: [{
      document: {
        url: 'https://example.test/b',
        hierarchy: {
          lvl0: 'Woman'
        }
      },
      highlights: []
    }]
  }, {
    hits: [{
      document: {
        url: 'https://example.test/c',
        hierarchy: {
          lvl0: 'Camera'
        }
      },
      highlights: []
    }]
  }]
};

QUnit.module('typesense-minibar', hooks => {
  function parseHTML (html) {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.firstChild;
  }

  function simulate (element, type, options, props) {
    const event = new Event(type, options);
    Object.assign(event, props);
    element.dispatchEvent(event);
  }

  function normalizeHTML (str) {
    return str.replace(/>\s*</g, '>\n<');
  }

  let mockFetchResponse;
  hooks.before(() => {
    globalThis.fetch = function () {
      if (!mockFetchResponse) throw new Error('Unexpected fetch: No mock response pending');

      return {
        async json () {
          const ret = mockFetchResponse;
          mockFetchResponse = null; // consume only once
          return ret;
        }
      };
    };
  });
  hooks.afterEach(() => {
    mockFetchResponse = null;
  });

  async function expectRender (targetElement, cb) {
    let renderDone;
    const promise = new Promise(resolve => { renderDone = resolve; });
    const observer = new MutationObserver(() => {
      renderDone();
    });
    observer.observe(targetElement, { attributes: true, childList: true, subtree: true });
    cb();
    await new Promise(resolve => setTimeout(resolve));
    observer.disconnect();
    return await promise;
  }

  let bar;
  hooks.afterEach(() => {
    if (bar) {
      bar.form.remove();
      bar.disconnect();
      bar = null;
    }

    document.head.querySelectorAll('link[rel=preconnect]').forEach(link => link.remove());
  });

  QUnit.test('init [fail without input element]', assert => {
    const form = parseHTML('<form>');

    assert.throws(() => {
      bar = tsminibar(form);
    }, TypeError);
  });

  QUnit.test.each('input', {
    'no results': {
      value: 'something',
      resp: API_RESP_EMPTY,
      expect: `<div class="tsmb-empty">No results for 'something'.</div>`
    },
    'no results escaped': {
      value: 'something<',
      resp: API_RESP_EMPTY,
      expect: `<div class="tsmb-empty">No results for 'something&lt;'.</div>`
    },
    'title-only': {
      value: 'something',
      resp: API_RESP_TITLE_MATCH,
      expect: `<div role="option">
        <a href="https://example.test/page" tabindex="-1">
          <div class="tsmb-suggestion_title">Page</div>
          <div class="tsmb-suggestion_content"></div>
        </a>
      </div>`
    },
    'title, headings, and snippet': {
      value: 'something',
      resp: API_RESP_FULL_MATCH_SOMETHING,
      expect: `<div role="option">
        <a href="https://example.test/some" tabindex="-1">
          <div class="tsmb-suggestion_title">Some › Thing</div>
          <div class="tsmb-suggestion_content">Foo <mark>something</mark> baz.</div>
        </a>
      </div>`
    },
  }, async (assert, { value, resp, expect }) => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = resp;
    input.value = value;
    await expectRender(form, () => {
      simulate(input, 'input');
    });

    assert.equal(normalizeHTML(listbox.innerHTML), normalizeHTML(expect), 'listbox HTML');
  });

  QUnit.test.each('input with grouped results', {
    'title-only': {
      value: 'something',
      resp: API_RESP_TITLE_MATCH,
      expect: `<div role="option">
        <div class="tsmb-suggestion_group">Page</div>
        <a href="https://example.test/page" tabindex="-1">
          <div class="tsmb-suggestion_title">Page</div>
          <div class="tsmb-suggestion_content"></div>
        </a>
      </div>`
    },
    'title, headings, and snippet': {
      value: 'something',
      resp: API_RESP_FULL_MATCH_SOMETHING,
      expect: `<div role="option">
        <div class="tsmb-suggestion_group">Some</div>
        <a href="https://example.test/some" tabindex="-1">
          <div class="tsmb-suggestion_title">Thing</div>
          <div class="tsmb-suggestion_content">Foo <mark>something</mark> baz.</div>
        </a>
      </div>`
    },
  }, async (assert, { value, resp, expect }) => {
    const form = parseHTML('<form data-group="true"><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = resp;
    input.value = value;
    await expectRender(form, () => {
      simulate(input, 'input');
    });

    assert.equal(normalizeHTML(listbox.innerHTML), normalizeHTML(expect), 'listbox HTML');
  });

  QUnit.test('input [memory cache hit]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_FULL_MATCH_SOME;
    input.value = 'some';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.equal(listbox.querySelector('.tsmb-suggestion_title').textContent, 'Some', 'result 1');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.equal(listbox.querySelector('.tsmb-suggestion_title').textContent, 'Some › Thing', 'result 2');

    // expect cache hit, no fetch
    mockFetchResponse = null;
    input.value = 'some';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.equal(listbox.querySelector('.tsmb-suggestion_title').textContent, 'Some', 'result 3');
  });

  QUnit.test('listbox [close on empty string or backspace]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.false(listbox.hidden, 'listbox not hidden');

    mockFetchResponse = null; // expect no fetch request for empty query
    input.value = '';
    simulate(input, 'input');

    assert.true(listbox.hidden, 'listbox hidden');
  });

  QUnit.test('listbox [close on Esc]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.false(listbox.hidden, 'listbox not hidden');
    assert.equal(listbox.querySelector('mark').outerHTML, '<mark>something</mark>', 'snippet');

    mockFetchResponse = null;
    simulate(input, 'keydown', {}, { code: 'Escape' });

    assert.true(listbox.hidden, 'listbox hidden');
  });

  QUnit.test('listbox [close button]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.false(listbox.hidden, 'listbox not hidden');

    mockFetchResponse = null;
    simulate(form.querySelector('svg.tsmb-icon-close'), 'click', { bubbles: true });

    assert.true(listbox.hidden, 'listbox hidden');
    assert.equal(input.value, '', 'clear input value');
  });

  QUnit.test('listbox [close on outside click]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.false(listbox.hidden, 'listbox not hidden');
    assert.equal(listbox.querySelector('mark').outerHTML, '<mark>something</mark>', 'snippet');

    mockFetchResponse = null;
    simulate(document.body, 'click', { bubbles: true });

    assert.true(listbox.hidden, 'listbox hidden');
  });

  QUnit.test('listbox [re-open on click]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.false(listbox.hidden, 'listbox not hidden');

    mockFetchResponse = null;
    simulate(document.body, 'click', { bubbles: true });
    assert.true(listbox.hidden, 'listbox hidden');

    simulate(input, 'click', { bubbles: true });
    assert.false(listbox.hidden, 'listbox re-opened');
  });

  QUnit.test('listbox [no stale result leak on refocus]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.false(listbox.hidden, 'listbox not hidden');
    assert.equal(listbox.querySelector('mark').outerHTML, '<mark>something</mark>', 'snippet');

    // When backspacing and making the input empty, we hide the listbox.
    // Given that empty string isn't a valid query, this means no results
    // are rendered. If we later re-focus the input field, we should not leak
    // results from the last query (i.e. before the last backspace), as those
    // are now unrelated.
    mockFetchResponse = null;
    input.value = '';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.true(listbox.hidden, 'listbox hidden');

    mockFetchResponse = null;
    simulate(document.body, 'click', { bubbles: true });
    assert.true(listbox.hidden, 'listbox remains hidden (document)');

    simulate(input, 'click', { bubbles: true });
    assert.true(listbox.hidden, 'listbox remains hidden (refocus)');
    // It would be fine if render() was more lazy and left innerHTML populated
    // when rendering a close() that sets `state.open = false`. It only matters
    // that state.hits is cleared and that any future render() call will not make
    // the element visible, unless it also replaces innerHTML then.
    // But.. for simplicity, right now, we do clear the HTML unconditonally,
    // so let's assert that, and detect potentially unintended changes in the future.
    assert.equal(listbox.querySelector('mark')?.textContent, null, 'stale snippet gone');
  });

  QUnit.test('listbox [arrow key cursor]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_MULTIPLE;
    input.value = 'tv';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.false(listbox.hidden, 'listbox not hidden');
    assert.equal(
      normalizeHTML(listbox.outerHTML),
      normalizeHTML(`<div role="listbox">
        <div role="option"><a href="https://example.test/a" tabindex="-1"><div class="tsmb-suggestion_title">Person</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/b" tabindex="-1"><div class="tsmb-suggestion_title">Woman</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/c" tabindex="-1"><div class="tsmb-suggestion_title">Camera</div><div class="tsmb-suggestion_content"></div></a></div>
      </div>`),
      'initial result'
    );

    await expectRender(form, () => {
      simulate(input, 'keydown', {}, { code: 'ArrowDown' }); // -1 to 0
    });
    assert.equal(
      normalizeHTML(listbox.outerHTML),
      normalizeHTML(`<div role="listbox">
        <div role="option" aria-selected="true"><a href="https://example.test/a" tabindex="-1"><div class="tsmb-suggestion_title">Person</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/b" tabindex="-1"><div class="tsmb-suggestion_title">Woman</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/c" tabindex="-1"><div class="tsmb-suggestion_title">Camera</div><div class="tsmb-suggestion_content"></div></a></div>
      </div>`),
      'select 0'
    );

    simulate(input, 'keydown', {}, { code: 'ArrowDown' }); // 0 to 1
    simulate(input, 'keydown', {}, { code: 'ArrowDown' }); // 1 to 2
    await expectRender(form, () => {
      simulate(input, 'keydown', {}, { code: 'ArrowDown' }); // 2 to -1
    });
    assert.equal(
      normalizeHTML(listbox.outerHTML),
      normalizeHTML(`<div role="listbox">
        <div role="option"><a href="https://example.test/a" tabindex="-1"><div class="tsmb-suggestion_title">Person</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/b" tabindex="-1"><div class="tsmb-suggestion_title">Woman</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/c" tabindex="-1"><div class="tsmb-suggestion_title">Camera</div><div class="tsmb-suggestion_content"></div></a></div>
      </div>`),
      'select none'
    );

    simulate(input, 'keydown', {}, { code: 'ArrowUp' }); // -1 to 2 (wrap around)
    await expectRender(form, () => {
      simulate(input, 'keydown', {}, { code: 'ArrowUp' }); // 2 to 1
    });
    assert.equal(
      normalizeHTML(listbox.outerHTML),
      normalizeHTML(`<div role="listbox">
        <div role="option"><a href="https://example.test/a" tabindex="-1"><div class="tsmb-suggestion_title">Person</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option" aria-selected="true"><a href="https://example.test/b" tabindex="-1"><div class="tsmb-suggestion_title">Woman</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/c" tabindex="-1"><div class="tsmb-suggestion_title">Camera</div><div class="tsmb-suggestion_content"></div></a></div>
      </div>`),
      'select 1'
    );
  });

  QUnit.test('focus [slash]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    document.body.append(form);
    assert.false(form.contains(document.activeElement || null), 'initial focus');

    bar = tsminibar(form);
    assert.false(form.contains(document.activeElement || null), 'focus after contruct');

    simulate(document, 'keydown', {}, { key: '/' });
    assert.strictEqual(document.activeElement, input, 'focus after slash');
  });

  QUnit.test('focus [re-open results]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    document.body.append(form);
    bar = tsminibar(form);
    const listbox = form.querySelector('[role=listbox]');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(form, () => {
      simulate(input, 'input');
    });
    assert.false(listbox.hidden, 'listbox not hidden');

    mockFetchResponse = null;
    simulate(document.body, 'click', { bubbles: true });
    assert.true(listbox.hidden, 'listbox hidden');

    input.focus();
    assert.false(listbox.hidden, 'listbox re-opened');
  });

  QUnit.test('focus [preconnect]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    document.body.append(form);
    bar = tsminibar(form);

    assert.strictEqual(document.head.querySelectorAll('link[rel=preconnect]').length, 0, 'initial preconnect');

    simulate(document, 'keydown', {}, { key: '/' });
    assert.strictEqual(document.activeElement, input, 'focus after slash');
    await new Promise(resolve => setTimeout(resolve));
    assert.strictEqual(document.head.querySelectorAll('link[rel=preconnect]').length, 1, 'preconnect link');
  });
});
