
const canvas = document.getElementById("canvas");

const symbols = {
  plant: "🪴",
  chair: "🪑",
  lamp: "💡",
  art: "🖼️"
};

let objects = [];
let selectedId = null;
let nextId = 1;

function render() {
  canvas.querySelectorAll(".collage-object").forEach(el => el.remove());

  objects.forEach(obj => {
    const element = document.createElement("div");

    element.className = "collage-object";
    element.textContent = symbols[obj.type];
    element.dataset.id = obj.id;

    element.style.left = obj.x + "px";
    element.style.top = obj.y + "px";
    element.style.transform =
      `scale(${obj.scale}) rotate(${obj.rotation}deg)`;

    if (obj.id === selectedId) {
      element.classList.add("selected");
    }

    element.addEventListener("pointerdown", startDrag);
    canvas.appendChild(element);
  });
}

function addObject(type) {
  const obj = {
    id: nextId++,
    type,
    x: Math.max(0, canvas.clientWidth / 2 - 55),
    y: Math.max(0, canvas.clientHeight / 2 - 55),
    scale: 1,
    rotation: 0
  };

  objects.push(obj);
  selectedId = obj.id;
  render();
}

function startDrag(event) {
  event.preventDefault();

  const element = event.currentTarget;
  const id = Number(element.dataset.id);
  const obj = objects.find(item => item.id === id);

  if (!obj) return;

  selectedId = id;
  render();

  const rect = canvas.getBoundingClientRect();
  const offsetX = event.clientX - rect.left - obj.x;
  const offsetY = event.clientY - rect.top - obj.y;

  function move(e) {
    obj.x = Math.max(
      0,
      Math.min(canvas.clientWidth - 110,
        e.clientX - rect.left - offsetX)
    );

    obj.y = Math.max(
      0,
      Math.min(canvas.clientHeight - 110,
        e.clientY - rect.top - offsetY)
    );

    const active = canvas.querySelector(
      `[data-id="${id}"]`
    );

    if (active) {
      active.style.left = obj.x + "px";
      active.style.top = obj.y + "px";
    }
  }

  function stop() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
    window.removeEventListener("pointercancel", stop);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
  window.addEventListener("pointercancel", stop);
}

function editSelected(action) {
  const obj = objects.find(item => item.id === selectedId);

  if (!obj) return;

  if (action === "bigger") {
    obj.scale = Math.min(3, obj.scale + 0.15);
  }

  if (action === "smaller") {
    obj.scale = Math.max(0.3, obj.scale - 0.15);
  }

  if (action === "rotate") {
    obj.rotation = (obj.rotation + 15) % 360;
  }

  if (action === "delete") {
    objects = objects.filter(item => item.id !== selectedId);
    selectedId = null;
  }

  render();
}

document.querySelectorAll(".add-btn").forEach(button => {
  button.addEventListener("click", () => {
    addObject(button.dataset.type);
  });
});

document.getElementById("biggerBtn").onclick =
  () => editSelected("bigger");

document.getElementById("smallerBtn").onclick =
  () => editSelected("smaller");

document.getElementById("rotateBtn").onclick =
  () => editSelected("rotate");

document.getElementById("deleteBtn").onclick =
  () => editSelected("delete");

document.getElementById("saveBtn").onclick = () => {
  localStorage.setItem("inhabit-space", JSON.stringify(objects));
  alert("Your little space has been saved! ♡");
};

document.getElementById("resetBtn").onclick = () => {
  if (confirm("Start your space again?")) {
    objects = [];
    selectedId = null;
    localStorage.removeItem("inhabit-space");
    render();
  }
};

try {
  const saved = JSON.parse(
    localStorage.getItem("inhabit-space") || "[]"
  );

  if (Array.isArray(saved)) {
    objects = saved;
    nextId = Math.max(
      0,
      ...objects.map(obj => Number(obj.id) || 0)
    ) + 1;
  }
} catch (error) {
  console.warn("Could not load saved space.", error);
}

render();
