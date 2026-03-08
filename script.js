const letterScreen = document.getElementById("letterScreen");
const letterIcon = document.getElementById("letterIcon");
const letterCard = document.getElementById("letterCard");
const flowersScreen = document.getElementById("flowersScreen");
const flowersContainer = document.getElementById("flowersContainer");
const continueBtn = document.getElementById("continueBtn");
const spawnLayer = document.getElementById("spawnLayer");
const spawnPrompt = document.getElementById("spawnPrompt");

const MAX_FLOWERS = 14;
const MIN_HORIZONTAL_GAP = 8;
const spawned = [];
let flowersRevealed = false;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function generateHeightVh(index, total) {
  const centerRatio = Math.abs((index - (total - 1) / 2) / total) * 2;
  const base = 42;
  const range = 22;
  const centerBonus = (1 - centerRatio) * 10;
  return base + Math.random() * range + centerBonus;
}

function findSafeX(desiredX) {
  if (spawned.length === 0) return desiredX;

  const isSafe = (x) => spawned.every((f) => Math.abs(f.x - x) >= MIN_HORIZONTAL_GAP);
  if (isSafe(desiredX)) return desiredX;

  for (let offset = MIN_HORIZONTAL_GAP; offset < 90; offset += 2.5) {
    const left = desiredX - offset;
    const right = desiredX + offset;
    if (left >= 4 && isSafe(left)) return left;
    if (right <= 96 && isSafe(right)) return right;
  }

  return clamp(desiredX, 4, 96);
}

function chooseVariant() {
  const c1 = spawned.filter((f) => f.variant === 1).length;
  const c2 = spawned.filter((f) => f.variant === 2).length;
  const c3 = spawned.filter((f) => f.variant === 3).length;

  const counts = [c1, c2, c3];
  const min = Math.min(...counts);
  const options = [1, 2, 3].filter((v, i) => counts[i] === min);
  return options[Math.floor(Math.random() * options.length)];
}

function getOriginalFlowerMarkup(variant) {
  const lineLeaves =
    variant === 1
      ? `<div class="flower__line__leaf flower__line__leaf--1"></div>
         <div class="flower__line__leaf flower__line__leaf--2"></div>
         <div class="flower__line__leaf flower__line__leaf--3"></div>
         <div class="flower__line__leaf flower__line__leaf--4"></div>
         <div class="flower__line__leaf flower__line__leaf--5"></div>
         <div class="flower__line__leaf flower__line__leaf--6"></div>`
      : `<div class="flower__line__leaf flower__line__leaf--1"></div>
         <div class="flower__line__leaf flower__line__leaf--2"></div>
         <div class="flower__line__leaf flower__line__leaf--3"></div>
         <div class="flower__line__leaf flower__line__leaf--4"></div>`;

  return `
    <div class="flower flower--${variant}">
      <div class="flower__leafs flower__leafs--${variant}">
        <div class="flower__leaf flower__leaf--1"></div>
        <div class="flower__leaf flower__leaf--2"></div>
        <div class="flower__leaf flower__leaf--3"></div>
        <div class="flower__leaf flower__leaf--4"></div>
        <div class="flower__white-circle"></div>

        <div class="flower__light flower__light--1"></div>
        <div class="flower__light flower__light--2"></div>
        <div class="flower__light flower__light--3"></div>
        <div class="flower__light flower__light--4"></div>
        <div class="flower__light flower__light--5"></div>
        <div class="flower__light flower__light--6"></div>
        <div class="flower__light flower__light--7"></div>
        <div class="flower__light flower__light--8"></div>
      </div>
      <div class="flower__line">${lineLeaves}</div>
    </div>
  `;
}

function createFlowerNode(variant, x, heightVh) {
  const wrapper = document.createElement("div");
  const baseHeight = variant === 1 ? 70 : 60;
  const scale = clamp(heightVh / baseHeight, 0.62, 1.25);

  wrapper.className = "spawned-original";
  wrapper.style.setProperty("--x", `${x}%`);
  wrapper.style.setProperty("--scale", `${scale}`);
  wrapper.innerHTML = getOriginalFlowerMarkup(variant);
  return wrapper;
}

function spawnFlower(clientX) {
  if (!spawnLayer || spawned.length >= MAX_FLOWERS) return;

  const bounds = flowersScreen.getBoundingClientRect();
  const relativeX = (clientX - bounds.left) / bounds.width;
  const baseX = clamp(relativeX * 100, 4, 96);
  const desiredX = clamp(baseX + (Math.random() - 0.5) * 9, 4, 96);
  const safeX = findSafeX(desiredX);
  const variant = chooseVariant();

  const id = Date.now() + Math.floor(Math.random() * 1000);
  const heightVh = generateHeightVh(spawned.length, MAX_FLOWERS);

  spawned.push({ id, variant, x: safeX });
  const node = createFlowerNode(variant, safeX, heightVh, id);
  spawnLayer.appendChild(node);

  if (spawnPrompt) {
    spawnPrompt.classList.add("is-fading");
  }
}

continueBtn.addEventListener("click", () => {
  const audio = document.getElementById("continueSfx");
  if (audio) {
    audio.play().catch(() => {});
  }

  letterScreen.classList.add("hidden");
  letterCard.classList.remove("overlay-mode");
  letterCard.classList.add("hidden");
  continueBtn.classList.add("hidden");

  setTimeout(() => {
    flowersScreen.classList.remove("hidden");
    requestAnimationFrame(() => {
      flowersScreen.classList.remove("not-loaded");
    });
  }, 320);

  setTimeout(() => {
    const birthdayMessage = document.getElementById("birthdayMessage");
    if (birthdayMessage) {
      birthdayMessage.classList.add("show");
    }
  }, 5320);
});

letterScreen.addEventListener("pointerdown", (event) => {
  if (letterScreen.classList.contains("hidden")) return;
  if (letterCard.classList.contains("overlay-mode")) return;
  if (event.target.closest(".letter-card")) return;
  
  letterIcon.classList.add("hidden");
  letterCard.classList.remove("hidden");
  letterCard.classList.add("overlay-mode");
  continueBtn.classList.remove("hidden");
});

flowersScreen.addEventListener("pointerdown", (event) => {
  if (flowersScreen.classList.contains("hidden")) return;
  
  if (!flowersRevealed) {
    flowersContainer.classList.remove("flowers-hidden");
    flowersContainer.classList.add("flowers-visible");
    flowersRevealed = true;
    if (spawnPrompt) {
      spawnPrompt.classList.add("is-fading");
    }
    return;
  }
  
  spawnFlower(event.clientX);
});
