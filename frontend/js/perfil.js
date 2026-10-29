let eventosPerfilConfigurados = false;

async function subirFotoPerfil() {
    const token = localStorage.getItem('token');
    const archivoFotoPerfil = document.getElementById('archivoFotoPerfil');
    const archivo = archivoFotoPerfil.files[0];

    if (!archivo) {
        return;
    }

    const datos = new FormData();
    datos.append('foto', archivo);

    try {
        const respuesta = await fetch(`${API_BASE_URL}/perfil/foto`, {
            method: 'POST',
            headers: {
                Authorization: token
            },
            body: datos
        });

        if (!respuesta.ok) {
            throw new Error('No se pudo subir la foto');
        }

        document.getElementById('fotoPerfil').src = URL.createObjectURL(archivo);
    } catch (error) {
        console.error('Error al subir la foto de perfil:', error);
    }
}

async function cargarPerfil() {
    const token = localStorage.getItem('token');
    const nombrePerfil = document.getElementById('nombrePerfil');
    const chipAdmin = document.getElementById('chipAdmin');
    const panelAdminPerfil = document.querySelector('.panel-admin-perfil');
    const fotoPerfil = document.getElementById('fotoPerfil');
    const botonFotoPerfil = document.getElementById('botonFotoPerfil');
    const archivoFotoPerfil = document.getElementById('archivoFotoPerfil');
    const proyectosPublicados = document.getElementById('proyectosPublicados');
    const proyectosNoPublicados = document.getElementById('proyectosNoPublicados');

    if (!token) {
        nombrePerfil.textContent = 'Iniciá sesión para ver tu perfil';
        chipAdmin.hidden = true;
        panelAdminPerfil.hidden = true;
        proyectosPublicados.innerHTML = '<p>Tenés que iniciar sesión para ver tus proyectos.</p>';
        proyectosNoPublicados.innerHTML = '';
        return;
    }

    if (!eventosPerfilConfigurados) {
        botonFotoPerfil.addEventListener('click', () => {
            archivoFotoPerfil.click();
        });

        archivoFotoPerfil.addEventListener('change', subirFotoPerfil);
        eventosPerfilConfigurados = true;
    }

    try {
        const respuestaPerfil = await fetch(`${API_BASE_URL}/perfil/yo`, {
            cache: 'no-store',
            headers: {
                Authorization: token
            }
        });

        if (!respuestaPerfil.ok) {
            throw new Error('No se pudo cargar el perfil');
        }

        const perfil = await respuestaPerfil.json();
        nombrePerfil.textContent = perfil.nombre;
        chipAdmin.hidden = perfil.admin !== true;
        panelAdminPerfil.hidden = perfil.admin !== true;

        const urlFoto = convertirFotoEnUrl(perfil.foto);
        if (urlFoto) {
            fotoPerfil.src = agregarVersionCache(urlFoto);
        }

        const respuestaProyectos = await fetch(`${API_BASE_URL}/proyectos/mios`, {
            cache: 'no-store',
            headers: {
                Authorization: token
            }
        });

        if (!respuestaProyectos.ok) {
            throw new Error('No se pudieron cargar los proyectos');
        }

        const proyectos = await respuestaProyectos.json();
        mostrarProyectos(proyectos);
    } catch (error) {
        console.error('Error al cargar el perfil:', error);
        proyectosPublicados.innerHTML = '<p>No se pudo cargar el perfil.</p>';
        proyectosNoPublicados.innerHTML = '';
    }
}

function convertirFotoEnUrl(foto) {
    if (!foto) return '';

    if (typeof foto === 'object') {
        foto = foto.url || foto.filename || foto.nombre || foto.archivo || '';
    }

    if (typeof foto !== 'string' || !foto) return '';

    if (foto.startsWith('http') || foto.startsWith('/')) {
        return foto.startsWith('/media/') ? `${API_BASE_URL}${foto}` : foto;
    }

    return `${API_BASE_URL}/media/${foto}`;
}

function agregarVersionCache(url) {
    if (!url) return '';
    const separador = url.includes('?') ? '&' : '?';
    return `${url}${separador}v=${Date.now()}`;
}

function estaPublicado(proyecto) {
    const estado = proyecto.estado.toLowerCase();
    return estado.includes('public');
}

async function cargarEstadoProyecto(proyecto) {
    const estado = (proyecto.estado || '').toLowerCase();
    const esBorrador = estado.includes('borrador') || estado.includes('creado');

    if (esBorrador || estado.includes('public')) {
        return proyecto;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/proyectos/${proyecto.id}/estado`, {
            cache: 'no-store',
            headers: {
                Authorization: localStorage.getItem('token')
            }
        });

        if (!respuesta.ok) {
            throw new Error(`No se pudo cargar el estado del proyecto ${proyecto.id}`);
        }

        const estadoProyecto = await respuesta.json();
        return { ...proyecto, ...estadoProyecto };
    } catch (error) {
        console.error('Error al cargar el estado del proyecto:', error);
        return proyecto;
    }
}

async function mostrarProyectos(proyectos) {
    const proyectosPublicados = document.getElementById('proyectosPublicados');
    const proyectosNoPublicados = document.getElementById('proyectosNoPublicados');
    const proyectosConEstado = await Promise.all(proyectos.map(cargarEstadoProyecto));

    proyectosPublicados.innerHTML = '';
    proyectosNoPublicados.innerHTML = '';

    for (const proyecto of proyectosConEstado) {
        if (estaPublicado(proyecto)) {
            proyectosPublicados.innerHTML += crearProyectoPublicado(proyecto);
        } else {
            proyectosNoPublicados.innerHTML += crearProyectoNoPublicado(proyecto);
        }
    }

    if (proyectosPublicados.innerHTML === '') {
        proyectosPublicados.innerHTML = '<p>Todavía no tenés proyectos publicados.</p>';
    }

    if (proyectosNoPublicados.innerHTML === '') {
        proyectosNoPublicados.innerHTML = '<p>No tenés proyectos pendientes.</p>';
    }
}

function crearProyectoPublicado(proyecto) {
    return `
        <a href="/Pestaña-proyecto.html?id=${proyecto.id}" class="proyecto">
            <div class="imagen-proyecto">
                <img src="${agregarVersionCache(convertirFotoEnUrl(proyecto.miniatura))}" alt="${proyecto.titulo}">
            </div>
            <div class="barra-negra">
                <h3>${proyecto.titulo}</h3>
            </div>
        </a>
    `;
}

function crearProyectoNoPublicado(proyecto) {
    const estado = (proyecto.estado || '').toLowerCase();
    const esBorrador = estado.includes('borrador') || estado.includes('creado');
    let textoEstado = 'EN REVISIÓN';

    if (estado.includes('borrador') || estado.includes('creado')) {
        textoEstado = 'BORRADOR';
    } else if (estado.includes('reprob') || estado.includes('rechaz')) {
        textoEstado = 'REPROBADO';
    } else if (estado.includes('aprob')) {
        textoEstado = 'APROBADO';
    }

    const mensajeAdmin = !esBorrador && !estado.includes('aprob')
        ? (proyecto.comentario_admin || proyecto.comentarioAdmin || '')
        : '';

    return `
        <a href="/editor.html?id=${proyecto.id}" class="proyecto-no-publicado">
            <div class="miniatura-no-publicado">
                <img src="${agregarVersionCache(convertirFotoEnUrl(proyecto.miniatura))}" alt="">
            </div>
            <div class="datos-no-publicado">
                <h3>${proyecto.titulo}</h3>
                <div class="estado-no-publicado estado-${textoEstado.toLowerCase().replaceAll(' ', '-')}">
                    ${textoEstado}
                </div>
                <p>${textoDelEstado(textoEstado)}</p>
                ${mensajeAdmin ? `<p class="mensaje-admin-proyecto">${mensajeAdmin}</p>` : ''}
            </div>
            <div class="flecha-no-publicado">↗</div>
        </a>
    `;
}

function textoDelEstado(estado) {
    if (estado === 'BORRADOR') {
        return 'Diseñá tu página y, cuando creas que la tenés lista, enviála a revisión.';
    }

    if (estado === 'REPROBADO') {
        return 'Revisá los cambios indicados por el administrador y volvé a enviarlo.';
    }

    if (estado === 'APROBADO') {
        return 'Este proyecto fue aprobado y está listo para publicarse.';
    }

    return 'Los profesores están revisando tu proyecto, esperá la devolución.';
}

cargarPerfil();
window.addEventListener('pageshow', cargarPerfil);
