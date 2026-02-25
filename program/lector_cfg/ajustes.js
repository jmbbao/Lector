const contenidoDiv = document.getElementById("id_contenido");
const temaSelect = document.getElementById("id_tema-select");
const colorFondoInput = document.getElementById("id_color-fondo");
const colorTextoInput = document.getElementById("id_color-texto");
const tamanoActualSpan = document.getElementById("id_tamano-actual");
const btnTextoMenos = document.getElementById("id_texto-menos");
const btnTextoMas = document.getElementById("id_texto-mas");
const tipoLetraSelect = document.getElementById("id_tipo-letra");
const btnRestablecer = document.getElementById("id_restablecer-ajustes");
const btnBorrarCache = document.getElementById("id_btn-borrar-cache");

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
  tema: "oscuro",        // claro, oscuro
  colorFondo: "#000000",
  colorTexto: "#f0f0f0",
  tamanoTexto: 18,
  tipoLetra: "verdana"    // normal, mono
};

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

function guardarAjustes() {
  localStorage.setItem(CLAVE_AJUSTES, JSON.stringify(ajustes));
}

function aplicarAjustes() {
  document.body.classList.toggle("tema-claro", ajustes.tema === "claro");

  document.documentElement.style.setProperty("--texto-fondo", ajustes.colorFondo);
  document.documentElement.style.setProperty("--texto-color", ajustes.colorTexto);
  document.documentElement.style.setProperty("--texto-tamano", ajustes.tamanoTexto + "px");
  //document.documentElement.style.setProperty("--texto-font",
  //  ajustes.tipoLetra === "mono" ? '"Courier New", monospace' : 'system-ui, sans-serif'
  //);
  document.documentElement.style.setProperty("--texto-font", fuentesCSS[ajustes.tipoLetra]);

  temaSelect.value = ajustes.tema;
  colorFondoInput.value = ajustes.colorFondo;
  colorTextoInput.value = ajustes.colorTexto;
  tipoLetraSelect.value = ajustes.tipoLetra;
  tamanoActualSpan.textContent = ajustes.tamanoTexto + "px";
}

function inicializarAjustes() {
  cargarAjustes();
  aplicarAjustes();

  temaSelect.addEventListener("change", () => {
    ajustes.tema = temaSelect.value;
    aplicarAjustes();
    //guardarAjustes();
  });

  colorFondoInput.addEventListener("input", () => {
    ajustes.colorFondo = colorFondoInput.value;
    aplicarAjustes();
    //guardarAjustes();
  });

  colorTextoInput.addEventListener("input", () => {
    ajustes.colorTexto = colorTextoInput.value;
    aplicarAjustes();
    //guardarAjustes();
  });

  btnTextoMas.addEventListener("click", () => {
    ajustes.tamanoTexto = Math.min(40, ajustes.tamanoTexto + 2);
    aplicarAjustes();
    //guardarAjustes();
  });

  btnTextoMenos.addEventListener("click", () => {
    ajustes.tamanoTexto = Math.max(10, ajustes.tamanoTexto - 2);
    aplicarAjustes();
    //guardarAjustes();
  });

  tipoLetraSelect.addEventListener("change", () => {
    ajustes.tipoLetra = tipoLetraSelect.value;
    aplicarAjustes();
    //guardarAjustes();
  });

  btnRestablecer.addEventListener("click", () => {
    ajustes = {
      tema: "oscuro",
      colorFondo: "#000000",
      colorTexto: "#f0f0f0",
      tamanoTexto: 18,
      tipoLetra: "mono"
    };
    aplicarAjustes();
    //guardarAjustes();
  });
  
  if (btnBorrarCache) {
    btnBorrarCache.addEventListener("click", async () => {
        const ok = confirm("¿Seguro que quieres borrar la caché de archivos?\nSe volverán a descargar la próxima vez.");
        if (!ok) return;
        if (window._lector && typeof window._lector.borrarCacheArchivos === "function") {
          await window._lector.borrarCacheArchivos();
          alert("Caché de archivos borrada.");
        }
    });
  }
}
