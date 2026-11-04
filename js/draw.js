(function () {
  const Neon = (window.Neon = window.Neon || {});

  const FAR = [];
  const MID = [];
  const SIGNS = [
    { x: 180, text: "RAMEN", color: "#5cefff" },
    { x: 860, text: "24", color: "#ff4fd8" },
    { x: 1540, text: "OPEN", color: "#ffb045" },
    { x: 2320, text: "HOTEL", color: "#5cefff" },
    { x: 3180, text: "BAR", color: "#ff4fd8" },
    { x: 3720, text: "LATE", color: "#ffb045" },
  ];

  function hash(n) {
    const x = Math.sin(n * 127.1 + 4.7) * 43758.5453;
    return x - Math.floor(x);
  }

  (function buildSkyline() {
    let x = -40;
    let i = 0;
    while (x < 4300) {
      const w = 64 + Math.floor(hash(i + 1) * 110);
      const h = 90 + Math.floor(hash(i + 9) * 170);
      FAR.push({ x, w, h });
      x += w + 10 + Math.floor(hash(i + 3) * 18);
      i += 1;
    }
    x = -20;
    i = 0;
    while (x < 4400) {
      const w = 90 + Math.floor(hash(i + 20) * 130);
      const h = 140 + Math.floor(hash(i + 30) * 200);
      const sign = SIGNS.find((item) => Math.abs(item.x - x) < 80);
      MID.push({ x, w, h, sign: sign || null, seed: i + 40 });
      x += w + 16 + Math.floor(hash(i + 8) * 28);
      i += 1;
    }
  })();

  function roundRect(ctx, x, y, w, h, r) {
    const radius = Math.max(0, Math.min(r, w / 2, h / 2));
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
  }

  function drawSky(ctx, time) {
    const sky = ctx.createLinearGradient(0, 0, 0, 540);
    sky.addColorStop(0, "#1a103c");
    sky.addColorStop(0.42, "#3a2066");
    sky.addColorStop(0.7, "#6d3268");
    sky.addColorStop(1, "#d06a86");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 960, 540);

    const glow = ctx.createRadialGradient(710, 118, 10, 710, 118, 180);
    glow.addColorStop(0, "rgba(255, 214, 170, 0.95)");
    glow.addColorStop(0.35, "rgba(255, 140, 120, 0.28)");
    glow.addColorStop(1, "rgba(255, 120, 140, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(710, 118, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffe6c4";
    ctx.beginPath();
    ctx.arc(710, 118, 26, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    for (let i = 0; i < 28; i++) {
      const sx = (hash(i) * 960) | 0;
      const sy = (hash(i + 50) * 220) | 0;
      const tw = 0.4 + hash(i + 80) * 0.8;
      ctx.globalAlpha = 0.35 + Math.sin(time * 0.8 + i) * 0.15;
      ctx.fillRect(sx, sy, tw, tw);
    }
    ctx.globalAlpha = 1;
  }

  function drawFarCity(ctx, camera) {
    ctx.save();
    ctx.translate(-camera * 0.18, 0);
    ctx.fillStyle = "#241433";
    FAR.forEach((building) => {
      const y = 470 - building.h;
      ctx.fillRect(building.x, y, building.w, building.h + 40);
    });
    ctx.restore();
  }

  function drawMidCity(ctx, camera, time) {
    ctx.save();
    ctx.translate(-camera * 0.42, 0);
    MID.forEach((building) => {
      const y = 500 - building.h;
      ctx.fillStyle = "#321c4a";
      ctx.fillRect(building.x, y, building.w, building.h + 50);
      const cols = Math.max(2, Math.floor(building.w / 18));
      const rows = Math.max(2, Math.floor((building.h - 24) / 22));
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const n = hash(building.seed + row * 17 + col * 3);
          if (n < 0.42) continue;
          ctx.fillStyle = n > 0.78 ? "rgba(120, 230, 255, 0.75)" : "rgba(255, 206, 140, 0.8)";
          ctx.fillRect(building.x + 8 + col * 16, y + 12 + row * 20, 7, 11);
        }
      }
      if (building.sign) drawSign(ctx, building.x + 12, y + 18, building.sign, time);
    });
    ctx.restore();
  }

  function drawSign(ctx, x, y, sign, time) {
    const pulse = 0.62 + Math.sin(time * 1.35 + x * 0.01) * 0.28;
    ctx.save();
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "rgba(8, 4, 16, 0.72)";
    const width = Math.max(54, sign.text.length * 13 + 16);
    roundRect(ctx, x, y, width, 22, 4);
    ctx.fill();
    ctx.strokeStyle = sign.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = sign.color;
    ctx.font = "700 13px Segoe UI, Trebuchet MS, sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillText(sign.text, x + 8, y + 12);
    ctx.restore();
  }

  function drawAlley(ctx, width) {
    const alley = ctx.createLinearGradient(0, 470, 0, 560);
    alley.addColorStop(0, "rgba(18, 8, 28, 0)");
    alley.addColorStop(0.45, "rgba(12, 6, 18, 0.55)");
    alley.addColorStop(1, "#07040c");
    ctx.fillStyle = alley;
    ctx.fillRect(-200, 470, width + 400, 160);
  }

  function drawRoofs(ctx, roofs) {
    roofs.forEach((roof, index) => {
      const crate = roof.w < 80;
      ctx.fillStyle = crate ? "#4a3b32" : "#3a3158";
      ctx.fillRect(roof.x, roof.y + 8, roof.w, roof.h);
      ctx.fillStyle = crate ? "#6b5142" : "#51486f";
      ctx.fillRect(roof.x, roof.y, roof.w, 10);
      ctx.fillStyle = crate ? "#e0a15a" : "rgba(94, 230, 255, 0.85)";
      ctx.fillRect(roof.x, roof.y, roof.w, 2);
      if (!crate && roof.w > 160 && index % 2 === 0) {
        ctx.fillStyle = "#2a2344";
        ctx.fillRect(roof.x + roof.w * 0.62, roof.y - 18, 28, 18);
        ctx.fillStyle = "#8fdfff";
        ctx.fillRect(roof.x + roof.w * 0.62 + 6, roof.y - 14, 6, 4);
      }
    });
  }

  function drawWasher(ctx, washer, time) {
    ctx.strokeStyle = "rgba(190, 220, 255, 0.35)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(washer.x + 18, -20);
    ctx.lineTo(washer.x + 18, washer.y);
    ctx.moveTo(washer.x + washer.w - 18, -20);
    ctx.lineTo(washer.x + washer.w - 18, washer.y);
    ctx.stroke();

    ctx.fillStyle = "#2f3b4f";
    roundRect(ctx, washer.x, washer.y, washer.w, washer.h, 3);
    ctx.fill();
    const glow = 0.45 + Math.sin(time * 1.6) * 0.25;
    ctx.fillStyle = `rgba(94, 230, 255, ${glow})`;
    ctx.fillRect(washer.x + 6, washer.y + washer.h - 4, washer.w - 12, 3);
    ctx.fillStyle = "#d7e4f8";
    ctx.fillRect(washer.x + 4, washer.y + 3, washer.w - 8, 3);
  }

  function drawTokens(ctx, tokens, time) {
    tokens.forEach((token) => {
      if (token.got) return;
      const bob = Math.sin(time * 2.2 + token.x) * 3;
      const y = token.y + bob;
      ctx.save();
      ctx.translate(token.x, y);
      ctx.fillStyle = "rgba(255, 186, 70, 0.28)";
      ctx.beginPath();
      ctx.arc(0, 0, token.r + 7 + Math.sin(time * 1.4) * 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ffc15a";
      ctx.beginPath();
      ctx.arc(0, 0, token.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff4d2";
      ctx.font = "700 11px Segoe UI, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✦", 0, 1);
      ctx.restore();
    });
  }

  function drawPad(ctx, pad, time) {
    const pulse = 0.55 + Math.sin(time * 2.1) * 0.35;
    ctx.save();
    ctx.fillStyle = `rgba(94, 230, 255, ${0.18 + pulse * 0.2})`;
    roundRect(ctx, pad.x - 8, pad.y - 8, pad.w + 16, pad.h + 18, 8);
    ctx.fill();
    ctx.fillStyle = "#163246";
    roundRect(ctx, pad.x, pad.y - 4, pad.w, pad.h, 4);
    ctx.fill();
    ctx.strokeStyle = `rgba(255, 79, 216, ${pulse})`;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#9af4ff";
    ctx.font = "700 11px Segoe UI, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("DROP", pad.x + pad.w / 2, pad.y - 8);
    ctx.restore();
  }

  function drawDrones(ctx, drones, time) {
    drones.forEach((drone, index) => {
      const cx = drone.x + drone.w / 2;
      const cy = drone.y + drone.h / 2;
      const spin = time * 8 + index;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.strokeStyle = "rgba(210, 245, 255, 0.7)";
      ctx.lineWidth = 2;
      [-16, 16].forEach((ox) => {
        ctx.beginPath();
        ctx.ellipse(ox, -8, 9, 3.2, spin, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.fillStyle = "#24182f";
      roundRect(ctx, -drone.w / 2, -6, drone.w, drone.h, 6);
      ctx.fill();
      ctx.fillStyle = "#ff4fd8";
      ctx.globalAlpha = 0.75 + Math.sin(time * 1.8 + index) * 0.2;
      ctx.beginPath();
      ctx.arc(drone.dir * 6, 2, 3.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  function drawParticles(ctx, particles) {
    particles.forEach((speck) => {
      const t = 1 - speck.age / speck.life;
      ctx.globalAlpha = Math.max(0, t);
      ctx.fillStyle = speck.color;
      ctx.fillRect(speck.x, speck.y, speck.size, speck.size);
    });
    ctx.globalAlpha = 1;
  }

  function limb(ctx, x, y, w, h) {
    roundRect(ctx, x, y, w, h, 3);
    ctx.fill();
  }

  function drawCourier(ctx, player, time) {
    if (player.invuln > 0 && Math.sin(player.invuln * 46) > 0.35) return;
    const bob = player.state === "idle" ? Math.sin(time * 2.4) * 1.1 : 0;
    const step = Math.sin(player.anim);
    ctx.save();
    ctx.translate(player.x + player.w / 2, player.y + player.h + bob);
    const squashX = 1 + player.squash * 0.16;
    const squashY = 1 - player.squash * 0.22;
    ctx.scale(player.facing * squashX, squashY);

    ctx.fillStyle = "rgba(0, 0, 0, 0.28)";
    ctx.beginPath();
    ctx.ellipse(0, -1, 10, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#141820";
    if (player.state === "run") {
      limb(ctx, -7, -16, 5, 10 + step * 4);
      limb(ctx, 2, -16, 5, 10 - step * 4);
    } else if (player.state === "jump") {
      limb(ctx, -8, -18, 5, 8);
      limb(ctx, 3, -16, 5, 8);
    } else if (player.state === "fall") {
      limb(ctx, -8, -16, 5, 12);
      limb(ctx, 3, -18, 5, 11);
    } else {
      limb(ctx, -6, -16, 5, 14);
      limb(ctx, 2, -16, 5, 14);
    }

    ctx.fillStyle = "#243044";
    roundRect(ctx, -9, -34, 18, 20, 5);
    ctx.fill();
    ctx.fillStyle = "#ff4fa3";
    ctx.fillRect(-9, -28, 18, 2);

    ctx.fillStyle = "#e8943a";
    roundRect(ctx, -14, -30, 6, 9, 2);
    ctx.fill();

    ctx.fillStyle = "#e7fff8";
    roundRect(ctx, -13, -38, 9, 7, 1.5);
    ctx.fill();
    ctx.strokeStyle = "#3ee0ff";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-13, -34.5);
    ctx.lineTo(-4, -34.5);
    ctx.moveTo(-8.5, -38);
    ctx.lineTo(-8.5, -31);
    ctx.stroke();

    ctx.fillStyle = "#1a2030";
    roundRect(ctx, -8, -46, 16, 14, 6);
    ctx.fill();
    ctx.fillStyle = "#f0c2a0";
    ctx.beginPath();
    ctx.ellipse(4, -38, 3.2, 3.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a2030";
    ctx.fillRect(-2, -46, 12, 4);

    ctx.restore();
  }

  function drawVignette(ctx) {
    const vignette = ctx.createRadialGradient(480, 270, 160, 480, 280, 560);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(1, "rgba(12, 0, 20, 0.38)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, 960, 540);
  }

  function drawHud(ctx, score, total) {
    ctx.save();
    ctx.font = "700 16px Segoe UI, Trebuchet MS, sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.fillStyle = "rgba(8, 4, 16, 0.45)";
    roundRect(ctx, 16, 14, 118, 28, 8);
    ctx.fill();
    ctx.fillStyle = "#ffd59a";
    ctx.fillText("TIPS  " + score + " / " + total, 28, 20);
    ctx.restore();
  }

  function drawFrame(ctx, scene) {
    drawSky(ctx, scene.time);
    drawFarCity(ctx, scene.camera);
    drawMidCity(ctx, scene.camera, scene.time);
    ctx.save();
    ctx.translate(-Math.round(scene.camera), 0);
    drawAlley(ctx, scene.level.width);
    drawRoofs(ctx, scene.level.roofs);
    drawWasher(ctx, scene.level.washer, scene.time);
    drawTokens(ctx, scene.level.tokens, scene.time);
    drawPad(ctx, scene.level.pad, scene.time);
    drawDrones(ctx, scene.level.drones, scene.time);
    drawParticles(ctx, scene.particles);
    drawCourier(ctx, scene.player, scene.time);
    ctx.restore();
    drawVignette(ctx);
    if (scene.mode === "play") drawHud(ctx, scene.score, scene.level.tokens.length);
  }

  Neon.drawFrame = drawFrame;
})();
