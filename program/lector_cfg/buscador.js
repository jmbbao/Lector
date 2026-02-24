const inputBusqueda = document.getElementById("buscar-este-texto");
const chkGlobal = document.getElementById("chk-global");
const btnBuscarUnico = document.getElementById("btn-buscar-unico");

const btnAnteriorCoincidencia = document.getElementById("btn-anterior-coincidencia");
const btnSiguienteCoincidencia = document.getElementById("btn-siguiente-coincidencia");
const infoCoincidencias = document.getElementById("info-coincidencias");

const inputNumeroCoincidencia = document.getElementById("numero-coincidencia");
const btnIrCoincidencia = document.getElementById("btn-ir-coincidencia");

const contResultadosGlobales = document.getElementById("resultados-globales");

let coincidencias = [];
let indiceCoincidenciaActual = -1;

function mostrarTextoEnContenido(textoPlano) {
  const contenido = document.getElementById("contenido");
  contenido.innerHTML = "";
  const pre = document.createElement("div");
  pre.textContent = textoPlano;
  contenido.appendChild(pre);

  coincidencias = [];
  indiceCoincidenciaActual = -1;
  infoCoincidencias.textContent = "Coincidencias: 0";
}

function resaltarCoincidencias(patron) {
  const contenido = document.getElementById("contenido");
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
  coincidencias.forEach(span => span.classList.remove("resaltado-actual"));

  if (indiceCoincidenciaActual >= 0 && indiceCoincidenciaActual < coincidencias.length) {
    const actual = coincidencias[indiceCoincidenciaActual];
    actual.classList.add("resaltado-actual");
    actual.scrollIntoView({ behavior: "smooth", block: "center" });

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
  const urls = window._lector.getUrls();
  const nombres = window._lector.getNombres();
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
    div.className = "resultado-global";
    div.textContent = `${res.nombre} — ${res.cuenta} coincidencia(s)`;
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

  if (chkGlobal.checked) {
    buscarEnTodos(patron);
  } else {
    resaltarCoincidencias(patron);
  }
});

function inicializarBuscador() {}

