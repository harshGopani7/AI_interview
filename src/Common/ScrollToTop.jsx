import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Scrolls to top on every route change. If a hash is present, attempts to scroll to that anchor.
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      // Wait a tick for the element to exist in the DOM
      setTimeout(() => {
        const id = hash.replace('#', '');
        const el = document.getElementById(id);
        if (el && el.scrollIntoView) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo(0, 0);
        }
      }, 0);
    } else {
      // Instant scroll to top to avoid initial bottom flash
      window.scrollTo(0, 0);
    }
  }, [pathname, hash]);

  return null;
}
