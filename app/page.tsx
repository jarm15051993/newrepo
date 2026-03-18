'use client'

import { useEffect } from 'react'

const css = `
:root {
  --ink:        #1C1A14;
  --terra:      #9C7A52;
  --terra-mid:  #B8956A;
  --terra-pale: #DFC9A8;
  --sage:       #6E7B6A;
  --sage-lt:    #9BAA96;
  --sage-pale:  #CBD6C7;
  --gold:       #C8A96A;
  --gold-lt:    #DEC28F;
  --gold-pale:  #F0DCBA;
  --stone:      #C8BFB0;
  --linen:      #EBE5DA;
  --cloud:      #F4F0E8;
  --moon:       #FAF7F2;
  --mgray:      #8A8070;
  --lgray:      #BDB3A8;
  --rule:       #DAD3C8;
}

*, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  font-family: 'Jost', 'Jost Fallback', sans-serif;
  background: var(--moon);
  color: var(--ink);
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}

/* ── SCROLL REVEAL ── */
.rv { opacity: 1; transform: none; transition: opacity .72s ease, transform .72s ease; }
.rv.on { opacity: 1; transform: none; }

/* ── NAV ── */
nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 999;
  display: flex; justify-content: space-between; align-items: center;
  padding: 0 52px; height: 60px;
  background: rgba(250, 247, 242, 0.96);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid var(--rule);
}
.nav-logo { display: block; width: 140px; color: var(--ink); flex-shrink: 0; }
.nav-logo svg { display: block; width: 100%; height: auto; }
.nav-links {
  display: flex; gap: 28px; list-style: none;
  position: absolute; left: 50%; transform: translateX(-50%);
}
.nav-links a {
  font-size: 8px; letter-spacing: .26em; text-transform: uppercase;
  color: var(--mgray); text-decoration: none; transition: color .2s;
}
.nav-links a:hover { color: var(--terra); }
.nav-ctas { display: flex; align-items: center; gap: 20px; }
.btn-ghost-sm {
  font-family: 'Jost', sans-serif; font-size: 9px;
  letter-spacing: .28em; text-transform: uppercase;
  color: var(--mgray); background: none; border: none;
  cursor: pointer; text-decoration: none; transition: color .2s;
}
.btn-ghost-sm:hover { color: var(--terra); }
.btn-fill {
  font-family: 'Jost', sans-serif; font-size: 9px;
  letter-spacing: .28em; text-transform: uppercase;
  color: var(--moon); background: var(--terra);
  border: none; padding: 10px 22px; cursor: pointer;
  text-decoration: none; display: inline-block;
  transition: background .2s; border-radius: 0;
}
.btn-fill:hover { background: var(--ink); }
.nav-ham {
  display: none; flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: 4px;
}
.nav-ham span { display: block; width: 22px; height: 1px; background: var(--ink); }
.mob-menu {
  display: none; position: fixed; top: 60px; left: 0; right: 0;
  background: var(--moon); border-bottom: 1px solid var(--rule);
  padding: 28px 36px; z-index: 998; flex-direction: column; gap: 18px;
}
.mob-menu.open { display: flex; }
.mob-menu a {
  font-size: 9px; letter-spacing: .26em; text-transform: uppercase;
  color: var(--mgray); text-decoration: none;
}
.mob-menu .btn-fill { text-align: center; margin-top: 6px; }

/* ── SHARED ── */
.s-tag {
  font-size: 8px; letter-spacing: .42em; text-transform: uppercase;
  color: var(--terra); display: block; margin-bottom: 14px;
}
.s-tag-sage { color: var(--sage); }
.s-h2 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(30px, 4vw, 58px); font-weight: 300;
  line-height: 1.05; color: var(--ink);
}
.s-h2-moon { color: var(--moon); }
.s-h2 em { font-style: italic; color: var(--terra); }
.s-h2-moon em { color: var(--gold-lt); }
.s-body { font-size: 13.5px; line-height: 2.0; color: var(--mgray); font-weight: 300; }
.s-rule { width: 40px; height: 1px; background: var(--terra-pale); margin-bottom: 28px; }

/* ── HERO ── */
#hero {
  min-height: 100vh;
  background: var(--ink);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.hero-arc-outer {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 860px; height: 860px; border-radius: 50%;
  border: 1px solid rgba(201,168,108,.07); pointer-events: none;
}
.hero-arc-inner {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 580px; height: 580px; border-radius: 50%;
  border: 1px solid rgba(201,168,108,.04); pointer-events: none;
}
#hero::before {
  content: ''; position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
  opacity: .3; pointer-events: none;
}
.hero-inner {
  text-align: center; z-index: 2; padding: 24px;
  display: flex; flex-direction: column; align-items: center;
}
.hero-inner > * {
  opacity: 1; transform: none;
  animation: hfu .8s ease forwards;
}
@keyframes hfu { to { opacity: 1; transform: none; } }
.h-a0 { animation-delay: .10s; }
.h-a1 { animation-delay: .22s; }
.h-a2 { animation-delay: .34s; }
.h-a3 { animation-delay: .46s; }
.h-a4 { animation-delay: .58s; }
.h-a5 { animation-delay: .70s; }
.h-a6 { animation-delay: .82s; }

.hero-location {
  font-size: 7.5px; letter-spacing: .55em; text-transform: uppercase;
  color: var(--gold); margin-bottom: 44px;
}
.hero-logo { width: clamp(240px, 44vw, 600px); margin-bottom: 16px; color: var(--moon); }
.hero-logo svg { display: block; width: 100%; height: auto; }
.hero-wc {
  font-size: clamp(9px, 1vw, 12px); letter-spacing: .62em; text-transform: uppercase;
  color: rgba(250,248,244,.32); margin-bottom: 30px;
}
.hero-tagline {
  font-family: 'Playfair Display', serif; font-style: italic;
  font-size: clamp(14px, 1.7vw, 20px); font-weight: 300;
  color: rgba(201,168,108,.55); margin-bottom: 16px;
}
.hero-sub {
  font-family: 'Playfair Display', serif;
  font-size: clamp(26px, 3.8vw, 50px); font-weight: 300;
  color: var(--moon); line-height: 1.1;
  max-width: 620px; margin-bottom: 42px;
}
.hero-pills {
  display: flex; gap: 10px; flex-wrap: wrap;
  justify-content: center; margin-bottom: 46px;
}
.hero-pill {
  font-size: 8px; letter-spacing: .28em; text-transform: uppercase;
  color: rgba(250,248,244,.38); border: 1px solid rgba(250,248,244,.1);
  padding: 7px 16px;
}
.hero-ctas { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
.btn-hero-p {
  font-family: 'Jost', sans-serif; font-size: 9px;
  letter-spacing: .3em; text-transform: uppercase;
  color: var(--moon); background: var(--terra); border: none;
  padding: 13px 32px; cursor: pointer; text-decoration: none;
  display: inline-block; transition: background .2s, transform .15s;
}
.btn-hero-p:hover { background: var(--gold); color: var(--ink); transform: translateY(-1px); }
.btn-hero-g {
  font-family: 'Jost', sans-serif; font-size: 9px;
  letter-spacing: .3em; text-transform: uppercase;
  color: rgba(250,248,244,.5); border: 1px solid rgba(250,248,244,.2);
  background: none; padding: 13px 32px; cursor: pointer;
  text-decoration: none; display: inline-block;
  transition: color .2s, border-color .2s, transform .15s;
}
.btn-hero-g:hover { color: var(--moon); border-color: rgba(250,248,244,.55); transform: translateY(-1px); }
.scroll-hint {
  position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  animation: hfu .8s ease .96s forwards; opacity: 0;
}
.scroll-line { width: 1px; height: 36px; background: var(--gold); opacity: .4; animation: sp 2s ease infinite; }
@keyframes sp { 0%,100%{opacity:.3} 50%{opacity:.8} }

/* ── FILOSOFÍA ── */
#filosofia {
  background: var(--linen);
  padding: 100px 56px;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: center;
  position: relative; overflow: hidden;
}
.fil-deco {
  position: absolute; right: -70px; top: 50%; transform: translateY(-50%);
  width: 380px; height: 380px; border-radius: 50%;
  border: 1px solid rgba(156,122,82,.10); pointer-events: none;
}
.fil-deco2 {
  position: absolute; right: -30px; top: 50%; transform: translateY(-50%);
  width: 240px; height: 240px; border-radius: 50%;
  border: 1px solid rgba(156,122,82,.06); pointer-events: none;
}
.fil-manifesto {
  font-family: 'Playfair Display', serif;
  font-size: clamp(22px, 3vw, 40px); font-weight: 300;
  line-height: 1.55; color: var(--ink); margin-top: 28px;
}
.fil-manifesto em { font-style: italic; color: var(--terra); }
.fil-quote {
  margin-top: 36px; padding: 22px 24px 22px 22px;
  border-left: 2px solid var(--terra-pale);
  font-size: 13.5px; font-weight: 300;
  color: var(--mgray); line-height: 1.9;
  background: rgba(156,122,82,.04);
}
.fil-right { display: flex; flex-direction: column; gap: 1px; background: var(--rule); }
.fil-feature {
  padding: 30px 28px; background: var(--cloud);
  display: flex; gap: 18px; align-items: flex-start;
  transition: box-shadow .2s;
}
.fil-feature:hover { box-shadow: 0 4px 20px rgba(0,0,0,.05); }
.ff-icon { flex-shrink: 0; width: 30px; height: 30px; color: var(--terra); margin-top: 2px; }
.ff-title {
  font-family: 'Playfair Display', serif;
  font-size: 16px; font-weight: 400; color: var(--ink); margin-bottom: 5px;
}
.ff-sub { font-size: 12px; line-height: 1.9; color: var(--mgray); font-weight: 300; }

/* ── CLASES ── */
#clases {
  background: var(--ink);
  padding: 100px 56px;
  position: relative; overflow: hidden;
}
#clases::before {
  content: ''; position: absolute; bottom: -80px; left: -60px;
  width: 360px; height: 360px; border-radius: 50%;
  background: radial-gradient(circle, rgba(110,123,106,.10), transparent 70%);
  pointer-events: none;
}
.clases-header { margin-bottom: 56px; }
.clases-grid {
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 1px; background: rgba(255,255,255,.06);
}
.clase-card {
  background: rgba(28,26,20,.7); padding: 52px 44px;
  position: relative; overflow: hidden;
  transition: background .2s;
}
.clase-card:hover { background: rgba(28,26,20,.92); }
.clase-top-bar {
  position: absolute; top: 0; left: 0; right: 0; height: 2px;
}
.pilates .clase-top-bar { background: var(--terra); }
.yoga .clase-top-bar { background: var(--sage); }
.clase-ghost {
  font-family: 'Playfair Display', serif; font-size: 80px; font-weight: 300;
  color: rgba(201,168,108,.04); position: absolute;
  top: 8px; right: 22px; line-height: 1; pointer-events: none;
}
.clase-label {
  font-size: 8px; letter-spacing: .28em; text-transform: uppercase;
  color: var(--terra); display: block; margin-bottom: 14px;
}
.yoga .clase-label { color: var(--sage-lt); }
.clase-title {
  font-family: 'Playfair Display', serif;
  font-size: 32px; font-weight: 300; color: var(--moon);
  margin-bottom: 20px; line-height: 1.05;
}
.clase-body { font-size: 13px; line-height: 2.0; color: rgba(250,248,244,.45); font-weight: 300; margin-bottom: 26px; }
.clase-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 28px; }
.ctag {
  font-size: 8px; letter-spacing: .18em; text-transform: uppercase;
  padding: 5px 12px; border: 1px solid rgba(201,168,108,.2); color: var(--gold-lt);
}
.yoga .ctag { border-color: rgba(110,123,106,.3); color: var(--sage-lt); }
.clase-note {
  padding: 16px 18px;
  border-left: 2px solid rgba(201,168,108,.25);
  font-size: 12px; color: rgba(250,248,244,.35); line-height: 1.75; font-weight: 300;
}
.yoga .clase-note { border-left-color: rgba(110,123,106,.3); }

/* ── RESERVAS ── */
#reservas {
  background: var(--linen);
  padding: 100px 56px;
  position: relative; overflow: hidden;
}
.res-header { margin-bottom: 56px; }
.res-steps {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 1px; background: var(--rule);
  margin-bottom: 52px;
}
.res-step {
  padding: 36px 28px; background: var(--cloud);
  position: relative; transition: box-shadow .2s;
}
.res-step:hover { box-shadow: 0 6px 24px rgba(0,0,0,.06); }
.res-step-n {
  font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 300;
  color: rgba(156,122,82,.08); position: absolute;
  top: 8px; right: 14px; line-height: 1; pointer-events: none;
}
.res-step-num {
  font-size: 8px; letter-spacing: .3em; text-transform: uppercase;
  color: var(--terra); display: block; margin-bottom: 12px; opacity: .8;
}
.res-step-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px; font-weight: 300; color: var(--ink); margin-bottom: 10px;
}
.res-step-body { font-size: 12px; line-height: 1.9; color: var(--mgray); font-weight: 300; }

.res-planes {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 1px; background: var(--rule);
  margin-bottom: 44px;
}
.plan-card {
  padding: 32px 28px; background: var(--cloud);
  border-top: 2px solid var(--terra-pale);
  transition: box-shadow .2s;
}
.plan-card:hover { box-shadow: 0 6px 24px rgba(0,0,0,.06); }
.plan-card.sage { border-top-color: var(--sage-pale); }
.plan-card.mix { border-top-color: var(--gold-pale); }
.plan-label {
  font-size: 8px; letter-spacing: .3em; text-transform: uppercase;
  color: var(--terra); display: block; margin-bottom: 10px;
}
.plan-card.sage .plan-label { color: var(--sage); }
.plan-card.mix .plan-label { color: var(--gold); }
.plan-name {
  font-family: 'Playfair Display', serif;
  font-size: 22px; font-weight: 300; color: var(--ink); margin-bottom: 6px;
}
.plan-desc { font-size: 12px; color: var(--mgray); line-height: 1.75; font-weight: 300; }
.res-nota {
  text-align: center; font-size: 12px; color: var(--mgray);
  font-weight: 300; font-style: italic;
}

/* ── NORMAS ── */
#normas {
  background: var(--cloud);
  padding: 100px 56px;
  display: grid; grid-template-columns: 6fr 4fr;
  gap: 80px; align-items: start;
}
.normas-header { margin-bottom: 44px; }
.normas-list { display: flex; flex-direction: column; }
.normas-item {
  display: grid; grid-template-columns: 44px 1fr;
  padding: 22px 0; border-bottom: 1px solid var(--rule);
}
.normas-item:first-child { border-top: 1px solid var(--rule); }
.normas-num {
  font-family: 'Playfair Display', serif;
  font-size: 12px; font-weight: 300; color: var(--terra-pale); padding-top: 2px;
}
.normas-title { font-size: 13px; font-weight: 400; color: var(--ink); margin-bottom: 4px; }
.normas-desc { font-size: 12.5px; color: var(--mgray); line-height: 1.8; font-weight: 300; }
.normas-right { position: sticky; top: 80px; }
.normas-aside {
  padding: 32px 28px; background: var(--linen);
  border: 1px solid var(--rule);
  border-top: 2px solid var(--terra-pale);
}
.normas-aside-tag {
  font-size: 8px; letter-spacing: .32em; text-transform: uppercase;
  color: var(--terra); display: block; margin-bottom: 12px;
}
.normas-aside-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px; font-weight: 300; color: var(--ink);
  margin-bottom: 10px; line-height: 1.35;
}
.normas-aside-body { font-size: 12px; color: var(--mgray); line-height: 1.85; font-weight: 300; }

/* ── COFFEE ── */
#coffee {
  background: var(--terra);
  padding: 80px 56px;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: center;
  position: relative; overflow: hidden;
}
#coffee::before {
  content: ''; position: absolute; top: -100px; right: -100px;
  width: 400px; height: 400px; border-radius: 50%;
  border: 1px solid rgba(250,248,244,.06); pointer-events: none;
}
.coffee-tag {
  font-size: 8px; letter-spacing: .38em; text-transform: uppercase;
  color: rgba(250,248,244,.45); display: block; margin-bottom: 16px;
}
.coffee-h2 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 3.8vw, 52px); font-weight: 300;
  color: var(--moon); line-height: 1.08; margin-bottom: 20px;
}
.coffee-h2 em { font-style: italic; }
.coffee-body { font-size: 13.5px; line-height: 2.0; color: rgba(250,248,244,.6); font-weight: 300; }
.coffee-features { display: flex; flex-direction: column; gap: 12px; }
.coffee-f {
  display: flex; gap: 16px; align-items: flex-start;
  padding: 22px 24px; background: rgba(250,248,244,.08);
  border: 1px solid rgba(250,248,244,.1);
  transition: background .2s;
}
.coffee-f:hover { background: rgba(250,248,244,.14); }
.cfi { flex-shrink: 0; width: 26px; height: 26px; color: rgba(250,248,244,.55); margin-top: 2px; }
.cft-title { font-size: 13.5px; font-weight: 400; color: var(--moon); margin-bottom: 3px; }
.cft-sub { font-size: 12px; color: rgba(250,248,244,.45); font-weight: 300; line-height: 1.65; }

/* ── CIERRE ── */
#cierre {
  background: var(--ink);
  padding: 120px 56px;
  text-align: center;
  position: relative; overflow: hidden;
}
.cierre-circle1 {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 700px; height: 700px; border-radius: 50%;
  border: 1px solid rgba(201,168,108,.05); pointer-events: none;
}
.cierre-circle2 {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 450px; height: 450px; border-radius: 50%;
  border: 1px solid rgba(201,168,108,.04); pointer-events: none;
}
.cierre-inner { position: relative; z-index: 2; max-width: 700px; margin: 0 auto; }
.cierre-h2 {
  font-family: 'Playfair Display', serif;
  font-size: clamp(28px, 4vw, 52px); font-weight: 300;
  color: var(--moon); line-height: 1.12; margin-bottom: 22px;
}
.cierre-h2 em { font-style: italic; color: var(--gold-lt); }
.cierre-body {
  font-size: 14px; line-height: 2.0; color: rgba(250,248,244,.4);
  font-weight: 300; margin-bottom: 44px;
}
.cierre-btns { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }

/* ── FOOTER ── */
footer {
  background: var(--linen);
  padding: 60px 56px 40px;
  border-top: 1px solid var(--rule);
}
.footer-grid {
  display: grid; grid-template-columns: 2fr 1fr 1fr;
  gap: 60px; margin-bottom: 52px;
}
.footer-logo { display: block; width: 130px; color: var(--ink); margin-bottom: 16px; }
.footer-logo svg { display: block; width: 100%; height: auto; }
.footer-tagline { font-size: 11.5px; color: var(--mgray); line-height: 1.8; font-weight: 300; }
.footer-location { font-size: 10px; letter-spacing: .2em; text-transform: uppercase; color: var(--lgray); margin-top: 6px; }
.footer-col-title {
  font-size: 8px; letter-spacing: .36em; text-transform: uppercase;
  color: var(--terra); display: block; margin-bottom: 20px;
}
.footer-links { list-style: none; display: flex; flex-direction: column; gap: 10px; }
.footer-links a {
  font-size: 12.5px; color: var(--mgray); text-decoration: none;
  font-weight: 300; transition: color .2s;
}
.footer-links a:hover { color: var(--terra); }
.footer-rule { border: none; border-top: 1px solid var(--rule); margin-bottom: 24px; }
.footer-bottom { display: flex; justify-content: space-between; align-items: center; }
.footer-copy { font-size: 11px; color: var(--lgray); font-weight: 300; letter-spacing: .04em; }
.footer-socials { display: flex; align-items: center; gap: 18px; }
.footer-socials a { color: var(--lgray); transition: color .2s; }
.footer-socials a:hover { color: var(--terra); }

/* ── ACCESO ── */
#acceso {
  background: var(--ink);
  padding: 100px 56px;
  position: relative; overflow: hidden;
}
#acceso::before {
  content: ''; position: absolute; top: -80px; right: -80px;
  width: 360px; height: 360px; border-radius: 50%;
  border: 1px solid rgba(201,168,108,.06); pointer-events: none;
}
#acceso::after {
  content: ''; position: absolute; bottom: -60px; left: -60px;
  width: 260px; height: 260px; border-radius: 50%;
  border: 1px solid rgba(201,168,108,.04); pointer-events: none;
}
.acc-inner { max-width: 900px; margin: 0 auto; }
.acc-intro { font-size: 13.5px; line-height: 2.0; color: rgba(250,248,244,.45); font-weight: 300; margin-top: 20px; max-width: 520px; }
.acc-grid {
  display: grid; grid-template-columns: repeat(3,1fr);
  gap: 1px; background: rgba(255,255,255,.06);
  margin-top: 52px;
}
.acc-card {
  padding: 36px 30px; background: rgba(28,26,20,.7);
  border: 1px solid rgba(255,255,255,.06);
  transition: background .2s;
}
.acc-card:hover { background: rgba(28,26,20,.92); }
.acc-icon { width: 28px; height: 28px; color: var(--gold); margin-bottom: 20px; opacity: .7; }
.acc-label {
  font-size: 8px; letter-spacing: .3em; text-transform: uppercase;
  color: rgba(201,168,108,.5); display: block; margin-bottom: 10px;
}
.acc-title {
  font-family: 'Playfair Display', serif;
  font-size: 18px; font-weight: 300; color: var(--moon); margin-bottom: 10px;
}
.acc-body { font-size: 12px; line-height: 1.9; color: rgba(250,248,244,.4); font-weight: 300; }
.acc-footer {
  margin-top: 1px; padding: 26px 30px;
  background: rgba(156,122,82,.07);
  border: 1px solid rgba(201,168,108,.10);
  display: flex; align-items: center; gap: 16px;
}
.acc-footer-icon { flex-shrink: 0; width: 20px; height: 20px; color: var(--gold); opacity: .6; }
.acc-footer-text { font-size: 12.5px; color: rgba(250,248,244,.4); font-weight: 300; line-height: 1.7; }
.acc-footer-text strong { color: rgba(250,248,244,.7); font-weight: 400; }

/* ── RESPONSIVE ── */
@media (max-width: 900px) {
  nav { padding: 0 24px; }
  .nav-links, .nav-ctas .btn-ghost-sm { display: none; }
  .nav-ham { display: flex; }
  #filosofia, #normas, #coffee { grid-template-columns: 1fr; gap: 44px; }
  #filosofia { padding: 72px 28px; }
  .normas-right { position: static; }
  #coffee { padding: 60px 28px; }
  #clases { padding: 72px 28px; }
  .clases-grid { grid-template-columns: 1fr; }
  #reservas { padding: 72px 28px; }
  .res-steps { grid-template-columns: 1fr 1fr; }
  .res-planes { grid-template-columns: 1fr; }
  .acc-grid { grid-template-columns: 1fr; }
  #acceso { padding: 72px 28px; }
  #cierre { padding: 80px 28px; }
  .footer-grid { grid-template-columns: 1fr; gap: 36px; }
  footer { padding: 48px 28px 28px; }
}
@media (max-width: 600px) {
  .res-steps { grid-template-columns: 1fr; }
  .hero-pills { display: none; }
}
`

const WORDMARK = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="155 155 580 155" fill="currentColor">
  <path d="M228.1,168c41.4,0,62.1,33.6,62.1,67.3c0,33.6-20.6,67.3-62.1,67.3c-41.3,0-62.1-33.8-62.1-67.3C166,201.6,186.8,168,228.1,168z M170.8,235.5c0,31.5,25.1,62.8,56.6,62.8s48-31.5,48-63s-16-63.1-47.5-63.1S170.8,204,170.8,235.5z"/>
  <path d="M366.3,168c41.4,0,62.1,33.6,62.1,67.3c0,33.6-20.6,67.3-62.1,67.3c-41.3,0-62.1-33.8-62.1-67.3C304.2,201.6,325,168,366.3,168z M319.2,235.3c0,31.5,15.6,63.1,47.1,63.1s47.3-31.5,47.3-63.1s-15.8-63.1-47.3-63.1S319.2,203.8,319.2,235.3z"/>
  <path d="M432.3,298.4c2.8-0.9,11.5-1.1,13.1-11.4l10-102c1.2-11.4-5.8-12.7-8.6-13.6c-0.5-0.2-0.7-1.3-0.7-1.3h22.4l40.1,107.5l40.2-107.5h21c0,0,0,1.1-0.5,1.3c-2.6,0.9-8.8,2.4-8.9,11.4l10.1,103.8c1.5,10,10.3,10.1,12.9,11.1c0.5,0.2,0.5,1.5,0.5,1.5h-39c0,0,0-1.3,0.5-1.5c-2.8-0.9,11-0.9,10.8-10.3l-9.6-99.8l-41.6,111.6h-4.5L459,189.2l-9.6,99.1c-0.2,9.2,8.3,9.2,10.8,10.1c0.5,0.2,0.3,1.5,0.3,1.5h-28.7C431.8,299.9,431.8,298.6,432.3,298.4z"/>
  <path d="M587.1,298.4c2.8-0.9,9.5-3.5,12.9-11.3l44.2-106.4c-3.4-5.9-8.9-7.9-11.2-8.7c-0.5-0.2-0.5-1.3-0.5-1.3h21.7l48.3,116.4c3.4,7.7,10.3,10.3,12.9,11.3c0.5,0.2,0.7,1.5,0.7,1.5h-36.1c0,0,0-1.3,0.5-1.5c-2.8-0.9,9.6-2,6.7-11.1l-8.6-20.8h-65.7l-8.6,20.8c-3.1,9,4.1,10.1,6.7,11.1c0.5,0.2,0.5,1.5,0.5,1.5h-24.9C586.6,299.9,586.6,298.6,587.1,298.4z M614.8,262.3h61.9l-30.9-74.9L614.8,262.3z"/>
  <path d="M191.6,235.5c0-21.9,7.5-41.5,20.6-54.1c-23.7,9.2-36.8,31.7-36.8,54.1c0,22.5,13.1,45,36.8,54.1C199.2,277,191.6,257.5,191.6,235.5z"/>
</svg>`

const bodyHtml = `
<!-- NAV -->
<nav>
  <a href="#hero" class="nav-logo" aria-label="OOMA Wellness Club">${WORDMARK}</a>
  <ul class="nav-links">
    <li><a href="#filosofia">El estudio</a></li>
    <li><a href="#clases">Clases</a></li>
    <li><a href="#reservas">Reservas</a></li>
    <li><a href="#acceso">Acceso</a></li>
    <li><a href="#coffee">Coffee</a></li>
  </ul>
  <div class="nav-ctas">
    <a href="#clases" class="btn-ghost-sm">Ver clases</a>
    <!-- <a href="/signup" class="btn-fill">Crea tu cuenta</a> -->
  </div>
  <button class="nav-ham" id="ham" aria-label="Menú">
    <span></span><span></span><span></span>
  </button>
</nav>

<div class="mob-menu" id="mob">
  <a href="#filosofia">El estudio</a>
  <a href="#clases">Clases</a>
  <a href="#reservas">Reservas</a>
  <a href="#coffee">Coffee</a>
  <!-- <a href="/signup" class="btn-fill">Crea tu cuenta</a> -->
</div>

<!-- HERO -->
<section id="hero">
  <div class="hero-arc-outer"></div>
  <div class="hero-arc-inner"></div>
  <div class="hero-inner">
    <div class="hero-location h-a0">Tortosa · Terres de l'Ebre</div>
    <div class="hero-logo h-a1">${WORDMARK}</div>
    <div class="hero-wc h-a2">Wellness Club</div>
    <p class="hero-tagline h-a3">Un espacio para moverte, cuidarte y sentirte bien</p>
    <h1 class="hero-sub h-a4">Movimiento consciente.<br>Bienestar real. <em style="font-style:italic;color:var(--gold-lt);">Comunidad.</em></h1>
    <div class="hero-pills h-a5">
      <span class="hero-pill">Pilates Reformer</span>
      <span class="hero-pill">Yoga</span>
      <span class="hero-pill">Respiración</span>
      <span class="hero-pill">Tortosa</span>
    </div>
    <div class="hero-ctas h-a6">
      <!-- <a href="/signup" class="btn-hero-p">Crea tu cuenta</a> -->
      <a href="#clases" class="btn-hero-g">Ver clases</a>
    </div>
  </div>
  <div class="scroll-hint"><div class="scroll-line"></div></div>
</section>

<!-- FILOSOFÍA -->
<section id="filosofia">
  <div class="fil-deco"></div>
  <div class="fil-deco2"></div>
  <div>
    <span class="s-tag rv">El estudio</span>
    <div class="s-rule rv"></div>
    <h2 class="s-h2 rv">El bienestar no<br>tiene que ser<br><em>complicado</em></h2>
    <div class="fil-manifesto rv">
      Un estudio en Tortosa donde el movimiento y la salud se trabajan de forma <em>natural, cercana y sin líos.</em>
    </div>
    <div class="fil-quote rv">
      No necesitas experiencia. Solo ganas de empezar. Nos adaptamos a tu nivel desde el primer día.
    </div>
  </div>
  <div class="fil-right rv">
    <div class="fil-feature">
      <svg class="ff-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <circle cx="16" cy="16" r="10"/><path d="M16 6 C10 10 10 22 16 26"/><path d="M6 16 Q16 12 26 16"/>
      </svg>
      <div><div class="ff-title">Movimiento consciente</div><div class="ff-sub">Aprender a moverte mejor, con control y sin prisas.</div></div>
    </div>
    <div class="fil-feature">
      <svg class="ff-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <path d="M16 8 C16 8 10 14 10 19 C10 22.3 12.7 25 16 25 C19.3 25 22 22.3 22 19 C22 14 16 8 16 8Z"/><path d="M13 20 Q16 17 19 20"/>
      </svg>
      <div><div class="ff-title">Respiración</div><div class="ff-sub">Porque respirar bien también forma parte de sentirte mejor.</div></div>
    </div>
    <div class="fil-feature">
      <svg class="ff-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <path d="M16 6 L16 26"/><path d="M10 12 C10 8 22 8 22 12 C22 17 16 20 16 20 C16 20 10 17 10 12Z"/>
      </svg>
      <div><div class="ff-title">Entrenamiento funcional</div><div class="ff-sub">Ejercicios que notarás fuera del estudio.</div></div>
    </div>
    <div class="fil-feature">
      <svg class="ff-icon" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <circle cx="11" cy="13" r="4"/><circle cx="21" cy="13" r="4"/>
        <path d="M4 26 C4 21 7 19 11 19"/><path d="M28 26 C28 21 25 19 21 19"/>
        <path d="M11 19 C11 19 13 21 16 21 C19 21 21 19 21 19"/>
      </svg>
      <div><div class="ff-title">Comunidad real</div><div class="ff-sub">Gente como tú, talleres durante el año y buen rollo. Sin postureo.</div></div>
    </div>
  </div>
</section>

<!-- CLASES -->
<section id="clases">
  <div class="clases-header">
    <span class="s-tag rv" style="color:var(--gold)">Clases</span>
    <div class="s-rule rv" style="background:rgba(201,168,108,.3)"></div>
    <h2 class="s-h2 s-h2-moon rv">Tu cuerpo,<br>tu forma de <em>moverte</em></h2>
  </div>
  <div class="clases-grid">
    <div class="clase-card pilates rv">
      <div class="clase-top-bar"></div>
      <div class="clase-ghost">01</div>
      <span class="clase-label">01 · Pilates Reformer</span>
      <h3 class="clase-title">Pilates<br>Reformer</h3>
      <p class="clase-body">Pilates en máquinas con un enfoque actual y dinámico. Trabajamos fuerza, movilidad y control del cuerpo. Añadimos pequeños momentos más intensos para activar el cuerpo y salir con energía.</p>
      <div class="clase-tags">
        <span class="ctag">Reformer</span>
        <span class="ctag">Pilates contemporáneo</span>
        <span class="ctag">Trabajo funcional</span>
        <span class="ctag">Toques de intensidad</span>
      </div>
      <div class="clase-note">No somos un centro de rehabilitación. Aquí vienes a moverte, mejorar y sentirte mejor.</div>
    </div>
    <div class="clase-card yoga rv">
      <div class="clase-top-bar"></div>
      <div class="clase-ghost">02</div>
      <span class="clase-label">02 · Yoga</span>
      <h3 class="clase-title">Yoga</h3>
      <p class="clase-body">Clases guiadas por profesora certificada en India. Movimiento, respiración y calma para conectar contigo. Desde clases más suaves hasta más dinámicas — según lo que necesites ese día.</p>
      <div class="clase-tags">
        <span class="ctag">Yin Yoga</span>
        <span class="ctag">Hatha</span>
        <span class="ctag">Ashtanga</span>
        <span class="ctag">Meditación</span>
      </div>
      <div class="clase-note">Para todos los niveles. Si es tu primera vez, avísanos y lo tenemos en cuenta.</div>
    </div>
  </div>
</section>

<!-- RESERVAS -->
<section id="reservas">
  <div class="res-header">
    <span class="s-tag rv">Reservas</span>
    <div class="s-rule rv"></div>
    <h2 class="s-h2 rv">Así de <em>fácil</em></h2>
  </div>
  <div class="res-steps">
    <div class="res-step rv">
      <div class="res-step-n">1</div>
      <span class="res-step-num">01 · Regístrate</span>
      <div class="res-step-title">Crea tu usuario</div>
      <div class="res-step-body">Dinos si tienes alguna lesión o necesitas adaptación. Lo tendremos en cuenta desde el primer día.</div>
    </div>
    <div class="res-step rv">
      <div class="res-step-n">2</div>
      <span class="res-step-num">02 · Elige tu plan</span>
      <div class="res-step-title">Pilates, Yoga o mixto</div>
      <div class="res-step-body">Todo dentro de la app. Elige lo que encaja con lo que buscas.</div>
    </div>
    <div class="res-step rv">
      <div class="res-step-n">3</div>
      <span class="res-step-num">03 · Reserva</span>
      <div class="res-step-title">Desde el móvil</div>
      <div class="res-step-body">Apúntate o cancela tus clases con unos pocos toques, sin complicaciones.</div>
    </div>
    <div class="res-step rv">
      <div class="res-step-n">4</div>
      <span class="res-step-num">04 · Accede</span>
      <div class="res-step-title">Entra con tu QR</div>
      <div class="res-step-body">Rápido y sin esperas. Solo tienes que mostrar tu código al llegar.</div>
    </div>
  </div>
  <div class="res-planes">
    <div class="plan-card rv">
      <span class="plan-label">Plan</span>
      <div class="plan-name">Pilates</div>
      <div class="plan-desc">Acceso a todas las clases de reformer y pilates dinámico.</div>
    </div>
    <div class="plan-card sage rv">
      <span class="plan-label">Plan</span>
      <div class="plan-name">Yoga</div>
      <div class="plan-desc">Acceso a todas las clases de yoga, de las más suaves a las más dinámicas.</div>
    </div>
    <div class="plan-card mix rv">
      <span class="plan-label">Plan</span>
      <div class="plan-name">Mixto</div>
      <div class="plan-desc">Combina todo con libertad. Pilates, yoga y lo que necesites cada semana.</div>
    </div>
  </div>
  <p class="res-nota rv">Sin permanencias. Vienes porque quieres, no por obligación.</p>
</section>

<!-- ACCESO -->
<section id="acceso">
  <div class="acc-inner">
    <span class="s-tag rv" style="color:var(--gold)">Acceso al estudio</span>
    <div class="s-rule rv" style="background:rgba(201,168,108,.25)"></div>
    <h2 class="s-h2 s-h2-moon rv">Entra con tu<br><span style="font-family:'Jost',sans-serif;font-weight:300;letter-spacing:.08em;color:var(--gold-lt);">QR</span></h2>
    <p class="acc-intro rv">Cuando te registras, tendrás tu código QR personal dentro de la app. Puedes guardarlo en tu móvil o añadirlo a Apple Wallet o Android Wallet.</p>
    <div class="acc-grid">
      <div class="acc-card rv">
        <svg class="acc-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <rect x="3" y="3" width="9" height="9" rx="1"/><rect x="16" y="3" width="9" height="9" rx="1"/><rect x="3" y="16" width="9" height="9" rx="1"/>
          <rect x="16" y="16" width="4" height="4"/><rect x="21" y="21" width="4" height="4"/><rect x="21" y="16" width="4" height="4"/><rect x="16" y="21" width="4" height="4"/>
        </svg>
        <span class="acc-label">Tu QR personal</span>
        <div class="acc-title">Siempre en tu móvil</div>
        <div class="acc-body">Guárdalo en la app o añádelo a Apple Wallet o Android Wallet para tenerlo siempre a mano.</div>
      </div>
      <div class="acc-card rv">
        <svg class="acc-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <rect x="5" y="3" width="18" height="22" rx="2"/><circle cx="14" cy="18" r="2"/>
          <line x1="10" y1="8" x2="18" y2="8"/><line x1="10" y1="12" x2="16" y2="12"/>
        </svg>
        <span class="acc-label">Al llegar</span>
        <div class="acc-title">iPad en recepción</div>
        <div class="acc-body">En la entrada hay un iPad con cámara. Acerca tu QR, escanea y listo.</div>
      </div>
      <div class="acc-card rv">
        <svg class="acc-icon" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <circle cx="14" cy="14" r="10"/><path d="M9 14 L12.5 17.5 L19 11"/>
        </svg>
        <span class="acc-label">Tu sitio, listo</span>
        <div class="acc-title">Reformer o esterilla asignados</div>
        <div class="acc-body">Al hacer check-in verás en pantalla tu número de reformer o esterilla. Se asigna automáticamente al reservar.</div>
      </div>
    </div>
    <div class="acc-footer rv">
      <svg class="acc-footer-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M5 12 L10 17 L19 7"/>
      </svg>
      <div class="acc-footer-text"><strong>Rápido y sin esperas.</strong> Llegas, escaneas y entras. Sin colas, sin interrupciones.</div>
    </div>
  </div>
</section>

<!-- NORMAS -->
<section id="normas">
  <div>
    <div class="normas-header">
      <span class="s-tag rv">Información importante</span>
      <div class="s-rule rv"></div>
      <h2 class="s-h2 rv">Lo que necesitas<br><em>saber</em></h2>
      <p class="s-body rv" style="margin-top:20px;">Estas normas ayudan a que el ambiente sea cómodo y seguro para todos.</p>
    </div>
    <div class="normas-list">
      <div class="normas-item rv">
        <span class="normas-num">01</span>
        <div><div class="normas-title">No somos un centro médico</div><div class="normas-desc">OOMA no es un centro médico ni de rehabilitación. Si tienes dudas sobre si las clases son adecuadas para ti, consulta antes con tu médico.</div></div>
      </div>
      <div class="normas-item rv">
        <span class="normas-num">02</span>
        <div><div class="normas-title">Acceso con código QR</div><div class="normas-desc">La entrada al estudio es mediante el código QR de tu cuenta. Tenlo listo al llegar.</div></div>
      </div>
      <div class="normas-item rv">
        <span class="normas-num">03</span>
        <div><div class="normas-title">Puntualidad</div><div class="normas-desc">La entrada es posible hasta 10 minutos después del inicio de la clase. Pasado ese tiempo, no podrás acceder para no interrumpir el grupo.</div></div>
      </div>
      <div class="normas-item rv">
        <span class="normas-num">04</span>
        <div><div class="normas-title">Cancelaciones con 2h</div><div class="normas-desc">Las clases pueden cancelarse hasta 2 horas antes. Pasado ese plazo no serán reembolsables.</div></div>
      </div>
      <div class="normas-item rv">
        <span class="normas-num">05</span>
        <div><div class="normas-title">Calcetines obligatorios — Reformer</div><div class="normas-desc">Es obligatorio asistir con calcetines para el uso de las máquinas de Pilates Reformer.</div></div>
      </div>
      <div class="normas-item rv">
        <span class="normas-num">06</span>
        <div><div class="normas-title">Indica lesiones o condiciones especiales</div><div class="normas-desc">Al registrarte puedes indicar lesiones, embarazo o condiciones físicas especiales. Esta información nos ayuda a adaptar los ejercicios a tus necesidades.</div></div>
      </div>
    </div>
  </div>
  <div class="normas-right">
    <div class="normas-aside rv">
      <span class="normas-aside-tag">A tener en cuenta</span>
      <div class="normas-aside-title">El movimiento consciente empieza por cuidarte a ti y respetar a los demás.</div>
      <p class="normas-aside-body">Estas normas existen para que cada clase sea una experiencia segura, enfocada y agradable para todos.</p>
      <div style="height:24px"></div>
      <span class="normas-aside-tag" style="color:var(--sage)">Coaches certificados</span>
      <div class="normas-aside-title">Siempre hay un profesional disponible para adaptarse a ti.</div>
      <p class="normas-aside-body">Si tienes alguna condición especial, indícala al registrarte y lo tendremos en cuenta desde tu primera clase.</p>
    </div>
  </div>
</section>

<!-- COFFEE -->
<section id="coffee">
  <div>
    <span class="coffee-tag rv">Dentro del estudio</span>
    <h2 class="coffee-h2 rv">Un espacio para<br>quedarte <em>un rato más</em></h2>
    <p class="coffee-body rv">Dentro del estudio hay una zona pensada para antes y después de clase. Un lugar tranquilo donde puedes tomarte algo, relajarte y compartir con la gente.</p>
  </div>
  <div class="coffee-features">
    <div class="coffee-f rv">
      <svg class="cfi" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <path d="M5 9 L7 22 L19 22 L21 9 Z"/><path d="M21 13 C24 13 25 15 24 17 C23 19 21 19 21 17"/>
        <path d="M8 6 C8 3.5 10 3.5 10 5.5 C10 7.5 12 7.5 12 5.5"/><path d="M13 6.5 C13 4 15 4 15 6"/>
      </svg>
      <div><div class="cft-title">Coffee shop &amp; zona social</div><div class="cft-sub">Café, té y opciones ligeras dentro del propio estudio. Ven antes de clase o quédate después, sin prisas.</div></div>
    </div>
    <div class="coffee-f rv">
      <svg class="cfi" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <rect x="4" y="7" width="18" height="14" rx="1"/><path d="M8 7 V5.5 C8 4 10 3 13 3 C16 3 18 4 18 5.5 V7"/>
        <line x1="13" y1="11" x2="13" y2="15"/><line x1="11" y1="13" x2="15" y2="13"/>
      </svg>
      <div><div class="cft-title">Productos y ropa deportiva</div><div class="cft-sub">Una pequeña selección de ropa, calcetines de pilates y básicos para tu práctica.</div></div>
    </div>
    <div class="coffee-f rv">
      <svg class="cfi" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <rect x="4" y="4" width="18" height="18" rx="2"/><path d="M9 9 L9 13 L13 13"/>
        <path d="M17 13 L17 17 L13 17"/><path d="M9 13 L13 17"/>
      </svg>
      <div><div class="cft-title">Compra fácil, sin esperas</div><div class="cft-sub">Elige lo que quieras, escanea el QR con tu móvil y paga directamente. Sin colas, sin depender de nadie.</div></div>
    </div>
    <div class="coffee-f rv">
      <svg class="cfi" viewBox="0 0 26 26" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
        <circle cx="8" cy="10" r="3"/><circle cx="18" cy="10" r="3"/>
        <path d="M3 22 C3 17.5 5.5 16 8 16"/><path d="M23 22 C23 17.5 20.5 16 18 16"/>
        <path d="M8 16 C8 16 10 18 13 18 C16 18 18 16 18 16"/>
      </svg>
      <div><div class="cft-title">Un espacio para compartir</div><div class="cft-sub">Mesas, sillones y un ambiente cómodo. Aquí también forma parte de la experiencia.</div></div>
    </div>
  </div>
</section>

<!-- CIERRE -->
<section id="cierre">
  <div class="cierre-circle1"></div>
  <div class="cierre-circle2"></div>
  <div class="cierre-inner">
    <h2 class="cierre-h2 rv">Un sitio para moverte,<br>respirar y <em>desconectar</em><br>un rato del día.</h2>
    <p class="cierre-body rv">El bienestar no va de hacerlo perfecto,<br>va de hacerlo constante.</p>
    <div class="cierre-btns rv">
      <!-- <a href="/signup" class="btn-hero-p">Crea tu cuenta</a> -->
      <a href="#clases" class="btn-hero-g">Ver clases</a>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer>
  <div class="footer-grid">
    <div>
      <a href="#hero" class="footer-logo" aria-label="OOMA Wellness Club">${WORDMARK}</a>
      <p class="footer-tagline">Movimiento consciente.<br>Bienestar real. Comunidad.</p>
      <p class="footer-location">Tortosa · Terres de l'Ebre</p>
    </div>
    <div>
      <span class="footer-col-title">Estudio</span>
      <ul class="footer-links">
        <li><a href="#filosofia">El estudio</a></li>
        <li><a href="#clases">Clases</a></li>
        <li><a href="#reservas">Reservas</a></li>
        <li><a href="#acceso">Acceso</a></li>
        <li><a href="#normas">Información</a></li>
        <li><a href="#coffee">Coffee &amp; Merch</a></li>
      </ul>
    </div>
    <div>
      <span class="footer-col-title">Contacto</span>
      <p style="font-size:12.5px;color:var(--mgray);line-height:2.0;font-weight:300;">
        Tortosa, Terres de l'Ebre<br>
        <a href="mailto:hola@oomawellness.shop" style="color:var(--terra);text-decoration:none;">hola@oomawellness.shop</a>
        <!-- <a href="/signup" style="color:var(--terra);text-decoration:none;">Crea tu cuenta →</a> -->
      </p>
    </div>
  </div>
  <hr class="footer-rule">
  <div class="footer-bottom">
    <p class="footer-copy">© 2026 OOMA Wellness Club · Tortosa · Todos los derechos reservados</p>
    <div class="footer-socials">
      <a href="#" aria-label="Instagram">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round">
          <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r=".5" fill="currentColor"/>
        </svg>
      </a>
    </div>
  </div>
</footer>
`

export default function LandingPage() {
  useEffect(() => {
    // Scroll reveal
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('on')
          obs.unobserve(e.target)
        }
      })
    }, { threshold: 0.08 })
    document.querySelectorAll('.rv').forEach(el => obs.observe(el))

    // Hamburger
    const ham = document.getElementById('ham')
    const mob = document.getElementById('mob')
    if (ham && mob) {
      const toggle = () => mob.classList.toggle('open')
      ham.addEventListener('click', toggle)
      document.querySelectorAll('#mob a').forEach(a =>
        a.addEventListener('click', () => mob.classList.remove('open'))
      )
      return () => {
        ham.removeEventListener('click', toggle)
        obs.disconnect()
      }
    }
    return () => obs.disconnect()
  }, [])

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div dangerouslySetInnerHTML={{ __html: bodyHtml }} />
    </>
  )
}
