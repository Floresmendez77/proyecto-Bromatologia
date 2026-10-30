/**
 * @license MIT
 * Copyright (c) 2026 FitMate Contributors
 * Spotlight Pointer Coordinator
 * Uses requestAnimationFrame throttling for buttery 60fps cursor illumination on glass cards.
 */

export function initSpotlightCards(container = document) {
  let isMoving = false;
  let clientX = 0;
  let clientY = 0;

  container.addEventListener('pointermove', (e) => {
    clientX = e.clientX;
    clientY = e.clientY;

    if (!isMoving) {
      isMoving = true;
      requestAnimationFrame(() => {
        const cards = container.querySelectorAll('.glass-card, .glass-spotlight-card');
        for (let i = 0; i < cards.length; i++) {
          const card = cards[i];
          const rect = card.getBoundingClientRect();
          const x = clientX - rect.left;
          const y = clientY - rect.top;

          // Only calculate if cursor is in vicinity of the card
          if (x >= -100 && x <= rect.width + 100 && y >= -100 && y <= rect.height + 100) {
            card.style.setProperty('--mouse-x', `${x}px`);
            card.style.setProperty('--mouse-y', `${y}px`);
          }
        }
        isMoving = false;
      });
    }
  }, { passive: true });
}
