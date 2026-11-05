const Nebula = () => (
  <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
    <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle,rgba(120,40,255,0.18) 0%,transparent 70%)", top: "-10%", left: "-5%", animation: "nebula1 20s ease-in-out infinite alternate" }} />
    <div style={{ position: "absolute", width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle,rgba(0,180,255,0.14) 0%,transparent 70%)", bottom: "0%", right: "-5%", animation: "nebula2 25s ease-in-out infinite alternate" }} />
    <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle,rgba(255,60,120,0.1) 0%,transparent 70%)", top: "40%", left: "40%", animation: "nebula3 18s ease-in-out infinite alternate" }} />
  </div>
);
export default Nebula;