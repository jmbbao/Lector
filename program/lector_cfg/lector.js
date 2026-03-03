// URL del índice en GitHub
const URL_INDICE = "https://raw.githubusercontent.com/jmbbao/Lector/refs/heads/main/datos/indice.json";

const barraLista = document.getElementById("id_barra_lista");
const btnAnterior = document.getElementById("id_archivos_anterior");
const btnSiguiente = document.getElementById("id_archivos_siguiente");
const btnBajarArchivos = document.getElementById("id_btn_bajar_archivos");
const btnNuevasVersiones = document.getElementById("id_btn_nuevas_versiones");
const btnBajarNuevasVersiones = document.getElementById("id_btn_bajar_nuevas_versiones");
const btnBarraBuscar = document.getElementById("id_btn_barra_buscar");
const filaCoincidencias = document.getElementById("id_fila_coincidencias");
const btnBarraAjustes = document.getElementById("id_btn_barra_ajustes");
const panelBuscar = document.getElementById("id_panel_buscar");
const panelAjustes = document.getElementById("id_panel_ajustes");
const panelNuevasVersiones = document.getElementById("id_panel_nuevas_versiones");
const botonesPanelCerrar = document.querySelectorAll(".panel_cerrar");
const estado = document.getElementById("id_estado");
const contenido = document.getElementById("id_contenido");
const infoArchivosMegas = document.getElementById("id_archivos_megas");

const CLAVE_POSICIONES = "lector_posiciones";

window.gVars = {
  titulos: [],
  versiones: [],
  urls: [],
  textos: {},
  totalBytes: 0,
  hayNuevasVersiones: false,
  indiceActual: 0,
  posicionesLectura: {},
  scrollTimeout: 0,
  indiceAnterior: 0,
  posAnterior: 0
};

window.gFunc = {};

// ================== Clusterize ==================

let clusterize = null;

function inicializarClusterize() {
  clusterize = new Clusterize({
    scrollId: 'id_contenido',
    contentId: 'id_contenido_lista',
    rows: []
  });
}

// ================== IndexedDB ==================

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

// ================== LÓGICA PRINCIPAL ==================

async function cargarIndice() {
  window.gFunc.setEstado("Leyendo índice...");

  const resp = await fetch(URL_INDICE);
  if (!resp.ok) throw new Error("Error índice: " + resp.status);

  const data = await resp.json();

  window.gVars.titulos = data.textos.map(t => t.titulo || "Falta título");
  window.gVars.versiones = data.textos.map(t => t.version);
  window.gVars.urls = data.textos.map(t => t.url);

  barraLista.innerHTML = "";
  window.gVars.titulos.forEach((titulo, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = titulo;
    barraLista.appendChild(opt);
  });

  if (window.gVars.urls.length === 0) {
    infoArchivosMegas.textContent = "SIN ARCHIVOS AÚN";
    window.gFunc.setEstado("El índice está vacío.");
    return;
  }

  window.gVars.indiceActual = 0;
  barraLista.value = "0";
}

function actualizarInfoArchivosMegas() {
  let totalmb = (window.gVars.totalBytes / (1024 * 1024)).toFixed(1);
  const num = window.gVars.urls.length;
  const pos = (num === 0 ? 0 : window.gVars.indiceActual + 1);
  infoArchivosMegas.textContent = `Archivo ${pos} de ${num} (${totalmb} MB total):`;
}

async function comprobarCacheyVersiones() {
  const db = await abrirDB();
  window.gVars.textos = {};

  let todosEnCache = true;
  window.gVars.hayNuevasVersiones = false;

  window.gFunc.setEstado("Comprobando caché...");

  for (let i = 0; i < window.gVars.urls.length; i++) {
    const cached = await obtenerArchivoDB(db, window.gVars.urls[i]);

    if (cached) {
      window.gVars.textos[window.gVars.urls[i]] = cached.texto;

      if (cached.version !== window.gVars.versiones[i]) {
        window.gVars.hayNuevasVersiones = true;
      }
    } else {
      todosEnCache = false;
    }
  }

  window.gVars.totalBytes = 0;
  for (let url of window.gVars.urls) {
    const txt = window.gVars.textos[url];
    if (txt) {
      window.gVars.totalBytes += (new TextEncoder().encode(txt)).length;
    }
  }

  if (window.gVars.hayNuevasVersiones) {
    btnNuevasVersiones.classList.remove("oculto");
  } else {
    btnNuevasVersiones.classList.add("oculto");
  }

  if (todosEnCache && window.gVars.urls.length > 0) {
    btnBajarArchivos.classList.add("oculto");
    window.gFunc.setEstado("Ficheros cargados desde caché.");
    mostrarTextoActual();
  } else {
    btnBajarArchivos.classList.remove("oculto");
    window.gFunc.setEstado("Pulsa BAJAR ARCHIVOS.");
  }
}

async function bajarArchivosCompletos() {
  const db = await abrirDB();
  window.gVars.textos = {};
  window.gVars.totalBytes = 0;

  window.gFunc.setEstado("Bajando archivos…");

  for (let i = 0; i < window.gVars.urls.length; i++) {
    const url = window.gVars.urls[i];
    const versionWeb = window.gVars.versiones[i];

    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP " + resp.status);

      const texto = await resp.text();
      const size = (new TextEncoder().encode(texto)).length;

      await guardarArchivoDB(db, url, texto, versionWeb);
      window.gVars.textos[url] = texto;
      window.gVars.totalBytes += size;

    } catch (e) {
      console.error("Error al descargar", url, e);
    }
  }

  window.gVars.hayNuevasVersiones = false;
  btnNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.add("oculto");

  window.gFunc.setEstado("Archivos descargados.");
  mostrarTextoActual();
}

// ================== Resetear búsqueda ==================

function resetearBusqueda() {
  inputBusqueda.value = "";
  chkTodos.checked = true;
  buscarLista.innerHTML = "";
  infoCoincidencias.textContent = "Coincidencias: 0";
  inputNumeroCoincidencia.value = "";
  coincidencias = [];
  indiceCoincidenciaActual = -1;
  patronBusqueda = "";
}

// ================== Mostrar texto actual (Clusterize) ==================

function mostrarTextoActual() {
  if (window.gVars.urls.length === 0) return;

  const url = window.gVars.urls[window.gVars.indiceActual];
  const texto = window.gVars.textos[url] || "";

  mostrarTextoEnContenido(texto);
  actualizarInfoArchivosMegas();

  setTimeout(() => {
    const pos = window.gVars.posicionesLectura[url];
    if (pos !== undefined) {
      const alturaLinea = parseFloat(getComputedStyle(contenido).lineHeight);
      const linea = Math.floor(pos / alturaLinea);
      clusterize.scrollTo(linea);
    }
  }, 0);
}

// ================== Posiciones de lectura ==================

function cargarPosicionesLectura() {
  window.gVars.posicionesLectura = JSON.parse(localStorage.getItem(CLAVE_POSICIONES) || "{}");
}

function guardarPosicionesLectura() {
  if (window.gVars.urls.length === 0) return;

  const url = window.gVars.urls[window.gVars.indiceActual];
  const linea = clusterize.getScrollProgress().top;
  const alturaLinea = parseFloat(getComputedStyle(contenido).lineHeight);

  window.gVars.posicionesLectura[url] = linea * alturaLinea;
  localStorage.setItem(CLAVE_POSICIONES, JSON.stringify(window.gVars.posicionesLectura));
}

// ================== Eventos UI ==================

barraLista.addEventListener("change", () => {
  guardarPosicionesLectura();
  window.gVars.indiceActual = parseInt(barraLista.value, 10) || 0;
  mostrarTextoActual();
});

btnAnterior.addEventListener("click", () => {
  if (window.gVars.urls.length === 0) return;
  guardarPosicionesLectura();
  window.gVars.indiceActual = (window.gVars.indiceActual - 1 + window.gVars.urls.length) % window.gVars.urls.length;
  barraLista.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
});

btnSiguiente.addEventListener("click", () => {
  if (window.gVars.urls.length === 0) return;
  guardarPosicionesLectura();
  window.gVars.indiceActual = (window.gVars.indiceActual + 1) % window.gVars.urls.length;
  barraLista.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
});

btnBarraBuscar.addEventListener("click", () => {
  const estabavisible = !panelBuscar.classList.contains("oculto");

  if (estabavisible) {
    resetearBusqueda();
    filaCoincidencias.classList.add("oculto");
  }

  panelBuscar.classList.toggle("oculto");
});

btnBarraAjustes.addEventListener("click",
