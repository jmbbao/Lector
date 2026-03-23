"use strict";

const panelEstado = document.getElementById("id_panel_estado");
const panelAjustesTitulo = document.getElementById("id_panel_ajustes_titulo");
const btnIdioma = document.getElementById("id_btn_idioma");
const btnInterfaceMenos = document.getElementById("id_interface_menos");
const tamanoInterface = document.getElementById("id_tamano_interface");
const btnInterfaceMas = document.getElementById("id_interface_mas");
const temaSelect = document.getElementById("id_tema_select");
const colorTextoInput = document.getElementById("id_color_texto");
const colorFondoInput = document.getElementById("id_color_fondo");
const tipoLetraSelect = document.getElementById("id_tipo_letra");
const btnTextoMenos = document.getElementById("id_texto_menos");
const tamanoFont = document.getElementById("id_tamano_font");
const btnTextoMas = document.getElementById("id_texto_mas");
const btnRestablecer = document.getElementById("id_btn_restablecer_ajustes");
const btnBorrarCache = document.getElementById("id_btn_borrar_cache");

const CLAVE_AJUSTES = "lector_ajustes";

const fuentesCSS = {
  "arial":   'Arial, sans-serif',
  "calibri": 'Calibri, sans-serif',
  "courier": '"Courier New", monospace',
  "georgia": 'Georgia, serif',  
  "roboto":  'Roboto, sans-serif',
  "times":   '"Times New Roman", serif',  
  "ubuntu":  'Ubuntu, sans-serif',  
  "verdana": 'Verdana, sans-serif'
};

let ajustes = {
  version:     "v07",  //Cambiar tb. sw_movil.js 
  idioma:      "es",   //Traducir[ajustes.idioma]["clave"]
  tamanoInterface: 2,  
  tema:        "oscuro",           
  colorTexto:  "#ffffff",    
  colorFondo:  "#000000", 
  tipoLetra:   "arial",   
  tamanoFont:  2
};

function cargarAjustesdeFabrica() {
  const varCSS = getComputedStyle(document.documentElement);
  ajustes.idioma =          varCSS.getPropertyValue("--fabrica_idioma").trim();  
  ajustes.tamanoInterface = parseInt(varCSS.getPropertyValue("--fabrica_interface_tamano"), 10);  
  ajustes.tema =            varCSS.getPropertyValue("--fabrica_tema").trim();  
  ajustes.colorTexto =      varCSS.getPropertyValue("--fabrica_texto_color").trim();  
  ajustes.colorFondo =      varCSS.getPropertyValue("--fabrica_texto_fondo").trim();  
  ajustes.tipoLetra =       varCSS.getPropertyValue("--fabrica_texto_font").trim(); 
  ajustes.tamanoFont =      parseInt(varCSS.getPropertyValue("--fabrica_texto_tamano"), 10);
}

function cargarAjustes() {
  const guardado = localStorage.getItem(CLAVE_AJUSTES);
  if (guardado) {
    try {
      const obj = JSON.parse(guardado);
      ajustes = { ...ajustes, ...obj };
    } 
    catch { // ignorar errores
    }
  } else {
    //No había nada guardado así que inicializamos con valores de fábrica
    cargarAjustesdeFabrica();
  }
}
/*
En la función cargarAjustes() esto:
let ajustes = JSON.parse(localStorage.getItem("ajustes"));

funciona, pero al añadir alguna variable a ajustes ya no funcionará. Pues:
ajustes = { ...ajustes, ...obj };

hace una fusión entre lo que hay guardado (obj) y la variable actual, 
sobreescribiendo los campos guardados pero sin tocar los nuevos que no tenga guardados
*/  

function guardarAjustes() {
  localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
}

function ponerColoresSolo() {
  ajustes.tema = temaSelect.value;
	
  if (ajustes.tema === "claro") { 
    ajustes.colorTexto = "#000000";
    ajustes.colorFondo = "#ffffff";
  }

  if (ajustes.tema === "oscuro") {
    ajustes.colorTexto = "#ffffff";
    ajustes.colorFondo = "#000000";
  }

  if (ajustes.tema === "usuario") {
    ajustes.colorTexto = colorTextoInput.value;
    ajustes.colorFondo = colorFondoInput.value;  
  }
  contenido.style.color =      ajustes.colorTexto;
  contenido.style.background = ajustes.colorFondo;
  estado.style.background = ajustes.colorFondo;
}

function aplicarIdioma() {
  let idioma = ajustes.idioma;
  // textContent
  document.querySelectorAll("[data-txt]").forEach(elem => {
    elem.textContent = Traducir[idioma][elem.dataset.txt];
  });

  // title
  document.querySelectorAll("[data-title]").forEach(elem => {
    elem.title = Traducir[idioma][elem.dataset.title];
  });
/*
  // Traduce placeholders
  document.querySelectorAll("[data-ph]").forEach(elem => {
    const clave = elem.dataset.ph;
    elem.placeholder = Traducir[idioma][clave];
  });

  // Traduce value (inputs tipo button)
  document.querySelectorAll("[data-value]").forEach(elem => {
    const clave = elem.dataset.value;
    elem.value = Traducir[idioma][clave];
  });
*/
  if (idioma == "es") {
    btnIdioma.textContent = "🇪🇦️";
  } else {
    btnIdioma.textContent = "🇺🇸";
  }
  
  //recalcular estos dos
  actualizarInfoArchivo();      //Archivo 1 de 9
  actualizarBotonBorrarCache(); //Borrar los 9 archivos (25.3 MB)
  window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado19"]);
  panelAjustesTitulo.textContent = Traducir[ajustes.idioma]["traduce_ajus_titulo"] + ajustes.version; //Cambiar tb. sw_movil.js 
}

function aplicarAjustes() {
  //Rellenar valores en el panel
  aplicarIdioma();
  
  tamanoInterface.textContent = ajustes.tamanoInterface + "px";  
  temaSelect.value = ajustes.tema;
  colorTextoInput.value = ajustes.colorTexto;
  colorFondoInput.value = ajustes.colorFondo;
  tipoLetraSelect.value = ajustes.tipoLetra;
  tamanoFont.textContent = ajustes.tamanoFont + "px";

  //Poner tamaño interface
  barraSuperior.style.fontSize =    ajustes.tamanoInterface + "px"; 
  panelesContainer.style.fontSize = ajustes.tamanoInterface + "px"; 
  panelEstado.style.fontSize = ajustes.tamanoInterface + "px";

  //Se llama también en addEventListener("change") y solo debe poner color texto y color fondo
  ponerColoresSolo(); 
  
  //Poner fuente y tamaño
  contenido.style.fontFamily = fuentesCSS[ajustes.tipoLetra];
  contenido.style.fontSize =   ajustes.tamanoFont + "px";
}

function inicializarAjustes() {
  cargarAjustes();
  aplicarAjustes();

  btnIdioma.addEventListener("click", () => {
    if (ajustes.idioma == "es") {
      ajustes.idioma = "en";
      btnIdioma.textContent = "🇺🇸";
    } else {
      ajustes.idioma = "es";
      btnIdioma.textContent = "🇪🇦️";
    }
    aplicarIdioma();
  });
      
  btnInterfaceMenos.addEventListener("click", () => {
    ajustes.tamanoInterface = Math.max(8, ajustes.tamanoInterface - 1);
    tamanoInterface.textContent = ajustes.tamanoInterface + "px";
    barraSuperior.style.fontSize =    ajustes.tamanoInterface + "px"; 
    panelesContainer.style.fontSize = ajustes.tamanoInterface + "px"; 
    panelEstado.style.fontSize = ajustes.tamanoInterface + "px";
  });
  
  btnInterfaceMas.addEventListener("click", () => {
    ajustes.tamanoInterface = Math.min(32, ajustes.tamanoInterface + 1);
    tamanoInterface.textContent = ajustes.tamanoInterface + "px";
    barraSuperior.style.fontSize =    ajustes.tamanoInterface + "px"; 
    panelesContainer.style.fontSize = ajustes.tamanoInterface + "px"; 
    panelEstado.style.fontSize = ajustes.tamanoInterface + "px";
  });
  
  temaSelect.addEventListener("change", () => {
    ponerColoresSolo();
  });

  colorTextoInput.addEventListener("input", () => {
    ajustes.colorTexto = colorTextoInput.value;
    contenido.style.color = ajustes.colorTexto;
    temaSelect.value = "usuario"; 
    ajustes.tema = "usuario";
  });
  
  colorFondoInput.addEventListener("input", () => {
    ajustes.colorFondo = colorFondoInput.value;
    contenido.style.background = ajustes.colorFondo;
    estado.style.background = ajustes.colorFondo;
    temaSelect.value = "usuario"; 
    ajustes.tema = "usuario";
  });

  btnTextoMenos.addEventListener("click", () => {
    ajustes.tamanoFont = Math.max(14, ajustes.tamanoFont - 2);
    tamanoFont.textContent = ajustes.tamanoFont + "px";
    contenido.style.fontSize = ajustes.tamanoFont + "px"; 
  });
  
  btnTextoMas.addEventListener("click", () => {
    ajustes.tamanoFont = Math.min(60, ajustes.tamanoFont + 2);
    tamanoFont.textContent = ajustes.tamanoFont + "px";
    contenido.style.fontSize = ajustes.tamanoFont + "px"; 
  });
  
  tipoLetraSelect.addEventListener("change", () => {
    ajustes.tipoLetra = tipoLetraSelect.value;
    contenido.style.fontFamily = fuentesCSS[ajustes.tipoLetra];
  });

  btnRestablecer.addEventListener("click", () => {
    cargarAjustesdeFabrica();
    aplicarAjustes();
  });
  
  btnBorrarCache.addEventListener("click", async () => {
    const ok = confirm(Traducir[ajustes.idioma]["traduce_confirm1"]);
    if (!ok) return;
    
    if (window.gFunc && typeof window.gFunc.borrarCacheArchivos === "function") {
      window.gFunc.setEstado(Traducir[ajustes.idioma]["traduce_estado1"]);
      await window.gFunc.borrarCacheArchivos();
      
      // Borrar también las posiciones de lectura guardadas
      localStorage.removeItem("posiciones_lectura");
      
      alert(Traducir[ajustes.idioma]["traduce_alert1"]);
      
      btnBorrarCache.textContent = Traducir[ajustes.idioma]["traduce_ajus_id_btn_borrar_cache"];
    }
  });
  
  panelAjustesTitulo.textContent = Traducir[ajustes.idioma]["traduce_ajus_titulo"] + ajustes.version; 
}
