const PROPIEDADES_POR_TIPO = {
    texto: ["contenido", "tamano", "tipografia", "grosor", "color", "formato", "alinear", "margin"],
    imagen: ["subir", "tamano", "alinear", "margin"],
    video: ["subir", "tamano", "alinear", "margin"],
    divisor: ["color", "margin"],
    contenedor: ["color", "radio", "margin", "padding"],
    fila: ["horizontal", "vertical", "margin", "padding"],
    columna: ["horizontal", "vertical", "margin", "padding"]
};

const TIPOS_VALIDOS = Object.keys(PROPIEDADES_POR_TIPO);

const ALINEACIONES = {
    izquierda: "left",
    centro: "center",
    derecha: "right",
    justificar: "justify"
};

const ALINEACIONES_INVERSO = {
    left: "izquierda",
    start: "izquierda",
    center: "centro",
    right: "derecha",
    justify: "justificar"
};

const ALINEACIONES_IMAGEN = {
    izquierda: "0 auto 0 0",
    centro: "0 auto",
    derecha: "0 0 0 auto",
    justificar: "0"
};

const TIPOGRAFIAS = {
    "Inter Regular": "Inter, sans-serif",
    "Arial": "Arial, sans-serif",
    "Georgia": "Georgia, serif",
    "Courier New": "'Courier New', monospace"
};

const SELECTOR_CONTENEDORES = ".caja-lienzo, .contenedor-editor, .fila-editor, .columna-editor";
const LIMITE_HISTORIAL = 50;

const cajaLienzo = document.getElementById("cajaLienzo");
const botonGuardar = document.getElementById("botonGuardar");
const botonRevision = document.getElementById("botonRevision");
const botonConfiguracion = document.getElementById("botonConfiguracion");
const ventanaConfirmacion = document.getElementById("ventanaConfirmacion");
const ventanaTitulo = document.getElementById("ventanaTitulo");
const ventanaTexto = document.getElementById("ventanaTexto");
const ventanaCampos = document.getElementById("ventanaCampos");
const ventanaAceptar = document.getElementById("ventanaAceptar");
const ventanaRechazar = document.getElementById("ventanaRechazar");
const mensajeSeleccion = document.getElementById("mensajeSeleccion");
const propiedadContenido = document.getElementById("propiedadContenido");
const propiedadTamano = document.getElementById("propiedadTamano");
const etiquetaTamano = document.getElementById("etiquetaTamano");
const propiedadTipografia = document.getElementById("propiedadTipografia");
const propiedadGrosor = document.getElementById("propiedadGrosor");
const propiedadColor = document.getElementById("propiedadColor");
const propiedadRadio = document.getElementById("propiedadRadio");
const propiedadAlineacionHorizontal = document.getElementById("propiedadAlineacionHorizontal");
const propiedadAlineacionVertical = document.getElementById("propiedadAlineacionVertical");
const propiedadMargen = document.getElementById("propiedadMargen");
const propiedadRelleno = document.getElementById("propiedadRelleno");
const botonSubirArchivo = document.getElementById("botonSubirArchivo");
const subirPropiedad = document.getElementById("subirPropiedad");
const botonBorrar = document.getElementById("botonBorrar");
const idProyecto = new URLSearchParams(window.location.search).get("id");
const token = localStorage.getItem("token");
let miniaturaProyecto = "";

let elementoSeleccionado = null;
let accionPendiente = null;
let elementoEnArrastre = null;
let contenedorResaltado = null;
let historial = [];
let edicionEnCurso = false;

function rgbAHex(color) {
    const partes = color.match(/\d+/g);
    if (!partes || partes.length < 3) return "#ffffff";
    if (partes.length >= 4 && Number(partes[3]) === 0) return "#ffffff";

    let hex = "#";
    for (let i = 0; i < 3; i++) {
        let valor = Number(partes[i]).toString(16);
        if (valor.length < 2) valor = "0" + valor;
        hex = hex + valor;
    }
    return hex;
}

function normalizarMargen(margen) {
    const partes = margen.split(" ").filter(Boolean);
    const arriba = partes[0];
    const derecha = partes[1] !== undefined ? partes[1] : arriba;
    const abajo = partes[2] !== undefined ? partes[2] : arriba;
    const izquierda = partes[3] !== undefined ? partes[3] : derecha;

    const lados = [arriba, derecha, abajo, izquierda];
    let resultado = "";
    for (let i = 0; i < lados.length; i++) {
        let lado = lados[i];
        if (lado !== "auto") lado = parseFloat(lado) + "";
        if (i > 0) resultado = resultado + " ";
        resultado = resultado + lado;
    }
    return resultado;
}

function guardarHistorial() {
    if (elementoSeleccionado) elementoSeleccionado.classList.remove("seleccionado");

    historial.push(JSON.stringify(crearDocumento()));
    if (historial.length > LIMITE_HISTORIAL) historial.shift();

    if (elementoSeleccionado) elementoSeleccionado.classList.add("seleccionado");
}

function deshacer() {
    if (historial.length === 0) return;

    deseleccionarElemento();
    const documento = JSON.parse(historial.pop());
    mostrarDocumento(documento);
    edicionEnCurso = false;
}

function marcarEdicion() {
    if (!edicionEnCurso) {
        guardarHistorial();
        edicionEnCurso = true;
    }
}

function terminarEdicion() {
    edicionEnCurso = false;
}

function actualizarClaseTamanoMedia(elemento) {
    if (elemento.dataset.tipo !== "imagen" && elemento.dataset.tipo !== "video") return;

    if (elemento.style.width) {
        elemento.classList.add("tamano-personalizado");
    } else {
        elemento.classList.remove("tamano-personalizado");
    }
}

function crearElemento(tipo, datos = {}) {
    const elemento = document.createElement(datos.tag || "div");
    elemento.classList.add("elemento");
    elemento.draggable = true;
    elemento.dataset.tipo = tipo;

    if (tipo === "texto") {
        elemento.classList.add("texto-editor");
        elemento.textContent = datos.contenido || "Nuevo texto";
    } else if (tipo === "imagen") {
        elemento.classList.add("imagen-editor", "sin-archivo");
        const imagen = document.createElement("img");
        imagen.alt = datos.alt || "Imagen";
        if (datos.src) imagen.src = datos.src;
        elemento.appendChild(imagen);
    } else if (tipo === "video") {
        elemento.classList.add("video-editor", "sin-archivo");
        const video = document.createElement("video");
        video.controls = true;
        if (datos.src) video.src = datos.src;
        elemento.appendChild(video);
    } else if (tipo === "divisor") {
        elemento.classList.add("divisor-editor");
    } else if (tipo === "contenedor") {
        elemento.classList.add("contenedor-editor");
    } else if (tipo === "fila") {
        elemento.classList.add("fila-editor");
        elemento.style.justifyContent = "flex-start";
        elemento.style.alignItems = "stretch";
    } else if (tipo === "columna") {
        elemento.classList.add("columna-editor");
        elemento.style.justifyContent = "flex-start";
        elemento.style.alignItems = "stretch";
    }

    if (datos.estilos && typeof datos.estilos === "object") {
        for (const propiedad in datos.estilos) {
            elemento.style.setProperty(propiedad, datos.estilos[propiedad]);
        }
    }

    actualizarClaseTamanoMedia(elemento);

    if (datos.tipografia) {
        elemento.dataset.tipografia = datos.tipografia;
    }

    if (Array.isArray(datos.hijos)) {
        for (const hijo of datos.hijos) {
            const elementoHijo = crearElementoDesdeDocumento(hijo);
            if (elementoHijo) elemento.appendChild(elementoHijo);
        }
    }

    if (datos.src) elemento.classList.remove("sin-archivo");
    return elemento;
}

function crearElementoDesdeDocumento(datos) {
    if (!datos || TIPOS_VALIDOS.indexOf(datos.tipo) === -1) return null;
    return crearElemento(datos.tipo, datos);
}

function estilosDelElemento(elemento) {
    const estilos = {};

    for (let i = 0; i < elemento.style.length; i++) {
        const propiedad = elemento.style[i];
        estilos[propiedad] = elemento.style.getPropertyValue(propiedad);
    }

    return estilos;
}

function crearDatosElemento(elemento) {
    const datos = {
        tipo: elemento.dataset.tipo,
        tag: elemento.tagName.toLowerCase(),
        estilos: estilosDelElemento(elemento),
        hijos: []
    };

    if (elemento.dataset.tipografia) {
        datos.tipografia = elemento.dataset.tipografia;
    }

    if (datos.tipo === "texto") {
        datos.contenido = elemento.textContent;
    }

    if (datos.tipo === "imagen" || datos.tipo === "video") {
        const archivo = elemento.querySelector(datos.tipo === "imagen" ? "img" : "video");
        if (archivo) {
            datos.src = archivo.getAttribute("src") || "";
            datos.alt = archivo.getAttribute("alt") || "";
        }
    }

    for (let i = 0; i < elemento.children.length; i++) {
        const hijo = elemento.children[i];
        if (hijo.classList.contains("elemento")) {
            datos.hijos.push(crearDatosElemento(hijo));
        }
    }

    return datos;
}

function crearDocumento() {
    const documento = {
        version: 1,
        elementos: []
    };

    for (let i = 0; i < cajaLienzo.children.length; i++) {
        const elemento = cajaLienzo.children[i];
        if (elemento.classList.contains("elemento")) {
            documento.elementos.push(crearDatosElemento(elemento));
        }
    }

    return documento;
}

function mostrarDocumento(documento) {
    cajaLienzo.innerHTML = "";

    for (const datos of documento.elementos) {
        const elemento = crearElementoDesdeDocumento(datos);
        if (elemento) cajaLienzo.appendChild(elemento);
    }
}

function seleccionarElemento(elemento) {
    if (elementoSeleccionado === elemento) return;

    if (elementoSeleccionado) elementoSeleccionado.classList.remove("seleccionado");

    elementoSeleccionado = elemento;
    elementoSeleccionado.classList.add("seleccionado");
    refrescarPanelPropiedades();
}

function deseleccionarElemento() {
    if (elementoSeleccionado) elementoSeleccionado.classList.remove("seleccionado");

    elementoSeleccionado = null;
    refrescarPanelPropiedades();
}

function alineacionActual() {
    if (!elementoSeleccionado) return null;
    const tipo = elementoSeleccionado.dataset.tipo;

    if (tipo === "texto") {
        return ALINEACIONES_INVERSO[getComputedStyle(elementoSeleccionado).textAlign] || null;
    }

    if (tipo === "imagen" || tipo === "video") {
        if (!elementoSeleccionado.style.margin) return "izquierda";

        const margen = normalizarMargen(getComputedStyle(elementoSeleccionado).margin);
        for (const clave in ALINEACIONES_IMAGEN) {
            if (margen === normalizarMargen(ALINEACIONES_IMAGEN[clave])) return clave;
        }
    }

    return null;
}

function refrescarPanelPropiedades() {
    const grupos = document.querySelectorAll(".grupo-propiedad");
    let lista = [];

    if (elementoSeleccionado && PROPIEDADES_POR_TIPO[elementoSeleccionado.dataset.tipo]) {
        lista = PROPIEDADES_POR_TIPO[elementoSeleccionado.dataset.tipo];
    }

    for (let i = 0; i < grupos.length; i++) {
        grupos[i].hidden = lista.indexOf(grupos[i].dataset.grupo) === -1;
    }

    mensajeSeleccion.hidden = elementoSeleccionado !== null;

    if (!elementoSeleccionado) return;

    const tipo = elementoSeleccionado.dataset.tipo;
    const estilos = getComputedStyle(elementoSeleccionado);

    if (lista.indexOf("contenido") !== -1) {
        propiedadContenido.value = elementoSeleccionado.textContent;
    }

    if (lista.indexOf("tamano") !== -1) {
        if (tipo === "texto") {
            etiquetaTamano.textContent = "Tamaño (px)";
            propiedadTamano.value = parseInt(estilos.fontSize) || 16;
        } else {
            etiquetaTamano.textContent = "Ancho (px)";
            propiedadTamano.value = parseInt(elementoSeleccionado.style.width) || "";
        }
    }

    if (lista.indexOf("tipografia") !== -1) {
        propiedadTipografia.value = elementoSeleccionado.dataset.tipografia || "Inter Regular";
    }

    if (lista.indexOf("grosor") !== -1) {
        const peso = parseInt(estilos.fontWeight) || 400;
        if (peso <= 350) propiedadGrosor.value = "300";
        else if (peso <= 450) propiedadGrosor.value = "400";
        else if (peso <= 600) propiedadGrosor.value = "500";
        else propiedadGrosor.value = "700";
    }

    if (lista.indexOf("color") !== -1) {
        if (tipo === "texto") {
            propiedadColor.value = rgbAHex(estilos.color);
        } else if (tipo === "divisor") {
            propiedadColor.value = rgbAHex(estilos.backgroundColor);
        } else if (tipo === "contenedor") {
            propiedadColor.value = rgbAHex(estilos.backgroundColor);
        }
    }

    if (lista.indexOf("radio") !== -1) {
        propiedadRadio.value = parseInt(estilos.borderRadius) || 0;
    }

    if (lista.indexOf("margin") !== -1) {
        propiedadMargen.value = parseInt(estilos.marginTop) || 0;
    }

    if (lista.indexOf("padding") !== -1) {
        propiedadRelleno.value = parseInt(estilos.paddingTop) || 0;
    }

    if (lista.indexOf("horizontal") !== -1) {
        propiedadAlineacionHorizontal.value = elementoSeleccionado.dataset.tipo === "fila"
            ? estilos.justifyContent === "normal" ? "flex-start" : estilos.justifyContent
            : estilos.alignItems === "normal" ? "flex-start" : estilos.alignItems;
    }

    if (lista.indexOf("vertical") !== -1) {
        propiedadAlineacionVertical.value = elementoSeleccionado.dataset.tipo === "fila"
            ? estilos.alignItems === "normal" ? "stretch" : estilos.alignItems
            : estilos.justifyContent === "normal" ? "flex-start" : estilos.justifyContent;
    }

    const botonesFormato = document.querySelectorAll(".boton-formato");
    for (let i = 0; i < botonesFormato.length; i++) {
        const formato = botonesFormato[i].dataset.formato;
        let activo = false;

        if (formato === "negrita") activo = parseInt(estilos.fontWeight) >= 600;
        if (formato === "cursiva") activo = estilos.fontStyle === "italic";
        if (formato === "subrayado") activo = estilos.textDecorationLine.indexOf("underline") !== -1;

        if (activo) botonesFormato[i].classList.add("activo");
        else botonesFormato[i].classList.remove("activo");
    }

    const botonesAlinear = document.querySelectorAll(".boton-alinear");
    for (let i = 0; i < botonesAlinear.length; i++) {
        if (botonesAlinear[i].dataset.alinear === alineacionActual()) {
            botonesAlinear[i].classList.add("activo");
        } else {
            botonesAlinear[i].classList.remove("activo");
        }
    }
}

function hijosOrdenables(contenedor) {
    const hijos = [];
    for (let i = 0; i < contenedor.children.length; i++) {
        const hijo = contenedor.children[i];
        if (hijo.classList.contains("elemento") && hijo !== elementoEnArrastre) {
            hijos.push(hijo);
        }
    }
    return hijos;
}

function posicionSoltado(contenedor, x, y) {
    const horizontal = contenedor.classList.contains("fila-editor");
    const posicion = horizontal ? x : y;
    const hijos = hijosOrdenables(contenedor);

    for (let i = 0; i < hijos.length; i++) {
        const rect = hijos[i].getBoundingClientRect();
        let centro;
        if (horizontal) centro = rect.left + rect.width / 2;
        else centro = rect.top + rect.height / 2;

        if (posicion < centro) {
            return { referencia: hijos[i], antes: true };
        }
    }

    return { referencia: null, antes: false };
}

function soltarElemento(contenedor, elemento, x, y) {
    const pos = posicionSoltado(contenedor, x, y);

    if (pos.referencia && pos.antes) {
        contenedor.insertBefore(elemento, pos.referencia);
    } else if (pos.referencia) {
        contenedor.insertBefore(elemento, pos.referencia.nextSibling);
    } else {
        contenedor.appendChild(elemento);
    }
}

function limpiarMarcadores() {
    const marcados = document.querySelectorAll(".marcador-antes, .marcador-despues");
    for (let i = 0; i < marcados.length; i++) {
        marcados[i].classList.remove("marcador-antes", "marcador-despues");
    }
}

function marcarPosicion(contenedor, x, y) {
    limpiarMarcadores();

    const pos = posicionSoltado(contenedor, x, y);
    const hijos = hijosOrdenables(contenedor);

    if (pos.referencia) {
        if (pos.antes) pos.referencia.classList.add("marcador-antes");
        else pos.referencia.classList.add("marcador-despues");
    } else if (hijos.length > 0) {
        hijos[hijos.length - 1].classList.add("marcador-despues");
    }
}

function resaltarContenedor(contenedor) {
    if (contenedorResaltado && contenedorResaltado !== contenedor) {
        contenedorResaltado.classList.remove("zona-activa");
    }
    contenedor.classList.add("zona-activa");
    contenedorResaltado = contenedor;
}

function terminarArrastre() {
    if (elementoEnArrastre) {
        elementoEnArrastre.classList.remove("arrastrando");
        elementoEnArrastre = null;
    }
    limpiarMarcadores();
    if (contenedorResaltado) {
        contenedorResaltado.classList.remove("zona-activa");
        contenedorResaltado = null;
    }
}

document.addEventListener("dragstart", function (evento) {
    if (!evento.target.closest) return;

    const herramienta = evento.target.closest(".herramienta");
    if (herramienta && herramienta.dataset.tipo) {
        evento.dataTransfer.setData("text/plain", herramienta.dataset.tipo);
        evento.dataTransfer.effectAllowed = "copy";
        return;
    }

    const elemento = evento.target.closest(".elemento");
    if (elemento && cajaLienzo.contains(elemento)) {
        elementoEnArrastre = elemento;
        evento.dataTransfer.setData("text/mover-elemento", "true");
        evento.dataTransfer.effectAllowed = "move";
        elemento.classList.add("arrastrando");
    }
});

document.addEventListener("dragover", function (evento) {
    if (!evento.target.closest) return;

    const contenedor = evento.target.closest(SELECTOR_CONTENEDORES);

    if (elementoEnArrastre) {
        if (!contenedor) {
            limpiarMarcadores();
            return;
        }
        
        if (contenedor === elementoEnArrastre || elementoEnArrastre.contains(contenedor)) {
            return;
        }
        evento.preventDefault();
        evento.dataTransfer.dropEffect = "move";
        marcarPosicion(contenedor, evento.clientX, evento.clientY);
        return;
    }

    if (contenedor) {
        evento.preventDefault();
        evento.dataTransfer.dropEffect = "copy";
        resaltarContenedor(contenedor);
    }
});

document.addEventListener("dragleave", function (evento) {
    if (!evento.target.closest) return;

    const contenedor = evento.target.closest(SELECTOR_CONTENEDORES);
    if (contenedor) contenedor.classList.remove("zona-activa");
});

document.addEventListener("drop", function (evento) {
    if (!evento.target.closest) return;

    const contenedor = evento.target.closest(SELECTOR_CONTENEDORES);
    if (!contenedor) return;
    evento.preventDefault();

    if (elementoEnArrastre) {
        if (contenedor !== elementoEnArrastre && !elementoEnArrastre.contains(contenedor)) {
            guardarHistorial();
            soltarElemento(contenedor, elementoEnArrastre, evento.clientX, evento.clientY);
        }
        terminarArrastre();
        return;
    }

    const tipo = evento.dataTransfer.getData("text/plain");
    if (TIPOS_VALIDOS.indexOf(tipo) !== -1) {
        guardarHistorial();
        soltarElemento(contenedor, crearElemento(tipo), evento.clientX, evento.clientY);
    }

    terminarArrastre();
});

document.addEventListener("dragend", terminarArrastre);

cajaLienzo.addEventListener("click", function (evento) {
    const elemento = evento.target.closest(".elemento");
    if (elemento) seleccionarElemento(elemento);
    else deseleccionarElemento();
});

propiedadContenido.addEventListener("input", function () {
    if (!elementoSeleccionado || elementoSeleccionado.dataset.tipo !== "texto") return;

    marcarEdicion();
    elementoSeleccionado.textContent = propiedadContenido.value;
});

propiedadTamano.addEventListener("input", function () {
    if (!elementoSeleccionado) return;

    marcarEdicion();
    const valor = parseInt(propiedadTamano.value);
    const tipo = elementoSeleccionado.dataset.tipo;

    if (tipo === "texto") {
        elementoSeleccionado.style.fontSize = valor ? valor + "px" : "";
    } else if (tipo === "imagen" || tipo === "video") {
        elementoSeleccionado.style.width = valor ? valor + "px" : "";
        actualizarClaseTamanoMedia(elementoSeleccionado);
    }
});

propiedadTipografia.addEventListener("change", function () {
    if (!elementoSeleccionado) return;

    guardarHistorial();
    const nombre = propiedadTipografia.value;
    elementoSeleccionado.style.fontFamily = TIPOGRAFIAS[nombre] || nombre;
    elementoSeleccionado.dataset.tipografia = nombre;
});

propiedadGrosor.addEventListener("change", function () {
    if (!elementoSeleccionado) return;

    guardarHistorial();
    elementoSeleccionado.style.fontWeight = propiedadGrosor.value;
});

propiedadColor.addEventListener("input", function () {
    if (!elementoSeleccionado) return;

    marcarEdicion();
    const tipo = elementoSeleccionado.dataset.tipo;

    if (tipo === "texto") {
        elementoSeleccionado.style.color = propiedadColor.value;
    } else if (tipo === "divisor") {
        elementoSeleccionado.style.backgroundColor = propiedadColor.value;
    } else if (tipo === "contenedor") {
        elementoSeleccionado.style.backgroundColor = propiedadColor.value;
    }
});

propiedadRadio.addEventListener("input", function () {
    if (!elementoSeleccionado || elementoSeleccionado.dataset.tipo !== "contenedor") return;

    marcarEdicion();
    const valor = parseInt(propiedadRadio.value);
    elementoSeleccionado.style.borderRadius = valor >= 0 ? valor + "px" : "";
});

propiedadMargen.addEventListener("input", function () {
    if (!elementoSeleccionado) return;

    marcarEdicion();
    const valor = parseInt(propiedadMargen.value);
    elementoSeleccionado.style.margin = valor >= 0 ? valor + "px" : "";
});

propiedadRelleno.addEventListener("input", function () {
    if (!elementoSeleccionado) return;

    const tipo = elementoSeleccionado.dataset.tipo;
    if (tipo !== "contenedor" && tipo !== "fila" && tipo !== "columna") return;

    marcarEdicion();
    const valor = parseInt(propiedadRelleno.value);
    elementoSeleccionado.style.padding = valor >= 0 ? valor + "px" : "";
});


propiedadAlineacionHorizontal.addEventListener("change", function () {
    if (!elementoSeleccionado) return;

    const tipo = elementoSeleccionado.dataset.tipo;
    if (tipo !== "fila" && tipo !== "columna") return;

    guardarHistorial();
    if (tipo === "fila") {
        elementoSeleccionado.style.justifyContent = propiedadAlineacionHorizontal.value;
    } else {
        elementoSeleccionado.style.alignItems = propiedadAlineacionHorizontal.value;
    }
});

propiedadAlineacionVertical.addEventListener("change", function () {
    if (!elementoSeleccionado) return;

    const tipo = elementoSeleccionado.dataset.tipo;
    if (tipo !== "fila" && tipo !== "columna") return;

    guardarHistorial();
    if (tipo === "fila") {
        elementoSeleccionado.style.alignItems = propiedadAlineacionVertical.value;
    } else {
        elementoSeleccionado.style.justifyContent = propiedadAlineacionVertical.value;
    }
});

const botonesFormato = document.querySelectorAll(".boton-formato");
for (let i = 0; i < botonesFormato.length; i++) {
    botonesFormato[i].addEventListener("click", function () {
        if (!elementoSeleccionado) return;

        guardarHistorial();
        const formato = botonesFormato[i].dataset.formato;

        if (formato === "negrita") {
            const activo = getComputedStyle(elementoSeleccionado).fontWeight >= 600;
            elementoSeleccionado.style.fontWeight = activo ? "normal" : "bold";
        } else if (formato === "cursiva") {
            if (elementoSeleccionado.style.fontStyle === "italic") {
                elementoSeleccionado.style.fontStyle = "normal";
            } else {
                elementoSeleccionado.style.fontStyle = "italic";
            }
        } else if (formato === "subrayado") {
            if (elementoSeleccionado.style.textDecoration.indexOf("underline") !== -1) {
                elementoSeleccionado.style.textDecoration = "none";
            } else {
                elementoSeleccionado.style.textDecoration = "underline";
            }
        }

        refrescarPanelPropiedades();
    });
}

const botonesAlinear = document.querySelectorAll(".boton-alinear");
for (let i = 0; i < botonesAlinear.length; i++) {
    botonesAlinear[i].addEventListener("click", function () {
        if (!elementoSeleccionado) return;

        guardarHistorial();
        const alineacion = botonesAlinear[i].dataset.alinear;
        const tipo = elementoSeleccionado.dataset.tipo;

        if (tipo === "texto") {
            elementoSeleccionado.style.textAlign = ALINEACIONES[alineacion];
        } else if (tipo === "imagen" || tipo === "video") {
            elementoSeleccionado.style.margin = ALINEACIONES_IMAGEN[alineacion];
        }

        refrescarPanelPropiedades();
    });
}

const camposPanel = [
    propiedadContenido,
    propiedadTamano,
    propiedadTipografia,
    propiedadGrosor,
    propiedadColor,
    propiedadRadio,
    propiedadMargen,
    propiedadRelleno,
    propiedadAlineacionHorizontal,
    propiedadAlineacionVertical
];
for (let i = 0; i < camposPanel.length; i++) {
    camposPanel[i].addEventListener("change", terminarEdicion);
    camposPanel[i].addEventListener("blur", terminarEdicion);
}

botonSubirArchivo.addEventListener("click", function () {
    subirPropiedad.click();
});

subirPropiedad.addEventListener("change", function () {
    const archivo = subirPropiedad.files[0];
    if (archivo) cargarArchivoEnElemento(archivo);
    subirPropiedad.value = "";
});

async function cargarArchivoEnElemento(archivo) {
    if (!elementoSeleccionado) return;
    const tipo = elementoSeleccionado.dataset.tipo;
    if (tipo !== "imagen" && tipo !== "video") return;

    if (!idProyecto || !token) {
        alert("Necesitás abrir un proyecto y tener una sesión iniciada.");
        return;
    }

    const datos = new FormData();
    datos.append("file", archivo);

    try {
        const respuesta = await fetch(`${API_BASE_URL}/proyectos/${idProyecto}/media`, {
            method: "POST",
            headers: {
                Authorization: token
            },
            body: datos
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo subir el archivo.");
        }

        const textoRespuesta = await respuesta.text();
        let resultado = null;

        try {
            resultado = JSON.parse(textoRespuesta);
        } catch (error) {
            resultado = textoRespuesta;
        }

        let nombreArchivo = "";

        if (typeof resultado === "string") {
            nombreArchivo = resultado;
        } else if (resultado && resultado.file && resultado.file.filename) {
            nombreArchivo = resultado.file.filename;
        } else if (resultado && resultado.filename) {
            nombreArchivo = resultado.filename;
        } else if (resultado && resultado.archivo) {
            nombreArchivo = resultado.archivo;
        } else if (resultado && resultado.nombre) {
            nombreArchivo = resultado.nombre;
        } else if (resultado && resultado.miniatura) {
            nombreArchivo = resultado.miniatura;
        }

        const urlArchivo = nombreArchivo
            ? `${API_BASE_URL}/media/${nombreArchivo}`
            : URL.createObjectURL(archivo);

        if (tipo === "imagen") {
            const imagen = elementoSeleccionado.querySelector("img");
            if (imagen) imagen.src = urlArchivo;
        } else {
            const video = elementoSeleccionado.querySelector("video");
            if (video) {
                video.src = urlArchivo;
                video.load();
            }
        }

        elementoSeleccionado.classList.remove("sin-archivo");
    } catch (error) {
        console.error("Error al subir el archivo:", error);
        alert("No se pudo subir el archivo.");
    }
}

function borrarSeleccionado() {
    if (!elementoSeleccionado) return;

    guardarHistorial();
    elementoSeleccionado.remove();
    deseleccionarElemento();
}

botonBorrar.addEventListener("click", borrarSeleccionado);

document.addEventListener("keydown", function (evento) {
    const escribiendo = evento.target.closest && evento.target.closest("input, textarea, select");

    if (evento.key === "Escape") {
        if (!ventanaConfirmacion.hidden) cerrarVentana();
        else deseleccionarElemento();
        return;
    }

    if (escribiendo) return;

    if ((evento.ctrlKey || evento.metaKey) && evento.key.toLowerCase() === "z") {
        evento.preventDefault();
        deshacer();
        return;
    }

    if (evento.key === "Delete" || evento.key === "Backspace") {
        if (elementoSeleccionado) {
            evento.preventDefault();
            borrarSeleccionado();
        }
    }
});

function abrirVentana(titulo, texto, accion, campos = "", permitirAceptar = true) {
    ventanaConfirmacion.classList.toggle("ventana-configuracion", accion === "miniatura");
    ventanaAceptar.textContent = accion === "miniatura" ? "Hecho" : "Aceptar";
    ventanaRechazar.hidden = accion === "miniatura";
    ventanaTitulo.textContent = titulo;
    ventanaTexto.textContent = "";
    ventanaTexto.classList.remove("texto-error");
    if (texto.error) {
        ventanaTexto.textContent = texto.mensaje;
        ventanaTexto.classList.add("texto-error");
    } else {
        ventanaTexto.textContent = texto;
    }
    ventanaCampos.innerHTML = campos;
    accionPendiente = accion;
    ventanaAceptar.disabled = !permitirAceptar;
    ventanaConfirmacion.hidden = false;
}

function cerrarVentana() {
    ventanaConfirmacion.hidden = true;
    accionPendiente = null;
    ventanaConfirmacion.classList.remove("ventana-configuracion");
    ventanaAceptar.textContent = "Aceptar";
    ventanaRechazar.hidden = false;
    ventanaCampos.innerHTML = "";
    ventanaAceptar.disabled = false;
}

ventanaAceptar.addEventListener("click", async function () {
    if (!accionPendiente) return;

    try {
        await ejecutarAccionPendiente();
        cerrarVentana();
    } catch (error) {
        console.error("No se pudo completar la acción:", error);
        alert("No se pudo completar la acción.");
    }
});

ventanaRechazar.addEventListener("click", cerrarVentana);

botonConfiguracion.addEventListener("click", () => {
    abrirVentana(
        "Configuración del proyecto",
        "Subí la miniatura que se va a mostrar en las tarjetas del proyecto.",
        "miniatura",
        `<label class="campo-miniatura" for="archivoMiniatura">Miniatura</label>
         <input type="file" id="archivoMiniatura" accept="image/*">`
    );
});

async function ejecutarAccionPendiente() {
    if (accionPendiente === "revision") {
        const guardado = await guardarProyecto();
        if (guardado) {
            await enviarARevision();
        }
    } else if (accionPendiente === "miniatura") {
        const archivo = document.getElementById("archivoMiniatura").files[0];
        if (!archivo) {
            alert("Seleccioná una miniatura.");
            return;
        }

        const datos = new FormData();
        datos.append("file", archivo);
        const respuesta = await fetch(`${API_BASE_URL}/proyectos/${idProyecto}/miniatura`, {
            method: "POST",
            headers: { Authorization: token },
            body: datos
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo subir la miniatura.");
        }

        miniaturaProyecto = archivo.name;
        alert("Miniatura guardada.");
    }
}

async function cargarMiniaturaProyecto() {
    if (!idProyecto || !token) return;

    const respuesta = await fetch(`${API_BASE_URL}/proyectos/mios`, {
        cache: "no-store",
        headers: { Authorization: token }
    });

    if (!respuesta.ok) {
        throw new Error("No se pudo consultar la miniatura del proyecto.");
    }

    const proyectos = await respuesta.json();
    const proyecto = proyectos.find((item) => String(item.id) === String(idProyecto));
    miniaturaProyecto = proyecto?.miniatura || "";
}

async function guardarProyecto() {
    if (elementoSeleccionado) elementoSeleccionado.classList.remove("seleccionado");

    const documento = crearDocumento();
    const contenido = JSON.stringify(documento);
    localStorage.setItem("proyectoTIC", contenido);

    if (elementoSeleccionado) elementoSeleccionado.classList.add("seleccionado");

    if (!idProyecto || !token) {
        alert("No se puede guardar: falta el proyecto o la sesión.");
        return false;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/proyectos/${idProyecto}/archivo`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: token
            },
            body: JSON.stringify({
                contenido: contenido
            })
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo guardar el proyecto.");
        }

        return true;
    } catch (error) {
        console.error("Error al guardar el proyecto:", error);
        alert("No se pudo guardar el proyecto.");
        return false;
    }
}

async function enviarARevision() {
    try {
        const respuesta = await fetch(`${API_BASE_URL}/proyectos/${idProyecto}/enviar`, {
            method: "POST",
            headers: {
                Authorization: token
            }
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo enviar el proyecto.");
        }

        alert("El proyecto fue enviado a revisión.");
    } catch (error) {
        console.error("Error al enviar el proyecto a revisión:", error);
        alert("No se pudo enviar el proyecto a revisión.");
    }
}

botonGuardar.addEventListener("click", async function () {
    await guardarProyecto();
});

botonRevision.addEventListener("click", async function () {
    try {
        await cargarMiniaturaProyecto();
    } catch (error) {
        console.error("No se pudo validar la miniatura:", error);
    }

    if (!miniaturaProyecto) {
        abrirVentana(
            "No se puede enviar a revisión",
            { error: true, mensaje: "Por favor, subir la miniatura del proyecto en la configuración." },
            null,
            "",
            false
        );
        return;
    }

    abrirVentana(
        "¿Estás seguro de que quieres enviar el proyecto a revisión?",
        "Un administrador revisará tu proyecto",
        "revision"
    );
});

refrescarPanelPropiedades();

async function cargarProyecto() {
    if (!idProyecto || !token) {
        alert("Abrí el editor desde un proyecto y asegurate de iniciar sesión.");
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/proyectos/${idProyecto}/archivo`, {
            headers: {
                Authorization: token
            }
        });

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el proyecto.");
        }

        const textoRespuesta = await respuesta.text();
        const documento = extraerContenidoArchivo(textoRespuesta);
        mostrarDocumento(documento);
        refrescarPanelPropiedades();
    } catch (error) {
        console.error("Error al cargar el proyecto:", error);
        alert("No se pudo cargar el proyecto.");
    }
}

function extraerContenidoArchivo(textoRespuesta) {
    if (!textoRespuesta.trim()) {
        return { version: 1, elementos: [] };
    }

    const respuesta = JSON.parse(textoRespuesta);
    let documento = respuesta;

    if (respuesta.contenido) {
        documento = JSON.parse(respuesta.contenido);
    }

    if (documento && documento.elementos) {
        return documento;
    }

    return { version: 1, elementos: [] };
}

cargarProyecto();