/* EDITOR VISUAL - TIC EXPERIENCE */

const CLAVE_GUARDADO = "proyectoTIC";

const cajaLienzo = document.getElementById("cajaLienzo");
const mensajeSeleccion = document.getElementById("mensajeSeleccion");
const etiquetaTamano = document.getElementById("etiquetaTamano");
const botonBorrar = document.getElementById("botonBorrar");
const botonGuardar = document.getElementById("botonGuardar");
const botonRevision = document.getElementById("botonRevision");
const ventanaConfirmacion = document.getElementById("ventanaConfirmacion");
const ventanaTitulo = document.getElementById("ventanaTitulo");
const ventanaTexto = document.getElementById("ventanaTexto");
const ventanaAceptar = document.getElementById("ventanaAceptar");
const ventanaRechazar = document.getElementById("ventanaRechazar");
const botonSubirArchivo = document.getElementById("botonSubirArchivo");
const subirPropiedad = document.getElementById("subirPropiedad");

let elementoSeleccionado = null;
let accionPendiente = null;

const PROPIEDADES_POR_TIPO = {
    texto: ["contenido", "tamano", "tipografia", "grosor", "color", "formato", "alinear"],
    imagen: ["subir", "tamano", "alinear"],
    video: ["subir", "tamano", "alinear"],
    divisor: ["color"],
    contenedor: [],
    fila: [],
    columna: []
};

const ALINEACIONES = {
    izquierda: "left",
    centro: "center",
    derecha: "right",
    justificar: "justify"
};

const ALINEACIONES_INVERSO = {
    left: "izquierda",
    center: "centro",
    right: "derecha",
    justify: "justificar"
};

/* Para imagen/video: la alineación se hace con márgenes */
const ALINEACIONES_IMAGEN = {
    izquierda: "0 auto 0 0",
    centro: "0 auto",
    derecha: "0 0 0 auto",
    justificar: "0"
};

/* ---------- ARRANQUE ---------- */

document.addEventListener("DOMContentLoaded", () => {
    cargarProyecto();
    prepararHerramientas();
    prepararLienzo();
    prepararPanel();
    prepararBotonesPrincipales();
});

/* ---------- HERRAMIENTAS (panel izquierdo) ---------- */

function prepararHerramientas() {
    const herramientas = document.querySelectorAll(".herramienta[draggable='true']");

    herramientas.forEach((herramienta) => {
        herramienta.addEventListener("dragstart", (evento) => {
            evento.dataTransfer.setData("text/plain", herramienta.dataset.tipo);
            evento.dataTransfer.effectAllowed = "copy";
        });
    });
}

/* ---------- LIENZO ---------- */

function prepararLienzo() {
    cajaLienzo.addEventListener("dragover", (evento) => {
        evento.preventDefault();
        const zona = zonaDeDrop(evento);
        if (zona) zona.classList.add("arrastrando-encima");
    });

    cajaLienzo.addEventListener("dragleave", (evento) => {
        const zona = zonaDeDrop(evento);
        if (zona) zona.classList.remove("arrastrando-encima");
    });

    cajaLienzo.addEventListener("drop", (evento) => {
        evento.preventDefault();
        const zona = zonaDeDrop(evento);
        if (!zona) return;
        zona.classList.remove("arrastrando-encima");

        const tipo = evento.dataTransfer.getData("text/plain");
        if (!tipo) return;

        const archivo = evento.dataTransfer.files && evento.dataTransfer.files[0];
        const elemento = crearElemento(tipo, archivo);
        if (!elemento) return;

        zona.appendChild(elemento);
        seleccionarElemento(elemento);
    });

    cajaLienzo.addEventListener("click", (evento) => {
        const objetivo = evento.target.closest("[data-tipo]");
        if (objetivo && cajaLienzo.contains(objetivo)) {
            seleccionarElemento(objetivo);
            if (objetivo.classList.contains("sin-archivo")) {
                subirPropiedad.click();
            }
        } else {
            deseleccionar();
        }
    });
}

function zonaDeDrop(evento) {
    return evento.target.closest(".contenedor-editor, .fila-editor, .columna-editor") || cajaLienzo;
}

function crearElemento(tipo, archivo) {
    let elemento = null;

    if (tipo === "texto") {
        elemento = document.createElement("p");
        elemento.className = "texto-editor elemento";
        elemento.textContent = "Nuevo texto";
    }

    if (tipo === "imagen") {
        elemento = document.createElement("div");
        elemento.className = "imagen-editor sin-archivo elemento";
    }

    if (tipo === "video") {
        elemento = document.createElement("div");
        elemento.className = "video-editor sin-archivo elemento";
    }

    if (tipo === "divisor") {
        elemento = document.createElement("hr");
        elemento.className = "divisor-editor elemento";
    }

    if (tipo === "contenedor") {
        elemento = document.createElement("div");
        elemento.className = "contenedor-editor elemento";
    }

    if (tipo === "fila") {
        elemento = document.createElement("div");
        elemento.className = "fila-editor elemento";
    }

    if (tipo === "columna") {
        elemento = document.createElement("div");
        elemento.className = "columna-editor elemento";
    }

    if (!elemento) return null;

    elemento.dataset.tipo = tipo;

    if (archivo) {
        cargarArchivoEnElemento(elemento, archivo);
    }

    return elemento;
}

function cargarArchivoEnElemento(elemento, archivo) {
    if (!archivo) return;
    const esImagen = archivo.type.startsWith("image/");
    const esVideo = archivo.type.startsWith("video/");
    if (!esImagen && !esVideo) return;

    const lector = new FileReader();
    lector.onload = () => {
        elemento.classList.remove("sin-archivo");
        if (esImagen) {
            elemento.innerHTML = "<img src='" + lector.result + "' alt='Imagen'>";
        } else {
            elemento.innerHTML = "<video src='" + lector.result + "' controls></video>";
        }
        if (elemento.style.width) {
            aplicarAncho(elemento, parseInt(elemento.style.width, 10));
        }
    };
    lector.readAsDataURL(archivo);
}

/* ---------- SELECCIÓN Y PANEL ---------- */

function seleccionarElemento(elemento) {
    if (elementoSeleccionado) {
        elementoSeleccionado.classList.remove("seleccionado");
    }
    elementoSeleccionado = elemento;
    elemento.classList.add("seleccionado");
    mostrarPropiedades(elemento);
}

function deseleccionar() {
    if (elementoSeleccionado) {
        elementoSeleccionado.classList.remove("seleccionado");
    }
    elementoSeleccionado = null;
    mostrarMensajeSinSeleccion();
}

function mostrarMensajeSinSeleccion() {
    mensajeSeleccion.hidden = false;
    botonBorrar.hidden = true;
    document.querySelectorAll("[data-grupo]").forEach((grupo) => {
        grupo.hidden = true;
    });
}

/* Devuelve la alineación actual de un elemento (texto o imagen/video) */
function alineacionActual(elemento) {
    const tipo = elemento.dataset.tipo;

    if (tipo === "imagen" || tipo === "video") {
        const estilos = window.getComputedStyle(elemento);
        const izq = estilos.marginLeft;
        const der = estilos.marginRight;

        if (izq === "auto" && der === "auto") return "centro";
        if (der === "auto") return "izquierda";
        if (izq === "auto") return "derecha";
        if (parseInt(izq, 10) === 0 && parseInt(der, 10) === 0 && elemento.style.margin) return "justificar";
        return "";
    }

    return ALINEACIONES_INVERSO[elemento.style.textAlign] || "";
}

function mostrarPropiedades(elemento) {
    const tipo = elemento.dataset.tipo;
    const propiedades = PROPIEDADES_POR_TIPO[tipo] || [];

    mensajeSeleccion.hidden = true;
    document.querySelectorAll("[data-grupo]").forEach((grupo) => {
        grupo.hidden = !propiedades.includes(grupo.dataset.grupo);
    });

    botonBorrar.hidden = false;

    if (tipo === "imagen" || tipo === "video") {
        etiquetaTamano.textContent = "Ancho (px)";
    } else {
        etiquetaTamano.textContent = "Tamaño (px)";
    }

    const alineacion = alineacionActual(elemento);
    document.querySelectorAll(".boton-alinear").forEach((boton) => {
        boton.classList.toggle("activo", boton.dataset.alinear === alineacion);
    });

    if (propiedades.includes("contenido")) {
        document.getElementById("propiedadContenido").value = elemento.textContent;
    }
    if (propiedades.includes("tamano")) {
        if (tipo === "imagen" || tipo === "video") {
            document.getElementById("propiedadTamano").value =
                elemento.style.width ? parseInt(elemento.style.width, 10) : "";
        } else {
            document.getElementById("propiedadTamano").value =
                parseInt(window.getComputedStyle(elemento).fontSize, 10);
        }
    }
    if (propiedades.includes("color")) {
        document.getElementById("propiedadColor").value = rgbAHex(window.getComputedStyle(elemento).color);
    }
}

function aplicarAncho(elemento, anchoPx) {
    if (!anchoPx || anchoPx < 20) {
        elemento.style.width = "";
    } else {
        elemento.style.width = anchoPx + "px";
    }
}

function rgbAHex(color) {
    const valores = color.match(/\d+/g);
    if (!valores || valores.length < 3) return "#ffffff";
    return "#" + valores.slice(0, 3).map((v) => parseInt(v, 10).toString(16).padStart(2, "0")).join("");
}

function prepararPanel() {
    const propiedadContenido = document.getElementById("propiedadContenido");
    const propiedadTamano = document.getElementById("propiedadTamano");
    const propiedadTipografia = document.getElementById("propiedadTipografia");
    const propiedadGrosor = document.getElementById("propiedadGrosor");
    const propiedadColor = document.getElementById("propiedadColor");

    propiedadContenido.addEventListener("input", () => {
        if (elementoSeleccionado && elementoSeleccionado.dataset.tipo === "texto") {
            elementoSeleccionado.textContent = propiedadContenido.value;
        }
    });

    propiedadTamano.addEventListener("input", () => {
        if (!elementoSeleccionado) return;
        const tipo = elementoSeleccionado.dataset.tipo;
        if (tipo === "imagen" || tipo === "video") {
            aplicarAncho(elementoSeleccionado, parseInt(propiedadTamano.value, 10));
        } else {
            elementoSeleccionado.style.fontSize = propiedadTamano.value + "px";
        }
    });

    propiedadTipografia.addEventListener("change", () => {
        if (elementoSeleccionado) {
            elementoSeleccionado.style.fontFamily = propiedadTipografia.value;
        }
    });

    propiedadGrosor.addEventListener("change", () => {
        if (elementoSeleccionado) {
            elementoSeleccionado.style.fontWeight = propiedadGrosor.value;
        }
    });

    propiedadColor.addEventListener("input", () => {
        if (elementoSeleccionado) {
            elementoSeleccionado.style.color = propiedadColor.value;
        }
    });

    document.querySelectorAll(".boton-formato").forEach((boton) => {
        boton.addEventListener("click", () => {
            if (!elementoSeleccionado) return;
            if (boton.dataset.formato === "italica") {
                elementoSeleccionado.style.fontStyle =
                    elementoSeleccionado.style.fontStyle === "italic" ? "normal" : "italic";
            }
            if (boton.dataset.formato === "subrayado") {
                elementoSeleccionado.style.textDecoration =
                    elementoSeleccionado.style.textDecoration === "underline" ? "none" : "underline";
            }
        });
    });

    document.querySelectorAll(".boton-alinear").forEach((boton) => {
        boton.addEventListener("click", () => {
            if (!elementoSeleccionado) return;
            const tipo = elementoSeleccionado.dataset.tipo;

            if (tipo === "imagen" || tipo === "video") {
                elementoSeleccionado.style.margin = ALINEACIONES_IMAGEN[boton.dataset.alinear];
            } else {
                elementoSeleccionado.style.textAlign = ALINEACIONES[boton.dataset.alinear];
            }

            document.querySelectorAll(".boton-alinear").forEach((otro) => otro.classList.remove("activo"));
            boton.classList.add("activo");
        });
    });

    botonSubirArchivo.addEventListener("click", () => subirPropiedad.click());

    subirPropiedad.addEventListener("change", () => {
        if (elementoSeleccionado && subirPropiedad.files[0]) {
            cargarArchivoEnElemento(elementoSeleccionado, subirPropiedad.files[0]);
        }
    });

    botonBorrar.addEventListener("click", () => {
        if (!elementoSeleccionado) return;
        const aBorrar = elementoSeleccionado;
        deseleccionar();
        aBorrar.remove();
    });
}

/* ---------- GUARDAR / REVISIÓN ---------- */

function prepararBotonesPrincipales() {
    botonGuardar.addEventListener("click", () =>
        abrirVentana("¿Estás seguro de que quieres guardar el proyecto?", "Los cambios se guardarán en tu navegador", "guardar"));
    botonRevision.addEventListener("click", () =>
        abrirVentana("¿Estás seguro de que quieres enviar el proyecto a revisión?", "Un administrador revisará tu proyecto", "revision"));
    ventanaRechazar.addEventListener("click", cerrarVentana);
    ventanaAceptar.addEventListener("click", ejecutarAccionPendiente);
}

function abrirVentana(titulo, texto, accion) {
    ventanaTitulo.textContent = titulo;
    ventanaTexto.textContent = texto;
    accionPendiente = accion;
    ventanaConfirmacion.hidden = false;
}

function abrirVentana(titulo, texto, accion) {
    ventanaTitulo.textContent = titulo;
    ventanaTexto.textContent = texto;
    accionPendiente = accion;
    ventanaConfirmacion.hidden = false;
}

function cerrarVentana() {
    ventanaConfirmacion.hidden = true;
    accionPendiente = null;
}

function ejecutarAccionPendiente() {
    if (accionPendiente === "guardar") {
        guardarProyecto();
    }
    if (accionPendiente === "revision") {
        guardarProyecto();
    }
    cerrarVentana();
}

function guardarProyecto() {
    if (elementoSeleccionado) {
        elementoSeleccionado.classList.remove("seleccionado");
    }
    localStorage.setItem(CLAVE_GUARDADO, cajaLienzo.innerHTML);
    if (elementoSeleccionado) {
        elementoSeleccionado.classList.add("seleccionado");
    }
}

function cargarProyecto() {
    const guardado = localStorage.getItem(CLAVE_GUARDADO);
    if (guardado) {
        cajaLienzo.innerHTML = guardado;
    }
}