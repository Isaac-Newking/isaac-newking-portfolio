import { Fragment } from 'react';
import Avatar from '@/components/Avatar';
import Intro from '@/components/Intro';
import Nav from '@/components/Nav';
import PixelLogo from '@/components/PixelLogo';
import Services from '@/components/Services';
import WorkIndex from '@/components/WorkIndex';
import { FAQ, SITE, TESTIMONIALS } from '@/content/site';

const HANDLES: [string, React.CSSProperties][] = [
  ['tl', { left: -5, top: -5 }], ['tc', { left: 'calc(50% - 5px)', top: -5 }], ['tr', { right: -5, top: -5 }],
  ['ml', { left: -5, top: 'calc(50% - 5px)' }], ['mr', { right: -5, top: 'calc(50% - 5px)' }],
  ['bl', { left: -5, bottom: -5 }], ['bc', { left: 'calc(50% - 5px)', bottom: -5 }], ['br', { right: -5, bottom: -5 }],
];

export default function Home() {
  return (
    <>
      <Nav />
      <main id="top">
        <Intro />

        <section className="hello paper wrap" id="about">
          <div className="grid">
            <div className="frame">
              <Avatar />
              {HANDLES.map(([k, s]) => <i key={k} className="h" style={s} />)}
              <span className="edge" />
            </div>
            <div>
              <h2>Hello<small>I&apos;m Isaac N<em>ew</em>king</small></h2>
              <p className="bio">{SITE.bio}</p>
            </div>
          </div>
          <div className="facts">
            <div><h3 className="bubble">Experience</h3><div className="big">{SITE.years} yrs</div><p>{SITE.experience}</p></div>
            <div><h3 className="bubble">Skills</h3><ul>{SITE.skills.map((s) => <li key={s}>{s}</li>)}</ul></div>
            <div><h3 className="bubble">Software</h3><ul className="apps" style={{ listStyle: 'none', margin: 0, padding: 0 }}>{SITE.software.map(([a, t]) => (
              <li key={a} className="app" tabIndex={0} aria-label={t}>
                <span className="lbl" aria-hidden="true">{a}</span><PixelLogo id={a} /><span className="tip" aria-hidden="true">{t}</span>
              </li>
            ))}</ul></div>
            <div><h3 className="bubble">Contact</h3><p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
              {SITE.socials.length > 0 && <p style={{ marginTop: 8 }}>{SITE.socials.map((s) => <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer" style={{ marginRight: 12 }}>{s.label}</a>)}</p>}</div>
          </div>
        </section>

        <Services />
        <WorkIndex />

        {TESTIMONIALS.length > 0 && (
          <section className="sec wrap" id="testimonials">
            <div className="in">
              <h2>Kind words</h2>
              <div className="quotes">
                {TESTIMONIALS.map((t) => (
                  <figure className="quote" key={t.name}><span className="qm">&quot;</span><p>{t.quote}</p><figcaption className="who"><b>{t.name}</b>{t.role}</figcaption></figure>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="sec paper wrap" id="faq">
          <div className="in">
            <h2>FAQ</h2>
            <div className="faq">
              {FAQ.map(([q, a], i) => <details key={q} open={i === 0}><summary>{q}<i /></summary><p>{a}</p></details>)}
            </div>
          </div>
        </section>

        <section className="contact wrap" id="contact">
          <div className="in">
            <h2>Got a brand to build? Let&apos;s talk.</h2>
            <a className="mail" href={`mailto:${SITE.email}`}>{SITE.email}</a>
            <div className="slots">
              <div className="slot"><span>Socials</span><b>{SITE.socials.length
                ? SITE.socials.map((s, i) => <Fragment key={s.href}>{i > 0 && ', '}<a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></Fragment>)
                : 'Coming soon'}</b></div>
              <div className="slot"><span>Book a call</span><b>{SITE.bookingUrl ? <a href={SITE.bookingUrl}>Pick a time</a> : 'Coming soon'}</b></div>
              <div className="slot"><span>Based</span><b>Working remotely</b></div>
            </div>
          </div>
          {/* the wall grid ends in a perspective floor; the name lies flat in one row of it and scrolls */}
          <div className="ct-stage" aria-hidden="true">
            <div className="ct-floor"><div className="plane">
              <div className="floor-name"><div className="wm-track">
                {Array.from({ length: 16 }, (_, i) => <span key={i}>NEWKING ISAAC<i /></span>)}
              </div></div>
            </div></div>
          </div>
          <div className="ct-foot-row"><div className="foot"><span>© 2026 {SITE.name}</span><span>{SITE.title}</span></div></div>
        </section>
      </main>
    </>
  );
}
