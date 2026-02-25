// URL del índice en GitHub
const URL_INDICE = "https://raw.githubusercontent.com/jmbbao/Lector/refs/heads/main/indice.txt";

const lista = document.getElementById("id_lista");
const btnAnterior = document.getElementById("id_anterior");
const btnSiguiente = document.getElementById("id_siguiente");
const btnBajarArchivos = document.getElementById("id_btn-bajar-archivos");
const btnNuevasVersiones = document.getElementById("id_btn-nuevas-versiones");
const btnBajarNuevasVersiones = document.getElementById("id_btn-bajar-nuevas-versiones");
const btnPanelBuscar = document.getElementById("id_btn-barra-buscar");
const btnPanelAjustes = document.getElementById("id_btn-barra-ajustes");
const panelBusqueda = document.getElementById("id_panel-busqueda");
const panelAjustes = document.getElementById("id_panel-ajustes");
const panelNuevasVersiones = document.getElementById("id_panel-nuevas-versiones");
const botonesCerrarPanel = document.querySelectorAll(".cerrar-panel");
const titulo = document.getElementById("id_titulo");
const estado = document.getElementById("id_estado");
const contenido = document.getElementById("id_contenido");
const infoArchivo = document.getElementById("id_info-archivo");

window.globalVars = {
  totalMB: 0,      //console.log(window.globalVars.totalMB);
  otravariable: 0  //la última no lleva la coma aunque si se pone es válido también
};


let urls = [];
let nombres = [];
let indiceActual = 0;
let textosCache = {};
let totalBytes = 0;
let hayNuevasVersiones = false;

window._lector = {
  _textos: textosCache
};

function setEstado(msg) {
  estado.textContent = msg;
}

function nombreDesdeURL(url) {
  try {
    const partes = url.split("/");
    let nombre = decodeURIComponent(partes.pop());
    // Quitar parámetros tipo ?raw=1
    nombre = nombre.split("?")[0];
    return nombre;
  } catch {
    return url;
  }
}

/* ================== IndexedDB ================== */

const DB_NAME = "lectorDB";
const DB_VERSION = 1;
const STORE_ARCHIVOS = "archivos";

function abrirDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_ARCHIVOS)) {
        db.createObjectStore(STORE_ARCHIVOS, { keyPath: "url" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function obtenerArchivoDB(db, url) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARCHIVOS, "readonly");
    const store = tx.objectStore(STORE_ARCHIVOS);
    const req = store.get(url);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function guardarArchivoDB(db, url, contenido, size) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARCHIVOS, "readwrite");
    const store = tx.objectStore(STORE_ARCHIVOS);
    const data = { url, contenido, size };
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function borrarTodoDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(DB_NAME);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/* ============ LÓGICA PRINCIPAL ============ */

async function cargarIndice() {
  setEstado("Leyendo índice…");
  const resp = await fetch(URL_INDICE);
  if (!resp.ok) throw new Error("Error índice: " + resp.status);
  const texto = await resp.text();

  urls = texto
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith("#"));

  nombres = urls.map(nombreDesdeURL);

  lista.innerHTML = "";
  urls.forEach((url, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = nombres[i];
    lista.appendChild(opt);
  });

  if (urls.length === 0) {
    infoArchivo.textContent = "SIN ARCHIVOS AÚN";
    setEstado("Índice vacío.");
    return;
  }

  indiceActual = 0;
  lista.value = "0";
}

function actualizarInfoArchivo() {
  window.globalVars.totalMB = (totalBytes / (1024 * 1024)).toFixed(1);
  const n = urls.length;
  const pos = n === 0 ? 0 : indiceActual + 1;
  infoArchivo.textContent = `Archivo ${pos} de ${n} (${window.globalVars.totalMB} MB totales):`;
}

async function comprobarCacheYVersiones() {
  const db = await abrirDB();
  textosCache = {};
  window._lector._textos = textosCache;

  let todosEnCache = true;
  totalBytes = 0;
  hayNuevasVersiones = false;

  setEstado("Comprobando tamaños…");

  for (const url of urls) {
    const cached = await obtenerArchivoDB(db, url);

    // HEAD para tamaño actual
    let sizeActual = 0;
    try {
      const headResp = await fetch(url, { method: "HEAD" });
      if (headResp.ok) {
        const len = headResp.headers.get("Content-Length");
        if (len) sizeActual = parseInt(len, 10) || 0;
      }
    } catch {
      // si falla HEAD, seguimos sin tamaño
    }

    if (cached) {
      textosCache[url] = cached.contenido;
      totalBytes += cached.size || 0;

      if (sizeActual && cached.size && sizeActual !== cached.size) {
        hayNuevasVersiones = true;
      }
    } else {
      todosEnCache = false;
    }
  }

  actualizarInfoArchivo();

  if (hayNuevasVersiones) {
    btnNuevasVersiones.classList.remove("oculto");
  } else {
    btnNuevasVersiones.classList.add("oculto");
  }

  if (todosEnCache && urls.length > 0) {
    btnBajarArchivos.classList.add("oculto");
    setEstado("Fichero cargado desde caché.");
    mostrarTextoActual();
  } else {
    btnBajarArchivos.classList.remove("oculto");
    setEstado("Aún no hay archivos de texto. Pulsa el botón Bajar Archivos de Texto.");
  }
}

async function bajarArchivosCompletos() {
  const db = await abrirDB();
  textosCache = {};
  window._lector._textos = textosCache;
  totalBytes = 0;

  setEstado("Descargando archivos…");

  for (const url of urls) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const texto = await resp.text();

      const size = new Blob([texto]).size;

      await guardarArchivoDB(db, url, texto, size);
      textosCache[url] = texto;
      totalBytes += size;
    } catch (e) {
      console.error("Error al descargar", url, e);
    }
  }

  hayNuevasVersiones = false;
  btnNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.add("oculto");
  actualizarInfoArchivo();
  setEstado("Archivos descargados.");
  mostrarTextoActual();
}

/* ============ Mostrar texto actual ============ */

function mostrarTextoActual() {
  if (urls.length === 0) return;
  const url = urls[indiceActual];
  //titulo.textContent = nombres[indiceActual];
  const txt = textosCache[url] || "";
  mostrarTextoEnContenido(txt);
  actualizarInfoArchivo();
}

/* ============ Eventos UI ============ */

lista.addEventListener("change", () => {
  indiceActual = parseInt(lista.value, 10) || 0;
  mostrarTextoActual();
});

btnAnterior.addEventListener("click", () => {
  if (urls.length === 0) return;
  indiceActual = (indiceActual - 1 + urls.length) % urls.length;
  lista.value = String(indiceActual);
  mostrarTextoActual();
});

btnSiguiente.addEventListener("click", () => {
  if (urls.length === 0) return;
  indiceActual = (indiceActual + 1) % urls.length;
  lista.value = String(indiceActual);
  mostrarTextoActual();
});

btnPanelBuscar.addEventListener("click", () => {
  panelBusqueda.classList.toggle("oculto");
});

btnPanelAjustes.addEventListener("click", () => {
  panelAjustes.classList.toggle("oculto");
  guardarAjustes();
});

botonesCerrarPanel.forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data-panel");
    document.getElementById(id).classList.add("oculto");
  });
  guardarAjustes();
});

btnBajarArchivos.addEventListener("click", async () => {
  if (urls.length === 0) return;
  await bajarArchivosCompletos();
});

btnNuevasVersiones.addEventListener("click", () => {
  panelNuevasVersiones.classList.remove("oculto");
});

btnBajarNuevasVersiones.addEventListener("click", async () => {
  panelNuevasVersiones.classList.add("oculto");
  await bajarArchivosCompletos();
});

/* ============ API para otros módulos ============ */

window._lector.obtenerTextoActual = function () {
  if (urls.length === 0) return "";
  return textosCache[urls[indiceActual]] || "";
};

window._lector.mostrarTextoActual = mostrarTextoActual;

window._lector.irAArchivoPorIndice = function (idx) {
  if (idx < 0 || idx >= urls.length) return;
  indiceActual = idx;
  lista.value = String(indiceActual);
  mostrarTextoActual();
};

window._lector.getUrls = () => urls;
window._lector.getNombres = () => nombres;

window._lector.borrarCacheArchivos = async function () {
  await borrarTodoDB();
  textosCache = {};
  window._lector._textos = textosCache;
  totalBytes = 0;
  hayNuevasVersiones = false;
  btnNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.remove("oculto");
  infoArchivo.textContent = "SIN ARCHIVOS AÚN";
  setEstado("Caché borrada. Vuelve a bajar los archivos.");
};

/* ============ Inicio ============ */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    inicializarAjustes();
    inicializarBuscador();
    await cargarIndice();
    if (urls.length > 0) {
      await comprobarCacheYVersiones();
    }
  } catch (e) {
    console.error(e);
    setEstado("Error al iniciar el lector.");
  }
});
