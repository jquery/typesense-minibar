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

  function simulate (element, type, props) {
    const event = new Event(type);
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

  let renderDone;
  async function expectRender (cb) {
    const promise = new Promise(resolve => { renderDone = resolve; });
    cb();
    return await promise;
  }
  hooks.before(() => {
    const renderSuper = TypesenseMinibar.prototype.render;
    TypesenseMinibar.prototype.render = function () {
      renderSuper.call(this);
      renderDone();
    };
  });

  let bar;
  hooks.afterEach(() => {
    if (bar) {
      bar.form.remove();
      bar.disconnect();
    }

    document.head.querySelectorAll('link[rel=preconnect]').forEach(link => link.remove());
  });

  QUnit.test('TypesenseMinibar constructor [fail without input element]', assert => {
    const form = parseHTML('<form>');

    assert.throws(() => {
      bar = new TypesenseMinibar(form);
    }, TypeError);
  });

  QUnit.test.each('TypesenseMinibar input', {
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
    'result with title-only': {
      value: 'something',
      resp: API_RESP_TITLE_MATCH,
      expect: `<div role="option">
        <a href="https://example.test/page" tabindex="-1">
          <div class="tsmb-suggestion_title">Page</div>
          <div class="tsmb-suggestion_content"></div>
        </a>
      </div>`
    },
    'result with title, headings, and snippet': {
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
    const bar = new TypesenseMinibar(form);

    mockFetchResponse = resp;
    input.value = value;
    await expectRender(() => {
      simulate(input, 'input');
    });

    assert.equal(normalizeHTML(bar.listbox.innerHTML), normalizeHTML(expect), 'listbox HTML');
  });

  QUnit.test('TypesenseMinibar input [memory cache hit]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    const bar = new TypesenseMinibar(form);

    mockFetchResponse = API_RESP_FULL_MATCH_SOME;
    input.value = 'some';
    await expectRender(() => {
      simulate(input, 'input');
    });
    assert.equal(bar.listbox.querySelector('.tsmb-suggestion_title').textContent, 'Some', 'result 1');

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(() => {
      simulate(input, 'input');
    });
    assert.equal(bar.listbox.querySelector('.tsmb-suggestion_title').textContent, 'Some › Thing', 'result 2');

    // expect cache hit, no fetch
    mockFetchResponse = null;
    input.value = 'some';
    await expectRender(() => {
      simulate(input, 'input');
    });
    assert.equal(bar.listbox.querySelector('.tsmb-suggestion_title').textContent, 'Some', 'result 3');
  });

  QUnit.test('TypesenseMinibar listbox [close on empty string or backspace]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    const bar = new TypesenseMinibar(form);

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(() => {
      simulate(input, 'input');
    });
    assert.false(bar.listbox.hidden, 'listbox not hidden');

    mockFetchResponse = null; // expect no fetch request for empty query
    input.value = '';
    simulate(input, 'input');

    assert.true(bar.listbox.hidden, 'listbox hidden');
  });

  QUnit.test('TypesenseMinibar listbox [close on Esc]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    const bar = new TypesenseMinibar(form);

    mockFetchResponse = API_RESP_FULL_MATCH_SOMETHING;
    input.value = 'something';
    await expectRender(() => {
      simulate(input, 'input');
    });
    assert.false(bar.listbox.hidden, 'listbox not hidden');
    assert.equal(bar.listbox.querySelector('mark').outerHTML, '<mark>something</mark>', 'snippet');

    mockFetchResponse = null;
    simulate(input, 'keydown', { code: 'Escape' });

    assert.true(bar.listbox.hidden, 'listbox hidden');
  });

  QUnit.test('TypesenseMinibar listbox [arrow key cursor]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    const bar = new TypesenseMinibar(form);

    mockFetchResponse = API_RESP_MULTIPLE;
    input.value = 'tv';
    await expectRender(() => {
      simulate(input, 'input');
    });
    assert.false(bar.listbox.hidden, 'listbox not hidden');
    assert.equal(
      normalizeHTML(bar.listbox.outerHTML),
      normalizeHTML(`<div role="listbox">
        <div role="option"><a href="https://example.test/a" tabindex="-1"><div class="tsmb-suggestion_title">Person</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/b" tabindex="-1"><div class="tsmb-suggestion_title">Woman</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/c" tabindex="-1"><div class="tsmb-suggestion_title">Camera</div><div class="tsmb-suggestion_content"></div></a></div>
      </div>`),
      'initial result'
    );

    await expectRender(() => {
      simulate(input, 'keydown', { code: 'ArrowDown' }); // -1 to 0
    });
    assert.equal(
      normalizeHTML(bar.listbox.outerHTML),
      normalizeHTML(`<div role="listbox">
        <div role="option" aria-selected="true"><a href="https://example.test/a" tabindex="-1"><div class="tsmb-suggestion_title">Person</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/b" tabindex="-1"><div class="tsmb-suggestion_title">Woman</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/c" tabindex="-1"><div class="tsmb-suggestion_title">Camera</div><div class="tsmb-suggestion_content"></div></a></div>
      </div>`),
      'select 0'
    );

    simulate(input, 'keydown', { code: 'ArrowDown' }); // 0 to 1
    simulate(input, 'keydown', { code: 'ArrowDown' }); // 1 to 2
    await expectRender(() => {
      simulate(input, 'keydown', { code: 'ArrowDown' }); // 2 to -1
    });
    assert.equal(
      normalizeHTML(bar.listbox.outerHTML),
      normalizeHTML(`<div role="listbox">
        <div role="option"><a href="https://example.test/a" tabindex="-1"><div class="tsmb-suggestion_title">Person</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/b" tabindex="-1"><div class="tsmb-suggestion_title">Woman</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/c" tabindex="-1"><div class="tsmb-suggestion_title">Camera</div><div class="tsmb-suggestion_content"></div></a></div>
      </div>`),
      'select none'
    );

    simulate(input, 'keydown', { code: 'ArrowUp' }); // -1 to 2 (wrap around)
    await expectRender(() => {
      simulate(input, 'keydown', { code: 'ArrowUp' }); // 2 to 1
    });
    assert.equal(
      normalizeHTML(bar.listbox.outerHTML),
      normalizeHTML(`<div role="listbox">
        <div role="option"><a href="https://example.test/a" tabindex="-1"><div class="tsmb-suggestion_title">Person</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option" aria-selected="true"><a href="https://example.test/b" tabindex="-1"><div class="tsmb-suggestion_title">Woman</div><div class="tsmb-suggestion_content"></div></a></div>
        <div role="option"><a href="https://example.test/c" tabindex="-1"><div class="tsmb-suggestion_title">Camera</div><div class="tsmb-suggestion_content"></div></a></div>
      </div>`),
      'select 1'
    );
  });

  QUnit.test('TypesenseMinibar focus [slash]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    document.body.append(form);
    assert.true(!document.activeElement || !form.contains(document.activeElement), 'initial focus');

    bar = new TypesenseMinibar(form);
    assert.true(!document.activeElement || !form.contains(document.activeElement), 'focus after contruct');

    simulate(document, 'keydown', { key: '/' });
    assert.strictEqual(document.activeElement, input, 'focus after slash');
  });

  QUnit.test('TypesenseMinibar focus [preconnect]', async assert => {
    const form = parseHTML('<form><input type="search"></form>');
    const input = form.firstChild;
    document.body.append(form);
    bar = new TypesenseMinibar(form);

    assert.strictEqual(document.head.querySelectorAll('link[rel=preconnect]').length, 0, 'initial preconnect');

    simulate(document, 'keydown', { key: '/' });
    assert.strictEqual(document.activeElement, input, 'focus after slash');
    await new Promise(resolve => setTimeout(resolve));
    assert.strictEqual(document.head.querySelectorAll('link[rel=preconnect]').length, 1, 'preconnect link');
  });
});
