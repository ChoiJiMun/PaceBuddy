import { useState, useEffect, useRef } from "react";

const buddies = ["🐌", "🐱", "🐶", "🐉", "🎿", "🚴", "🦊", "🪁"];

function FloatingBuddy({ emoji, style }) {
  return (
    <div
      style={{
        position: "absolute",
        fontSize: "2rem",
        animation: `float ${3 + Math.random() * 2}s ease-in-out infinite`,
        animationDelay: `${Math.random() * 2}s`,
        opacity: 0.15,
        userSelect: "none",
        pointerEvents: "none",
        ...style,
      }}
    >
      {emoji}
    </div>
  );
}

function StatBar({ label, value, color }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value), 300);
    return () => clearTimeout(t);
  }, [value]);
  return (
    <div style={{ marginBottom: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "11px",
          color: "#888",
          marginBottom: "4px",
          fontFamily: "'DM Mono', monospace",
        }}
      >
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div
        style={{
          height: "6px",
          background: "#f0f0f0",
          borderRadius: "99px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${width}%`,
            background: color,
            borderRadius: "99px",
            transition: "width 1.2s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      </div>
    </div>
  );
}

function MenuBarMockup() {
  const [buddy, setBuddy] = useState(0);
  const [cpu, setCpu] = useState(34);

  useEffect(() => {
    const i = setInterval(() => {
      const next = Math.floor(Math.random() * 80) + 10;
      setCpu(next);
    }, 1800);
    return () => clearInterval(i);
  }, []);

  useEffect(() => {
    if (cpu > 70) setBuddy(3); // dragon when busy
    else if (cpu > 45) setBuddy(5); // cycling
    else setBuddy(0); // snail
  }, [cpu]);

  return (
    <div
      style={{
        background: "rgba(30,30,30,0.92)",
        backdropFilter: "blur(20px)",
        borderRadius: "14px",
        padding: "10px 18px",
        display: "flex",
        alignItems: "center",
        gap: "18px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
        border: "1px solid rgba(255,255,255,0.08)",
        width: "fit-content",
        margin: "0 auto",
      }}
    >
      {/* fake mac menu items */}
      {["Finder", "File", "Edit", "View", "Go", "Window", "Help"].map((m) => (
        <span
          key={m}
          style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px", fontFamily: "-apple-system, sans-serif" }}
        >
          {m}
        </span>
      ))}
      <div style={{ flex: 1 }} />
      {/* right side icons */}
      <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "12px", fontFamily: "'DM Mono', monospace" }}>
        CPU {cpu}%
      </span>
      <span
        style={{
          fontSize: "22px",
          transition: "transform 0.3s",
          animation: cpu > 60 ? "wiggle 0.4s ease infinite" : "none",
        }}
      >
        {buddies[buddy]}
      </span>
    </div>
  );
}

function BuddyCard({ emoji, name, active, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        width: "72px",
        height: "72px",
        borderRadius: "18px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        border: `2px solid ${active ? "#4ade80" : "transparent"}`,
        background: active ? "#f0fdf4" : "#f7f7f7",
        transition: "all 0.2s",
        gap: "4px",
      }}
    >
      <span style={{ fontSize: "26px" }}>{emoji}</span>
      <span style={{ fontSize: "9px", color: "#888", fontFamily: "'DM Mono', monospace" }}>{name}</span>
    </div>
  );
}

const buddyList = [
  { emoji: "🐌", name: "SNAIL" },
  { emoji: "🐱", name: "CAT" },
  { emoji: "🐶", name: "DOG" },
  { emoji: "🐉", name: "DRAGON" },
  { emoji: "🚴", name: "RIDER" },
  { emoji: "🦊", name: "FOX" },
  { emoji: "🎿", name: "SKIER" },
  { emoji: "🪁", name: "SLING" },
];

export default function PacebbuddyLanding() {
  const [activeBuddy, setActiveBuddy] = useState(0);
  const [stats] = useState({ cpu: 34, mem: 61, storage: 48, net: 22 });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #fafafa;
          color: #111;
          font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-16px) rotate(5deg); }
        }

        @keyframes wiggle {
          0%, 100% { transform: scale(1.1) rotate(-5deg); }
          50% { transform: scale(1.2) rotate(5deg); }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-1 { animation: fadeUp 0.7s 0.1s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.2s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.35s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.5s ease both; }

        .cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          background: #111;
          color: #fff;
          padding: 14px 28px;
          border-radius: 14px;
          font-size: 15px;
          font-weight: 500;
          text-decoration: none;
          transition: all 0.2s;
          cursor: pointer;
          border: none;
        }
        .cta-btn:hover {
          background: #333;
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.18);
        }

        .feature-card {
          background: #fff;
          border-radius: 20px;
          padding: 28px;
          border: 1px solid #ebebeb;
          transition: all 0.2s;
        }
        .feature-card:hover {
          border-color: #d0d0d0;
          box-shadow: 0 8px 32px rgba(0,0,0,0.07);
          transform: translateY(-3px);
        }

        .section { padding: 100px 24px; max-width: 1000px; margin: 0 auto; }

        @media (max-width: 600px) {
          .section { padding: 60px 20px; }
          .hero-title { font-size: 48px !important; }
        }
      `}</style>

      <div style={{ minHeight: "100vh", background: "#fafafa" }}>

        {/* NAV */}
        <nav style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "rgba(250,250,250,0.8)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid #ebebeb",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 32px", height: "60px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "22px" }}>🐌</span>
            <span style={{ fontSize: "16px", fontWeight: 600, letterSpacing: "-0.3px" }}>pacebuddy</span>
          </div>
          <a
            href="https://apps.apple.com/kr/app/pacebuddy/id6749213835?mt=12"
            target="_blank"
            rel="noreferrer"
            className="cta-btn"
            style={{ padding: "9px 20px", fontSize: "13px" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            Mac App Store
          </a>
        </nav>

        {/* HERO */}
        <section style={{
          paddingTop: "160px", paddingBottom: "100px",
          textAlign: "center", position: "relative", overflow: "hidden",
          maxWidth: "100%",
        }}>
          {/* Background floating buddies */}
          {buddyList.map((b, i) => (
            <FloatingBuddy
              key={i}
              emoji={b.emoji}
              style={{
                top: `${10 + (i * 11) % 70}%`,
                left: `${(i * 13) % 90}%`,
              }}
            />
          ))}

          <div style={{ position: "relative", padding: "0 24px" }}>
            <div className="fade-up" style={{
              display: "inline-block",
              background: "#f0fdf4",
              color: "#16a34a",
              padding: "6px 14px",
              borderRadius: "99px",
              fontSize: "12px",
              fontWeight: 500,
              fontFamily: "'DM Mono', monospace",
              marginBottom: "24px",
              border: "1px solid #bbf7d0",
            }}>
              FREE · MAC ONLY · UTILITIES
            </div>

            <h1 className="fade-up-1 hero-title" style={{
              fontSize: "72px",
              fontFamily: "'Instrument Serif', Georgia, serif",
              fontStyle: "italic",
              lineHeight: 1.05,
              letterSpacing: "-2px",
              color: "#111",
              marginBottom: "20px",
              maxWidth: "680px",
              margin: "0 auto 20px",
            }}>
              Your cute little<br />system guardian
            </h1>

            <p className="fade-up-2" style={{
              fontSize: "18px",
              color: "#666",
              maxWidth: "460px",
              margin: "0 auto 40px",
              lineHeight: 1.6,
            }}>
              pacebuddy lives in your Mac's menu bar — tracking CPU, memory, and more with adorable animated buddies.
            </p>

            <div className="fade-up-3" style={{ display: "flex", justifyContent: "center", gap: "12px", flexWrap: "wrap" }}>
              <a
                href="https://apps.apple.com/kr/app/pacebuddy/id6749213835?mt=12"
                target="_blank"
                rel="noreferrer"
                className="cta-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                Download on Mac App Store
              </a>
              <div style={{
                padding: "14px 20px",
                borderRadius: "14px",
                border: "1.5px solid #ebebeb",
                fontSize: "14px",
                color: "#888",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}>
                <span style={{ color: "#4ade80" }}>●</span>
                Free · In-app purchases
              </div>
            </div>

            {/* Menu bar mockup */}
            <div className="fade-up-4" style={{ marginTop: "64px", padding: "0 24px" }}>
              <MenuBarMockup />
              <p style={{ fontSize: "12px", color: "#bbb", marginTop: "12px", fontFamily: "'DM Mono', monospace" }}>
                ↑ buddy reacts in real-time to your CPU
              </p>
            </div>
          </div>
        </section>

        {/* BUDDY PICKER */}
        <section style={{ background: "#fff", borderTop: "1px solid #ebebeb", borderBottom: "1px solid #ebebeb" }}>
          <div className="section" style={{ textAlign: "center" }}>
            <div style={{ marginBottom: "12px", fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em" }}>
              CHOOSE YOUR BUDDY
            </div>
            <h2 style={{
              fontSize: "38px",
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              marginBottom: "8px",
            }}>
              20+ buddies & counting
            </h2>
            <p style={{ color: "#888", marginBottom: "40px", fontSize: "15px" }}>
              Pick a character that matches your vibe. Unlock more with in-app purchases.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "32px" }}>
              {buddyList.map((b, i) => (
                <BuddyCard
                  key={i}
                  emoji={b.emoji}
                  name={b.name}
                  active={activeBuddy === i}
                  onClick={() => setActiveBuddy(i)}
                />
              ))}
            </div>

            <div style={{
              display: "inline-block",
              background: "#fafafa",
              border: "1px solid #ebebeb",
              borderRadius: "20px",
              padding: "24px 40px",
              minWidth: "200px",
            }}>
              <div style={{ fontSize: "52px", marginBottom: "8px" }}>{buddyList[activeBuddy].emoji}</div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px", color: "#888" }}>
                {buddyList[activeBuddy].name} is ready!
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section>
          <div className="section">
            <div style={{ textAlign: "center", marginBottom: "56px" }}>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: "11px", color: "#aaa", letterSpacing: "0.1em", marginBottom: "12px" }}>
                FEATURES
              </div>
              <h2 style={{ fontSize: "38px", fontFamily: "'Instrument Serif', serif", fontStyle: "italic" }}>
                Simple. Powerful. Cute.
              </h2>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
              {[
                {
                  icon: "📊",
                  title: "At-a-glance stats",
                  desc: "CPU, memory, storage, battery, and network — all visible at a glance from your menu bar.",
                  detail: (
                    <div style={{ marginTop: "16px" }}>
                      <StatBar label="CPU" value={stats.cpu} color="#4ade80" />
                      <StatBar label="Memory" value={stats.mem} color="#60a5fa" />
                      <StatBar label="Storage" value={stats.storage} color="#f59e0b" />
                      <StatBar label="Network" value={stats.net} color="#a78bfa" />
                    </div>
                  ),
                },
                {
                  icon: "🎭",
                  title: "Animated reactions",
                  desc: "Your buddy reacts to system load with fun animations. Busy CPU? Watch your buddy sprint!",
                  detail: (
                    <div style={{ display: "flex", gap: "8px", marginTop: "16px", alignItems: "center" }}>
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "28px" }}>🐌</div>
                        <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'DM Mono', monospace" }}>IDLE</div>
                      </div>
                      <div style={{ flex: 1, height: "2px", background: "linear-gradient(90deg, #4ade80, #f59e0b, #ef4444)", borderRadius: "99px" }} />
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: "28px", animation: "wiggle 0.5s ease infinite" }}>🐉</div>
                        <div style={{ fontSize: "10px", color: "#aaa", fontFamily: "'DM Mono', monospace" }}>BUSY</div>
                      </div>
                    </div>
                  ),
                },
                {
                  icon: "🎨",
                  title: "Theme customization",
                  desc: "Personalize your pacebuddy with custom theme colors and position the buddy anywhere on your menu bar.",
                  detail: (
                    <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
                      {["#4ade80","#60a5fa","#f59e0b","#f472b6","#a78bfa","#fb923c"].map(c => (
                        <div key={c} style={{ width: "28px", height: "28px", borderRadius: "50%", background: c, border: "2px solid #fff", boxShadow: "0 2px 6px rgba(0,0,0,0.12)" }} />
                      ))}
                    </div>
                  ),
                },
                {
                  icon: "🎮",
                  title: "Mini games",
                  desc: "Play mini games featuring your own unlocked buddies. Take a break — your buddy misses you!",
                  detail: (
                    <div style={{
                      marginTop: "16px", background: "#f7f7f7", borderRadius: "12px",
                      padding: "14px", textAlign: "center",
                    }}>
                      <div style={{ fontSize: "32px", marginBottom: "6px" }}>🎮</div>
                      <div style={{ fontSize: "11px", color: "#aaa", fontFamily: "'DM Mono', monospace" }}>MINI GAME UNLOCKED</div>
                    </div>
                  ),
                },
              ].map((f, i) => (
                <div key={i} className="feature-card">
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>{f.icon}</div>
                  <h3 style={{ fontSize: "17px", fontWeight: 600, marginBottom: "8px" }}>{f.title}</h3>
                  <p style={{ fontSize: "14px", color: "#777", lineHeight: 1.6 }}>{f.desc}</p>
                  {f.detail}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section style={{ background: "#111", color: "#fff" }}>
          <div className="section" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "52px", marginBottom: "16px" }}>🐌</div>
            <h2 style={{
              fontSize: "48px",
              fontFamily: "'Instrument Serif', serif",
              fontStyle: "italic",
              marginBottom: "16px",
              lineHeight: 1.1,
            }}>
              Meet your new<br />desktop companion
            </h2>
            <p style={{ color: "#888", marginBottom: "36px", fontSize: "16px" }}>
              Free to download. macOS 13.5+
            </p>
            <a
              href="https://apps.apple.com/kr/app/pacebuddy/id6749213835?mt=12"
              target="_blank"
              rel="noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: "10px",
                background: "#fff", color: "#111",
                padding: "16px 32px", borderRadius: "16px",
                fontSize: "16px", fontWeight: 600, textDecoration: "none",
                transition: "all 0.2s",
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
              Download on Mac App Store
            </a>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{
          borderTop: "1px solid #ebebeb",
          padding: "32px 24px",
          textAlign: "center",
          fontSize: "13px",
          color: "#bbb",
          fontFamily: "'DM Mono', monospace",
        }}>
          <div style={{ marginBottom: "8px" }}>
            <span style={{ fontSize: "16px" }}>🐌</span>{" "}
            <strong style={{ color: "#888" }}>pacebuddy</strong> · by jimun choi
          </div>
          <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
            <a href="https://galaxy-ahead-00365790.figma.site" target="_blank" rel="noreferrer" style={{ color: "#bbb", textDecoration: "none" }}>
              Privacy Policy
            </a>
            <a href="https://apps.apple.com/kr/app/pacebuddy/id6749213835?mt=12" target="_blank" rel="noreferrer" style={{ color: "#bbb", textDecoration: "none" }}>
              App Store
            </a>
          </div>
        </footer>
      </div>
    </>
  );
}
