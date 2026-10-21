let proyectos = [];
const container = document.querySelector('.cuadricula');

fetch(`${API_BASE_URL}/proyectos/publicos`)
  .then(response => response.json())
  .then(data => {
    console.log('Proyectos cargados desde la API:', data);
    proyectos = data;
    mostrarProyectos(proyectos);
  })
  .catch(error => {
    console.error('Error al cargar los proyectos:', error);
    container.innerHTML = '<p class="texto estado-proyectos">No se pudieron cargar los proyectos.</p>';
  });

function mostrarProyectos(lista) {
  container.innerHTML = '';
  lista.forEach(proyecto => {
    const colaboradores = proyecto.colaboradores ? proyecto.colaboradores : [];
    container.innerHTML += `
    <section class="proyecto">
      <a href="Pestaña-proyecto.html?id=${proyecto.id}" class="proyecto-link">
        <section class="proyecto-miniatura" style="background-image: url('${API_BASE_URL}/media/${proyecto.miniatura}')"></section>
        <div class="informacion">
          <div class="perfilytitulo">
            <div class="perfil">
              <img src="/Assets/perfil.svg" alt="Perfil del creador" class="perfil-img icono" title="Por ${colaboradores.map(c => c.alias).join(', ')}">
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