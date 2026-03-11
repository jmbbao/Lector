"use strict";

const barraSuperior = document.getElementById("id_barra_superior");
const panelesContainer = document.getElementById("id_paneles_container");
const panelEstado = document.getElementById("id_panel_estado");
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
  tamanoInterface: 2,  
  tema:        "oscuro",           
  colorTexto:  "#ffffff",    
  colorFondo:  "#000000", 
  tipoLetra:   "arial",   
  tamanoFont:  2
};

function cargarAjustesdeFabrica() {
  const varCSS = getComputedStyle(document.documentElement);
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

function aplicarAjustes() {
  //Rellenar valores en el panel
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
    const ok = confirm("¿Eliminar los archivos de texto almacenados en el navegador?\nSe volverán a descargar la próxima vez.");
    if (!ok) return;
    
    if (window.gFunc && typeof window.gFunc.borrarCacheArchivos === "function") {
      window.gFunc.setEstado("BORRANDO LOS ARCHIVOS DE TEXTO GUARDADOS EN LA CACHE DEL NAVEGADOR. ESPERA UN MOMENTO...");
      await window.gFunc.borrarCacheArchivos();
      
      // Borrar también las posiciones de lectura guardadas
      localStorage.removeItem("posiciones_lectura");
      
      alert("Caché de archivos y posiciones de lectura borradas.");
      
      btnBorrarCache.textContent = "ELIMINAR LOS ARCHIVOS DE TEXTO";
    }
  });
}
