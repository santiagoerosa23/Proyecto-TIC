let idProyecto = new URLSearchParams(window.location.search).get('id');

const titulo = document.getElementById('tituloProyecto');
// const descripcion = document.getElementById('descripcion');
const contenidoProyecto = document.getElementById('contenidoProyecto');
const colaboradores = document.getElementById('colaboradores');
const listaComentarios = document.getElementById('listaComentarios');
const formularioOpinion = document.getElementById('formularioOpinion');


fetch(`${API_BASE_URL}/proyectos/${idProyecto}`)
  .then(response => response.json())
  .then(data => {
    console.log('Proyecto cargado:', data);
    if (data.error) {
      window.location.href = '404.html';
      return;
    }
    mostrarProyecto(data);
  })
  .catch(error => {
    console.error('Error al cargar el proyecto:', error);
    titulo.textContent = 'No se pudo cargar el proyecto';
  });


fetch(`${API_BASE_URL}/proyectos/${idProyecto}/comentarios`)
  .then(response => response.json())
  .then(data => {
    console.log('Comentarios cargados:', data);
    mostrarComentarios(data);
  })
  .catch(error => {
    console.error('Error al cargar los comentarios:', error);
  });

function mostrarProyecto(proyecto) {
  titulo.textContent = proyecto.titulo;
  // descripcion.textContent = proyecto.descripcion;
  contenidoProyecto.innerHTML = proyecto.contenidoHtml;

  const colabs = proyecto.colaboradores ? proyecto.colaboradores : [];
  colaboradores.innerHTML = '';
  colabs.forEach(colab => {
    colaboradores.innerHTML += `
    <div class="perfil">
      <img src="/Assets/perfil.svg" alt="Perfil de ${colab.alias}" class="perfil-img icono" title="${colab.rol}: ${colab.alias}">
    </div>
    `;
  });
}


function mostrarComentarios(lista) {
  if (lista.length === 0) {
    listaComentarios.innerHTML = '<p class="texto">Todavía no hay comentarios aprobados.</p>';
    return;
  }
  listaComentarios.innerHTML = '';
  lista.forEach(comentario => {
    listaComentarios.innerHTML += `
    <div class="comentario">
      <p class="nombredeusuario">${comentario.username}</p>
      <p class="comentario-texto">${comentario.contenido}</p>
    </div>
    `;
  });
}

formularioOpinion.addEventListener('submit', (event) => {
  event.preventDefault();

  fetch(`${API_BASE_URL}/proyectos/${idProyecto}/comentarios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nombre: event.target.nombre.value,
      mail: event.target.mail.value,
      contenido: event.target.contenido.value,
    }),
  })
    .then(response => {
      if (response.ok) {
        alert('Comentario enviado a revisión. Cuando un admin lo apruebe va a aparecer acá.');
        formularioOpinion.reset();
      } else {
        return response.json().then(data => alert('Error: ' + data.error));
      }
    })
    .catch(error => console.error('Error al enviar el comentario:', error));
});
