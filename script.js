document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('starred-list');
  if (!container) return;
  container.setAttribute('aria-busy', 'true');

  fetch('events.json')
    .then(resp => {
      if (!resp.ok) throw new Error('Failed to load events.json');
      return resp.json();
    })
    .then(data => {
      renderList(container, data);
      container.setAttribute('aria-busy', 'false');
    })
    .catch(err => {
      container.textContent = 'Error loading starred repositories.';
      container.setAttribute('aria-busy', 'false');
      console.error(err);
    });
  const useApiChk = document.getElementById('use-github-api');
  const usernameInput = document.getElementById('github-username');
  const tokenInput = document.getElementById('github-token');
  const fetchBtn = document.getElementById('fetch-button');
  const retryBtn = document.getElementById('retry-button');
  const netStatus = document.getElementById('network-status');

  if (!container) return;

  function setBusy(val) { container.setAttribute('aria-busy', val ? 'true' : 'false'); }

  function fetchLocal() {
    return fetch('events.json').then(resp => {
      if (!resp.ok) throw new Error('Failed to load events.json');
      return resp.json();
    });
  }

  function fetchFromGitHub(user, token) {
    const url = `https://api.github.com/users/${encodeURIComponent(user)}/starred`;
    const headers = { 'Accept': 'application/vnd.github.v3+json' };
    if (token) headers['Authorization'] = 'token ' + token;
    return fetch(url, { headers }).then(resp => {
      if (!resp.ok) throw new Error('GitHub API error: ' + resp.status);
      return resp.json();
    }).then(repos => repos.map(r => ({
      owner: r.owner && r.owner.login,
      repo: r.name,
      description: r.description,
      html_url: r.html_url,
      language: r.language,
      stargazers_count: r.stargazers_count,
      starred_at: null
    })));
  }

  function showError(err) {
    container.textContent = 'Error loading starred repositories.';
    console.error(err);
    setBusy(false);
    if (retryBtn) retryBtn.style.display = 'inline-block';
  }

  function load() {
    setBusy(true);
    if (retryBtn) retryBtn.style.display = 'none';

    if (useApiChk && useApiChk.checked) {
      const user = usernameInput.value.trim();
      if (!user) {
        container.textContent = 'Enter a GitHub username to fetch starred repositories.';
        setBusy(false);
        return;
      }
      fetchFromGitHub(user, tokenInput.value.trim())
        .then(data => { renderList(container, data); setBusy(false); })
        .catch(showError);
    } else {
      fetchLocal().then(data => { renderList(container, data); setBusy(false); }).catch(showError);
    }
  }

  fetchBtn.addEventListener('click', load);
  if (retryBtn) retryBtn.addEventListener('click', () => { retryBtn.style.display = 'none'; load(); });

  function updateNetworkState() {
    if (netStatus) netStatus.textContent = navigator.onLine ? 'Online' : 'Offline';
    if (fetchBtn) fetchBtn.disabled = !navigator.onLine;
  }

  window.addEventListener('online', updateNetworkState);
  window.addEventListener('offline', updateNetworkState);
  updateNetworkState();

  // auto-load initial data
  load();
});

function renderList(container, items) {
  if (!Array.isArray(items) || items.length === 0) {
    container.innerHTML = '<p class="muted">No starred repositories found.</p>';
    return;
  }

  const ul = document.createElement('ul');
  ul.className = 'repo-list';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'repo-item';

    const main = document.createElement('div');
    main.className = 'repo-main';

    const a = document.createElement('a');
    a.className = 'repo-title';
    a.href = item.html_url || '#';
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.textContent = (item.owner ? item.owner + '/' : '') + (item.repo || 'unknown');

    const desc = document.createElement('div');
    desc.className = 'repo-desc';
    desc.textContent = item.description || '';

    main.appendChild(a);
    if (item.description) main.appendChild(desc);

    const meta = document.createElement('div');
    meta.className = 'repo-meta';
    if (item.language) {
      const spanLang = document.createElement('span');
      spanLang.textContent = item.language;
      meta.appendChild(spanLang);
    }
    if (item.stargazers_count || item.stargazers_count === 0) {
      const spanStars = document.createElement('span');
      spanStars.textContent = '★ ' + new Intl.NumberFormat().format(item.stargazers_count);
      meta.appendChild(spanStars);
    }
    if (item.starred_at) {
      const dateDiv = document.createElement('div');
      dateDiv.className = 'muted';
      dateDiv.textContent = 'Starred ' + new Date(item.starred_at).toLocaleDateString();
      meta.appendChild(dateDiv);
    }

    li.appendChild(main);
    li.appendChild(meta);
    ul.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(ul);
}
