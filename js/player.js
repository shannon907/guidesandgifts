(function () {
  const Neon = (window.Neon = window.Neon || {});

  const PHYS = {
    gravity: 1700,
    maxRun: 255,
    accel: 1500,
    airAccel: 980,
    friction: 1300,
    jumpVel: -600,
    jumpCut: 0.48,
    coyote: 0.12,
    buffer: 0.13,
    maxFall: 820,
  };

  const WIDTH = 22;
  const HEIGHT = 36;

  function createPlayer(spawn) {
    return {
      x: spawn.x,
      y: spawn.y,
      w: WIDTH,
      h: HEIGHT,
      vx: 0,
      vy: 0,
      facing: 1,
      onGround: false,
      coyote: 0,
      jumpBuffer: 0,
      rising: false,
      state: "idle",
      anim: 0,
      squash: 0,
      invuln: 0,
      checkpoint: { x: spawn.x, y: spawn.y },
      ground: null,
    };
  }

  function overlapsX(a, s) {
    return a.x < s.x + s.w && a.x + a.w > s.x;
  }

  function tryJump(player) {
    if (player.jumpBuffer <= 0) return false;
    if (!player.onGround && player.coyote <= 0) return false;
    player.vy = PHYS.jumpVel;
    player.onGround = false;
    player.coyote = 0;
    player.jumpBuffer = 0;
    player.rising = true;
    player.ground = null;
    return true;
  }

  function updatePlayer(player, input, dt, solids) {
    const left = input.left ? 1 : 0;
    const right = input.right ? 1 : 0;
    const dir = right - left;
    const accel = player.onGround ? PHYS.accel : PHYS.airAccel;

    if (dir !== 0) {
      player.vx += dir * accel * dt;
      player.facing = dir;
    } else if (player.onGround) {
      const drop = PHYS.friction * dt;
      if (Math.abs(player.vx) <= drop) player.vx = 0;
      else player.vx -= Math.sign(player.vx) * drop;
    } else {
      player.vx *= Math.pow(0.35, dt);
    }

    if (player.vx > PHYS.maxRun) player.vx = PHYS.maxRun;
    if (player.vx < -PHYS.maxRun) player.vx = -PHYS.maxRun;

    if (input.jumpPressed) player.jumpBuffer = PHYS.buffer;
    else player.jumpBuffer = Math.max(0, player.jumpBuffer - dt);

    if (player.onGround) player.coyote = PHYS.coyote;

    let jumped = tryJump(player);

    if (player.rising && !input.jumpHeld && player.vy < 0) {
      player.vy *= PHYS.jumpCut;
      player.rising = false;
    }
    if (!input.jumpHeld) player.rising = false;

    player.vy = Math.min(PHYS.maxFall, player.vy + PHYS.gravity * dt);

    player.x += player.vx * dt;
    for (let i = 0; i < solids.length; i++) {
      const solid = solids[i];
      const feet = player.y + player.h;
      // A body that only nicks the lip should step up, not get shoved back into the gap.
      if (feet > solid.y && feet <= solid.y + 16 && player.vy >= 0 && overlapsX(player, solid)) {
        player.y = solid.y - player.h;
        continue;
      }
      const vertically = player.y < solid.y + solid.h && feet > solid.y + 16;
      if (!vertically || !overlapsX(player, solid)) continue;
      if (player.vx > 0) player.x = solid.x - player.w;
      else if (player.vx < 0) player.x = solid.x + solid.w;
      else {
        const pushLeft = player.x + player.w - solid.x;
        const pushRight = solid.x + solid.w - player.x;
        player.x += pushLeft < pushRight ? -pushLeft : pushRight;
      }
      player.vx = 0;
    }

    const prevBottom = player.y + player.h;
    const prevTop = player.y;
    player.y += player.vy * dt;

    let landing = null;
    let ceiling = null;
    for (let i = 0; i < solids.length; i++) {
      const solid = solids[i];
      if (!overlapsX(player, solid)) continue;
      const crossedTop = player.vy >= 0 && prevBottom <= solid.y + 4 && player.y + player.h >= solid.y;
      if (crossedTop && (!landing || solid.y < landing.y)) landing = solid;
      const solidBottom = solid.y + solid.h;
      const hitHead = player.vy < 0 && prevTop >= solidBottom - 2 && player.y <= solidBottom;
      if (hitHead && (!ceiling || solidBottom > ceiling.y + ceiling.h)) ceiling = solid;
    }

    player.ground = null;
    const wasAir = !player.onGround;
    if (landing) {
      player.y = landing.y - player.h;
      const impact = player.vy;
      player.vy = 0;
      player.onGround = true;
      player.ground = landing;
      player.coyote = PHYS.coyote;
      if (wasAir && impact > 260) player.squash = 1;
      if (landing.checkpoint) {
        const minX = landing.x + 2;
        const maxX = landing.x + landing.w - player.w - 2;
        let cx = player.x;
        if (maxX >= minX) cx = Math.max(minX, Math.min(maxX, cx));
        player.checkpoint = { x: cx, y: player.y };
      }
    } else {
      player.onGround = false;
      player.coyote = Math.max(0, player.coyote - dt);
    }

    if (!landing && ceiling) {
      player.y = ceiling.y + ceiling.h;
      if (player.vy < 0) player.vy = 0;
    }

    if (!jumped && tryJump(player)) jumped = true;

    if (player.ground && player.ground.moving) player.x += player.ground.dx || 0;

    if (!player.onGround) player.state = player.vy < 0 ? "jump" : "fall";
    else if (Math.abs(player.vx) > 18) player.state = "run";
    else player.state = "idle";

    player.anim += dt * (player.state === "run" ? 11 : 2.2);
    player.squash = Math.max(0, player.squash - dt * 4.5);
    if (player.invuln > 0) player.invuln = Math.max(0, player.invuln - dt);

    return { jumped };
  }

  function respawnPlayer(player) {
    player.x = player.checkpoint.x;
    player.y = player.checkpoint.y;
    player.vx = 0;
    player.vy = 0;
    player.onGround = false;
    player.rising = false;
    player.ground = null;
    player.invuln = 0.85;
    player.squash = 0;
    player.state = "fall";
  }

  Neon.PHYS = PHYS;
  Neon.createPlayer = createPlayer;
  Neon.updatePlayer = updatePlayer;
  Neon.respawnPlayer = respawnPlayer;
})();
