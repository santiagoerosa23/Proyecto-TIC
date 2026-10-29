let proyectos = [];
const VERSION_AVATARES = '2';
const container = document.querySelector('.cuadricula');
const inputBusqueda = document.querySelector('.search-input');

const parametros = new URLSearchParams(window.location.search);
inputBusqueda.value = parametros.get('busqueda') ? parametros.get('busqueda') : '';

fetch(`${API_BASE_URL}/proyectos/publicos`)
  .then(response => response.json())
  .then(data => {
    console.log('Proyectos cargados desde la API:', data);
    proyectos = data;
    filtrarProyectos();
  })
  .catch(error => {
    console.error('Error al cargar los proyectos:', error);
    container.innerHTML = '<p class="texto estado-proyectos">No se pudieron cargar los proyectos.</p>';
  });

function filtrarProyectos() {
  const texto = inputBusqueda.value.trim().toLowerCase();
  const filtrados = proyectos.filter(proyecto => proyecto.titulo.toLowerCase().includes(texto));
  mostrarProyectos(filtrados);

  if (filtrados.length === 0) {
    container.innerHTML = '<p class="texto estado-proyectos">No hay proyectos que coincidan con la búsqueda.</p>';
  }
}

inputBusqueda.addEventListener('input', filtrarProyectos);

function mostrarProyectos(lista) {
  container.innerHTML = '';
  lista.forEach(proyecto => {
    const colaboradores = proyecto.colaboradores ? proyecto.colaboradores : [];
    const perfiles = crearPerfilesApilados(colaboradores);
    container.innerHTML += `
    <section class="proyecto">
      <a href="Pestaña-proyecto.html?id=${proyecto.id}" class="proyecto-link">
        <section class="proyecto-miniatura" style="background-image: url('${API_BASE_URL}/media/${proyecto.miniatura}')"></section>
        <div class="informacion">
          <div class="perfilytitulo">
            <div class="perfiles-apilados" title="Por ${colaboradores.map(c => c.alias).join(', ')}">
              ${perfiles}
            </div>
            <div class="titulo">
              <p class="tituloProyecto">${proyecto.titulo}</p>
            </div>
          </div>
        </div>
      </a>
    </section>
    `;
  });
}

function crearPerfilesApilados(colaboradores) {
  if (colaboradores.length === 0) {
    return crearPerfilColaborador({});
  }

  return colaboradores.map((colaborador, indice) => {
    return crearPerfilColaborador(colaborador, indice);
  }).join('');
}

function crearPerfilColaborador(colaborador, indice = 0) {
  const rol = (colaborador.rol || '').toLowerCase();
  const archivo = obtenerAvatarPorRol(rol);
  const alias = colaborador.alias || 'Colaborador';

  return `
    <div class="perfil perfil-apilado" style="z-index: ${20 - indice};">
      <img src="/Assets/${archivo}?v=${VERSION_AVATARES}" alt="Perfil de ${alias}" class="perfil-img" title="${alias} - ${colaborador.rol || 'Sin rol'}">
    </div>
  `;
}

function obtenerAvatarPorRol(rol) {
  if (rol.includes('front')) return 'frontendPfp.png';
  if (rol.includes('back')) return 'backendPfp.png';
  if (rol.includes('hardware')) return 'hardwarePfp.png';
  if (rol.includes('timi')) return 'timiPfp.png';
  if (rol.includes('full')) return 'fullstackPfp.png';
  return 'perfil.svg';
}