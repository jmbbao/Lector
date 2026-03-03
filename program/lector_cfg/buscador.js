// ================== Referencias a elementos ==================

const inputBusqueda = document.getElementById("id_buscar_este_texto");
const chkTodos = document.getElementById("id_chk_todos");
const btnBuscar = document.getElementById("id_btn_buscar_unico");
const buscarLista = document.getElementById("id_buscar_lista");
const infoCoincidencias = document.getElementById("id_info_coincidencias");
const btnAnteriorCoincidencia = document.getElementById("id_btn_anterior_coincidencia");
const btnSiguienteCoincidencia = document.getElementById("id_btn_siguiente_coincidencia");
const inputNumeroCoincidencia = document.getElementById("id_numero_coincidencia");
const btnIrCoincidencia = document.getElementById("id_btn_ir_coincidencia");
const filaCoincidencias = document.getElementById("id_fila_coincidencias");

let clusterize;

document.addEventListener("DOMContentLoaded", () => {
  clusterize = new Clusterize({
    scrollId: 'id_contenido',
    contentId: 'id_contenido_lista',
    rows: []
  });
});


// ================== Variables internas ==================

let coincidencias = [];
let indiceCoincidenciaActual = -1;
let cuentasMatches = {};
let patronBusqueda = "";

// ================== Mostrar texto sin resaltado ==================
/*
function mostrarTextoEnContenido(texto) {
  const lineas = texto.split("\n");
  clusterize.update(lineas);
}
*/
// ================== Resaltar coincidencias (Opción B) ==================

function resaltarCoincidencias() {
  const textoOriginal = window.gFunc.obtenerTextoActual();
  const lineas = textoOriginal.split("\n");

  coincidencias = [];
  indiceCoincidenciaActual = -1;

  if (!patronBusqueda) {
    clusterize.update(lineas);
    infoCoincidencias.textContent = "Coincidencias: 0";
    return;
  }

  const regex = new RegExp(
    patronBusqueda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi"
  );

  const nuevasLineas = lineas.map((linea, numLinea) => {
    let match;
    let partes = [];
    let ultimo = 0;

    while ((match = regex.exec(linea)) !== null) {
      const inicio = match.index;
      const fin = inicio + match[0].length;

      partes.push(linea.slice(ultimo, inicio));
      partes.push(`<span class="resaltado">${match[0]}</span>`);

      coincidencias.push({ linea: numLinea, inicio, fin });
      ultimo = fin;
    }

    if (partes.length === 0) return linea;

    partes.push(linea.slice(ultimo));
    return partes.join("");
  });

  clusterize.update(nuevasLineas);

  infoCoincidencias.textContent = `Coincidencias: ${coincidencias.length}`;

  if (coincidencias.length > 0) {
    filaCoincidencias.classList.remove("oculto");
    indiceCoincidenciaActual = 0;
    actualizarCoincidenciaActual();
  }
}

// ================== Actualizar coincidencia actual ==================

function actualizarCoincidenciaActual() {
  if (coincidencias.length === 0) return;

  const textoOriginal = window.gFunc.obtenerTextoActual();
  const lineas = textoOriginal.split("\n");

  const regex = new RegExp(
    patronBusqueda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi"
  );

  const nuevasLineas = lineas.map((linea) =>
    linea.replace(regex, (m) => `<span class="resaltado">${m}</span>`)
  );

  const c = coincidencias[indiceCoincidenciaActual];
  const lineaOriginal = lineas[c.linea];
  const textoCoinc = lineaOriginal.slice(c.inicio, c.fin);

  nuevasLineas[c.linea] = nuevasLineas[c.linea].replace(
    `<span class="resaltado">${textoCoinc}</span>`,
    `<span class="resaltado_actual">${textoCoinc}</span>`
  );

  clusterize.update(nuevasLineas);
  clusterize.scrollTo(c.linea);

  infoCoincidencias.textContent =
    `Coincidencias: ${coincidencias.length} — Actual: ${indiceCoincidenciaActual + 1}`;
}

// ================== Navegación entre coincidencias ==================

btnIrCoincidencia.addEventListener("click", () => {
  const n = parseInt(inputNumeroCoincidencia.value, 10);
  if (!n || n < 1 || n > coincidencias.length) return;

  indiceCoincidenciaActual = n - 1;
  actualizarCoincidenciaActual();
});

btnAnteriorCoincidencia.addEventListener("click", () => {
  if (coincidencias.length === 0) return;
  indiceCoincidenciaActual =
    (indiceCoincidenciaActual - 1 + coincidencias.length) % coincidencias.length;
  actualizarCoincidenciaActual();
});

btnSiguienteCoincidencia.addEventListener("click", () => {
  if (coincidencias.length === 0) return;
  indiceCoincidenciaActual =
    (indiceCoincidenciaActual + 1) % coincidencias.length;
  actualizarCoincidenciaActual();
});

// ================== Buscar en todos los archivos ==================

function buscarEnTodos() {
  const titulos = window.gVars.titulos;
  const textos = window.gVars.textos;
  const urls = window.gVars.urls;

  buscarLista.innerHTML = "";

  const regex = new RegExp(
    patronBusqueda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
    "gi"
  );

  const resultados = [];
  urls.forEach((url, idx) => {
    const txt = textos[url];
    if (!txt) return;

    const matches = txt.match(regex);
    if (matches && matches.length > 0) {
      resultados.push({
        indice: idx,
        nombre: titulos[idx],
        cuenta: matches.length
      });
    }
  });

  if (resultados.length === 0) {
    window.gFunc.setEstado("Sin coincidencias en ningún archivo.");
    return;
  }

  resultados.sort((a, b) => b.cuenta - a.cuenta);

  cuentasMatches = {};
  resultados.forEach((res) => {
    const opt = document.createElement("option");
    opt.value = res.indice;
    opt.textContent = res.nombre;
    cuentasMatches[res.indice] = res.cuenta;
    buscarLista.appendChild(opt);
  });

  buscarLista.value = "0";
  window.gFunc.irAArchivoPorIndice(0);
  resaltarCoincidencias();
}

// ================== Eventos UI ==================

buscarLista.addEventListener("change", () => {
  let indice = parseInt(buscarLista.value, 10) || 0;

  window.gFunc.irAArchivoPorIndice(indice);
  resaltarCoincidencias();
});

btnBuscar.addEventListener("click", () => {
  patronBusqueda = inputBusqueda.value;
  if (!patronBusqueda) return;

  if (chkTodos.checked) {
    buscarLista.classList.remove("oculto");
    buscarEnTodos();
  } else {
    buscarLista.classList.add("oculto");
    resaltarCoincidencias();
  }
});

