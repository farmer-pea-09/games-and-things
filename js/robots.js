const buttons = document.querySelectorAll('.filters button');
const cards = document.querySelectorAll('.idea-card');

function showKind(kind) {
  cards.forEach((card) => {
    const match = kind === 'all'
      || card.dataset.kind === kind
      || (kind === 'sketched' && card.dataset.ready === '1');
    card.classList.toggle('hidden', !match);
    if (!match) card.classList.remove('open');
  });
  buttons.forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.kind === kind));
  });
  document.querySelectorAll('.lab-section').forEach((section) => {
    const visible = [...section.querySelectorAll('.idea-card')]
      .some((card) => !card.classList.contains('hidden'));
    section.classList.toggle('hidden', !visible);
  });
}

buttons.forEach((button) => {
  button.addEventListener('click', () => showKind(button.dataset.kind || 'all'));
});

document.querySelectorAll('.idea-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.idea-card');
    const open = card.classList.toggle('open');
    button.setAttribute('aria-expanded', String(open));
    button.textContent = open ? 'Hide plan' : 'Show plan';
  });
});
