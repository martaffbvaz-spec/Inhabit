
/* INHABIT — CÓPIA DE SEGURANÇA */

(async () => {
  const keys = [
    "inhabit-space-v2",
    "inhabit-collection-v2",
    "inhabit-wallpaper-v2"
  ];

  const backup = {
    format: "inhabit-backup-v1",
    exportedAt: new Date().toISOString(),
    localStorage: Object.fromEntries(
      keys.map(key => [key, localStorage.getItem(key)])
    ),
    images: []
  };

  const database = await new Promise((resolve, reject) => {
    const request = indexedDB.open("inhabit-images", 1);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  try {
    if (database.objectStoreNames.contains("images")) {
      const images = await new Promise((resolve, reject) => {
        const tx = database.transaction("images", "readonly");
        const store = tx.objectStore("images");

        const keysRequest = store.getAllKeys();
        const valuesRequest = store.getAll();

        tx.oncomplete = () => resolve([
          keysRequest.result,
          valuesRequest.result
        ]);

        tx.onerror = () => reject(tx.error);
      });

      for (let i = 0; i < images[0].length; i++) {
        const blob = images[1][i];

        if (!(blob instanceof Blob)) {
          throw new Error("Formato de imagem inesperado.");
        }

        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(reader.error);

          reader.readAsDataURL(blob);
        });

        backup.images.push({
          id: String(images[0][i]),
          dataUrl
        });
      }
    }
  } finally {
    database.close();
  }

  const file = new Blob(
    [JSON.stringify(backup)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = "inhabit-backup.json";

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 60000);

  alert(
    "Cópia criada com " +
    backup.images.length +
    " imagens. Guarda o ficheiro num local seguro."
  );
})().catch(error => {
  console.error("Erro ao criar backup:", error);
  alert("Não foi possível criar a cópia de segurança.");
});
