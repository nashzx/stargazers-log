document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('starred-list');
  if (!container) return;

  fetch('events.json')
    .then(resp => {
      if (!resp.ok) throw new Error('Failed to load events.json');
      return resp.json();
    })
    .then(data => renderList(container, data))
    .catch(err => { container.textContent = 'Error loading starred repositories.'; console.error(err); });
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
    const lang = item.language ? `<span>${item.language}</span>` : '';
    const stars = item.stargazers_count ? `<span>★ ${item.stargazers_count.toLocaleString()}</span>` : '';
    const date = item.starred_at ? `<div class="muted">Starred ${new Date(item.starred_at).toLocaleDateString()}</div>` : '';
    meta.innerHTML = `${lang} ${stars} ${date}`;

    li.appendChild(main);
    li.appendChild(meta);
    ul.appendChild(li);
  });

  container.innerHTML = '';
  container.appendChild(ul);
}
