// URL del índice en GitHub
const URL_INDICE = "https://raw.githubusercontent.com/jmbbao/Lector/refs/heads/main/datos/indice.json";
const barraLista = document.getElementById("id_barra_lista");
const btnAnterior = document.getElementById("id_archivos_anterior");
const btnSiguiente = document.getElementById("id_archivos_siguiente");
const btnBajarArchivos = document.getElementById("id_btn_bajar_archivos");
const btnNuevasVersiones = document.getElementById("id_btn_nuevas_versiones");
const btnBajarNuevasVersiones = document.getElementById("id_btn_bajar_nuevas_versiones");
const btnBuscar = document.getElementById("id_btn_barra_buscar");
const btnAjustes = document.getElementById("id_btn_barra_ajustes");
const panelBuscar = document.getElementById("id_panel_buscar");
const panelAjustes = document.getElementById("id_panel_ajustes");
const panelNuevasVersiones = document.getElementById("id_panel_nuevas_versiones");
const botonesPanelCerrar = document.querySelectorAll(".panel_cerrar");
const estado = document.getElementById("id_estado");
const contenido = document.getElementById("id_contenido");
const infoArchivosMegas = document.getElementById("id_archivos_megas");

const CLAVE_POSICIONES = "lector_posiciones";

window.gVars = {
  nombres: [],
  versiones: [],
  hayNuevasVersiones: false,
  urls: [],
  indiceActual: 0,
  textosCache: {},
  totalBytes: 0,
  posicionesLectura: JSON.parse(localStorage.getItem(CLAVE_POSICIONES) || "{}")
};

//let posicionesLectura = JSON.parse(localStorage.getItem(CLAVE_POSICIONES) || "{}");

window._lector = {
  _textos: window.gVars.textosCache
};

function setEstado(msg) {
  estado.textContent = msg;
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

function guardarArchivoDB(db, url, texto, version) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARCHIVOS, "readwrite");
    const store = tx.objectStore(STORE_ARCHIVOS);
    const data = { url, texto, version };
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
  setEstado("Leyendo índice...");

  const resp = await fetch(URL_INDICE);
  if (!resp.ok) throw new Error("Error índice: " + resp.status);

  const data = await resp.json();

  window.gVars.nombres = data.textos.map(t => t.titulo || "Falta título");
  window.gVars.versiones = data.textos.map(t => t.version);
  window.gVars.urls = data.textos.map(t => t.url);

  barraLista.innerHTML = "";
  window.gVars.urls.forEach((url, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = window.gVars.nombres[i];
    barraLista.appendChild(opt);
  });

  if (window.gVars.urls.length === 0) {
    infoArchivosMegas.textContent = "SIN ARCHIVOS AÚN";
    setEstado("Índice vacío.");
    return;
  }

  window.gVars.indiceActual = 0;
  barraLista.value = "0";
}

function actualizarInfoArchivosMegas() {
  let totalmb = (window.gVars.totalBytes / (1024 * 1024)).toFixed(1);
  const n = window.gVars.urls.length;
  const pos = n === 0 ? 0 : window.gVars.indiceActual + 1;
  infoArchivosMegas.textContent = `Archivo ${pos} de ${n} (${totalmb} MB total):`;
}

async function comprobarCacheYVersiones() {
  const db = await abrirDB();
  window.gVars.textosCache = {};
  window._lector._textos = window.gVars.textosCache;

  let todosEnCache = true;
  window.gVars.hayNuevasVersiones = false;

  setEstado("Comprobando versiones...");

  for (let i = 0; i < window.gVars.urls.length; i++) {
    const cached = await obtenerArchivoDB(db, window.gVars.urls[i]);

    if (cached) {
      window.gVars.textosCache[window.gVars.urls[i]] = cached.texto;

      if (cached.version !== window.gVars.versiones[i]) {
        window.gVars.hayNuevasVersiones = true;
      }
    } else {
      todosEnCache = false;
    }
  }

  if (window.gVars.hayNuevasVersiones) {
    btnNuevasVersiones.classList.remove("oculto");
  } else {
    btnNuevasVersiones.classList.add("oculto");
  }

  if (todosEnCache && window.gVars.urls.length > 0) {
    btnBajarArchivos.classList.add("oculto");
    setEstado("Ficheros cargados desde caché.");
    mostrarTextoActual();
  } else {
    btnBajarArchivos.classList.remove("oculto");
    setEstado("Aún no hay archivos de texto. Pulsa BAJAR ARCHIVOS.");
  }
}

async function bajarArchivosCompletos() {
  const db = await abrirDB();
  window.gVars.textosCache = {};
  window._lector._textos = window.gVars.textosCache;
  window.gVars.totalBytes = 0;

  setEstado("Bajando archivos…");

  for (let i = 0; i < window.gVars.urls.length; i++) {
    const url = window.gVars.urls[i];
    const versionWeb = window.gVars.versiones[i];

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const texto = await resp.text();
      
      //const size = new Blob([texto]).size;
      const size = (new TextEncoder().encode(texto)).length;

      await guardarArchivoDB(db, url, texto, versionWeb);
      window.gVars.textosCache[url] = texto;
      window.gVars.totalBytes += size;

    } catch (e) {
      console.error("Error al descargar", url, e);
    }
  }

  window.gVars.hayNuevasVersiones = false;
  btnNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.add("oculto");

  setEstado("Archivos descargados.");
  mostrarTextoActual();
}

/* ============ Mostrar texto actual ============ */

function mostrarTextoActual() {
  if (window.gVars.urls.length === 0) return;
  const url = window.gVars.urls[window.gVars.indiceActual];
  //titulo.textContent = window.gVars.nombres[window.gVars.indiceActual];
  const txt = window.gVars.textosCache[url] || "";
  mostrarTextoEnContenido(txt);
  actualizarInfoArchivosMegas();

  // Restaurar posición guardada
  setTimeout(() => {
    if (window.gVars.posicionesLectura[url] !== undefined) {
      contenido.scrollTop = window.gVars.posicionesLectura[url];
    }
  }, 0);
}

/* ============ Guardar posiciones de lectura ============ */

function guardarPosicionesActuales() {
  if (window.gVars.urls.length === 0) return;
  const url = window.gVars.urls[window.gVars.indiceActual];
  window.gVars.posicionesLectura[url] = contenido.scrollTop;
  localStorage.setItem(CLAVE_POSICIONES, JSON.stringify(window.gVars.posicionesLectura));
}

/* ============ Eventos UI ============ */

barraLista.addEventListener("change", () => {
  guardarPosicionesActuales();
  window.gVars.indiceActual = parseInt(barraLista.value, 10) || 0;
  mostrarTextoActual();
});

btnAnterior.addEventListener("click", () => {
  if (window.gVars.urls.length === 0) return;
  guardarPosicionesActuales();
  window.gVars.indiceActual = (window.gVars.indiceActual - 1 + window.gVars.urls.length) % window.gVars.urls.length;
  barraLista.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
});

btnSiguiente.addEventListener("click", () => {
  if (window.gVars.urls.length === 0) return;
  guardarPosicionesActuales();
  window.gVars.indiceActual = (window.gVars.indiceActual + 1) % window.gVars.urls.length;
  barraLista.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
});

btnBuscar.addEventListener("click", () => {
  panelBuscar.classList.toggle("oculto");
});

btnAjustes.addEventListener("click", () => {
  panelAjustes.classList.toggle("oculto");
  guardarAjustes();
});

botonesPanelCerrar.forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data_panel");
    document.getElementById(id).classList.add("oculto");
    
    // Si se cierra el panel de búsqueda -> limpiar resaltados en el texto
    if (id === "id_panel_buscar") { 
      const txt = window._lector.obtenerTextoActual();
      mostrarTextoEnContenido(txt); 
    } 
    
    // Solo guardar ajustes si se cierra el panel de AJUSTES 
    if (id === "id_panel_ajustes") { 
      guardarAjustes(); 
    }
  });
});

btnBajarArchivos.addEventListener("click", async () => {
  if (window.gVars.urls.length === 0) return;
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
  if (window.gVars.urls.length === 0) return "";
  return window.gVars.textosCache[window.gVars.urls[window.gVars.indiceActual]] || "";
};

window._lector.mostrarTextoActual = mostrarTextoActual;

window._lector.irAArchivoPorIndice = function (idx) {
  if (idx < 0 || idx >= window.gVars.urls.length) return;
  window.gVars.indiceActual = idx;
  barraLista.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
};

window._lector.borrarCacheArchivos = async function () {
  await borrarTodoDB();
  window.gVars.textosCache = {};
  window._lector._textos = window.gVars.textosCache;
  window.gVars.totalBytes = 0;
  window.gVars.hayNuevasVersiones = false;
  btnNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.remove("oculto");
  infoArchivosMegas.textContent = "SIN ARCHIVOS AÚN";
  setEstado("Caché borrada. Vuelve a bajar los archivos.");
  
  // Borrar posiciones de lectura 
  localStorage.removeItem(CLAVE_POSICIONES); 
  window.gVars.posicionesLectura = {};
};

/* ============ Inicio del programa ============ */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    inicializarAjustes();
    await cargarIndice();
    if (window.gVars.urls.length > 0) {
      await comprobarCacheYVersiones();
    }
  } catch (e) {
    console.error(e);
    setEstado("Error al iniciar el lector.");
  }
});
