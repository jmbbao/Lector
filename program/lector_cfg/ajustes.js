const contenidoDiv = document.getElementById("contenido");
const temaSelect = document.getElementById("tema-select");
const colorFondoInput = document.getElementById("color-fondo");
const colorTextoInput = document.getElementById("color-texto");
const btnTextoMas = document.getElementById("texto-mas");
const btnTextoMenos = document.getElementById("texto-menos");
const tamanoActualSpan = document.getElementById("tamano-actual");
const tipoLetraSelect = document.getElementById("tipo-letra");
const btnRestablecer = document.getElementById("restablecer-ajustes");
const btnBorrarCache = document.getElementById("btn-borrar-cache");

const CLAVE_AJUSTES = "lector_ajustes";

let ajustes = {
  tema: "oscuro",
  colorFondo: "#000000",
  colorTexto: "#f0f0f0",
  tamanoTexto: 18,
  tipoLetra: "normal"
};

function aplicarAjustes() {
  document.body.classList.toggle("tema-claro", ajustes.tema === "claro");

  document.documentElement.style.setProperty("--fondo", ajustes.colorFondo);
  document.documentElement.style.setProperty("--texto", ajustes.colorTexto);
  document.documentElement.style.setProperty("--tamano-texto", ajustes.tamanoTexto + " px");
  document.documentElement.style.setProperty(
    "--fuente-contenido",
    ajustes.tipoLetra === "mono" ? '"Courier New", monospace' : 'system-ui, sans-serif'
  );

  temaSelect.value = ajustes.tema;
  colorFondoInput.value = ajustes.colorFondo;
  colorTextoInput.value = ajustes.colorTexto;
  tipoLetraSelect.value = ajustes.tipoLetra;
  tamanoActualSpan.textContent = ajustes.tamanoTexto + "px";
}

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

function inicializarAjustes() {
  cargarAjustes();
  aplicarAjustes();

  temaSelect.addEventListener("change", () => {
    ajustes.tema = temaSelect.value;
    aplicarAjustes();
    guardarAjustes();
  });

  colorFondoInput.addEventListener("input", () => {
    ajustes.colorFondo = colorFondoInput.value;
    aplicarAjustes();
    guardarAjustes();
  });

  colorTextoInput.addEventListener("input", () => {
    ajustes.colorTexto = colorTextoInput.value;
    aplicarAjustes();
    guardarAjustes();
  });

  btnTextoMas.addEventListener("click", () => {
    ajustes.tamanoTexto = Math.min(40, ajustes.tamanoTexto + 2);
    aplicarAjustes();
    guardarAjustes();
  });

  btnTextoMenos.addEventListener("click", () => {
    ajustes.tamanoTexto = Math.max(10, ajustes.tamanoTexto - 2);
    aplicarAjustes();
    guardarAjustes();
  });

  tipoLetraSelect.addEventListener("change", () => {
    ajustes.tipoLetra = tipoLetraSelect.value;
    aplicarAjustes();
    guardarAjustes();
  });

  btnRestablecer.addEventListener("click", () => {
    ajustes = {
      tema: "oscuro",
      colorFondo: "#000000",
      colorTexto: "#f0f0f0",
      tamanoTexto: 16,
      tipoLetra: "mono"
    };
    aplicarAjustes();
    guardarAjustes();
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

