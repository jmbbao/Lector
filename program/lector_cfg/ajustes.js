const temaSelect = document.getElementById("id_tema_select");
const colorTextoInput = document.getElementById("id_color_texto");
const colorFondoInput = document.getElementById("id_color_fondo");
const tipoLetraSelect = document.getElementById("id_tipo_letra");
const btnTextoMenos = document.getElementById("id_texto_menos");
const tamanoFont = document.getElementById("id_tamano_font");
const btnTextoMas = document.getElementById("id_texto_mas");
const btnRestablecer = document.getElementById("id_btn_restablecer_ajustes");
const btnBorrarCache = document.getElementById("id_btn_borrar_cache");

const fuentesCSS = {
  "arial":   'Arial, sans-serif',
  "calibri": 'Calibri, sans-serif',
  "courier": '"Courier New", monospace',
  "georgia": 'Georgia, serif',  
  "roboto":  'Roboto, sans-serif',
  "times":   '"Times New Roman", serif',  
  "ubuntu":  '"Ubuntu", sans-serif',  
  "verdana": 'Verdana, sans-serif'
};

const CLAVE_AJUSTES = "lector_ajustes";

let ajustes = {
  tema:       "oscuro",        // oscuro
  colorTexto: "#ffffff",
  colorFondo: "#000000",
  tamanoFont: 24,
  tipoLetra:  "calibri"    // normal, mono
};


function guardarAjustes() {
  localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
}

function cargarAjustes() {
  const guardado = localStorage.getItem(CLAVE_AJUSTES);
  if (guardado) {
    try {
      const obj = JSON.parse(guardado);
      ajustes = { ...ajustes, ...obj };
    } catch {
      // ignorar errores
    }
  }
}

function aplicarAjustes() {
  document.documentElement.style.setProperty("--contenido_texto", ajustes.colorTexto);
  document.documentElement.style.setProperty("--contenido_fondo", ajustes.colorFondo);  
  document.documentElement.style.setProperty("--contenido_tamano", ajustes.tamanoFont + "px");
  document.documentElement.style.setProperty("--contenido_font", fuentesCSS[ajustes.tipoLetra]);
  
  temaSelect.value = ajustes.tema;
  colorTextoInput.value = ajustes.colorTexto;
  colorFondoInput.value = ajustes.colorFondo;
  tamanoFont.textContent = ajustes.tamanoFont + "px";
  tipoLetraSelect.value = ajustes.tipoLetra;
}

function inicializarAjustes() {
  cargarAjustes();
  aplicarAjustes();

  temaSelect.addEventListener("change", () => {
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
  });

  colorTextoInput.addEventListener("input", () => {
    ajustes.colorTexto = colorTextoInput.value;
    document.documentElement.style.setProperty("--contenido_texto", ajustes.colorTexto);
    temaSelect.value = "usuario";
  });
  
  colorFondoInput.addEventListener("input", () => {
    ajustes.colorFondo = colorFondoInput.value;
    document.documentElement.style.setProperty("--contenido_fondo", ajustes.colorFondo); 
    temaSelect.value = "usuario";
  });

  btnTextoMas.addEventListener("click", () => {
    ajustes.tamanoFont = Math.min(40, ajustes.tamanoFont + 2);
    tamanoFont.textContent = ajustes.tamanoFont + "px";
    document.documentElement.style.setProperty("--contenido_tamano", ajustes.tamanoFont + "px");
  });

  btnTextoMenos.addEventListener("click", () => {
    ajustes.tamanoFont = Math.max(10, ajustes.tamanoFont - 2);
    tamanoFont.textContent = ajustes.tamanoFont + "px";
    document.documentElement.style.setProperty("--contenido_tamano", ajustes.tamanoFont + "px");
  });

  tipoLetraSelect.addEventListener("change", () => {
    ajustes.tipoLetra = tipoLetraSelect.value;
    document.documentElement.style.setProperty("--contenido_font", fuentesCSS[ajustes.tipoLetra]);
  });

  btnRestablecer.addEventListener("click", () => {
    ajustes = {
      tema:       "oscuro",
      colorTexto: "#ffffff",      
      colorFondo: "#000000",
      tamanoFont: 24,
      tipoLetra:  "calibri"
    };
    aplicarAjustes();
  });
  
  if (btnBorrarCache) {
    btnBorrarCache.addEventListener("click", async () => {
        const ok = confirm("¿Eliminar los archivos de texto almacenados en el navegador?\nSe volverán a descargar la próxima vez.");
        if (!ok) return;
        
        if (window._lector && typeof window._lector.borrarCacheArchivos === "function") {
          await window._lector.borrarCacheArchivos();
          
          // Borrar también las posiciones de lectura guardadas
          localStorage.removeItem("posiciones_lectura");
          
          alert("Caché de archivos y posiciones de lectura borradas.");
        }
    });
  }
}
