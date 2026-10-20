const RUTA_PROYECTOS_PUBLICOS = `${API_BASE_URL}/proyectos/publicos`;
const contenedorProyectos = document.querySelector('.cuadricula');
const estadoProyectos = document.getElementById('estado-proyectos');
const plantillaProyecto = document.getElementById('plantilla-proyecto');


function mostrarEstado(mensaje) {
  estadoProyectos.textContent = mensaje;
  estadoProyectos.hidden = false;
}

function ocultarEstado() {
  estadoProyectos.hidden = true;
}

function urlMiniatura(miniatura) {
  if (!miniatura) {
    return '';
  }
  return `${API_BASE_URL}/media/${encodeURIComponent(miniatura)}`;
}


function crearTarjetaProyecto(proyecto) {
  const tarjeta = plantillaProyecto.content.cloneNode(true);


  tarjeta.querySelector('.tituloProyecto').textContent = proyecto.titulo;


  const miniatura = tarjeta.querySelector('.proyecto-miniatura');
  const url = urlMiniatura(proyecto.miniatura);
  if (url) {
    miniatura.style.backgroundImage = `url("${url}")`;
  }


  const aliases = (proyecto.colaboradores ?? []).map((c) => c.alias).join(', ');
  const perfilImg = tarjeta.querySelector('.perfil-img');
  if (aliases) {
    perfilImg.title = `Por ${aliases}`;
    perfilImg.alt = `Perfil de ${aliases}`;
  }


  const link = tarjeta.querySelector('.proyecto-link');
  link.href = `Pestaña-proyecto.html?id=${proyecto.id}`;

  return tarjeta;
}


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
      'No se pudieron cargar los proyectos.'
    );
  }
}

cargarProyectos();
