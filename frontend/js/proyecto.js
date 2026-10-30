let idProyecto = new URLSearchParams(window.location.search).get('id');
const VERSION_AVATARES = '2';
const token = localStorage.getItem('token')

const titulo = document.getElementById('tituloProyecto');
const contenidoProyecto = document.getElementById('contenidoProyecto');
const colaboradores = document.getElementById('colaboradores');
const listaComentarios = document.getElementById('listaComentarios');
const formularioOpinion = document.getElementById('formularioOpinion');

const TIPOGRAFIAS = {
  "Inter Regular": "Inter, sans-serif",
  "Arial": "Arial, sans-serif",
  "Georgia": "Georgia, serif",
  "Courier New": "'Courier New', monospace"
};

if (token) {
  const mailLabel = document.getElementById('mailLabel')
  const mailInput = document.getElementById('mail')
  mailLabel.hidden = true
  mailInput.hidden = true
  mailInput.removeAttribute('required');

}


fetch(`${API_BASE_URL}/proyectos/${idProyecto}`)
  .then(response => response.json())
  .then(data => {
    console.log('Proyecto cargado:', data);
    if (data.error) {
      window.location.href = '404.html';
      return;
    }
    mostrarProyecto(data);
    cargarDisenioPublicado();
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
  contenidoProyecto.innerHTML = proyecto.contenidoHtml;

  const colabs = proyecto.colaboradores ? proyecto.colaboradores : [];
  colaboradores.innerHTML = '';
  colabs.forEach(colab => {
    colaboradores.innerHTML += `
    <div class="perfil">
      <img src="/Assets/${obtenerAvatarPorRol(colab.rol)}?v=${VERSION_AVATARES}" alt="Perfil de ${colab.alias}" class="perfil-img" title="${colab.rol}: ${colab.alias}">
    </div>
    `;
  });
}

function obtenerAvatarPorRol(rol) {
  const rolNormalizado = (rol || '').toLowerCase();
  if (rolNormalizado.includes('front')) return 'frontendPfp.png';
  if (rolNormalizado.includes('back')) return 'backendPfp.png';
  if (rolNormalizado.includes('hardware')) return 'hardwarePfp.png';
  if (rolNormalizado.includes('timi')) return 'timiPfp.png';
  if (rolNormalizado.includes('full')) return 'fullstackPfp.png';
  return 'perfil.svg';
}

function cargarDisenioPublicado() {
  fetch(`${API_BASE_URL}/proyectos/${idProyecto}/archivo-publico`)
    .then(respuesta => {
      if (!respuesta.ok) throw new Error('No se pudo cargar el diseño');
      return respuesta.text();
    })
    .then(texto => {
      const documento = extraerContenidoArchivo(texto);
      const caja = document.createElement('div');
      caja.className = 'contenido-publicado';

      const elementos = documento.elementos ? documento.elementos : [];
      for (const datos of elementos) {
        const elemento = crearElementoPublicado(datos);
        if (elemento) caja.appendChild(elemento);
      }

      contenidoProyecto.innerHTML = '';
      contenidoProyecto.appendChild(caja);
    })
    .catch(error => {
      console.error('No se pudo cargar el diseño publicado:', error);
    });
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

function aplicarEstilosPublicados(elemento, datos) {
  const estilos = datos.estilos ? datos.estilos : {};
  for (const propiedad in estilos) {
    if (estilos[propiedad]) {
      elemento.style.setProperty(propiedad, estilos[propiedad]);
    }
  }

  if (datos.tipografia && TIPOGRAFIAS[datos.tipografia]) {
    elemento.style.fontFamily = TIPOGRAFIAS[datos.tipografia];
  }
}

function crearElementoPublicado(datos) {
  if (!datos || !datos.tipo) return null;

  if (datos.tipo === 'imagen') {
    const caja = document.createElement('div');
    caja.classList.add('elemento', 'imagen-editor');
    const imagen = document.createElement('img');
    imagen.alt = datos.alt || 'Imagen';
    if (datos.src) imagen.src = datos.src;
    else caja.classList.add('sin-archivo');
    caja.appendChild(imagen);
    aplicarEstilosPublicados(caja, datos);
    return caja;
  }

  if (datos.tipo === 'video') {
    const caja = document.createElement('div');
    caja.classList.add('elemento', 'video-editor');
    const video = document.createElement('video');
    video.controls = true;
    if (datos.src) video.src = datos.src;
    else caja.classList.add('sin-archivo');
    caja.appendChild(video);
    aplicarEstilosPublicados(caja, datos);
    return caja;
  }

  let tag = 'div';
  if (datos.tipo === 'texto' && ['h1', 'h2', 'h3', 'p', 'span', 'div'].includes(datos.tag)) {
    tag = datos.tag;
  }
  if (datos.tipo === 'divisor') tag = 'hr';

  const elemento = document.createElement(tag);
  elemento.classList.add('elemento');

  if (datos.tipo === 'texto') elemento.classList.add('texto-editor');
  if (datos.tipo === 'divisor') elemento.classList.add('divisor-editor');
  if (datos.tipo === 'contenedor') elemento.classList.add('contenedor-editor');
  if (datos.tipo === 'fila') elemento.classList.add('fila-editor');
  if (datos.tipo === 'columna') elemento.classList.add('columna-editor');

  if (datos.tipo === 'texto' && datos.contenido) {
    elemento.textContent = datos.contenido;
  }

  aplicarEstilosPublicados(elemento, datos);

  if (Array.isArray(datos.hijos)) {
    for (const hijo of datos.hijos) {
      const elementoHijo = crearElementoPublicado(hijo);
      if (elementoHijo) elemento.appendChild(elementoHijo);
    }
  }

  return elemento;
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
  if (!token) {
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
  } else  {
    fetch(`${API_BASE_URL}/proyectos/${idProyecto}/comentarios`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization' : token },
      body: JSON.stringify({
        nombre: event.target.nombre.value,
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
  }
});
