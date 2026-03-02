const inputBusqueda = document.getElementById("id_buscar_este_texto");
const chkTodos = document.getElementById("id_chk_todos");
const btnBuscar = document.getElementById("id_btn_buscar_unico");
const buscarLista = document.getElementById("id_buscar_lista");
const infoCoincidencias = document.getElementById("id_info_coincidencias");
const btnAnteriorCoincidencia = document.getElementById("id_btn_anterior_coincidencia");
const btnSiguienteCoincidencia = document.getElementById("id_btn_siguiente_coincidencia");
const inputNumeroCoincidencia = document.getElementById("id_numero_coincidencia");
const btnIrCoincidencia = document.getElementById("id_btn_ir_coincidencia");

let coincidencias = [];
let indiceCoincidenciaActual = -1;
let cuentasMatches = {};
let patronBusqueda = "";


function mostrarTextoEnContenido(texto) {
  const contenido = document.getElementById("id_contenido");
  contenido.innerHTML = "";
  const pre = document.createElement("div");
  pre.textContent = texto;
  contenido.appendChild(pre);
}

function resaltarCoincidencias() {
  const contenido = document.getElementById("id_contenido");
  const textoOriginal = window.gFunc.obtenerTextoActual();

  if (!patronBusqueda) {
    mostrarTextoEnContenido(textoOriginal);
    
    coincidencias = [];
    indiceCoincidenciaActual = -1;
    infoCoincidencias.textContent = "Coincidencias: 0";
    return;
  }

  const regex = new RegExp(patronBusqueda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

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
	filaCoincidencias.classList.remove("oculto"); 
    indiceCoincidenciaActual = 0;
    actualizarCoincidenciaActual();
  } 
}

function actualizarCoincidenciaActual() {
  coincidencias.forEach(span => span.classList.remove("resaltado_actual"));

  if (indiceCoincidenciaActual >= 0 && indiceCoincidenciaActual < coincidencias.length) {
    const actual = coincidencias[indiceCoincidenciaActual];
    actual.classList.add("resaltado_actual");
    
    // Esperar a que el DOM pinte el resaltado antes de hacer scroll
    setTimeout(() => {
      actual.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, 0);


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

function buscarEnTodos() {
  const titulos = window.gVars.titulos;
  const textos = window.gVars.textos;
  const urls = window.gVars.urls;
  
  buscarLista.innerHTML = "";

  //Convierte carácteres que podrían dar problema en su forma escapada antes de buscar
  const regex = new RegExp(patronBusqueda.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

  const resultados = [];
  urls.forEach((url, idx) => {
    const txt = textos[url];
    if (!txt) return;

    const matches = txt.match(regex);
    if (matches && matches.length > 0) {
      resultados.push(
      {
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
  resultados.forEach((res,i) => {
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

/* ============ Eventos UI ============ */

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
