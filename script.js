

/* ========================================
   INHABIT — INTERACTIONS
======================================== */

const canvas = document.getElementById("canvas");
const workspace = document.getElementById("workspace");

const menuToggle = document.getElementById("menuToggle");
const menuPanel = document.getElementById("menuPanel");
const closeMenu = document.getElementById("closeMenu");

const collectionGrid = document.getElementById("collectionGrid");
const collectionMessage = document.getElementById("collectionMessage");
const importActions = document.getElementById("importActions");

const imageInput = document.getElementById("imageInput");
const cameraInput = document.getElementById("cameraInput");

const objectToolbar = document.getElementById("objectToolbar");
const objectInfo = document.getElementById("objectInfo");

const STORAGE_SPACE = "inhabit-space-v2";
const STORAGE_COLLECTION = "inhabit-collection-v2";

/* ========================================
   INHABIT — IMAGE DATABASE
======================================== */

const IMAGE_DB_NAME = "inhabit-images";
const IMAGE_DB_VERSION = 1;
const IMAGE_STORE = "images";

function openImageDatabase() {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error(
        "IndexedDB is not supported."
      ));
      return;
    }

    const request = indexedDB.open(
      IMAGE_DB_NAME,
      IMAGE_DB_VERSION
    );

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(IMAGE_STORE)) {
        database.createObjectStore(IMAGE_STORE);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(
        request.error ||
        new Error("Could not open image database.")
      );
    };
  });
}

async function saveImageToDatabase(id, imageBlob) {
  const database = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      IMAGE_STORE,
      "readwrite"
    );

    const store = transaction.objectStore(IMAGE_STORE);

    store.put(imageBlob, String(id));

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };

    transaction.onerror = () => {
      const error = transaction.error;
      database.close();

      reject(
        error ||
        new Error("Could not save image.")
      );
    };

    transaction.onabort = () => {
      const error = transaction.error;
      database.close();

      reject(
        error ||
        new Error("Image saving was cancelled.")
      );
    };
  });
}

async function getImageFromDatabase(id) {
  const database = await openImageDatabase();

  return new Promise((resolve, reject) => {
    const transaction = database.transaction(
      IMAGE_STORE,
      "readonly"
    );

    const request = transaction
      .objectStore(IMAGE_STORE)
      .get(String(id));

    request.onsuccess = () => {
      database.close();
      resolve(request.result || null);
    };

    request.onerror = () => {
      const error = request.error;
      database.close();

      reject(
        error ||
        new Error("Could not load image.")
      );
    };
  });
}


let objects = [];
let collection = [];
let selectedId = null;
let activeCategory = null;
let nextId = 1;
let nextItemId = 1;

/* ========================================
   ENTRADA
======================================== */

function enterWebsite() {
  if (document.body.classList.contains("entered")) {
    return;
  }

  document.body.classList.add("entered");
}

document.addEventListener("pointerdown", enterWebsite, {
  once: true
});

document.addEventListener("keydown", enterWebsite, {
  once: true
});

/* ========================================
   GUARDAR E CARREGAR
======================================== */

function readStorage(key, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return value ?? fallback;
  } catch (error) {
    console.warn("Could not read storage:", error);
    return fallback;
  }
}


function saveData() {
  try {
    // Guardar posições e tamanhos dos objetos.
    localStorage.setItem(
      STORAGE_SPACE,
      JSON.stringify(objects)
    );

    // Guardar os dados da coleção sem os
    // endereços temporários das imagens novas.
    const collectionToSave = collection.map(item => {
      const savedItem = { ...item };

      if (
        typeof savedItem.src === "string" &&
        savedItem.src.startsWith("blob:")
      ) {
        delete savedItem.src;
      }

      return savedItem;
    });

    localStorage.setItem(
      STORAGE_COLLECTION,
      JSON.stringify(collectionToSave)
    );

    return true;

  } catch (error) {
    console.error("Could not save data:", error);

    alert(
      "Não foi possível guardar os dados. " +
      "O armazenamento do navegador pode estar cheio."
    );

    return false;
  }
}


function loadData() {
  const savedObjects = readStorage(STORAGE_SPACE, []);
  const savedCollection = readStorage(
    STORAGE_COLLECTION,
    []
  );

  objects = Array.isArray(savedObjects)
    ? savedObjects
    : [];

  collection = Array.isArray(savedCollection)
    ? savedCollection
    : [];

  nextId = Math.max(
    0,
    ...objects.map(obj => Number(obj.id) || 0)
  ) + 1;

  nextItemId = Math.max(
    0,
    ...collection.map(item => Number(item.id) || 0)
  ) + 1;
}

/* ========================================
   MENU
======================================== */

function setMenuOpen(open) {
  menuPanel.hidden = !open;
  menuToggle.setAttribute(
    "aria-expanded",
    String(open)
  );
}

menuToggle.addEventListener("click", () => {
  setMenuOpen(menuPanel.hidden);
});

closeMenu.addEventListener("click", () => {
  setMenuOpen(false);
});

document.querySelectorAll(".category-btn").forEach(
  button => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category;

      document.querySelectorAll(
        ".category-btn"
      ).forEach(item => {
        item.classList.toggle(
          "active",
          item === button
        );
      });

      renderCollection();
    });
  }
);

/* ========================================
   COLEÇÃO PESSOAL
======================================== */

function renderCollection() {
  collectionGrid.innerHTML = "";

  if (!activeCategory) {
    collectionMessage.textContent =
      "select a category.";
    importActions.hidden = true;
    return;
  }

  const items = collection.filter(
    item => item.category === activeCategory
  );

  if (activeCategory === "wallpaper") {
    collectionMessage.textContent =
      "choose a background for your space.";

    const whiteButton = document.createElement("button");
    whiteButton.className = "collection-item";
    whiteButton.textContent = "white background";

    whiteButton.addEventListener("click", () => {
      canvas.style.backgroundImage = "none";
      canvas.style.backgroundColor = "#ffffff";
      saveWallpaper("none");
      setMenuOpen(false);
    });

    collectionGrid.appendChild(whiteButton);
  } else {
    collectionMessage.textContent = items.length
      ? "your personal collection."
      : "your collection is empty.";
  }

  items.forEach(item => {
    const button = document.createElement("button");
    button.className = "collection-item";
    button.type = "button";

    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.name;

    const label = document.createElement("span");
    label.textContent = item.name;

    button.append(image, label);

    button.addEventListener("click", () => {
      if (activeCategory === "wallpaper") {
        canvas.style.backgroundImage =
          `url("${item.src}")`;
        canvas.style.backgroundSize = "cover";
        canvas.style.backgroundPosition = "center";
        saveWallpaper(item.id);
      } else {
        addObject(item);
      }

      setMenuOpen(false);
    });

    collectionGrid.appendChild(button);
  });

  importActions.hidden = false;
}

document.getElementById("uploadBtn").addEventListener(
  "click",
  () => imageInput.click()
);

document.getElementById("cameraBtn").addEventListener(
  "click",
  () => cameraInput.click()
);

imageInput.addEventListener("change", event => {
  handleImageUpload(event.target.files?.[0]);
  event.target.value = "";
});

cameraInput.addEventListener("change", event => {
  handleImageUpload(event.target.files?.[0]);
  event.target.value = "";
});


/* ========================================
   IMPORTAR E RECORTAR IMAGENS
======================================== */


/* ========================================
   IMPORTAR E GUARDAR IMAGENS
======================================== */

async function handleImageUpload(file) {
  if (!file || !file.type.startsWith("image/")) {
    return;
  }

  const category = activeCategory || "objects";

  const name = file.name
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]/g, " ");

  let imageFile = file;

  collectionMessage.textContent =
    "preparing your image...";

  // Remover o fundo apenas de objetos e plantas.

  if (category !== "wallpaper") {
    collectionMessage.textContent =
      "removing background...";

    try {
      if (typeof window.removeImageBackground !== "function") {
        throw new Error(
          "Background removal library is not ready."
        );
      }

      imageFile = await window.removeImageBackground(
        file,
        {
          device: "cpu",
          output: {
            format: "image/png",
            quality: 1
          }
        }
      );

    } catch (error) {
      console.error(
        "Background removal failed:",
        error
      );

      const useOriginal = confirm(
        "Não foi possível remover o fundo. " +
        "Queres utilizar a fotografia original?"
      );

      if (!useOriginal) {
        collectionMessage.textContent =
          "image import cancelled.";
        return;
      }

      imageFile = file;
    }
  }

  collectionMessage.textContent =
    "saving to your collection...";

  const item = {
    id: nextItemId,
    category,
    name: name || "Untitled object",
    details: "Personal collection"
  };

  try {
    // Guardar a imagem no IndexedDB.
    await saveImageToDatabase(item.id, imageFile);

    // Criar um endereço temporário para mostrar a imagem.
    item.src = URL.createObjectURL(imageFile);

    // Guardar apenas os metadados no localStorage.
    const previousCollection = collection;
    collection = [...collection, item];

    if (!saveData()) {
      collection = previousCollection;
      URL.revokeObjectURL(item.src);

      collectionMessage.textContent =
        "could not save collection.";
      return;
    }

    nextItemId++;

    renderCollection();

    if (category !== "wallpaper") {
      addObject(item);
    }

  } catch (error) {
    console.error(
      "Image storage failed:",
      error
    );

    collectionMessage.textContent =
      "could not save image.";

    alert(
      "Não foi possível guardar a imagem " +
      "no navegador."
    );
  }
}
/* ========================================
   WALLPAPER
======================================== */

function saveWallpaper(value) {
  try {
    localStorage.setItem(
      "inhabit-wallpaper-v2",
      String(value)
    );
  } catch (error) {
    console.warn("Wallpaper not saved:", error);
  }
}

function loadWallpaper() {
  const saved = localStorage.getItem(
    "inhabit-wallpaper-v2"
  );

  const item = collection.find(
    entry => String(entry.id) === saved
  );

  if (item) {
    canvas.style.backgroundImage =
      `url("${item.src}")`;
    canvas.style.backgroundSize = "cover";
    canvas.style.backgroundPosition = "center";
  }
}

/* ========================================
   OBJETOS
======================================== */

function addObject(item) {
  const size = window.innerWidth <= 700
    ? 145
    : 180;

  const obj = {
    id: nextId++,
    itemId: item.id,
    x: Math.max(
      0,
      (canvas.clientWidth - size) / 2
    ),
    y: Math.max(
      0,
      (canvas.clientHeight - size) / 2
    ),
    scale: 1,
    rotation: 0
  };

  objects.push(obj);
  selectedId = obj.id;

  renderObjects();
  saveData();
}

function renderObjects() {
  canvas.querySelectorAll(
    ".collage-object"
  ).forEach(element => element.remove());

  objects.forEach(obj => {
    const item = collection.find(
      entry => entry.id === obj.itemId
    );

    if (!item) return;

    const element = document.createElement("div");
    element.className = "collage-object";
    element.dataset.id = obj.id;

    element.style.left = obj.x + "px";
    element.style.top = obj.y + "px";
element.style.transform =
  `rotate(${obj.rotation}deg) scale(${obj.flipX === true ? -obj.scale : obj.scale}, ${obj.scale})`;


    const image = document.createElement("img");
    image.src = item.src;
    image.alt = item.name;
    image.draggable = false;

    element.appendChild(image);

    element.addEventListener(
      "pointerdown",
      startDrag
    );

    canvas.appendChild(element);
  });

  objectToolbar.hidden = selectedId === null;
}

/* ========================================
   SELEÇÃO E MOVIMENTO
======================================== */

function startDrag(event) {
  if (event.button !== 0) return;

  event.preventDefault();

  const element = event.currentTarget;
  const id = Number(element.dataset.id);

  const obj = objects.find(
    entry => entry.id === id
  );

  if (!obj) return;

  selectedId = id;
  objectToolbar.hidden = false;

  const rect = canvas.getBoundingClientRect();

  const startX = event.clientX;
  const startY = event.clientY;

  const originalX = obj.x;
  const originalY = obj.y;

  let moved = false;

  element.setPointerCapture(event.pointerId);

  function move(e) {
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;

    if (
      Math.abs(deltaX) > 5 ||
      Math.abs(deltaY) > 5
    ) {
      moved = true;
    }

    if (!moved) return;

    obj.x = Math.max(
      0,
      Math.min(
        rect.width - 30,
        originalX + deltaX
      )
    );

    obj.y = Math.max(
      0,
      Math.min(
        rect.height - 30,
        originalY + deltaY
      )
    );

    element.style.left = obj.x + "px";
    element.style.top = obj.y + "px";

    objectInfo.hidden = true;
  }

  function stop() {
    element.removeEventListener(
      "pointermove",
      move
    );

    element.removeEventListener(
      "pointerup",
      stop
    );

    element.removeEventListener(
      "pointercancel",
      cancel
    );

    if (moved) {
      saveData();
    } else {
      showObjectInfo(obj);
    }
  }

  function cancel() {
    element.removeEventListener(
      "pointermove",
      move
    );

    element.removeEventListener(
      "pointerup",
      stop
    );

    element.removeEventListener(
      "pointercancel",
      cancel
    );
  }

  element.addEventListener("pointermove", move);
  element.addEventListener("pointerup", stop);
  element.addEventListener("pointercancel", cancel);
}

/* ========================================
   ETIQUETA DE INFORMAÇÃO
======================================== */

function showObjectInfo(obj) {
  const item = collection.find(
    entry => entry.id === obj.itemId
  );

  if (!item) return;

  if (
    !objectInfo.hidden &&
    Number(objectInfo.dataset.objectId) === obj.id
  ) {
    objectInfo.hidden = true;
    return;
  }

  document.getElementById(
    "infoName"
  ).textContent = item.name;

  document.getElementById(
    "infoType"
  ).textContent = item.category;

  document.getElementById(
    "infoDetails"
  ).textContent = item.details;

  objectInfo.dataset.objectId = obj.id;

  const baseSize = window.innerWidth <= 700
    ? 145
    : 180;

  const centerX =
    obj.x + baseSize / 2;

  const centerY =
    obj.y + baseSize / 2;

  const labelWidth = Math.min(
    290,
    window.innerWidth * 0.76
  );

  const left = Math.max(
    labelWidth / 2 + 8,
    Math.min(
      canvas.clientWidth - labelWidth / 2 - 8,
      centerX
    )
  );

  const top = Math.max(
    100,
    Math.min(
      canvas.clientHeight - 110,
      centerY
    )
  );

  objectInfo.style.left = left + "px";
  objectInfo.style.top = top + "px";

  objectInfo.hidden = false;
}

document.getElementById(
  "closeInfo"
).addEventListener("click", () => {
  objectInfo.hidden = true;
});

/* ========================================
   EDITAR OBJETO
======================================== */


function editSelected(action) {
  const obj = objects.find(
    entry => entry.id === selectedId
  );

  if (!obj) return;

  if (action === "bigger") {
    obj.scale = Math.min(
      3,
      obj.scale + 0.15
    );
  }

  if (action === "smaller") {
    obj.scale = Math.max(
      0.3,
      obj.scale - 0.15
    );
  }

  if (action === "rotate") {
    obj.rotation =
      (obj.rotation + 15) % 360;
  }

  if (action === "flip") {
    obj.flipX = !obj.flipX;
  }

  if (action === "delete") {
    objects = objects.filter(
      entry => entry.id !== selectedId
    );

    selectedId = null;
    objectInfo.hidden = true;
  }

  renderObjects();
  saveData();
}


/* ========================================
   GUARDAR E RECOMEÇAR
======================================== */

document.getElementById(
  "saveBtn"
).addEventListener("click", () => {
  if (saveData()) {
    alert("Your space has been saved.");
  }
});

document.getElementById(
  "resetBtn"
).addEventListener("click", () => {
  const confirmed = confirm(
    "Start your space again? " +
    "Your collection will be kept."
  );

  if (!confirmed) return;

  objects = [];
  selectedId = null;

  objectInfo.hidden = true;
  objectToolbar.hidden = true;

  renderObjects();
  saveData();
});

/* ========================================
   EXPANDIR
======================================== */

document.getElementById(
  "fullscreenBtn"
).addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      if (workspace.requestFullscreen) {
        await workspace.requestFullscreen();
      }
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.warn(
      "Fullscreen is not available:",
      error
    );
  }
});

/* ========================================
   INICIAR
======================================== */

async function initializeInhabit() {
  loadData();

  for (const item of collection) {
    // As imagens antigas continuam a usar
    // os dados guardados anteriormente.
    if (item.src) continue;

    try {
      const imageBlob = await getImageFromDatabase(
        item.id
      );

      if (imageBlob) {
        item.src = URL.createObjectURL(imageBlob);
      }
    } catch (error) {
      console.warn(
        "Could not restore image:",
        item.id,
        error
      );
    }
  }

  loadWallpaper();
  renderObjects();
  renderCollection();
}

initializeInhabit();


/* =====================================
   INHABIT — NAVEGAÇÃO ENTRE PÁGINAS
   ===================================== */


function enterMySpace() {
  document.body.classList.add("entered");
  document.body.classList.add("show-editor");
  window.scrollTo(0, 0);
}


document.getElementById("navMySpace")
  ?.addEventListener("click", enterMySpace);

document.getElementById("createSpaceBtn")
  ?.addEventListener("click", enterMySpace);

document.getElementById("enterSpaceBtn")
  ?.addEventListener("click", enterMySpace);

/* VOLTAR À PÁGINA INICIAL */

const homeLogo = document.getElementById("logo");

if (homeLogo) {
  homeLogo.addEventListener("click", function(event) {
    event.preventDefault();
    event.stopPropagation();

    document.body.classList.remove("show-editor");
    window.scrollTo({ top: 0, behavior: "instant" });
  });
}
