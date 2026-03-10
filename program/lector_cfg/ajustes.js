"use strict";

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
const varCSS = getComputedStyle(document.documentElement);

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
  tema:       varCSS.getPropertyValue("--val_fabrica_tema").trim(),
  colorTexto: varCSS.getPropertyValue("--val_fabrica_texto").trim(),  
  colorFondo: varCSS.getPropertyValue("--val_fabrica_fondo").trim(),  
  tipoLetra:  varCSS.getPropertyValue("--val_fabrica_font").trim(), 
  tamanoFont:      parseInt(varCSS.getPropertyValue("--val_fabrica_tamano"), 10),
  tamanoInterface: parseInt(varCSS.getPropertyValue("--val_fabrica_interface"), 10)
};


function cargarAjustes() {
  const guardado = localStorage.getItem(CLAVE_AJUSTES);
  if (guardado) {
    try {
      const obj = JSON.parse(guardado);
      ajustes = { ...ajustes, ...obj };
    } 
    catch { // ignorar errores
    }
  }
}

function guardarAjustes() {
  localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
  //console.log("LOG: Ajustes guardados en CLAVE_AJUSTES");
}

function ponerColoresSolo() {
  ajustes.tema = temaSelect.value;
	
  if (ajustes.tema === "claro") { 
    document.documentElement.style.setProperty("--contenido_texto", "#000000");
    document.documentElement.style.setProperty("--contenido_fondo", "#ffffff"); 
  }

  if (ajustes.tema === "oscuro") {
    document.documentElement.style.setProperty("--contenido_texto", "#ffffff");
    document.documentElement.style.setProperty("--contenido_fondo", "#000000"); 
  }

  if (ajustes.tema === "usuario") {
    ajustes.colorTexto = colorTextoInput.value;
    ajustes.colorFondo = colorFondoInput.value;  
    document.documentElement.style.setProperty("--contenido_texto", ajustes.colorTexto);
    document.documentElement.style.setProperty("--contenido_fondo", ajustes.colorFondo); 
  }
}
	
function aplicarAjustes() {
  temaSelect.value = ajustes.tema;
  colorTextoInput.value = ajustes.colorTexto;
  colorFondoInput.value = ajustes.colorFondo;
  tipoLetraSelect.value = ajustes.tipoLetra;
  tamanoFont.textContent = ajustes.tamanoFont + "px";
  tamanoInterface.textContent = ajustes.tamanoInterface + "px";
  
  //Se llama también desde addEventListener("change") y solo debe hacer colores
  ponerColoresSolo(); 
  //Poner fuente y tamaño
  document.documentElement.style.setProperty("--contenido_font", fuentesCSS[ajustes.tipoLetra]);
  document.documentElement.style.setProperty("--contenido_tamano", ajustes.tamanoFont + "px");
  //Poner tamaño interface
  document.documentElement.style.setProperty("--interface_tamano", ajustes.tamanoInterface + "px");
}

function inicializarAjustes() {
  cargarAjustes();
  aplicarAjustes();

  btnInterfaceMenos.addEventListener("click", () => {
    ajustes.tamanoInterface = Math.max(8, ajustes.tamanoInterface - 1);
    tamanoInterface.textContent = ajustes.tamanoInterface + "px";
    document.documentElement.style.setProperty("--interface_tamano", ajustes.tamanoInterface + "px");
  });
  
  btnInterfaceMas.addEventListener("click", () => {
    ajustes.tamanoInterface = Math.min(36, ajustes.tamanoInterface + 1);
    tamanoInterface.textContent = ajustes.tamanoInterface + "px";
    document.documentElement.style.setProperty("--interface_tamano", ajustes.tamanoInterface + "px");
  });
  
  temaSelect.addEventListener("change", () => {
    ponerColoresSolo();
  });

  colorTextoInput.addEventListener("input", () => {
    ajustes.colorTexto = colorTextoInput.value;
    document.documentElement.style.setProperty("--contenido_texto", ajustes.colorTexto);
    temaSelect.value = "usuario"; 
    ajustes.tema = "usuario";
  });
  
  colorFondoInput.addEventListener("input", () => {
    ajustes.colorFondo = colorFondoInput.value;
    document.documentElement.style.setProperty("--contenido_fondo", ajustes.colorFondo); 
    temaSelect.value = "usuario"; 
    ajustes.tema = "usuario";
  });

  btnTextoMenos.addEventListener("click", () => {
    ajustes.tamanoFont = Math.max(14, ajustes.tamanoFont - 2);
    tamanoFont.textContent = ajustes.tamanoFont + "px";
    document.documentElement.style.setProperty("--contenido_tamano", ajustes.tamanoFont + "px");
  });
  
  btnTextoMas.addEventListener("click", () => {
    ajustes.tamanoFont = Math.min(60, ajustes.tamanoFont + 2);
    tamanoFont.textContent = ajustes.tamanoFont + "px";
    document.documentElement.style.setProperty("--contenido_tamano", ajustes.tamanoFont + "px");
  });
  
  tipoLetraSelect.addEventListener("change", () => {
    ajustes.tipoLetra = tipoLetraSelect.value;
    document.documentElement.style.setProperty("--contenido_font", fuentesCSS[ajustes.tipoLetra]);
  });

  btnRestablecer.addEventListener("click", () => {
    ajustes.tema =       varCSS.getPropertyValue("--val_fabrica_tema").trim(); 
    ajustes.colorTexto = varCSS.getPropertyValue("--val_fabrica_texto").trim();  
    ajustes.colorFondo = varCSS.getPropertyValue("--val_fabrica_fondo").trim();
    ajustes.tipoLetra =  varCSS.getPropertyValue("--val_fabrica_font").trim();    
    ajustes.tamanoFont =      parseInt(varCSS.getPropertyValue("--val_fabrica_tamano"), 10);
    ajustes.tamanoInterface = parseInt(varCSS.getPropertyValue("--val_fabrica_interface"), 10);
    
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
