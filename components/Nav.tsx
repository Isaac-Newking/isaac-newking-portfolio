'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { SITE } from '@/content/site';

const isDarkNow = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
};

export default function Nav() {
  const [dark, setDark] = useState<boolean | null>(null);
  // Over the hero the menu floats; past it, it becomes a solid bar so it never sits on top of text,
  // and it slides away while scrolling down and returns as soon as you scroll up.
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setDark(isDarkNow());
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const sync = () => setDark(isDarkNow());
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    let lastY = scrollY, raf = 0;
    const update = () => {
      raf = 0;
      const y = scrollY;
      const hero = document.querySelector('.hero') as HTMLElement | null;
      const past = hero ? hero.getBoundingClientRect().bottom <= 64 : y > 64;
      setSolid(past);
      if (Math.abs(y - lastY) > 6) { setHidden(past && y > lastY); lastY = y; }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => { removeEventListener('scroll', onScroll); cancelAnimationFrame(raf); };
  }, []);

  const toggle = () => {
    const next = !isDarkNow();
    document.documentElement.dataset.theme = next ? 'dark' : 'light';
    try { localStorage.setItem('theme', next ? 'dark' : 'light'); } catch { /* storage blocked */ }
    setDark(next);
    window.dispatchEvent(new Event('themechange'));
  };

  return (
    <nav className={`nav${solid ? ' solid' : ''}${hidden ? ' hide' : ''}`} aria-label="Main" onFocus={() => setHidden(false)}>
      <Link className="mark" href="/">{SITE.name}</Link>
      <ul>
        <li><a href="#work">Work</a></li>
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#faq">FAQ</a></li>
        <li><a href="#contact">Contact</a></li>
      </ul>
      <button type="button" role="switch" aria-checked={dark === true} aria-label="Dark mode" onClick={toggle}
        className={`toggle${dark ? ' is-dark' : ''}${dark === null ? ' is-unset' : ''}`}>
        {/* pixel sun */}
        <svg className="ic sun" viewBox="0 0 9 9" aria-hidden="true"><path d="M4 0h1v1H4zM4 8h1v1H4zM0 4h1v1H0zM8 4h1v1H8zM1 1h1v1H1zM7 1h1v1H7zM1 7h1v1H1zM7 7h1v1H7zM3 3h3v3H3z" /></svg>
        {/* pixel moon */}
        <svg className="ic moon" viewBox="0 0 9 9" aria-hidden="true"><path d="M3 1h3v1H3zM2 2h2v1H2zM1 3h2v3H1zM2 6h2v1H2zM3 7h4v1H3zM6 6h2v1H6zM7 5h1v1H7z" /></svg>
        <span className="knob" aria-hidden="true" />
      </button>
    </nav>
  );
}
