/*! typesense-minibar 1.0.0 | Copyright Timo Tijhof <https://timotijhof.net> | License: MIT */
globalThis.TypesenseMinibar = class TypesenseMinibar {
  constructor (form, options) {
    this.origin = form.dataset.origin;
    this.key = form.dataset.key;
    this.collection = form.dataset.collection;
    this.options = options || {};

    this.form = form;
    this.input = form.querySelector('input[type=search]');
    this.listbox = document.createElement('div');
    this.preconnect = null;
    this.cache = new Map();
    this.state = {
      query: '',
      hits: [],
      cursor: -1,
      open: false,
    };
    this.onDocClick = this.onDocClick.bind(this);
    this.onDocSlash = this.onDocSlash.bind(this);

    this.listbox.setAttribute('role', 'listbox');
    this.listbox.hidden = true;
    this.input.after(this.listbox);
    this.input.addEventListener('click', () => {
      if (!this.preconnect) {
        this.preconnect = document.createElement('link');
        this.preconnect.rel = 'preconnect';
        this.preconnect.crossOrigin = 'anonymous'; // for fetch(mode:cors,credentials:omit)
        this.preconnect.href = this.origin;
        document.head.append(this.preconnect);
      }
      if (!this.state.open && this.state.hits.length) {
        this.state.open = true;
        this.render();
      }
    });
    this.input.addEventListener('input', async () => {
      const query = this.state.query = this.input.value;
      if (!query) {
        this.state.hits = []; // avoid non-current hits on focus
        this.state.cursor = -1;
        this.close();
        return;
      }
      const hits = await this.search(query);
      if (this.state.query === query) { // ignore response to non-current query
        this.state.hits = hits;
        this.state.cursor = -1;
        this.state.open = true;
        this.render();
      }
    });
    this.input.addEventListener('keydown', e => {
      if (!(e.altKey || e.ctrlKey || e.metaKey || e.shiftKey)) {
        if (e.code === 'ArrowDown') this.moveCursor(1);
        if (e.code === 'ArrowUp') this.moveCursor(-1);
        if (e.code === 'Escape') this.close();
        if (e.code === 'Enter') {
          const url = this.state.hits[this.state.cursor]?.url;
          if (url) {
            location.href = url;
          }
        }
      }
    });
    this.form.addEventListener('submit', e => {
      e.preventDefault(); // disable fallback
    });
    this.form.insertAdjacentHTML('beforeend', '<svg viewBox="0 0 12 12" width="20" height="20" aria-hidden="true" class="tsmb-icon-close" style="display: none;"><path d="M9 3L3 9M3 3L9 9"/></svg>');
    this.form.querySelector('.tsmb-icon-close').addEventListener('click', this.close.bind(this));
    this.connect();
  }

  onDocClick (e) {
    if (!this.form.contains(e.target)) this.close();
  }

  onDocSlash (e) {
    if (e.key === '/' && !/^(INPUT|TEXTAREA)$/.test(document.activeElement?.tagName)) {
      this.input.focus();
      e.preventDefault();
    }
  }

  connect () {
    document.addEventListener('click', this.onDocClick);
    if (this.options.slash !== false) {
      document.addEventListener('keydown', this.onDocSlash);
      this.form.classList.add('tsmb-form--slash');
    }
  }

  disconnect () {
    document.removeEventListener('click', this.onDocClick);
    document.removeEventListener('keydown', this.onDocSlash);
  }

  async search (query) {
    const cached = this.cache.get(query);
    if (cached) {
      this.cache.delete(query);
      this.cache.set(query, cached); // track LRU
      return cached;
    }

    // https://typesense.org/docs/0.24.1/api/search.html
    const resp = await fetch(
      `${this.origin}/collections/${this.collection}/documents/search?` + new URLSearchParams({
        q: query,
        per_page: '5',
        // based on https://github.com/typesense/typesense-docsearch.js/blob/3.4.0/packages/docsearch-react/src/DocSearchModal.tsx
        query_by: 'hierarchy.lvl0,hierarchy.lvl1,hierarchy.lvl2,hierarchy.lvl3,hierarchy.lvl4,hierarchy.lvl5,hierarchy.lvl6,content',
        include_fields: 'hierarchy.lvl0,hierarchy.lvl1,hierarchy.lvl2,hierarchy.lvl3,hierarchy.lvl4,hierarchy.lvl5,hierarchy.lvl6,content,url_without_anchor,url,id',
        highlight_full_fields: 'hierarchy.lvl0,hierarchy.lvl1,hierarchy.lvl2,hierarchy.lvl3,hierarchy.lvl4,hierarchy.lvl5,hierarchy.lvl6,content',
        group_by: 'url_without_anchor',
        group_limit: '1',
        sort_by: 'item_priority:desc',
        snippet_threshold: '8',
        highlight_affix_num_tokens: '12',
        'x-typesense-api-key': this.key,
      }),
      {
        mode: 'cors',
        credentials: 'omit',
        method: 'GET',
      }
    );
    const data = await resp.json();
    // flatten hit objects for HTML template
    const hits = data?.grouped_hits?.map(ghit => {
      const hit = ghit.hits[0];
      return {
        titleHtml: [hit.document.hierarchy.lvl0, hit.document.hierarchy.lvl1, hit.document.hierarchy.lvl2, hit.document.hierarchy.lvl3, hit.document.hierarchy.lvl4, hit.document.hierarchy.lvl5].filter(lvl => !!lvl).join(' › '),
        url: hit.document.url,
        contentHtml: hit.highlights[0]?.snippet || hit.document.content || ''
      };
    }) || [];

    this.cache.set(query, hits);
    if (this.cache.size > 100) {
      this.cache.delete(this.cache.keys().next().value);
    }
    return hits;
  }

  escapeText (s) {
    return s.replace(/['"<>&]/g, c => ({ "'": '&#039;', '"': '&quot;', '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));
  }

  render () {
    this.listbox.hidden = !this.state.open;
    this.form.classList.toggle('tsmb-form--open', this.state.open);
    if (this.state.open) {
      this.listbox.innerHTML = this.state.hits.map((hit, i) => `<div role="option"${i === this.state.cursor ? ' aria-selected="true"' : ''}><a href="${hit.url}" tabindex="-1"><div class="tsmb-suggestion_title">${hit.titleHtml}</div><div class="tsmb-suggestion_content">${hit.contentHtml}</div></a></div>`).join('') || `<div class="tsmb-empty">No results for '${this.escapeText(this.state.query)}'.</div>`;
    }
  }

  moveCursor (offset) {
    this.state.cursor += offset;
    // -1 refers to input field
    if (this.state.cursor >= this.state.hits.length) {
      this.state.cursor = -1;
    } else if (this.state.cursor < -1) {
      this.state.cursor = this.state.hits.length - 1;
    }
    this.render();
  }

  close () {
    if (this.state.open) {
      this.state.open = false;
      this.state.cursor = -1;
      this.render();
    }
  }
};

document.querySelectorAll('.tsmb-form[data-origin]').forEach(form => new TypesenseMinibar(form));
