const RUTA_PROYECTOS_PUBLICOS = `${API_BASE_URL}/proyectos/publicos`;
const contenedorProyectos = document.querySelector('.cuadricula');
const estadoProyectos = document.getElementById('estado-proyectos');
const plantillaProyecto = document.getElementById('plantilla-proyecto');

/**
 * Muestra un mensaje de estado en la grilla (cargando, error, vacío).
 * @param {string} mensaje Texto a mostrar
 */
function mostrarEstado(mensaje) {
  estadoProyectos.textContent = mensaje;
  estadoProyectos.hidden = false;
}

function ocultarEstado() {
  estadoProyectos.hidden = true;
}

/**
 * Arma la URL completa de la miniatura de un proyecto.
 * El backend sirve los archivos subidos en /media/:archivo
 * @param {string} miniatura Nombre del archivo de miniatura
 * @returns {string} URL absoluta de la miniatura
 */
function urlMiniatura(miniatura) {
  if (!miniatura) {
    return '';
  }
  return `${API_BASE_URL}/media/${encodeURIComponent(miniatura)}`;
}

/**
 * Crea la tarjeta de un proyecto a partir de la plantilla del HTML
 * y le carga los datos recibidos de la API.
 * @param {{id: number, titulo: string, colaboradores: Array<{alias: string}>, miniatura: string}} proyecto
 * @returns {HTMLElement} La tarjeta lista para agregar a la grilla
 */
function crearTarjetaProyecto(proyecto) {
  const tarjeta = plantillaProyecto.content.cloneNode(true);

  // Título (textContent evita inyectar HTML malicioso)
  tarjeta.querySelector('.tituloProyecto').textContent = proyecto.titulo;

  // Miniatura como imagen de fondo
  const miniatura = tarjeta.querySelector('.proyecto-miniatura');
  const url = urlMiniatura(proyecto.miniatura);
  if (url) {
    miniatura.style.backgroundImage = `url("${url}")`;
  }

  // Colaboradores como tooltip sobre el perfil
  const aliases = (proyecto.colaboradores ?? []).map((c) => c.alias).join(', ');
  const perfilImg = tarjeta.querySelector('.perfil-img');
  if (aliases) {
    perfilImg.title = `Por ${aliases}`;
    perfilImg.alt = `Perfil de ${aliases}`;
  }

  // Link a la pestaña del proyecto con su id en la URL
  const link = tarjeta.querySelector('.proyecto-link');
  link.href = `Pestaña-proyecto.html?id=${proyecto.id}`;

  return tarjeta;
}

/**
 * Busca los proyectos públicos y los dibuja en la grilla.
 */
async function cargarProyectos() {
  mostrarEstado('Cargando proyectos…');
  try {
    const respuesta = await fetch(RUTA_PROYECTOS_PUBLICOS);

    if (!respuesta.ok) {
      throw new Error(`El servidor respondió con estado ${respuesta.status}`);
    }

    const proyectos = await respuesta.json();

    if (!Array.isArray(proyectos) || proyectos.length === 0) {
      mostrarEstado('Todavía no hay proyectos públicos para mostrar.');
      return;
    }

    ocultarEstado();
    for (const proyecto of proyectos) {
      contenedorProyectos.appendChild(crearTarjetaProyecto(proyecto));
    }
  } catch (error) {
    console.error('Error al cargar los proyectos:', error);
    mostrarEstado(
      'No se pudieron cargar los proyectos. Verificá que el backend esté corriendo en ' +
        `${API_BASE_URL} y que tenga CORS habilitado.`,
    );
  }
}

cargarProyectos();
