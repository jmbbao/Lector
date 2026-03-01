// URL del índice en GitHub
const URL_INDICE = "https://raw.githubusercontent.com/jmbbao/Lector/refs/heads/main/datos/indice.txt";

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
//const titulo = document.getElementById("id_titulo");
const estado = document.getElementById("id_estado");
const contenido = document.getElementById("id_contenido");
const infoArchivosMegas = document.getElementById("id_archivos_megas");

/*window.globalVars = {
  totalMB: 0     //console.log(window.globalVars.totalMB);
};*/

let urls = [];
let nombres = [];
let indiceActual = 0;
let textosCache = {};
let totalBytes = 0;
let hayNuevasVersiones = false;

const CLAVE_POSICIONES = "lector_posiciones";
let posicionesLectura = JSON.parse(localStorage.getItem(CLAVE_POSICIONES) || "{}");

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

function guardarArchivoDB(db, url, texto, size, tamanoweb) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARCHIVOS, "readwrite");
    const store = tx.objectStore(STORE_ARCHIVOS);
    const data = { url, texto, size, tamanoweb };
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

  barraLista.innerHTML = "";
  urls.forEach((url, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = nombres[i];
    barraLista.appendChild(opt);
  });

  if (urls.length === 0) {
    infoArchivosMegas.textContent = "SIN ARCHIVOS AÚN";
    setEstado("Índice vacío.");
    return;
  }

  indiceActual = 0;
  barraLista.value = "0";
}

function actualizarInfoArchivosMegas() {
  let totalmb = (totalBytes / (1024 * 1024)).toFixed(1);
  const n = urls.length;
  const pos = n === 0 ? 0 : indiceActual + 1;
  infoArchivosMegas.textContent = `Archivo ${pos} de ${n} (${totalmb} MB total):`;
}

async function comprobarCacheYVersiones() {
  const db = await abrirDB();
  textosCache = {};
  window._lector._textos = textosCache;
  totalBytes = 0;
  
  let todosencache = true;
  hayNuevasVersiones = false;

  setEstado("Comparando tamaños de archivos con los de la web para ver si hay nuevas versiones");

  for (const url of urls) {
    const cached = await obtenerArchivoDB(db, url);

    // HEAD para ver el tamaño original en la web (es un valor comprimido)
    let tamanoactual = 0;
    try {
      const headResp = await fetch(url, { method: "HEAD" });
      if (headResp.ok) {
        const len = headResp.headers.get("Content-Length");
        if (len) tamanoactual = parseInt(len, 10) || 0;
      }
    } catch {
      // si falla HEAD, seguimos sin tamaño
    }

    if (cached) {
      textosCache[url] = cached.contenido;
      totalBytes += cached.size || 0;

      // Mirar en la consola los tamaños
      //console.log(url);  //https://raw.githubusercontent.com/jmbbao/Lector/refs/heads/main/Agencia_Cosmica.txt?raw=1
      //console.log("Tamaño:" + tamanoactual); // 2486329
      //console.log("Cached:" + cached.size);  // 7361786
      //console.log("tamanoweb:" + cached.tamanoweb);  // 2486329
        
      if (tamanoactual && cached.tamanoweb && tamanoactual !== cached.tamanoweb) {
        hayNuevasVersiones = true;
      }
    } else {
      todosencache = false;
    }
  }

  actualizarInfoArchivosMegas();

  if (hayNuevasVersiones) {
    btnNuevasVersiones.classList.remove("oculto");
  } else {
    btnNuevasVersiones.classList.add("oculto");
  }

  if (todosencache && urls.length > 0) {
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

  setEstado("Bajando archivos…");

  for (const url of urls) {
    try {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      const texto = await resp.text();
      const size = new Blob([texto]).size;

      // HEAD para tamaño actual
      let tamanoweb = 0;
      try {
        const headResp = await fetch(url, { method: "HEAD" });
        if (headResp.ok) {
          const len = headResp.headers.get("Content-Length");
          if (len) tamanoweb = parseInt(len, 10) || 0;
        }
      } catch {
        // si falla HEAD, seguimos sin tamaño
      }

      await guardarArchivoDB(db, url, texto, size, tamanoweb);
      textosCache[url] = texto;
      totalBytes += size;
    } catch (e) {
      console.error("Error al descargar", url, e);
    }
  }

  hayNuevasVersiones = false;
  btnNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.add("oculto");
  actualizarInfoArchivosMegas();
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
  actualizarInfoArchivosMegas();

  // Restaurar posición guardada
  setTimeout(() => {
    if (posicionesLectura[url] !== undefined) {
      contenido.scrollTop = posicionesLectura[url];
    }
  }, 0);
}

/* ============ Guardar posiciones de lectura ============ */

function guardarPosicionesActuales() {
  if (urls.length === 0) return;
  const url = urls[indiceActual];
  posicionesLectura[url] = contenido.scrollTop;
  localStorage.setItem(CLAVE_POSICIONES, JSON.stringify(posicionesLectura));
}

/* ============ Eventos UI ============ */

barraLista.addEventListener("change", () => {
  guardarPosicionesActuales();
  indiceActual = parseInt(barraLista.value, 10) || 0;
  mostrarTextoActual();
});

btnAnterior.addEventListener("click", () => {
  if (urls.length === 0) return;
  guardarPosicionesActuales();
  indiceActual = (indiceActual - 1 + urls.length) % urls.length;
  barraLista.value = String(indiceActual);
  mostrarTextoActual();
});

btnSiguiente.addEventListener("click", () => {
  if (urls.length === 0) return;
  guardarPosicionesActuales();
  indiceActual = (indiceActual + 1) % urls.length;
  barraLista.value = String(indiceActual);
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
  barraLista.value = String(indiceActual);
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
  infoArchivosMegas.textContent = "SIN ARCHIVOS AÚN";
  setEstado("Caché borrada. Vuelve a bajar los archivos.");
  
  // Borrar posiciones de lectura 
  localStorage.removeItem(CLAVE_POSICIONES); 
  posicionesLectura = {};
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
