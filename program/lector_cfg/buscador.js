"use strict";

const inputBusqueda = document.getElementById("id_buscar_este_texto");
const chkTodos = document.getElementById("id_chk_todos");
const chkMayusculas = document.getElementById("id_chk_mayusculas");
const btnBuscar = document.getElementById("id_btn_buscar_unico");
const listaBuscar = document.getElementById("id_buscar_lista");
const infoCoincidencias = document.getElementById("id_coincidencias");
const infoCoincidenciaActual = document.getElementById("id_coincidencia_actual");
const btnAnteriorCoincidencia = document.getElementById("id_btn_anterior_coincidencia");
const btnSiguienteCoincidencia = document.getElementById("id_btn_siguiente_coincidencia");
const inputNumeroCoincidencia = document.getElementById("id_numero_coincidencia");
const btnIrCoincidencia = document.getElementById("id_btn_ir_coincidencia");

let arrCoincidencias = [];
let indiceCoincidenciaActual = -1;
let textoBuscado = "";


function resaltarCoincidencias() {
  //lector.js: const contenido = document.getElementById("id_contenido");
  const texto = window.gFunc.obtenerTextoActual();
  let regex;
  
  /*if (!textoBuscado) {
    mostrarTextoEnContenido(texto);
    
    arrCoincidencias = [];
    indiceCoincidenciaActual = -1;
    infoCoincidencias.textContent = "Coincidencias: 0";
    return;
  }*/
  
  //window.gFunc.tiempoInicio();

  if (chkMayusculas.checked) {
	regex = new RegExp(textoBuscado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  } else {
    regex = new RegExp(textoBuscado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  }

  arrCoincidencias = [];
  indiceCoincidenciaActual = -1;
  let resultado, ultimoindice = 0;
  const fragment = document.createDocumentFragment();

  while ((resultado = regex.exec(texto)) !== null) {
    const inicio = resultado.index;
    const fin = inicio + resultado[0].length;

    const antes = texto.slice(ultimoindice, inicio);
    if (antes) fragment.appendChild(document.createTextNode(antes));

    const span = document.createElement("span");
    span.className = "resaltado";
    span.textContent = texto.slice(inicio, fin);
    fragment.appendChild(span);

    arrCoincidencias.push(span);
    ultimoindice = fin;
  }

  const resto = texto.slice(ultimoindice);
  if (resto) fragment.appendChild(document.createTextNode(resto));

  contenido.innerHTML = "";
  contenido.appendChild(fragment);

  infoCoincidencias.textContent = `encontré: ${arrCoincidencias.length}`;
  
  //window.gFunc.tiempoFin();

  if (arrCoincidencias.length > 0) {
	filaCoincidencias.classList.remove("oculto"); 
    indiceCoincidenciaActual = 0;
    actualizarCoincidenciaActual();
  } 
  window.gFunc.setEstado("BUSQUEDA FINALIZADA");
}

function actualizarCoincidenciaActual() {
  arrCoincidencias.forEach(span => span.classList.remove("resaltado_actual"));

  if (indiceCoincidenciaActual >= 0 && indiceCoincidenciaActual < arrCoincidencias.length) {
    const actual = arrCoincidencias[indiceCoincidenciaActual];
    actual.classList.add("resaltado_actual");
    
    // Esperar a que el DOM pinte el resaltado antes de hacer scroll
    setTimeout(() => {
      actual.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
    }, 0);

    infoCoincidencias.textContent = `hay: ${arrCoincidencias.length} coincidencias`;
    infoCoincidenciaActual.textContent = `${indiceCoincidenciaActual + 1}`;
  }
}

btnAnteriorCoincidencia.addEventListener("click", () => {
  if (arrCoincidencias.length === 0) return;
  indiceCoincidenciaActual =
    (indiceCoincidenciaActual - 1 + arrCoincidencias.length) % arrCoincidencias.length;
  actualizarCoincidenciaActual();
});

btnSiguienteCoincidencia.addEventListener("click", () => {
  if (arrCoincidencias.length === 0) return;
  indiceCoincidenciaActual =
    (indiceCoincidenciaActual + 1) % arrCoincidencias.length;
  actualizarCoincidenciaActual();
});

btnIrCoincidencia.addEventListener("click", () => {
  const n = parseInt(inputNumeroCoincidencia.value, 10);
  if (!n || n < 1 || n > arrCoincidencias.length) return;

  indiceCoincidenciaActual = n - 1;
  actualizarCoincidenciaActual();
});

/*Usa RegExp  (...  */
async function buscarEnTodos() { 
  const titulos = window.gVars.titulos;
  const textos = window.gVars.textos;
  const urls = window.gVars.urls;
  let regex;
  
  window.gFunc.tiempoInicio();
  window.gFunc.setEstado("BUSCANDO EL TEXTO... ESPERA UNOS SEGUNDOS...");
  await window.gFunc.Pausa(1); //1 milisegundo
  
  //Convierte carácteres que pueden dar problema, a su forma escapada
  //son estos caracteres: . * + ? ^ $ { } ( ) | [ ] \   la g indica que haga todas no una sola   gi  sería ignorando case
  if (chkMayusculas.checked) {
    regex = new RegExp(textoBuscado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g");
  } else {
    regex = new RegExp(textoBuscado.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
  }

  const resultados = [];
  urls.forEach((url, idx) => {
    const texto = textos[url];
    if (!texto) return;

    const matches = texto.match(regex);
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

  window.gFunc.tiempoFin();

  resultados.sort((a, b) => b.cuenta - a.cuenta);

  listaBuscar.innerHTML = "";
  //let cuentasmatches = {};
  resultados.forEach((res,i) => {
    const opt = document.createElement("option");
    opt.value = res.indice;
    opt.textContent = res.nombre; 
    listaBuscar.appendChild(opt);
    //cuentasmatches[res.indice] = res.cuenta;
  });
  listaBuscar.value = "0";
  window.gFunc.irAArchivoPorIndice(0);
  resaltarCoincidencias();
}
/*Usa RegExp  ...)  */

/* ============ Eventos UI ============ */

listaBuscar.addEventListener("change", () => {
  let indice = parseInt(listaBuscar.value, 10) || 0;
 
  window.gFunc.irAArchivoPorIndice(indice);
  resaltarCoincidencias();
});

btnBuscar.addEventListener("click", () => {
  textoBuscado = inputBusqueda.value;
  if (textoBuscado.trim()==="") return;

  if (chkTodos.checked) {
	listaBuscar.classList.remove("oculto");
    buscarEnTodos();
  } else {
	listaBuscar.classList.add("oculto");
    resaltarCoincidencias();
  }
});
