// URL del índice en GitHub
const URL_INDICE = "https://raw.githubusercontent.com/jmbbao/Lector/refs/heads/main/datos/indice.json";
const barraLista = document.getElementById("id_barra_lista");
const btnAnterior = document.getElementById("id_archivos_anterior");
const btnSiguiente = document.getElementById("id_archivos_siguiente");
const btnBajarArchivos = document.getElementById("id_btn_bajar_archivos");
const btnNuevasVersiones = document.getElementById("id_btn_nuevas_versiones");
const btnBajarNuevasVersiones = document.getElementById("id_btn_bajar_nuevas_versiones");
const btnBarraBuscar = document.getElementById("id_btn_barra_buscar");
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
  urls: [],         //array        gVars.textos.push("hola"); // lista
  textos: {},  //clave-valor  gVars.textos["id1"] = "hola"; // diccionario
  totalBytes: 0, 
  hayNuevasVersiones: false,
  indiceActual: 0,
  posicionesLectura: {},
  scrollTimeout: 0,
  indiceAnterior: 0,
  posAnterior: 0
};

window.gFunc = {  //Funciones globales
};


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
  let r = new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_ARCHIVOS, "readwrite");
    const store = tx.objectStore(STORE_ARCHIVOS);
    const data = { url, texto, version };
    const req = store.put(data);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  //console.log("LOG: guardarArchivoDB() ha sido ejecutado");
  return r;
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
    window.gFunc.setEstado("El índice está vacío, no contiene la lista de textos.");
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
  // BAO
  //window.gVars.totalBytes = 0;
  
  let todosEnCache = true;
  window.gVars.hayNuevasVersiones = false;

  window.gFunc.setEstado("Comprobando si hay versiones ya en caché, y si hay nuevas versiones...");

  for (let i = 0; i < window.gVars.urls.length; i++) {
    const cached = await obtenerArchivoDB(db, window.gVars.urls[i]);

    if (cached) {
      window.gVars.textos[window.gVars.urls[i]] = cached.texto;
      // BAO
      //let size = (new TextEncoder().encode(cached.texto)).length;
      //window.gVars.totalBytes += size;

      if (cached.version !== window.gVars.versiones[i]) {
        window.gVars.hayNuevasVersiones = true;
      }
    } else {
      todosEnCache = false;
    }
  }

  // Recalcular tamaño total correctamente
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
    window.gFunc.setEstado("Aún no hay archivos de texto. Pulsa BAJAR ARCHIVOS.");
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
      
      //const size = new Blob([texto]).size;
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

/* ============ Resetear Busqueda ============ */

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

/* ============ Mostrar texto actual ============ */

function mostrarTextoActual() {
  if (window.gVars.urls.length === 0) return;
  if (!clusterize) return;
  
  const url = window.gVars.urls[window.gVars.indiceActual];
  const texto = window.gVars.textos[url] || "";
  clusterize.update(texto.split("\n"));
  contenido.focus(); 
  actualizarInfoArchivosMegas();

  // Restaurar posición guardada
  setTimeout(() => {
    if (window.gVars.posicionesLectura[url] !== undefined) {
      clusterize.scrollTo(window.gVars.posicionesLectura[url] || 0);
    }
  }, 0);
}

/* ============ Posiciones de lectura ============ */

function cargarPosicionesLectura() {
  window.gVars.posicionesLectura = JSON.parse(localStorage.getItem(CLAVE_POSICIONES) || "{}");
}

function guardarPosicionesLectura() {
  if (window.gVars.urls.length === 0) return;
  const url = window.gVars.urls[window.gVars.indiceActual];
  window.gVars.posicionesLectura[url] = clusterize.getScrollProgress().top;
  localStorage.setItem(CLAVE_POSICIONES, JSON.stringify(window.gVars.posicionesLectura));
}

/* ============ Eventos UI ============ */

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

btnBarraAjustes.addEventListener("click", () => {
  panelAjustes.classList.toggle("oculto");
  guardarAjustes();
  guardarPosicionesLectura();
});

botonesPanelCerrar.forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data_panel");
    document.getElementById(id).classList.add("oculto");
    
    // Si se cierra el panel de búsqueda -> limpiar resaltados en el texto
    if (id === "id_panel_buscar") { 
      resetearBusqueda();
      const txt = window.gFunc.obtenerTextoActual();

      // Esperar a que el DOM termine de recolocarse
      setTimeout(() => {
        clusterize.update(txt.split("\n"));
        clusterize.refresh(true);
      }, 0);

      filaCoincidencias.classList.add("oculto");
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

// Función que se ejecutará cada 10 segundos
setInterval(() => {
    let ind_antes = window.gVars.indiceAnterior;
    let pos_antes = window.gVars.posAnterior;
    let ind_ahora = window.gVars.indiceActual;
    let pos_ahora = contenido.scrollTop; 
    let altura_linea = parseFloat(getComputedStyle(contenido).lineHeight);
    
    if (ind_ahora === ind_antes) {
      let dist = Math.floor( Math.abs(pos_ahora - pos_antes) / altura_linea ); 

      if (dist > 30) {
		if (dist < 200) {
	      guardarPosicionesLectura();
		}
		window.gVars.posAnterior = pos_ahora;
      }
	}
	else {
	  //ha cambiado de texto y ya se guardó, por lo tanto no lo guardamos
	  window.gVars.indiceAnterior =  ind_ahora;
	  window.gVars.posAnterior = pos_ahora;
	}
}, 10000); // 10 segundos

/* ============ Funciones Globales gFunc para otros módulos ============ */

window.gFunc.setEstado = function (msg) {
  estado.textContent = msg;
}

window.gFunc.obtenerTextoActual = function () {
  if (window.gVars.urls.length === 0) return "";
  return window.gVars.textos[window.gVars.urls[window.gVars.indiceActual]] || "";
};

window.gFunc.irAArchivoPorIndice = function (idx) {
  if (idx < 0 || idx >= window.gVars.urls.length) return;
  window.gVars.indiceActual = idx;
  barraLista.value = String(idx);
  mostrarTextoActual();
};

window.gFunc.borrarCacheArchivos = async function () {
  await borrarTodoDB();
  window.gVars.textos = {};
  window.gVars.totalBytes = 0;
  window.gVars.hayNuevasVersiones = false;
  btnNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.remove("oculto");
  infoArchivosMegas.textContent = "SIN ARCHIVOS AÚN";
  window.gFunc.setEstado("Caché borrada. Vuelve a bajar los archivos.");
  
  // Borrar posiciones de lectura 
  localStorage.removeItem(CLAVE_POSICIONES); 
  window.gVars.posicionesLectura = {};
};

/* ============ Inicio del programa ============ */

document.addEventListener("DOMContentLoaded", async () => {
  try {
	cargarPosicionesLectura();
    inicializarAjustes();
    await cargarIndice();
    if (window.gVars.urls.length > 0) {
      await comprobarCacheyVersiones();
    }
  } catch (e) {
    console.error(e);
    window.gFunc.setEstado("Error al iniciar el lector.");
  }
});
