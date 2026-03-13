'use client'

import { useEffect, useState } from 'react'

const OomaWordmark = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="155 155 580 155" fill="currentColor" className={className}>
    <path d="M228.1,168c41.4,0,62.1,33.6,62.1,67.3c0,33.6-20.6,67.3-62.1,67.3c-41.3,0-62.1-33.8-62.1-67.3C166,201.6,186.8,168,228.1,168z M170.8,235.5c0,31.5,25.1,62.8,56.6,62.8s48-31.5,48-63s-16-63.1-47.5-63.1S170.8,204,170.8,235.5z"/>
    <path d="M366.3,168c41.4,0,62.1,33.6,62.1,67.3c0,33.6-20.6,67.3-62.1,67.3c-41.3,0-62.1-33.8-62.1-67.3C304.2,201.6,325,168,366.3,168z M319.2,235.3c0,31.5,15.6,63.1,47.1,63.1s47.3-31.5,47.3-63.1s-15.8-63.1-47.3-63.1S319.2,203.8,319.2,235.3z"/>
    <path d="M432.3,298.4c2.8-0.9,11.5-1.1,13.1-11.4l10-102c1.2-11.4-5.8-12.7-8.6-13.6c-0.5-0.2-0.7-1.3-0.7-1.3h22.4l40.1,107.5l40.2-107.5h21c0,0,0,1.1-0.5,1.3c-2.6,0.9-8.8,2.4-8.9,11.4l10.1,103.8c1.5,10,10.3,10.1,12.9,11.1c0.5,0.2,0.5,1.5,0.5,1.5h-39c0,0,0-1.3,0.5-1.5c-2.8-0.9,11-0.9,10.8-10.3l-9.6-99.8l-41.6,111.6h-4.5L459,189.2l-9.6,99.1c-0.2,9.2,8.3,9.2,10.8,10.1c0.5,0.2,0.3,1.5,0.3,1.5h-28.7C431.8,299.9,431.8,298.6,432.3,298.4z"/>
    <path d="M587.1,298.4c2.8-0.9,9.5-3.5,12.9-11.3l44.2-106.4c-3.4-5.9-8.9-7.9-11.2-8.7c-0.5-0.2-0.5-1.3-0.5-1.3h21.7l48.3,116.4c3.4,7.7,10.3,10.3,12.9,11.3c0.5,0.2,0.7,1.5,0.7,1.5h-36.1c0,0,0-1.3,0.5-1.5c-2.8-0.9,9.6-2,6.7-11.1l-8.6-20.8h-65.7l-8.6,20.8c-3.1,9,4.1,10.1,6.7,11.1c0.5,0.2,0.5,1.5,0.5,1.5h-24.9C586.6,299.9,586.6,298.6,587.1,298.4z M614.8,262.3h61.9l-30.9-74.9L614.8,262.3z"/>
    <path d="M191.6,235.5c0-21.9,7.5-41.5,20.6-54.1c-23.7,9.2-36.8,31.7-36.8,54.1c0,22.5,13.1,45,36.8,54.1C199.2,277,191.6,257.5,191.6,235.5z"/>
  </svg>
)

const MoonIsotipo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <circle cx="100" cy="100" r="88" stroke="currentColor" strokeWidth="6"/>
    <path d="M100 20 C60 20 28 52 28 100 C28 148 60 180 100 180 C74 164 56 134 56 100 C56 66 74 36 100 20Z" fill="currentColor" opacity="0.55"/>
  </svg>
)

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    // Staggered hero animation
    const heroEls = document.querySelectorAll('.hero-anim')
    heroEls.forEach((el, i) => {
      setTimeout(() => {
        (el as HTMLElement).style.opacity = '1';
        (el as HTMLElement).style.transform = 'translateY(0)';
      }, 200 + i * 120)
    })

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).style.opacity = '1';
          (entry.target as HTMLElement).style.transform = 'translateY(0)';
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.08 })

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el))

    // Smooth scroll
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const href = (a as HTMLAnchorElement).getAttribute('href')
        if (href && href !== '#') {
          e.preventDefault()
          document.querySelector(href)?.scrollIntoView({ behavior: 'smooth' })
        }
      })
    })

    return () => observer.disconnect()
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --ink: #1C1A14;
          --terra: #9C7A52;
          --terra-mid: #B8956A;
          --terra-pale: #DFC9A8;
          --sage: #6E7B6A;
          --sage-lt: #9BAA96;
          --sage-pale: #CBD6C7;
          --gold: #C8A96A;
          --gold-lt: #DEC28F;
          --gold-pale: #F0DCBA;
          --stone: #C8BFB0;
          --linen: #EBE5DA;
          --cloud: #F4F0E8;
          --moon: #FAF7F2;
          --mgray: #8A8070;
          --lgray: #BDB3A8;
          --rule: #DAD3C8;
          --font-display: var(--font-playfair), 'Playfair Display', Georgia, serif;
          --font-body: var(--font-jost), 'Jost', system-ui, sans-serif;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        html { scroll-behavior: smooth; }

        body {
          background: var(--moon);
          color: var(--ink);
          font-family: var(--font-body);
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        /* ── NAV ── */
        .nav {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 100;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 52px;
          background: rgba(250,247,242,0.95);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--rule);
        }
        .nav-logo { width: 140px; color: var(--ink); flex-shrink: 0; }
        .nav-links {
          display: flex; gap: 32px; align-items: center;
          position: absolute; left: 50%; transform: translateX(-50%);
        }
        .nav-links a {
          font-family: var(--font-body);
          font-size: 8px; font-weight: 400;
          letter-spacing: .26em; text-transform: uppercase;
          color: var(--mgray); text-decoration: none;
          transition: color 200ms;
        }
        .nav-links a:hover { color: var(--terra); }
        .nav-ctas { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
        .btn-login-nav {
          font-family: var(--font-body);
          font-size: 9px; font-weight: 400;
          letter-spacing: .3em; text-transform: uppercase;
          color: var(--mgray); background: none; border: none;
          cursor: pointer; padding: 10px 16px;
          text-decoration: none; transition: color 200ms;
        }
        .btn-login-nav:hover { color: var(--terra); }
        .btn-signup-nav {
          font-family: var(--font-body);
          font-size: 9px; font-weight: 400;
          letter-spacing: .3em; text-transform: uppercase;
          color: var(--moon); background: var(--terra);
          border: none; cursor: pointer;
          padding: 10px 22px; border-radius: 0;
          text-decoration: none; transition: background 200ms;
        }
        .btn-signup-nav:hover { background: var(--ink); }

        .hamburger {
          display: none; flex-direction: column; gap: 5px;
          cursor: pointer; background: none; border: none; padding: 4px;
        }
        .hamburger span {
          display: block; width: 22px; height: 1.5px;
          background: var(--ink);
        }

        .mobile-menu {
          display: none;
          position: fixed;
          top: 60px; left: 0; right: 0;
          background: var(--moon);
          border-bottom: 1px solid var(--rule);
          padding: 24px 32px;
          flex-direction: column; gap: 20px;
          z-index: 99;
        }
        .mobile-menu.open { display: flex; }
        .mobile-menu a {
          font-family: var(--font-body);
          font-size: 9px; font-weight: 400;
          letter-spacing: .26em; text-transform: uppercase;
          color: var(--mgray); text-decoration: none;
        }
        .mobile-menu-ctas {
          display: flex; gap: 10px; margin-top: 8px;
        }

        /* ── HERO ── */
        .hero {
          min-height: 100vh;
          background: var(--ink);
          display: flex; align-items: center; justify-content: center;
          position: relative; overflow: hidden;
          padding-top: 60px;
        }
        .hero-ring {
          position: absolute;
          width: 900px; height: 900px;
          border: 1px solid rgba(201,168,108,0.08);
          border-radius: 50%;
          top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          pointer-events: none;
        }
        .hero-ring-2 {
          width: 600px; height: 600px;
          border-color: rgba(201,168,108,0.05);
        }
        .hero-grain {
          position: absolute; inset: 0; pointer-events: none;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E");
          opacity: 0.04;
        }
        .hero-content {
          position: relative; z-index: 2;
          display: flex; flex-direction: column;
          align-items: center; text-align: center;
          gap: 20px; padding: 0 24px;
        }
        .hero-eyebrow {
          font-family: var(--font-body);
          font-size: 7.5px; font-weight: 400;
          letter-spacing: .55em; text-transform: uppercase;
          color: var(--gold);
          opacity: 0; transform: translateY(20px);
          transition: opacity 800ms ease, transform 800ms ease;
        }
        .hero-moon {
          width: 72px; height: 72px; color: var(--moon);
          opacity: 0; transform: translateY(20px);
          transition: opacity 800ms ease, transform 800ms ease;
        }
        .hero-wordmark {
          width: clamp(260px, 48vw, 640px);
          color: var(--moon);
          opacity: 0; transform: translateY(20px);
          transition: opacity 800ms ease, transform 800ms ease;
        }
        .hero-subtitle {
          font-family: var(--font-body);
          font-size: 10px; font-weight: 400;
          letter-spacing: .65em; text-transform: uppercase;
          color: rgba(250,248,244,0.35);
          opacity: 0; transform: translateY(20px);
          transition: opacity 800ms ease, transform 800ms ease;
        }
        .hero-tagline {
          font-family: var(--font-display);
          font-style: italic;
          font-size: clamp(14px, 1.8vw, 22px); font-weight: 300;
          color: rgba(201,168,108,0.6);
          opacity: 0; transform: translateY(20px);
          transition: opacity 800ms ease, transform 800ms ease;
        }
        .hero-headline {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 52px); font-weight: 300;
          color: var(--moon); line-height: 1.1;
          max-width: 620px;
          opacity: 0; transform: translateY(20px);
          transition: opacity 800ms ease, transform 800ms ease;
        }
        .hero-ctas {
          display: flex; gap: 16px; align-items: center;
          margin-top: 8px;
          opacity: 0; transform: translateY(20px);
          transition: opacity 800ms ease, transform 800ms ease;
        }
        .btn-primary {
          font-family: var(--font-body);
          font-size: 9px; font-weight: 400;
          letter-spacing: .3em; text-transform: uppercase;
          color: var(--moon); background: var(--terra);
          border: none; border-radius: 0;
          padding: 14px 36px; cursor: pointer;
          text-decoration: none;
          transition: background 200ms, color 200ms, transform 200ms;
        }
        .btn-primary:hover {
          background: var(--gold); color: var(--ink);
          transform: translateY(-1px);
        }
        .btn-ghost {
          font-family: var(--font-body);
          font-size: 9px; font-weight: 400;
          letter-spacing: .3em; text-transform: uppercase;
          color: rgba(250,248,244,0.55);
          background: none; border-radius: 0;
          border: 1px solid rgba(250,248,244,0.25);
          padding: 14px 36px; cursor: pointer;
          text-decoration: none;
          transition: border-color 200ms, color 200ms, transform 200ms;
        }
        .btn-ghost:hover {
          border-color: rgba(250,248,244,0.6);
          color: var(--moon);
          transform: translateY(-1px);
        }
        .hero-scroll {
          position: absolute; bottom: 36px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px;
          opacity: 0.4;
        }
        .hero-scroll-line {
          width: 1px; height: 40px; background: var(--gold);
        }
        .hero-scroll-chevron {
          color: var(--gold);
          font-size: 10px; line-height: 1;
        }

        /* ── REVEAL ── */
        .reveal {
          opacity: 0;
          transform: translateY(18px);
          transition: opacity 0.72s ease, transform 0.72s ease;
        }

        /* ── PHILOSOPHY ── */
        .philosophy {
          background: var(--linen);
          padding: 100px 56px;
          position: relative; overflow: hidden;
        }
        .philosophy-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr; gap: 80px;
          align-items: center;
        }
        .section-tag {
          font-family: var(--font-body);
          font-size: 8px; font-weight: 400;
          letter-spacing: .42em; text-transform: uppercase;
          color: var(--terra); margin-bottom: 28px;
        }
        .philosophy-text {
          font-family: var(--font-display);
          font-size: clamp(22px, 3vw, 40px); font-weight: 300;
          line-height: 1.55; color: var(--ink);
        }
        .philosophy-text em { font-style: italic; color: var(--terra); }
        .philosophy-decor {
          position: relative; display: flex;
          align-items: center; justify-content: center;
          height: 360px;
        }
        .philosophy-circle {
          position: absolute; border-radius: 50%;
          border: 1px solid rgba(156,122,82,0.1);
        }
        .philosophy-circle-1 { width: 360px; height: 360px; }
        .philosophy-circle-2 { width: 240px; height: 240px; border-color: rgba(156,122,82,0.06); }
        .philosophy-isotipo { width: 80px; height: 80px; color: var(--terra-pale); }

        /* ── OFFERINGS ── */
        .offerings {
          background: var(--cloud);
          padding: 80px 56px;
        }
        .offerings-inner { max-width: 1200px; margin: 0 auto; }
        .offerings-header { margin-bottom: 52px; }
        .offerings-header h2 {
          font-family: var(--font-display);
          font-size: clamp(36px, 5vw, 72px); font-weight: 300;
          color: var(--ink); margin: 8px 0;
        }
        .offerings-sub {
          font-family: var(--font-body);
          font-size: 12px; font-weight: 300;
          color: var(--mgray); letter-spacing: .04em;
        }
        .offerings-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 1px;
          background: var(--rule);
          border: 1px solid var(--rule);
        }
        .offering-card {
          background: var(--cloud);
          padding: 44px 40px;
          position: relative;
          border-top: 2px solid transparent;
          transition: box-shadow 300ms;
          overflow: hidden;
        }
        .offering-card:hover {
          box-shadow: 0 8px 32px rgba(0,0,0,0.06);
        }
        .offering-card.terra { border-top-color: var(--terra); }
        .offering-card.sage { border-top-color: var(--sage); }
        .offering-card.gold { border-top-color: var(--gold); }
        .offering-ghost-num {
          position: absolute; top: 16px; right: 24px;
          font-family: var(--font-display);
          font-size: 52px; font-weight: 400;
          color: rgba(156,122,82,0.06);
          line-height: 1; user-select: none;
        }
        .offering-title {
          font-family: var(--font-display);
          font-size: 22px; font-weight: 400;
          color: var(--ink); margin-bottom: 12px;
        }
        .offering-body {
          font-family: var(--font-body);
          font-size: 11px; font-weight: 300;
          color: var(--mgray); line-height: 1.85;
          margin-bottom: 20px;
        }
        .offering-label {
          font-family: var(--font-body);
          font-size: 8px; font-weight: 400;
          letter-spacing: .26em; text-transform: uppercase;
        }
        .offering-label.terra { color: var(--terra); }
        .offering-label.sage { color: var(--sage); }
        .offering-label.gold { color: var(--gold); }

        /* ── PILLARS ── */
        .pillars {
          background: var(--ink);
          padding: 100px 56px;
        }
        .pillars-inner { max-width: 1200px; margin: 0 auto; }
        .pillars-tag {
          font-family: var(--font-body);
          font-size: 8px; font-weight: 400;
          letter-spacing: .42em; text-transform: uppercase;
          color: var(--gold); margin-bottom: 20px;
        }
        .pillars-title {
          font-family: var(--font-display);
          font-size: clamp(28px, 4vw, 56px); font-weight: 300;
          color: var(--moon); margin-bottom: 12px;
        }
        .pillars-sub {
          font-family: var(--font-body);
          font-size: 12px; font-weight: 300;
          color: rgba(250,248,244,0.45);
          max-width: 580px; line-height: 1.8;
          margin-bottom: 56px;
        }
        .pillars-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
        }
        .pillar-card {
          border: 1px solid rgba(201,168,108,0.12);
          padding: 36px 28px;
        }
        .pillar-greek {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 11px; font-weight: 300;
          letter-spacing: .22em;
          color: var(--gold); margin-bottom: 14px;
        }
        .pillar-title {
          font-family: var(--font-display);
          font-size: 20px; font-weight: 300;
          color: var(--moon); margin-bottom: 12px;
        }
        .pillar-body {
          font-family: var(--font-body);
          font-size: 10.5px; font-weight: 300;
          color: rgba(250,248,244,0.45);
          line-height: 1.95;
        }

        /* ── TESTIMONIAL ── */
        .testimonial {
          background: var(--terra);
          padding: 80px 56px;
        }
        .testimonial-inner {
          max-width: 680px; margin: 0 auto;
          display: flex; flex-direction: column;
          align-items: center; text-align: center; gap: 24px;
        }
        .testimonial-isotipo { width: 60px; height: 60px; color: rgba(250,248,244,0.15); }
        .testimonial-quote {
          font-family: var(--font-display);
          font-style: italic;
          font-size: clamp(18px, 2.4vw, 30px); font-weight: 300;
          color: var(--moon); line-height: 1.6;
        }
        .testimonial-rule {
          width: 40px; height: 1px; background: rgba(250,248,244,0.25);
        }
        .testimonial-attr {
          font-family: var(--font-body);
          font-size: 8px; font-weight: 400;
          letter-spacing: .3em; text-transform: uppercase;
          color: rgba(250,248,244,0.45);
        }

        /* ── MEMBERSHIP ── */
        .membership {
          background: var(--linen);
          padding: 100px 56px;
        }
        .membership-inner { max-width: 1200px; margin: 0 auto; }
        .membership-header { max-width: 640px; margin: 0 auto 56px; text-align: center; }
        .membership-header h2 {
          font-family: var(--font-display);
          font-size: clamp(32px, 4.5vw, 64px); font-weight: 300;
          color: var(--ink); margin: 12px 0;
        }
        .membership-sub {
          font-family: var(--font-body);
          font-size: 13px; font-weight: 300;
          color: var(--mgray); line-height: 2;
        }
        .membership-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 32px;
        }
        .membership-card {
          border: 1px solid var(--rule);
          background: var(--cloud);
          padding: 36px 28px;
          border-top: 1px solid var(--rule);
          transition: transform 300ms, box-shadow 300ms;
          display: flex; flex-direction: column; gap: 12px;
        }
        .membership-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 40px rgba(0,0,0,0.08);
        }
        .membership-card.featured {
          border-top: 2px solid var(--gold);
        }
        .membership-num {
          font-family: var(--font-body);
          font-size: 8px; font-weight: 400;
          letter-spacing: .4em; text-transform: uppercase;
          color: var(--lgray);
        }
        .membership-badge {
          display: inline-block;
          font-family: var(--font-body);
          font-size: 7px; font-weight: 400;
          letter-spacing: .3em; text-transform: uppercase;
          color: var(--gold); border: 1px solid rgba(200,169,106,0.35);
          padding: 3px 8px; margin-bottom: 4px;
          align-self: flex-start;
        }
        .membership-name {
          font-family: var(--font-display);
          font-size: 24px; font-weight: 300;
          color: var(--ink);
        }
        .membership-price {
          font-family: var(--font-body);
          font-size: 11px; font-weight: 300;
          color: var(--mgray); letter-spacing: .06em;
          flex: 1;
        }
        .btn-join-card {
          font-family: var(--font-body);
          font-size: 9px; font-weight: 400;
          letter-spacing: .3em; text-transform: uppercase;
          color: var(--moon); background: var(--terra);
          border: none; border-radius: 0;
          padding: 13px 20px; cursor: pointer;
          text-decoration: none; display: block;
          text-align: center; width: 100%;
          transition: background 200ms;
        }
        .btn-join-card:hover { background: var(--ink); }
        .membership-already {
          text-align: center;
          font-family: var(--font-body);
          font-size: 11px; font-weight: 300;
          color: var(--mgray);
        }
        .membership-already a {
          color: var(--terra); text-decoration: none;
          letter-spacing: .04em;
        }
        .membership-already a:hover { text-decoration: underline; }

        /* ── FOOTER ── */
        .footer {
          background: var(--ink);
          padding: 60px 56px 40px;
        }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: grid; grid-template-columns: 1fr 1fr 1fr;
          gap: 40px; align-items: start;
          padding-bottom: 32px;
          border-bottom: 1px solid rgba(250,248,244,0.08);
        }
        .footer-logo { width: 180px; color: var(--moon); }
        .footer-tagline {
          font-family: var(--font-display);
          font-style: italic;
          font-size: 14px; font-weight: 300;
          color: rgba(250,248,244,0.35);
          margin-top: 12px;
        }
        .footer-nav {
          display: flex; flex-direction: column; gap: 14px;
          padding-top: 8px;
        }
        .footer-nav a {
          font-family: var(--font-body);
          font-size: 8px; font-weight: 400;
          letter-spacing: .26em; text-transform: uppercase;
          color: rgba(250,248,244,0.4); text-decoration: none;
          transition: color 200ms;
        }
        .footer-nav a:hover { color: var(--terra); }
        .footer-right { display: flex; flex-direction: column; gap: 14px; align-items: flex-end; }
        .footer-handle {
          font-family: var(--font-body);
          font-size: 8px; letter-spacing: .16em;
          color: rgba(250,248,244,0.3);
        }
        .footer-socials { display: flex; gap: 16px; }
        .footer-socials a {
          color: rgba(250,248,244,0.3); text-decoration: none;
          transition: color 200ms;
        }
        .footer-socials a:hover { color: var(--terra); }
        .footer-copyright {
          max-width: 1200px; margin: 24px auto 0;
          font-family: var(--font-body);
          font-size: 7px; font-weight: 400;
          letter-spacing: .1em; text-transform: uppercase;
          color: rgba(250,248,244,0.2);
          text-align: center;
        }

        /* ── RESPONSIVE ── */
        @media (max-width: 1024px) {
          .pillars-grid { grid-template-columns: repeat(2, 1fr); }
          .philosophy-inner { grid-template-columns: 1fr; }
          .philosophy-decor { display: none; }
        }

        @media (max-width: 768px) {
          .nav { padding: 0 24px; }
          .nav-links { display: none; }
          .nav-ctas { display: none; }
          .hamburger { display: flex; }

          .hero { padding: 80px 24px 80px; }
          .hero-wordmark { width: clamp(200px, 80vw, 380px); }

          .philosophy { padding: 72px 24px; }
          .offerings { padding: 72px 24px; }
          .offerings-grid { grid-template-columns: 1fr; }
          .pillars { padding: 72px 24px; }
          .pillars-grid { grid-template-columns: 1fr; }
          .testimonial { padding: 72px 24px; }
          .membership { padding: 72px 24px; }
          .membership-grid { grid-template-columns: 1fr; }
          .footer { padding: 52px 24px 32px; }
          .footer-inner { grid-template-columns: 1fr; gap: 32px; }
          .footer-right { align-items: flex-start; }
        }
      `}} />

      {/* NAV */}
      <nav className="nav">
        <a href="#" aria-label="OOMA Home">
          <OomaWordmark className="nav-logo" />
        </a>
        <div className="nav-links">
          <a href="#clases">Clases</a>
          <a href="#metodo">Método</a>
          <a href="#comunidad">Comunidad</a>
          <a href="#precios">Precios</a>
        </div>
        <div className="nav-ctas">
          <a href="/login" className="btn-login-nav">Log In</a>
          <a href="/signup" className="btn-signup-nav">Join Ooma</a>
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu">
          <span /><span /><span />
        </button>
      </nav>

      {/* MOBILE MENU */}
      <div className={`mobile-menu${menuOpen ? ' open' : ''}`}>
        <a href="#clases" onClick={() => setMenuOpen(false)}>Clases</a>
        <a href="#metodo" onClick={() => setMenuOpen(false)}>Método</a>
        <a href="#comunidad" onClick={() => setMenuOpen(false)}>Comunidad</a>
        <a href="#precios" onClick={() => setMenuOpen(false)}>Precios</a>
        <div className="mobile-menu-ctas">
          <a href="/login" className="btn-login-nav" style={{padding:'10px 0'}}>Log In</a>
          <a href="/signup" className="btn-signup-nav">Join Ooma</a>
        </div>
      </div>

      {/* HERO */}
      <section className="hero">
        <div className="hero-ring" />
        <div className="hero-ring hero-ring-2" />
        <div className="hero-grain" />
        <div className="hero-content">
          <p className="hero-eyebrow hero-anim">OOMA Wellness Club · 2026</p>
          <MoonIsotipo className="hero-moon hero-anim" />
          <OomaWordmark className="hero-wordmark hero-anim" />
          <p className="hero-subtitle hero-anim">Wellness Club</p>
          <p className="hero-tagline hero-anim">El cuerpo es tu obra maestra.</p>
          <h1 className="hero-headline hero-anim">No viniste a sudar. Viniste a construirte.</h1>
          <div className="hero-ctas hero-anim">
            <a href="/signup" className="btn-primary">Join Ooma</a>
            <a href="/login" className="btn-ghost">Log In</a>
          </div>
        </div>
        <div className="hero-scroll">
          <div className="hero-scroll-line" />
          <span className="hero-scroll-chevron">↓</span>
        </div>
      </section>

      {/* PHILOSOPHY */}
      <section className="philosophy" id="metodo">
        <div className="philosophy-inner">
          <div className="reveal">
            <p className="section-tag">Manifiesto · Filosofía</p>
            <p className="philosophy-text">
              OOMA existe en el espacio entre<br />
              el <em>esfuerzo</em> y la <em>gracia</em>.<br /><br />
              Donde el método se convierte en ritual.<br />
              Donde la disciplina se convierte en identidad.<br />
              Donde el movimiento se convierte en<br />
              la mejor conversación que tienes<br />
              contigo mismo.
            </p>
          </div>
          <div className="philosophy-decor reveal">
            <div className="philosophy-circle philosophy-circle-1" />
            <div className="philosophy-circle philosophy-circle-2" />
            <MoonIsotipo className="philosophy-isotipo" />
          </div>
        </div>
      </section>

      {/* OFFERINGS */}
      <section className="offerings" id="clases">
        <div className="offerings-inner">
          <div className="offerings-header reveal">
            <p className="section-tag">03 — Método</p>
            <h2>Las clases</h2>
            <p className="offerings-sub">El movimiento tiene muchas formas. Elige la tuya.</p>
          </div>
          <div className="offerings-grid">
            <div className="offering-card terra reveal">
              <span className="offering-ghost-num">01</span>
              <h3 className="offering-title">Reformer</h3>
              <p className="offering-body">El método más preciso de control corporal. Fuerza, estabilidad y movilidad en cada sesión.</p>
              <span className="offering-label terra">STOTT Method · Reformer</span>
            </div>
            <div className="offering-card sage reveal">
              <span className="offering-ghost-num">02</span>
              <h3 className="offering-title">Yoga</h3>
              <p className="offering-body">De lo dinámico a lo restaurativo. Cada práctica es un diálogo entre tu cuerpo y tu respiración.</p>
              <span className="offering-label sage">Vinyasa · Yin · Restaurativo</span>
            </div>
            <div className="offering-card gold reveal">
              <span className="offering-ghost-num">03</span>
              <h3 className="offering-title">Power Flow</h3>
              <p className="offering-body">La intensidad con método. HIIT y reformer combinados para quienes buscan el siguiente nivel.</p>
              <span className="offering-label gold">HIIT · Reformer Fusion</span>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="pillars" id="comunidad">
        <div className="pillars-inner">
          <div className="reveal">
            <p className="pillars-tag">Por qué Ooma</p>
            <h2 className="pillars-title">El cuerpo como templo griego.</h2>
            <p className="pillars-sub">En la Grecia antigua, el cuerpo no era separado del alma — era su expresión más bella.</p>
          </div>
          <div className="pillars-grid">
            {[
              { greek: 'Ἀρετή · Areté', title: 'Excelencia', body: 'La búsqueda de la mejor versión de uno mismo — no por vanidad, sino por respeto propio.' },
              { greek: 'Σελήνη · Selene', title: 'El ciclo lunar', body: 'Como la luna que da nombre a nuestra O, el cuerpo vive en ciclos. Entrenamiento, descanso, nutrición.' },
              { greek: 'Κοινωνία · Koinonía', title: 'Comunidad', body: 'En OOMA, el progreso individual florece en el calor de un colectivo que se impulsa.' },
              { greek: 'Μέθοδος · Methodos', title: 'El Método', body: 'Primero la técnica. Luego la intensidad. Siempre con propósito.' },
            ].map((p, i) => (
              <div key={i} className="pillar-card reveal">
                <p className="pillar-greek">{p.greek}</p>
                <h3 className="pillar-title">{p.title}</h3>
                <p className="pillar-body">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIAL */}
      <section className="testimonial">
        <div className="testimonial-inner reveal">
          <MoonIsotipo className="testimonial-isotipo" />
          <blockquote className="testimonial-quote">
            &ldquo;No vine buscando un gimnasio. Encontré un método, una comunidad y la mejor versión de mí misma.&rdquo;
          </blockquote>
          <div className="testimonial-rule" />
          <p className="testimonial-attr">— Ana M. · Miembro desde 2024</p>
        </div>
      </section>

      {/* MEMBERSHIP */}
      <section className="membership" id="precios">
        <div className="membership-inner">
          <div className="membership-header reveal">
            <p className="section-tag">Membresías</p>
            <h2>Tu práctica, tu ritmo.</h2>
            <p className="membership-sub">OOMA ofrece membresías mensuales, paquetes de clases y acceso a retiros y workshops especiales. Sin contratos forzosos. Sin presión. Solo compromiso contigo mismo.</p>
          </div>
          <div className="membership-grid">
            {[
              { num: '01', name: 'Luna', tag: 'Inicio', price: 'desde $XXX / mes', plan: 'luna' },
              { num: '02', name: 'Sol', tag: 'Popular', price: 'desde $XXX / mes', plan: 'sol', featured: true },
              { num: '03', name: 'Areté', tag: 'Gold', price: 'desde $XXX / mes', plan: 'arete' },
            ].map((t, i) => (
              <div key={i} className={`membership-card reveal${t.featured ? ' featured' : ''}`}>
                <p className="membership-num">{t.num}</p>
                {t.featured && <span className="membership-badge">Más popular</span>}
                <h3 className="membership-name">{t.name}</h3>
                <p className="membership-price">{t.price}</p>
                <a href={`/signup?plan=${t.plan}`} className="btn-join-card">Join Ooma →</a>
              </div>
            ))}
          </div>
          <p className="membership-already reveal">
            Already a member? <a href="/login">Log In →</a>
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div>
            <OomaWordmark className="footer-logo" />
            <p className="footer-tagline">El cuerpo es tu obra maestra.</p>
          </div>
          <nav className="footer-nav">
            <a href="#clases">Clases</a>
            <a href="#metodo">Método</a>
            <a href="#comunidad">Comunidad</a>
            <a href="#precios">Precios</a>
            <a href="/contacto">Contacto</a>
          </nav>
          <div className="footer-right">
            <span className="footer-handle">@ooma.wellness</span>
            <div className="footer-socials">
              <a href="#" aria-label="Instagram">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <circle cx="12" cy="12" r="4"/>
                  <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor"/>
                </svg>
              </a>
              <a href="#" aria-label="Spotify">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M8 11.8c2.5-1 5.3-.8 7.5.5"/>
                  <path d="M7.5 14.3c2-0.8 4.3-.6 6 .4"/>
                  <path d="M9 9c2.8-1.1 5.9-.9 8.3.7"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
        <p className="footer-copyright">OOMA Wellness Club · 2026 · Todos los derechos reservados</p>
      </footer>
    </>
  )
}
