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


function mostrarTextoEnContenido(texto) {
  const contenido = document.getElementById("id_contenido");
  contenido.innerHTML = "";
  const pre = document.createElement("div");
  pre.textContent = texto;
  contenido.appendChild(pre);
}

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
  
  let timeinicio = performance.now();

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

  infoCoincidencias.textContent = `hay: ${arrCoincidencias.length} coincidencias`;
  
  let timefin = performance.now();
  let tiempo = timefin - timeinicio;
  console.log("Tiempo resaltarCoincidencias(): ", tiempo.toFixed(2), "ms");

  if (arrCoincidencias.length > 0) {
	filaCoincidencias.classList.remove("oculto"); 
    indiceCoincidenciaActual = 0;
    actualizarCoincidenciaActual();
  } 
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

/*Usa IndexOf  (...  
function buscarEnTodos() { 
  const titulos = window.gVars.titulos;
  const textos = window.gVars.textos;
  const urls = window.gVars.urls;
  
  let timeinicio = performance.now();
  
  if (!chkMayusculas.checked) {
    textoBuscado.toLowerCase();
  }
  
  const resultados = [];
  urls.forEach((url, idx) => {
    const texto = textos[url];
    if (!texto) return;

    if (!chkMayusculas.checked) {
      texto.toLowerCase();
    }
    
    let matches = [];
    let pos = texto.indexOf(textoBuscado);
    while (pos !== -1) {
      matches.push(pos);
      pos = texto.indexOf(textoBuscado, (pos + textoBuscado.length));
    }
    
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

  let timefin = performance.now();
  let tiempo = timefin - timeinicio;
  console.log("Tiempo buscarEnTodos() con indexOf: ", tiempo.toFixed(2), "ms");

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
/*Usa IndexOf  ...)  */


/*Usa miBusqueda  (...  
function buscarEnTodos() { 
  const titulos = window.gVars.titulos;
  const textos = window.gVars.textos;
  const urls = window.gVars.urls;
  
  let timeinicio = performance.now();
  
  const resultados = [];
  urls.forEach((url, idx) => {
    const texto = textos[url];
    if (!texto) return;

    const lentexto = texto.length;
    let txtbuscado;
    if (chkMayusculas.checked) { 
	    txtbuscado = textoBuscado; 
	  } else { 
	    txtbuscado = textoBuscado.toLowerCase(); 
	  }
    const lenbuscado = txtbuscado.length;

    let matches = [];
    let i, j, bcoincide;
    
    if (lenbuscado >= 2) {
      if (chkMayusculas.checked) {  //comparamos Mayúsculas y minúsculas
        for (i=0; i <= (lentexto - lenbuscado); i++) {
          if ( (texto[i]   == txtbuscado[0]) &&
               (texto[i+1] == txtbuscado[1]) ) {
            bcoincide = true;
            for (j=2; j < lenbuscado; j++) {
              if (texto[i+j] != txtbuscado[j]) {
                bcoincide = false;
                break;
            } }
            if (bcoincide) {
              matches.push(i);
              i += lenbuscado-1;
      } } } }
      else { //comparamos en minúsculas
        for (i=0; i <= (lentexto - lenbuscado); i++) {
          if ( (texto[i].toLowerCase()   == txtbuscado[0])  &&
               (texto[i+1].toLowerCase() == txtbuscado[1]) ) {
            bcoincide = true;
            for (j=2; j < lenbuscado; j++) {
              if (texto[i+j].toLowerCase() != txtbuscado[j]) {
                bcoincide = false;
                break;
            } }
            if (bcoincide) {
              matches.push(i);
              i += lenbuscado - 1;
    } } } } }
    else {
      if (chkMayusculas.checked) {  //comparamos Mayúsculas y minúsculas
        for (i=0; i <= (lentexto - lenbuscado); i++) {
          if (texto[i] == txtbuscado[0]) {
            bcoincide = true;
            for (j=1; j < lenbuscado; j++) {
              if (texto[i+j] != txtbuscado[j]) {
                bcoincide = false;
                break;
            } }
            if (bcoincide) {
              matches.push(i);
              i += lenbuscado - 1;
      } } } }
      else { //comparamos en minúsculas
        for (i=0; i <= (lentexto - lenbuscado); i++) {
          if (texto[i].toLowerCase() == txtbuscado[0]) {
            bcoincide = true;
            for (j=1; j < lenbuscado; j++) {
              if (texto[i+j].toLowerCase() != txtbuscado[j]) {
                bcoincide = false;
                break;
            } }
            if (bcoincide) {
              matches.push(i);
              i += lenbuscado - 1;
    } } } } }
    
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

  let timefin = performance.now();
  let tiempo = timefin - timeinicio;
  console.log("Tiempo buscarEnTodos() con miBusqueda: ", tiempo.toFixed(2), "ms");

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
/*Usa miBusqueda  ...)  */

/*
buscar "de "
regEx:   39.60 ms
         80.10 ms

         minusc     may/minusc
indexOf: 50.30 ms    24.00 ms
        230.10 ms   230.10 ms

miBusqueda:   minusc     may/minusc
             221.90 ms    194.60 ms 
             227.20 ms    221.30 ms
*/

/*Usa RegExp  (...  */
function buscarEnTodos() { 
  const titulos = window.gVars.titulos;
  const textos = window.gVars.textos;
  const urls = window.gVars.urls;
  let regex;
  
  let timeinicio = performance.now();
  
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

  let timefin = performance.now();
  let tiempo = timefin - timeinicio;
  console.log("Tiempo buscarEnTodos() con regex: ", tiempo.toFixed(2), "ms");

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
