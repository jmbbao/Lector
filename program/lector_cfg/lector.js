"use strict";

/*
Página GitHub:
https://github.com/jmbbao/Lector

Página web Lector:
https://jmbbao.github.io/Lector/program/lector.html

Drive con las Imágenes:
https://drive.google.com/drive/u/0/folders/1V9WCwuwJCXT9fuzLQ4NyU2xO8Wre1JxV
*/

// URL del índice en GitHub
const URL_INDICE = "https://raw.githubusercontent.com/jmbbao/Lector/refs/heads/main/datos/indice.json";

const bloqueArchivos = document.getElementById("id_bloque_archivos");
const listaBarra = document.getElementById("id_barra_lista");
const btnAnterior = document.getElementById("id_archivos_anterior");
const btnSiguiente = document.getElementById("id_archivos_siguiente");
const btnBajarArchivos = document.getElementById("id_btn_bajar_archivos");
const btnHayNuevasVersiones = document.getElementById("id_btn_nuevas_versiones");
const btnActualizarTextos = document.getElementById("id_btn_bajar_nuevas_versiones");
const btnBarraBuscar = document.getElementById("id_btn_barra_buscar");
const filaCoincidencias = document.getElementById("id_fila_coincidencias");
const btnBarraFotos = document.getElementById("id_btn_barra_fotos");
const btnBarraAjustes = document.getElementById("id_btn_barra_ajustes");
const panelBuscar = document.getElementById("id_panel_buscar");
const panelAjustes = document.getElementById("id_panel_ajustes");
const panelNuevasVersiones = document.getElementById("id_panel_nuevas_versiones");
const botonesPanelCerrar = document.querySelectorAll(".panel_cerrar");
const estado = document.getElementById("id_estado");
const contenido = document.getElementById("id_contenido");
const infoArchivo = document.getElementById("id_archivo");

const CLAVE_POSICIONES = "lector_posiciones";

window.gVars = {
  titulos: [],
  versiones: [],
  urls: [],         //array        gVars.textos.push("hola"); // lista
  textos: {},  //clave-valor  gVars.textos["id1"] = "hola"; // diccionario
  totalBytes: 0, 
  hayNuevasVersiones: false,
  indiceActual: 0,
  indiceAnterior: 0,
  posAnterior: 0, 
  posicionesLectura: {},
  scrollTimeout: 0
};

// ============ Funciones Globales gFunc para otros módulos ============
window.gFunc = {  //Funciones globales
  timeinicio: 0
};

window.gFunc.tiempoInicio = function () {
    window.gFunc.timeinicio = performance.now();
};
  
window.gFunc.tiempoFin = function () {
    let timefinal = performance.now();
    let diferencia = timefinal - window.gFunc.timeinicio;
    //console.log("Tiempo buscarEnTodos(): ", diferencia.toFixed(2), " ms");
    //window.gFunc.setEstado("Tiempo buscarEnTodos(): " + diferencia.toFixed(2) + " ms"); 
};

window.gFunc.setEstado = async function (msg) {
  estado.textContent = msg;
};

window.gFunc.Pausa = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
};

window.gFunc.obtenerTextoActual = function () {
  if (window.gVars.urls.length === 0) return "";
  return window.gVars.textos[window.gVars.urls[window.gVars.indiceActual]] || "";
};

window.gFunc.irAArchivoPorIndice = function (idx) {
  if (idx < 0 || idx >= window.gVars.urls.length) return;
  window.gVars.indiceActual = idx;
  listaBarra.value = String(idx);
  mostrarTextoActual();
};

window.gFunc.borrarCacheArchivos = async function () {
  await borrarTodoDB();
  window.gVars.textos = {};
  window.gVars.totalBytes = 0;
  window.gVars.hayNuevasVersiones = false;
  btnHayNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.remove("oculto");
  infoArchivo.textContent = "SIN ARCHIVOS AÚN";
  this.setEstado("Caché borrada. Vuelve a bajar los archivos.");
  
  // Borrar posiciones de lectura 
  localStorage.removeItem(CLAVE_POSICIONES); 
  window.gVars.posicionesLectura = {};
  
  bloqueArchivos.classList.add("oculto");
};  

window.gFunc.mostrarTextoEnContenido = function (texto) {
  contenido.innerHTML = "";
  const pre = document.createElement("div");
  pre.textContent = texto;
  contenido.appendChild(pre);
};


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

// ============ LÓGICA PRINCIPAL ============ 

async function cargarIndice() {
  window.gFunc.setEstado("Leyendo índice...");

  const resp = await fetch(URL_INDICE);
  if (!resp.ok) throw new Error("Error índice: " + resp.status);

  const data = await resp.json();

  window.gVars.titulos = data.textos.map(t => t.titulo || "Falta título");
  window.gVars.versiones = data.textos.map(t => t.version);
  window.gVars.urls = data.textos.map(t => t.url);

  listaBarra.innerHTML = "";
  window.gVars.titulos.forEach((titulo, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = titulo;
    listaBarra.appendChild(opt);
  });

  if (window.gVars.urls.length === 0) {
    infoArchivo.textContent = "SIN ARCHIVOS AÚN";
    window.gFunc.setEstado("El índice está vacío, no contiene la lista de textos.");
    return;
  }

  window.gVars.indiceActual = 0;
  listaBarra.value = "0";
}

function actualizarInfoArchivo() {
  //let totalmb = (window.gVars.totalBytes / (1024 * 1024)).toFixed(1);
  const num = window.gVars.urls.length;
  const pos = (num === 0 ? 0 : window.gVars.indiceActual + 1);
  //infoArchivo.textContent = `Archivo ${pos} de ${num} (${totalmb} MB total):`;
  
  infoArchivo.textContent = `Archivo ${pos} de ${num}:`;
}

async function comprobarCacheyVersiones() {
  const db = await abrirDB();
  window.gVars.textos = {};
  
  let btodosencache = true;
  window.gVars.hayNuevasVersiones = false;

  window.gFunc.setEstado("Comprobando si hay versiones ya en caché, y si hay nuevas versiones...");

  for (let i = 0; i < window.gVars.urls.length; i++) {
    const cached = await obtenerArchivoDB(db, window.gVars.urls[i]);

    if (cached) {
      window.gVars.textos[window.gVars.urls[i]] = cached.texto;
      if (cached.version !== window.gVars.versiones[i]) {
        window.gVars.hayNuevasVersiones = true;
      }
    } else {
      btodosencache = false;
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
    btnHayNuevasVersiones.classList.remove("oculto");
    //console.log("LOG: Hay nuevas versiones de archivos");
  } else {
    btnHayNuevasVersiones.classList.add("oculto");
  }

  if (btodosencache && window.gVars.urls.length > 0) {
    btnBajarArchivos.classList.add("oculto");
    window.gFunc.setEstado("Ficheros cargados desde caché.");
    mostrarTextoActual();
  } else {
    btnBajarArchivos.classList.remove("oculto");
    window.gFunc.setEstado("Faltan los archivos de texto. Pulsa BAJAR ARCHIVOS DE TEXTO.");
  }
  
  if(btodosencache) { 
	bloqueArchivos.classList.remove("oculto");
  } else { 
    bloqueArchivos.classList.add("oculto");
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
  btnHayNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.add("oculto");

  window.gFunc.setEstado("Archivos descargados.");
  mostrarTextoActual();
  
  bloqueArchivos.classList.remove("oculto");
}

function resetearBusqueda() {
  inputBusqueda.value = "";
  //chkTodos.checked = true;
  //chkMayusculas.checked = false;
  listaBuscar.innerHTML = "";
  textoBuscado = "";   
  infoCoincidencias.textContent = "";
  inputNumeroCoincidencia.value = "";
  arrCoincidencias = [];
  indiceCoincidenciaActual = -1;
}

function mostrarTextoActual() {
  if (window.gVars.urls.length === 0) return;
  
  const url = window.gVars.urls[window.gVars.indiceActual];
  const texto = window.gVars.textos[url] || "";
  window.gFunc.mostrarTextoEnContenido(texto);
  contenido.focus(); 
  actualizarInfoArchivo();

  // Restaurar posición guardada
  setTimeout(() => {
    if (window.gVars.posicionesLectura[url] !== undefined) {
      contenido.scrollTop = window.gVars.posicionesLectura[url];
    }
  }, 0);
}

// ============ Posiciones de lectura ============

function cargarPosicionesLectura() {
  window.gVars.posicionesLectura = JSON.parse(localStorage.getItem(CLAVE_POSICIONES) || "{}");
}

function guardarPosicionesLectura() {
  if (window.gVars.urls.length === 0) return;
  const url = window.gVars.urls[window.gVars.indiceActual];
  window.gVars.posicionesLectura[url] = contenido.scrollTop;
  localStorage.setItem(CLAVE_POSICIONES, JSON.stringify(window.gVars.posicionesLectura));
}

// Función que se ejecutará cada 10 segundos y mira si el usuario ha
// avanzado 30 líneas y guarda la nueva posición
// Si hizo un scroll superior a 200 líneas entonces no está leyendo
// y no se guarda la posición pues solo está avanzando por el texto
setInterval(() => {
    let ind_antes = gVars.indiceAnterior;
    let pos_antes = gVars.posAnterior;
    let ind_ahora = gVars.indiceActual;
    let pos_ahora = contenido.scrollTop; 
    let altura_linea = parseFloat(getComputedStyle(contenido).lineHeight);
    
    if (ind_ahora === ind_antes) {
      let dist = Math.floor( Math.abs(pos_ahora - pos_antes) / altura_linea ); 

      if (dist > 30) {
		if (dist < 200) {
	      guardarPosicionesLectura();
		}
		gVars.posAnterior = pos_ahora;
      }
	}
	else {
	  //ha cambiado de texto y ya se guardó allí, por lo tanto no lo guardamos
	  gVars.indiceAnterior =  ind_ahora;
	  gVars.posAnterior = pos_ahora;
	}
}, 10000); // 10 segundos

// ============ Eventos UI ============ 

listaBarra.addEventListener("change", () => {
  guardarPosicionesLectura();
  window.gVars.indiceActual = parseInt(listaBarra.value, 10) || 0;
  mostrarTextoActual();
});

btnAnterior.addEventListener("click", () => {
  if (window.gVars.urls.length === 0) return;
  guardarPosicionesLectura();
  window.gVars.indiceActual = (window.gVars.indiceActual - 1 + window.gVars.urls.length) % window.gVars.urls.length;
  listaBarra.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
});

btnSiguiente.addEventListener("click", () => {
  if (window.gVars.urls.length === 0) return;
  guardarPosicionesLectura();
  window.gVars.indiceActual = (window.gVars.indiceActual + 1) % window.gVars.urls.length;
  listaBarra.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
});

btnBarraBuscar.addEventListener("click", () => {
  const estabavisible = !panelBuscar.classList.contains("oculto");
  panelBuscar.classList.toggle("oculto");
  
  // Si se cierra el panel de búsqueda -> limpiar resaltados en el texto
  if (estabavisible) {
	  resetearBusqueda(); 
    const txt = window.gFunc.obtenerTextoActual();
    window.gFunc.mostrarTextoEnContenido(txt); 
    filaCoincidencias.classList.add("oculto");
    window.gFunc.setEstado("Opciones de Busqueda reseteados");
  } else {
    window.gFunc.setEstado("Panel Buscar: buscar en el fichero actual o en todos, navegar por las coincidencias encontradas");
  }
});

btnBarraFotos.addEventListener("click", () => {
  window.open("https://drive.google.com/drive/u/0/folders/1V9WCwuwJCXT9fuzLQ4NyU2xO8Wre1JxV", "_blank");
});
  
btnBarraAjustes.addEventListener("click", () => {
  panelAjustes.classList.toggle("oculto");
  guardarAjustes();
  guardarPosicionesLectura();
  
  if(panelAjustes.classList.contains("oculto")) {
    window.gFunc.setEstado("Ajustes Guardados");
  } else {
    window.gFunc.setEstado("Panel Ajustes: cambiar tamaño interface, tamaño texto, color texto, borrar caché navegador, restablecer ajustes de fábrica");
  }
  
  //actualizarInfoArchivo()
  let totalmb = (window.gVars.totalBytes / (1024 * 1024)).toFixed(1);
  const num = window.gVars.urls.length;
  //const pos = (num === 0 ? 0 : window.gVars.indiceActual + 1);
  //infoArchivo.textContent = `Archivo ${pos} de ${num} (${totalmb} MB total):`;
  btnBorrarCache.textContent = `Borrar los ${num} archivos (${totalmb} MB)`;
});

botonesPanelCerrar.forEach(btn => {
  btn.addEventListener("click", () => {
    const id = btn.getAttribute("data_panel");
    document.getElementById(id).classList.add("oculto");
    
    // Si se cierra el panel de búsqueda -> limpiar resaltados en el texto
    if (id === "id_panel_buscar") { 
	    resetearBusqueda();
      const txt = window.gFunc.obtenerTextoActual();
      window.gFunc.mostrarTextoEnContenido(txt); 
      filaCoincidencias.classList.add("oculto");
      window.gFunc.setEstado("Opciones de Busqueda reseteados");
    } 
    
    // Solo guardar ajustes si se cierra el panel de AJUSTES 
    if (id === "id_panel_ajustes") { 
      guardarAjustes(); 
      if(panelAjustes.classList.contains("oculto")) {
        window.gFunc.setEstado("Ajustes Guardados");
      } else {
        window.gFunc.setEstado("Panel Ajustes: cambiar tamaño interface, tamaño texto, color texto, borrar caché navegador, restablecer ajustes de fábrica");
      }
    }
  });
});

// BOTON BAJAR ARCHIVOS DE TEXTO
btnBajarArchivos.addEventListener("click", async () => {
  if (window.gVars.urls.length === 0) return;
  await bajarArchivosCompletos();
  bloqueArchivos.classList.remove("oculto");
});

// BOTON NUEVAS VERSIONES DE TEXTOS
btnHayNuevasVersiones.addEventListener("click", () => {
  panelNuevasVersiones.classList.remove("oculto");
});

// BOTON ACTUALIZAR TEXTOS
btnActualizarTextos.addEventListener("click", async () => {
  panelNuevasVersiones.classList.add("oculto");    
  await bajarArchivosCompletos();
});

// ============ Cambio orientación en el móvil ============
/*
function miFuncionAlCambiarOrientacion() {
  if (screen.orientation.type.startsWith("landscape")) {
    //ajustarTamanosHorizontal();
    ajustes.tamanoFont = ;
    ajustes.tamanoInterface = ;
    
  } else {
    //ajustarTamanosVertical();
    ajustes.tamanoFont = ;
    ajustes.tamanoInterface = ;
    
  }
}

window.addEventListener("orientationchange", function() {
  console.log("orientación cambiada:", screen.orientation.type);
  miFuncionAlCambiarOrientacion();
});
*/
// ============ Inicio del programa ============

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

/*
const dispositivo = document.body.dataset.dispositivo;
if (dispositivo === "movil") {
  console.log("Estás en móvil");
} else {
  console.log("Estás en ordenador");
}
*/
