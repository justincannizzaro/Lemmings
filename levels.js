export const LEVELS = [
  {
    id: 'tutorial-1',
    name: '1. Gentle Drop',
    width: 960,
    height: 540,
    timeLimit: 300,
    requiredPercent: 50,
    lemmingsTotal: 20,
    spawnRate: 25,
    spawn: { x: 60, y: 40 },
    exit: { x: 880, y: 460 },
    skills: { builder: 6, basher: 2, digger: 3, blocker: 1, climber: 2, floater: 2, bomber: 2 },
    terrain: {
      ground: [ { x: 0, y: 500, w: 960, h: 40 } ],
      blocks: [ { x: 200, y: 420, w: 160, h: 20 }, { x: 460, y: 360, w: 160, h: 20 }, { x: 720, y: 420, w: 120, h: 20 } ],
      steel: [ { x: 0, y: 500, w: 960, h: 40 } ]
    }
  },
  {
    id: 'tutorial-2',
    name: '2. First Gaps',
    width: 960,
    height: 540,
    timeLimit: 240,
    requiredPercent: 60,
    lemmingsTotal: 30,
    spawnRate: 20,
    spawn: { x: 70, y: 60 },
    exit: { x: 900, y: 480 },
    skills: { builder: 10, basher: 4, digger: 4, blocker: 2, climber: 2, floater: 2, bomber: 2 },
    terrain: {
      ground: [ { x: 0, y: 500, w: 960, h: 40 } ],
      holes: [ { x: 260, y: 500, w: 80, h: 60 }, { x: 540, y: 500, w: 120, h: 80 } ],
      blocks: [ { x: 360, y: 420, w: 90, h: 20 }, { x: 660, y: 430, w: 140, h: 20 } ],
      steel: [ { x: 0, y: 500, w: 960, h: 40 } ]
    }
  },
  {
    id: 'tutorial-3',
    name: '3. Dig Down',
    width: 960,
    height: 540,
    timeLimit: 240,
    requiredPercent: 60,
    lemmingsTotal: 30,
    spawnRate: 20,
    spawn: { x: 100, y: 40 },
    exit: { x: 850, y: 520 },
    skills: { builder: 6, basher: 3, digger: 10, blocker: 2, climber: 1, floater: 2, bomber: 2 },
    terrain: {
      ground: [ { x: 0, y: 520, w: 960, h: 20 } ],
      blocks: [ { x: 240, y: 120, w: 520, h: 40 }, { x: 240, y: 160, w: 40, h: 360 }, { x: 720, y: 160, w: 40, h: 360 } ],
      steel: [ { x: 240, y: 160, w: 40, h: 360 }, { x: 720, y: 160, w: 40, h: 360 } ]
    }
  },
  {
    id: 'tutorial-4',
    name: '4. Build Up',
    width: 960,
    height: 540,
    timeLimit: 240,
    requiredPercent: 70,
    lemmingsTotal: 40,
    spawnRate: 15,
    spawn: { x: 80, y: 260 },
    exit: { x: 860, y: 120 },
    skills: { builder: 20, basher: 2, digger: 2, blocker: 2, climber: 2, floater: 2, bomber: 2 },
    terrain: {
      ground: [ { x: 0, y: 500, w: 960, h: 40 } ],
      blocks: [ { x: 120, y: 320, w: 200, h: 20 }, { x: 420, y: 300, w: 160, h: 20 }, { x: 720, y: 250, w: 160, h: 20 } ],
      steel: [ { x: 0, y: 500, w: 960, h: 40 } ]
    }
  },
  {
    id: 'tutorial-5',
    name: '5. Basher Tunnels',
    width: 960,
    height: 540,
    timeLimit: 240,
    requiredPercent: 70,
    lemmingsTotal: 40,
    spawnRate: 15,
    spawn: { x: 70, y: 80 },
    exit: { x: 880, y: 420 },
    skills: { builder: 8, basher: 12, digger: 4, blocker: 2, climber: 2, floater: 2, bomber: 2 },
    terrain: {
      ground: [ { x: 0, y: 460, w: 960, h: 80 } ],
      blocks: [ { x: 200, y: 120, w: 560, h: 40 }, { x: 200, y: 160, w: 40, h: 340 }, { x: 720, y: 160, w: 40, h: 340 }, { x: 360, y: 300, w: 240, h: 40 } ],
      steel: [ { x: 200, y: 160, w: 40, h: 340 }, { x: 720, y: 160, w: 40, h: 340 } ]
    }
  },
  {
    id: 'challenge-6',
    name: '6. Climbers Needed',
    width: 960,
    height: 540,
    timeLimit: 220,
    requiredPercent: 65,
    lemmingsTotal: 35,
    spawnRate: 18,
    spawn: { x: 80, y: 440 },
    exit: { x: 900, y: 60 },
    skills: { builder: 12, basher: 4, digger: 3, blocker: 2, climber: 8, floater: 4, bomber: 2 },
    terrain: {
      ground: [ { x: 0, y: 500, w: 960, h: 40 } ],
      blocks: [ { x: 280, y: 340, w: 80, h: 200 }, { x: 520, y: 240, w: 80, h: 300 }, { x: 760, y: 140, w: 60, h: 360 } ],
      steel: [ { x: 520, y: 240, w: 80, h: 300 } ]
    }
  },
  {
    id: 'challenge-7',
    name: '7. Drop Control',
    width: 960,
    height: 540,
    timeLimit: 210,
    requiredPercent: 70,
    lemmingsTotal: 40,
    spawnRate: 15,
    spawn: { x: 80, y: 60 },
    exit: { x: 860, y: 500 },
    skills: { builder: 10, basher: 4, digger: 6, blocker: 3, climber: 2, floater: 20, bomber: 2 },
    terrain: {
      ground: [ { x: 0, y: 520, w: 960, h: 20 } ],
      blocks: [ { x: 200, y: 160, w: 560, h: 40 }, { x: 360, y: 320, w: 240, h: 40 } ],
      steel: [ { x: 0, y: 520, w: 960, h: 20 } ]
    }
  },
  {
    id: 'challenge-8',
    name: '8. Bomb Squad',
    width: 960,
    height: 540,
    timeLimit: 210,
    requiredPercent: 65,
    lemmingsTotal: 40,
    spawnRate: 14,
    spawn: { x: 140, y: 120 },
    exit: { x: 820, y: 480 },
    skills: { builder: 12, basher: 6, digger: 6, blocker: 3, climber: 2, floater: 2, bomber: 6 },
    terrain: {
      ground: [ { x: 0, y: 500, w: 960, h: 40 } ],
      blocks: [ { x: 300, y: 80, w: 80, h: 420 }, { x: 500, y: 160, w: 80, h: 340 }, { x: 700, y: 220, w: 80, h: 280 } ],
      steel: [ { x: 300, y: 80, w: 80, h: 420 } ]
    }
  },
  {
    id: 'challenge-9',
    name: '9. Maze',
    width: 960,
    height: 540,
    timeLimit: 200,
    requiredPercent: 60,
    lemmingsTotal: 30,
    spawnRate: 18,
    spawn: { x: 60, y: 60 },
    exit: { x: 900, y: 480 },
    skills: { builder: 10, basher: 10, digger: 8, blocker: 3, climber: 4, floater: 4, bomber: 2 },
    terrain: {
      ground: [ { x: 0, y: 500, w: 960, h: 40 } ],
      blocks: [
        { x: 120, y: 180, w: 720, h: 20 },
        { x: 120, y: 320, w: 720, h: 20 },
        { x: 120, y: 180, w: 20, h: 200 },
        { x: 820, y: 180, w: 20, h: 200 },
        { x: 340, y: 180, w: 20, h: 160 },
        { x: 560, y: 220, w: 20, h: 160 }
      ],
      steel: [ { x: 0, y: 500, w: 960, h: 40 } ]
    }
  },
  {
    id: 'challenge-10',
    name: '10. Final Gauntlet',
    width: 960,
    height: 540,
    timeLimit: 180,
    requiredPercent: 70,
    lemmingsTotal: 50,
    spawnRate: 12,
    spawn: { x: 60, y: 80 },
    exit: { x: 900, y: 80 },
    skills: { builder: 20, basher: 12, digger: 8, blocker: 3, climber: 6, floater: 10, bomber: 4 },
    terrain: {
      ground: [ { x: 0, y: 520, w: 960, h: 20 } ],
      blocks: [
        { x: 200, y: 420, w: 120, h: 20 },
        { x: 360, y: 340, w: 120, h: 20 },
        { x: 520, y: 260, w: 120, h: 20 },
        { x: 680, y: 180, w: 120, h: 20 }
      ],
      steel: [ { x: 0, y: 520, w: 960, h: 20 } ]
    }
  }
];
