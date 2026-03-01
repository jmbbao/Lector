const inputBusqueda = document.getElementById("id_buscar_este_texto");
const chkTodos = document.getElementById("id_chk_todos");
const btnBuscarUnico = document.getElementById("id_btn_buscar_unico");
const infoCoincidencias = document.getElementById("id_info_coincidencias");
const btnAnteriorCoincidencia = document.getElementById("id_btn_anterior_coincidencia");
const btnSiguienteCoincidencia = document.getElementById("id_btn_siguiente_coincidencia");
const inputNumeroCoincidencia = document.getElementById("id_numero_coincidencia");
const btnIrCoincidencia = document.getElementById("id_btn_ir_coincidencia");
const contResultadosGlobales = document.getElementById("id_resultados_buscar");

let coincidencias = [];
let indiceCoincidenciaActual = -1;


function mostrarTextoEnContenido(texto) {
  const contenido = document.getElementById("id_contenido");
  contenido.innerHTML = "";
  const pre = document.createElement("div");
  pre.textContent = texto;
  contenido.appendChild(pre);

  coincidencias = [];
  indiceCoincidenciaActual = -1;
  infoCoincidencias.textContent = "Coincidencias: 0";
}

function resaltarCoincidencias(patron) {
  const contenido = document.getElementById("id_contenido");
  const textoOriginal = window._lector.obtenerTextoActual();

  if (!patron) {
    mostrarTextoEnContenido(textoOriginal);
    return;
  }

  const regex = new RegExp(patron.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

  coincidencias = [];
  indiceCoincidenciaActual = -1;

  let resultado;
  let ultimoIndice = 0;
  const fragment = document.createDocumentFragment();

  while ((resultado = regex.exec(textoOriginal)) !== null) {
    const inicio = resultado.index;
    const fin = inicio + resultado[0].length;

    const antes = textoOriginal.slice(ultimoIndice, inicio);
    if (antes) fragment.appendChild(document.createTextNode(antes));

    const span = document.createElement("span");
    span.className = "resaltado";
    span.textContent = textoOriginal.slice(inicio, fin);
    fragment.appendChild(span);

    coincidencias.push(span);
    ultimoIndice = fin;
  }

  const resto = textoOriginal.slice(ultimoIndice);
  if (resto) fragment.appendChild(document.createTextNode(resto));

  contenido.innerHTML = "";
  contenido.appendChild(fragment);

  infoCoincidencias.textContent = `Coincidencias: ${coincidencias.length}`;

  if (coincidencias.length > 0) {
    indiceCoincidenciaActual = 0;
    actualizarCoincidenciaActual();
  }
}

function actualizarCoincidenciaActual() {
  coincidencias.forEach(span => span.classList.remove("resaltado_actual"));

  if (indiceCoincidenciaActual >= 0 && indiceCoincidenciaActual < coincidencias.length) {
    const actual = coincidencias[indiceCoincidenciaActual];
    actual.classList.add("resaltado_actual");
    actual.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

    infoCoincidencias.textContent =
      `Coincidencias: ${coincidencias.length} — Actual: ${indiceCoincidenciaActual + 1}`;
  }
}

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

function buscarEnTodos(patron) {
  const urls = window.gVars.urls;
  const nombres = window.gVars.nombres;
  const textos = window._lector._textos;

  contResultadosGlobales.innerHTML = "";

  const regex = new RegExp(patron.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

  const resultados = [];

  urls.forEach((url, idx) => {
    const txt = textos[url];
    if (!txt) return;

    const matches = txt.match(regex);
    if (matches && matches.length > 0) {
      resultados.push({
        indice: idx,
        nombre: nombres[idx],
        cuenta: matches.length
      });
    }
  });

  if (resultados.length === 0) {
    contResultadosGlobales.textContent = "Sin coincidencias en ningún archivo.";
    return;
  }

  resultados.sort((a, b) => b.cuenta - a.cuenta);

  resultados.forEach(res => {
    const div = document.createElement("div");
    div.className = "resultado_global";
    div.textContent = `${res.nombre} — ${res.cuenta} coincidencias`;
    div.addEventListener("click", () => {
      window._lector.irAArchivoPorIndice(res.indice);
      resaltarCoincidencias(patron);
    });
    contResultadosGlobales.appendChild(div);
  });
}

btnBuscarUnico.addEventListener("click", () => {
  //const patron = inputBusqueda.value.trim();
  const patron = inputBusqueda.value;
  if (!patron) return;

  if (chkTodos.checked) {
    buscarEnTodos(patron);
  } else {
    resaltarCoincidencias(patron);
  }
});
