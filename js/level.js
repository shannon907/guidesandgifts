(function () {
  const Neon = (window.Neon = window.Neon || {});

  // About four screens wide. Surfaces are solid from `y` downward.
  // Upward gaps stay inside a full jump; the washer bridges the long span.
  const ROOFS = [
    { x: 0, y: 430, w: 540, h: 200 },
    { x: 680, y: 462, w: 300, h: 160 },
    { x: 1040, y: 418, w: 460, h: 220 },
    { x: 1320, y: 378, w: 86, h: 40 },
    { x: 1460, y: 342, w: 86, h: 76 },
    { x: 1860, y: 430, w: 320, h: 200 },
    { x: 2220, y: 392, w: 540, h: 240 },
    { x: 2880, y: 448, w: 240, h: 180 },
    { x: 3160, y: 408, w: 280, h: 220 },
    { x: 3500, y: 372, w: 620, h: 260 },
  ];

  function createLevel() {
    return {
      width: 4200,
      height: 540,
      spawn: { x: 56, y: 430 - 36 },
      roofs: ROOFS.map((roof) => ({ ...roof, checkpoint: true })),
      washer: {
        x: 1620,
        y: 392,
        w: 136,
        h: 16,
        minX: 1620,
        maxX: 1860,
        speed: 42,
        dir: 1,
        dx: 0,
        moving: true,
        checkpoint: false,
      },
      drones: [
        { x: 2360, y: 348, w: 36, h: 18, minX: 2340, maxX: 2680, speed: 58, dir: 1 },
        { x: 3660, y: 328, w: 36, h: 18, minX: 3620, maxX: 3920, speed: 70, dir: 1 },
      ],
      tokens: [
        { x: 260, y: 392, r: 11 },
        { x: 800, y: 420, r: 11 },
        { x: 1490, y: 292, r: 11 },
        { x: 1980, y: 388, r: 11 },
        { x: 2500, y: 340, r: 11 },
        { x: 3320, y: 360, r: 11 },
        { x: 3960, y: 320, r: 11 },
      ].map((token) => ({ ...token, got: false })),
      pad: { x: 3988, y: 372, w: 92, h: 14 },
    };
  }

  function updateMover(mover, dt) {
    const prev = mover.x;
    mover.x += mover.dir * mover.speed * dt;
    if (mover.x < mover.minX) {
      mover.x = mover.minX;
      mover.dir = 1;
    }
    const right = mover.x + (mover.w || 0);
    if (right > mover.maxX) {
      mover.x = mover.maxX - mover.w;
      mover.dir = -1;
    }
    mover.dx = mover.x - prev;
  }

  function updateLevel(level, dt) {
    updateMover(level.washer, dt);
    level.drones.forEach((drone) => updateMover(drone, dt));
  }

  function solids(level) {
    return level.roofs.concat([level.washer]);
  }

  Neon.createLevel = createLevel;
  Neon.updateLevel = updateLevel;
  Neon.levelSolids = solids;
})();
