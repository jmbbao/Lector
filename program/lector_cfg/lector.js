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
//const URL_FOTOS = "https://drive.google.com/drive/u/0/folders/1V9WCwuwJCXT9fuzLQ4NyU2xO8Wre1JxV"; //Google
const URL_FOTOS = "https://mega.nz/folder/25kCgLDa#ENihUfSAtPlE9dQr2MkZXA"; //Mega

const barraSuperior = document.getElementById("id_barra_superior");
const panelesContainer = document.getElementById("id_paneles_container");
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
const btnEstadoPaneles = document.getElementById("id_btn_estado_paneles");
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
  scrollTimeout: 0,
  estadopaneles: "abiertos" //"abiertos" "cerrados"
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
  infoArchivo.textContent = Traducir[ajustes.idioma]["traduce_id_archivo"];
  this.setEstado(Traducir[ajustes.idioma]["traduce_estado6"]);
  
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
  window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado7"]);

  const resp = await fetch(URL_INDICE);
  if (!resp.ok) throw new Error("Error índice: " + resp.status);

  const data = await resp.json();

  window.gVars.titulos =   data.textos.map(t => t.titulo || Traducir[ajustes.idioma]["traduce_error2"]);
  window.gVars.versiones = data.textos.map(t => t.version);
  window.gVars.urls =      data.textos.map(t => t.url);

  listaBarra.innerHTML = "";
  window.gVars.titulos.forEach((titulo, i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = titulo;
    listaBarra.appendChild(opt);
  });

  if (window.gVars.urls.length === 0) {
    infoArchivo.textContent = "😳️ SIN ARCHIVOS";
    window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado8"]);
    return;
  }

  window.gVars.indiceActual = 0;
  listaBarra.value = "0";
}

function actualizarInfoArchivo() {
  const num = window.gVars.urls.length;
  const pos = (num === 0 ? 0 : window.gVars.indiceActual + 1);
  //Archivo 1 de 9
  infoArchivo.textContent = Traducir[ajustes.idioma]["traduce_id_archivo2"] + pos + 
                            Traducir[ajustes.idioma]["traduce_id_archivo3"] + num + ":";
}

function actualizarBotonBorrarCache() {
  let totalmb = (window.gVars.totalBytes / (1024 * 1024)).toFixed(1);
  const num = window.gVars.urls.length;
  //Borrar los 9 archivos (25.3 MB)
  btnBorrarCache.textContent = Traducir[ajustes.idioma]["traduce_ajus_id_btn_borrar_cache2"] + num + 
                               Traducir[ajustes.idioma]["traduce_ajus_id_btn_borrar_cache3"] + totalmb + " MB)";
}

async function comprobarCacheyVersiones() {
  const db = await abrirDB();
  window.gVars.textos = {};
  
  let btodosencache = true;
  window.gVars.hayNuevasVersiones = false;
  btnBajarArchivos.classList.add("oculto");

  window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado9"]);

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
    //btnBajarArchivos.classList.add("oculto");
    window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado10"]);
    mostrarTextoActual();
  } else {
    btnBajarArchivos.classList.remove("oculto");
    window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado11"]);
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

  window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado12"]);

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
      console.error(Traducir[ajustes.idioma]["traduce_error3"], url, e);
    }
  }

  window.gVars.hayNuevasVersiones = false;
  btnHayNuevasVersiones.classList.add("oculto");
  btnBajarArchivos.classList.add("oculto");

  window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado13"]);
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

// LISTA CON LOS FICHEROS DE TEXTO
listaBarra.addEventListener("change", () => {
  guardarPosicionesLectura();
  window.gVars.indiceActual = parseInt(listaBarra.value, 10) || 0;
  mostrarTextoActual();
});

// BOTON ANTERIOR 
btnAnterior.addEventListener("click", () => {
  if (window.gVars.urls.length === 0) return;
  guardarPosicionesLectura();
  window.gVars.indiceActual = (window.gVars.indiceActual - 1 + window.gVars.urls.length) % window.gVars.urls.length;
  listaBarra.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
});

// BOTON SIGUIENTE 
btnSiguiente.addEventListener("click", () => {
  if (window.gVars.urls.length === 0) return;
  guardarPosicionesLectura();
  window.gVars.indiceActual = (window.gVars.indiceActual + 1) % window.gVars.urls.length;
  listaBarra.value = String(window.gVars.indiceActual);
  mostrarTextoActual();
});

// BOTON BUSCAR 
btnBarraBuscar.addEventListener("click", () => {
  const estabavisible = !panelBuscar.classList.contains("oculto");
  panelBuscar.classList.toggle("oculto");
  
  // Si se cierra el panel de búsqueda -> limpiar resaltados en el texto
  if (estabavisible) {
	  resetearBusqueda(); 
    const txt = window.gFunc.obtenerTextoActual();
    window.gFunc.mostrarTextoEnContenido(txt); 
    filaCoincidencias.classList.add("oculto");
    window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado14"]);
  } else {
    window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado15"]);
  }
});

// BOTON AJUSTES 
btnBarraAjustes.addEventListener("click", () => {
  panelAjustes.classList.toggle("oculto");
  guardarAjustes();
  guardarPosicionesLectura();
  
  if(panelAjustes.classList.contains("oculto")) {
    window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado16"]);
  } else {
    window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado17"]);
  }
  
  //actualizarInfoArchivo()
  actualizarBotonBorrarCache();
});

// BOTON FOTOS 
btnBarraFotos.addEventListener("click", () => {
  window.open(URL_FOTOS, "_blank");
});

// BOTON PANELES EN LA BARRA DE ESTADO
btnEstadoPaneles.addEventListener("click", () => {
  if (window.gVars.estadopaneles == "abiertos") {
    barraSuperior.classList.add("oculto");
    panelesContainer.classList.add("oculto");
    window.gVars.estadopaneles = "cerrados";
    btnEstadoPaneles.textContent = "⤵️";
  } else {
    barraSuperior.classList.remove("oculto");
    panelesContainer.classList.remove("oculto");
    window.gVars.estadopaneles = "abiertos";
    btnEstadoPaneles.textContent = "⤴️";
  }
});

// BOTON CERRAR EN LOS PANELES
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
      window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado14"]);
    } 
    
    // Solo guardar ajustes si se cierra el panel de AJUSTES 
    if (id === "id_panel_ajustes") { 
      guardarAjustes(); 
      if(panelAjustes.classList.contains("oculto")) {
        window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado16"]);
      } else {
        window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado17"]);
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

// CAPTURA BOTONES IZQUIERDA Y DERECHA
document.addEventListener("keydown", function(event) {
	if (event.key === "ArrowLeft") {
		event.preventDefault(); //evita el shortcut que tenga el navegador para esta tecla
		//document.getElementById("id_btn_anterior_coincidencia").click();
		btnAnteriorCoincidencia.click();
	}
	if (event.key === "ArrowRight") {
		event.preventDefault(); //evita el shortcut que tenga el navegador para esta tecla
		//document.getElementById("id_btn_siguiente_coincidencia").click();
		btnSiguienteCoincidencia.click();
	}
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
    window.gVars.estadopaneles = "abiertos"
	  cargarPosicionesLectura();
    inicializarAjustes();
    await cargarIndice();
    if (window.gVars.urls.length > 0) {
      await comprobarCacheyVersiones();
    }
  } catch (e) {
    console.error(e);
    window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado18"]);
  }
});

/*
const dispositivo = document.body.data_dispositivo;
if (dispositivo === "movil") {
  console.log("Estás en móvil");
} else {
  console.log("Estás en ordenador");
}
*/
