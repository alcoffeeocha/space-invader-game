'use strict';
const scoreEl = document.getElementById('scoreEl');
const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

console.log(scoreEl);
// 16:9
canvas.width = 1024;
canvas.height = 576;

const player = new Player(0.15);
// storing multiple projectiles
const projectiles = [];
const grids = [];
const invaderProjectiles = [];
const particles = [];

const keys = {
  a: {
    pressed: false,
  },
  d: {
    pressed: false,
  },
  space: {
    pressed: false,
  },
};

let frames = 0;
const minimumFramesToSpawn = 0;
let randomIntervals = Math.floor(Math.random() * 500 + minimumFramesToSpawn);
let game = {
  over: false,
  active: true,
};
let score = 0;

// Create background stars.
for (let i = 0; i < 100; i++) {
  particles.push(
    new Particle({
      position: {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
      },
      // Randomize velocity so particles not on top of each others.
      velocity: {
        x: 0,
        y: 0.3,
      },
      radius: Math.random() * 2,
      color: 'white',
      fade: false,
    })
  );
}

// Create particles splash.
function createParticles({ object, color = '#BAA0DE' }) {
  for (let i = 0; i < 15; i++) {
    particles.push(
      new Particle({
        position: {
          x: object.position.x + object.width / 2,
          y: object.position.y + object.height / 2,
        },
        // Randomize velocity so particles not on top of each others.
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
        radius: Math.random() * 3,
        color: color,
      })
    );
  }
}

function animate() {
  if (!game.active) return;
  requestAnimationFrame(animate);
  c.fillStyle = 'black';
  c.fillRect(0, 0, canvas.width, canvas.height);
  player.update();
  particles.forEach((particle, particleIndex) => {
    if (particle.position.y - particle.radius >= canvas.height) {
      particle.position.x = Math.random() * canvas.width;
      particle.position.y = -particle.radius;
    }
    if (particle.opacity <= 0) {
      // Prevent flickering.
      setTimeout(() => {
        // Garbagge collection.
        particles.splice(particleIndex, 1);
      }, 0);
    } else {
      particle.update();
    }
  });
  invaderProjectiles.forEach((invaderProjectile, invaderProjectileIndex) => {
    if (
      invaderProjectile.position.y + invaderProjectile.height >=
      canvas.height
    ) {
      setTimeout(() => {
        invaderProjectiles.splice(invaderProjectileIndex, 1);
      }, 0);
    } else {
      invaderProjectile.update();
    }
    // Projectile hits player.
    if (
      invaderProjectile.position.y + invaderProjectile.height >=
        player.position.y &&
      invaderProjectile.position.x + invaderProjectile.width >=
        player.position.x &&
      invaderProjectile.position.x <= player.position.x + player.width
    ) {
      setTimeout(() => {
        invaderProjectiles.splice(invaderProjectileIndex, 1);
        player.opacity = 0;
        game.over = true;
      }, 0);
      setTimeout(() => {
        game.active = false;
      }, 1000);
      document.querySelector('[data-js=info]').textContent = 'You Lose';
      createParticles({
        object: player,
        color: 'white',
      });
    }
  });

  grids.forEach((grid, gridIndex) => {
    grid.update();
    // Spawn enemy's projectile.
    if (frames % 100 == 0 && grid.invaders.length > 0) {
      grid.invaders[Math.floor(Math.random() * grid.invaders.length)].shoot(
        invaderProjectiles
      );
    }
    grid.invaders.forEach((invader, i) => {
      invader.update({
        velocity: grid.velocity,
      });

      // Projectile hit enemy.
      projectiles.forEach((projectile, j) => {
        const topOfProjectile = projectile.position.y - projectile.radius;
        const bottomOfProjectile = projectile.position.y + projectile.radius;
        const topOfInvader = invader.position.y;
        const bottomOfInvader = invader.position.y + invader.height;
        const rightSideOfProjectile = projectile.position.x + projectile.radius;
        const leftSideOfInvader = invader.position.x;
        const rightSideOfInvader = invader.position.x + invader.width;
        const leftSideOfProjectile = projectile.position.x - projectile.radius;
        const isCollided =
          topOfProjectile <= bottomOfInvader &&
          rightSideOfProjectile >= leftSideOfInvader &&
          leftSideOfProjectile <= rightSideOfInvader &&
          bottomOfProjectile >= topOfInvader;
        if (isCollided) {
          setTimeout(() => {
            const invaderFound = grid.invaders.find(
              (invader2) => invader2 === invader
            );
            const projectileFound = projectiles.find(
              (projectile2) => projectile2 === projectile
            );
            // Remove invader and projectile.
            if (invaderFound && projectileFound) {
              score += 100;
              scoreEl.textContent = score;
              createParticles({
                object: invader,
              });
              grid.invaders.splice(i, 1);
              projectiles.splice(j, 1);

              // Handle new grid width when some invaders removed.
              const totalInvaders = grid.invaders.length;
              if (totalInvaders > 0) {
                const firstInvader = grid.invaders[0];
                const lastInvader = grid.invaders[totalInvaders - 1];

                grid.width =
                  lastInvader.position.x -
                  firstInvader.position.x +
                  lastInvader.width;
                grid.position.x = firstInvader.position.x;
              } else {
                grids.splice(gridIndex, 1);
              }
            }
          }, 0);
        }
      });
    });
  });

  projectiles.forEach((projectile, index) => {
    const outOfScreen = projectile.position.y + projectile.radius <= 0;
    if (outOfScreen) {
      setTimeout(() => {
        projectiles.splice(index, 1);
      }, 0);
    } else {
      projectile.update();
    }
  });
  if (keys.a.pressed && player.position.x >= 0) {
    player.velocity.x = -7;
    player.rotation = -0.15;
  } else if (
    keys.d.pressed &&
    player.position.x + player.width <= canvas.width
  ) {
    player.velocity.x = 7;
    player.rotation = 0.15;
  } else {
    // reset
    player.velocity.x = 0;
    player.rotation = 0;
  }

  // Spawn enemies.
  if (frames % randomIntervals == 0) {
    grids.push(new Grid());
    randomIntervals = Math.floor(Math.random() * 500 + minimumFramesToSpawn);
    frames = 0;
  }

  frames++;
}
animate();

addEventListener('keydown', ({ key }) => {
  if (game.over) return;
  switch (key) {
    case 'a':
      keys.a.pressed = true;
      break;
    case 'd':
      keys.d.pressed = true;
      break;
    case ' ':
      projectiles.push(
        new Projectile({
          position: {
            x: player.position.x + player.width / 2,
            y: player.position.y,
          },
          velocity: {
            x: 0,
            y: -10,
          },
        })
      );
      keys.space.pressed = true;
      break;
  }
});
addEventListener('keyup', ({ key }) => {
  switch (key) {
    case 'a':
      keys.a.pressed = false;
      break;
    case 'd':
      keys.d.pressed = false;
      break;
    case ' ':
      keys.space.pressed = false;
      break;
  }
});

document.querySelectorAll('[data-disappear]').forEach((element) => {
  setTimeout(() => {
    element.textContent = '';
  }, parseInt(element.dataset.disappear));
});
