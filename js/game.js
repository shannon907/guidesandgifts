(function () {
  const Neon = (window.Neon = window.Neon || {});

  const VIEW_W = 960;
  const keys = Object.create(null);
  let jumpPressed = false;
  let audioCtx = null;
  let audioReady = false;

  const session = {
    mode: "title",
    level: null,
    player: null,
    score: 0,
    particles: [],
    camera: 0,
    time: 0,
    won: false,
  };

  function freshRun() {
    session.level = Neon.createLevel();
    session.player = Neon.createPlayer(session.level.spawn);
    session.score = 0;
    session.particles = [];
    session.camera = 0;
    session.won = false;
    session.player.onGround = true;
  }

  function ensureAudio() {
    if (audioReady) return;
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    try {
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === "suspended") audioCtx.resume();
      audioReady = audioCtx.state === "running" || audioCtx.state === "suspended";
    } catch (err) {
      audioReady = false;
    }
  }

  function tone(freq, duration, type, volume, slideTo) {
    if (!audioCtx || !audioReady) return;
    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch (err) {
      /* keep the game running if a cue fails */
    }
  }

  function cue(name) {
    if (name === "jump") tone(420, 0.09, "triangle", 0.05, 720);
    else if (name === "token") {
      tone(880, 0.08, "square", 0.03, 1320);
    } else if (name === "bump") tone(110, 0.14, "sine", 0.07, 60);
    else if (name === "win") {
      tone(523, 0.12, "triangle", 0.05, 659);
      setTimeout(() => tone(784, 0.18, "triangle", 0.05, 1046), 90);
    }
  }

  function show(id, visible) {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle("hidden", !visible);
  }

  function setMode(mode) {
    session.mode = mode;
    show("title", mode === "title");
    show("win", mode === "win");
    if (mode === "win") {
      const line = document.getElementById("scoreline");
      const total = session.level.tokens.length;
      if (line) line.textContent = "Tips collected: " + session.score + " / " + total;
    }
  }

  function startPlaying() {
    freshRun();
    setMode("play");
    jumpPressed = false;
  }

  function spawnSpeck(player) {
    session.particles.push({
      x: player.x + player.w / 2 - player.facing * 8,
      y: player.y + player.h - 2,
      vx: -player.facing * (24 + Math.random() * 36) - player.vx * 0.15,
      vy: -16 - Math.random() * 28,
      life: 0.32 + Math.random() * 0.12,
      age: 0,
      size: 2,
      color: Math.random() > 0.5 ? "#9af4ff" : "#ffd59a",
    });
  }

  function updateParticles(dt) {
    const next = [];
    for (let i = 0; i < session.particles.length; i++) {
      const speck = session.particles[i];
      speck.age += dt;
      if (speck.age >= speck.life) continue;
      speck.vy += 40 * dt;
      speck.x += speck.vx * dt;
      speck.y += speck.vy * dt;
      next.push(speck);
    }
    session.particles = next.slice(-48);
  }

  function updateCamera(dt) {
    const player = session.player;
    const level = session.level;
    const target = player.x + player.w / 2 - VIEW_W * 0.38;
    const max = Math.max(0, level.width - VIEW_W);
    const clamped = Math.max(0, Math.min(max, target));
    if (Math.abs(clamped - session.camera) > 520) session.camera = clamped;
    else session.camera += (clamped - session.camera) * Math.min(1, dt * 5);
  }

  function hitDrone(player, drone) {
    return (
      player.x < drone.x + drone.w &&
      player.x + player.w > drone.x &&
      player.y < drone.y + drone.h &&
      player.y + player.h > drone.y
    );
  }

  function collectTokens(player) {
    const tokens = session.level.tokens;
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (token.got) continue;
      const cx = player.x + player.w / 2;
      const cy = player.y + player.h / 2;
      const dx = cx - token.x;
      const dy = cy - token.y;
      if (dx * dx + dy * dy <= (token.r + 12) * (token.r + 12)) {
        token.got = true;
        session.score += 1;
        cue("token");
      }
    }
  }

  function onPad(player, pad) {
    return (
      player.onGround &&
      player.x + player.w > pad.x + 6 &&
      player.x < pad.x + pad.w - 6 &&
      Math.abs(player.y + player.h - pad.y) < 10
    );
  }

  function fail() {
    Neon.respawnPlayer(session.player);
    cue("bump");
  }

  function step(dt) {
    const input = {
      left: !!(keys.KeyA || keys.ArrowLeft),
      right: !!(keys.KeyD || keys.ArrowRight),
      jumpHeld: !!(keys.Space || keys.KeyW || keys.ArrowUp),
      jumpPressed: jumpPressed,
    };
    jumpPressed = false;

    Neon.updateLevel(session.level, dt);
    const solids = Neon.levelSolids(session.level);
    const result = Neon.updatePlayer(session.player, input, dt, solids);
    if (result.jumped) cue("jump");

    const player = session.player;
    if (player.state === "run" && player.onGround && Math.random() < 0.45) spawnSpeck(player);
    updateParticles(dt);
    collectTokens(player);

    if (player.invuln <= 0) {
      const drones = session.level.drones;
      for (let i = 0; i < drones.length; i++) {
        if (hitDrone(player, drones[i])) {
          fail();
          break;
        }
      }
    }

    if (player.y > 530) fail();

    if (!session.won && onPad(player, session.level.pad)) {
      session.won = true;
      cue("win");
      setMode("win");
    }

    updateCamera(dt);
    session.time += dt;
  }

  function frame(now) {
    const dt = Math.min(0.033, (now - frame.last) / 1000 || 0);
    frame.last = now;
    if (session.mode === "play") step(dt);
    else {
      session.time += dt;
      updateParticles(dt);
      if (session.player) updateCamera(dt);
    }
    Neon.drawFrame(frame.ctx, session);
    requestAnimationFrame(frame);
  }

  function onKeyDown(event) {
    const move = event.code === "Space" || event.code === "ArrowUp" || event.code === "ArrowDown" ||
      event.code === "ArrowLeft" || event.code === "ArrowRight";
    if (move) event.preventDefault();
    ensureAudio();
    if (event.repeat) {
      keys[event.code] = true;
      return;
    }
    keys[event.code] = true;
    if (event.code === "Space" && (session.mode === "title" || session.mode === "win")) {
      startPlaying();
      return;
    }
    if (session.mode === "play" && (event.code === "Space" || event.code === "KeyW" || event.code === "ArrowUp")) {
      jumpPressed = true;
    }
  }

  function onKeyUp(event) {
    keys[event.code] = false;
  }

  function boot() {
    const canvas = document.getElementById("view");
    const ctx = canvas.getContext("2d");
    freshRun();
    setMode("title");
    frame.ctx = ctx;
    frame.last = performance.now();
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    requestAnimationFrame(frame);
  }

  Neon.debug = function () {
    const player = session.player;
    return {
      mode: session.mode,
      x: player ? player.x : 0,
      y: player ? player.y : 0,
      vx: player ? player.vx : 0,
      vy: player ? player.vy : 0,
      onGround: player ? player.onGround : false,
      state: player ? player.state : "",
      facing: player ? player.facing : 1,
      score: session.score,
      invuln: player ? player.invuln : 0,
      checkpoint: player ? { x: player.checkpoint.x, y: player.checkpoint.y } : null,
      washerX: session.level ? session.level.washer.x : 0,
      won: session.won,
    };
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
