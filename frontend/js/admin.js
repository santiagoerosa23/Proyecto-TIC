const tokenAdmin = localStorage.getItem('token');
const listaSolicitudes = document.getElementById('listaSolicitudes');
const listaComentarios = document.getElementById('listaComentarios');
const listaUsuarios = document.getElementById('listaUsuarios');
const listaMails = document.getElementById('listaMails');
const cantidadSolicitudes = document.getElementById('cantidadSolicitudes');
const cantidadComentarios = document.getElementById('cantidadComentarios');
const cantidadMails = document.getElementById('cantidadMails');
const popupAdmin = document.getElementById('popupAdmin');
const formularioAdmin = document.getElementById('formularioAdmin');
const popupTitulo = document.getElementById('popupTitulo');
const popupTexto = document.getElementById('popupTexto');
const camposPopup = document.getElementById('camposPopup');
let accionPopup = null;

async function pedirApi(ruta, opciones = {}) {
    const respuesta = await fetch(`${API_BASE_URL}${ruta}`, {
        ...opciones,
        cache: 'no-store',
        headers: {
            Authorization: tokenAdmin,
            ...(opciones.headers || {})
        }
    });

    if (!respuesta.ok) {
        throw new Error(`No se pudo completar ${ruta}`);
    }

    return respuesta.json().catch(() => ({}));
}

function textoSeguro(valor) {
    const elemento = document.createElement('span');
    elemento.textContent = valor || '';
    return elemento.innerHTML;
}

function mostrarMensaje(lista, texto) {
    lista.innerHTML = `<p class="item-admin">${texto}</p>`;
}

function abrirPopup(titulo, texto, campos, accion) {
    popupTitulo.textContent = titulo;
    popupTexto.textContent = texto;
    camposPopup.innerHTML = campos;
    accionPopup = accion;
    popupAdmin.hidden = false;
}

function cerrarPopup() {
    popupAdmin.hidden = true;
    accionPopup = null;
    camposPopup.innerHTML = '';
}

async function cargarSolicitudes() {
    const proyectos = await pedirApi('/admin/proyectos/pendientes');
    cantidadSolicitudes.textContent = proyectos.length;
    listaSolicitudes.innerHTML = '';

    if (proyectos.length === 0) {
        mostrarMensaje(listaSolicitudes, 'No hay solicitudes pendientes.');
        return;
    }

    for (const proyecto of proyectos) {
        listaSolicitudes.innerHTML += `
            <article class="item-admin">
                <h3>${textoSeguro(proyecto.nombre || proyecto.titulo || 'Proyecto')}</h3>
                <p>${textoSeguro(proyecto.integrantes?.length ? 'Integrantes cargados' : 'Sin integrantes')}</p>
                <div class="acciones-item">
                    <button class="boton-admin" data-revisar="${textoSeguro(proyecto.id)}" data-decision="aprobar">✓</button>
                    <button class="boton-admin secundario" data-revisar="${textoSeguro(proyecto.id)}" data-decision="reprobar">×</button>
                    <button class="boton-admin" data-publicar="${textoSeguro(proyecto.id)}">Aprobar y publicar</button>
                </div>
            </article>
        `;
    }
}

async function cargarComentarios() {
    const comentarios = await pedirApi('/admin/comentarios');
    cantidadComentarios.textContent = comentarios.length;
    listaComentarios.innerHTML = '';

    if (comentarios.length === 0) {
        mostrarMensaje(listaComentarios, 'No hay comentarios pendientes.');
        return;
    }

    for (const comentario of comentarios) {
        listaComentarios.innerHTML += `
            <article class="item-admin">
                <h3>${textoSeguro(comentario.nombre || 'Comentario')}</h3>
                <p>${textoSeguro(comentario.contenido)}</p>
                <div class="acciones-item">
                    <button class="boton-admin" data-comentario="${textoSeguro(comentario.id)}" data-accion="aprobar">✓</button>
                    <button class="boton-admin secundario" data-comentario="${textoSeguro(comentario.id)}" data-accion="borrar">×</button>
                </div>
            </article>
        `;
    }
}

async function cargarUsuarios() {
    const usuarios = await pedirApi('/admin/usuarios');
    listaUsuarios.innerHTML = '';

    if (usuarios.length === 0) {
        mostrarMensaje(listaUsuarios, 'No hay usuarios para mostrar.');
        return;
    }

    for (const usuario of usuarios) {
        const idUsuario = usuario.userId || usuario.id;
        listaUsuarios.innerHTML += `
            <article class="item-admin">
                <h3>${textoSeguro(usuario.nombre || 'Usuario')}</h3>
                <p>DNI: ${textoSeguro(usuario.dni || usuario.DNI || 'Sin DNI')}</p>
                <div class="acciones-item">
                    <button class="boton-admin secundario" data-usuario="${textoSeguro(idUsuario)}">Borrar</button>
                </div>
            </article>
        `;
    }
}

async function cargarMails() {
    const mails = await pedirApi('/admin/mails');
    cantidadMails.textContent = mails.length;
    listaMails.innerHTML = '';

    if (mails.length === 0) {
        mostrarMensaje(listaMails, 'No hay mails para mostrar.');
        return;
    }

    for (const mail of mails) {
        listaMails.innerHTML += `
            <article class="item-admin">
                <h3>${textoSeguro(mail.mail || 'Mail sin dirección')}</h3>
                <p>Estado: ${textoSeguro(mail.estado || 'Sin estado')}</p>
                <div class="acciones-item">
                    <button class="boton-admin" data-mail="${textoSeguro(mail.id)}">Editar</button>
                </div>
            </article>
        `;
    }
}

document.addEventListener('click', (evento) => {
    const botonRevision = evento.target.closest('[data-revisar]');
    if (botonRevision) {
        const decision = botonRevision.dataset.decision;
        abrirPopup(
            decision === 'aprobar' ? 'Aprobar proyecto' : 'Reprobar proyecto',
            'Podés dejar una razón para el administrador.',
            '<textarea name="razon" placeholder="Razón"></textarea>',
            async (datos) => {
                await pedirApi(`/admin/proyectos/${botonRevision.dataset.revisar}/revision`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ decision, razon: datos.razon })
                });
                await cargarSolicitudes();
            }
        );
        return;
    }

    const botonComentario = evento.target.closest('[data-comentario]');
    if (botonComentario) {
        const accion = botonComentario.dataset.accion;
        abrirPopup(
            accion === 'aprobar' ? 'Aprobar comentario' : 'Borrar comentario',
            '¿Confirmás esta acción?',
            '',
            async () => {
                const ruta = accion === 'aprobar'
                    ? `/admin/comentarios/${botonComentario.dataset.comentario}/aprobar`
                    : `/admin/comentarios/${botonComentario.dataset.comentario}`;
                await pedirApi(ruta, { method: accion === 'aprobar' ? 'PUT' : 'DELETE' });
                await cargarComentarios();
            }
        );
        return;
    }

    const botonPublicar = evento.target.closest('[data-publicar]');
    if (botonPublicar) {
        abrirPopup(
            'Publicar proyecto',
            'Primero se aprobará el proyecto y después se publicará.',
            '',
            async () => {
                await pedirApi(`/admin/proyectos/${botonPublicar.dataset.publicar}/revision`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ decision: 'aprobar', razon: '' })
                });
                const ids = botonPublicar.dataset.publicar.map(id => {
                    return parseNumber(id)
                });
                await pedirApi('/admin/proyectos/publicar', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [ids] })
                });
                await cargarSolicitudes();
            }
        );
        return;
    }

    const botonUsuario = evento.target.closest('[data-usuario]');
    if (botonUsuario) {
        abrirPopup(
            'Borrar usuario',
            '¿Confirmás que querés borrar este usuario? Esta acción no se puede deshacer.',
            '',
            async () => {
                await pedirApi('/admin/usuarios', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: [botonUsuario.dataset.usuario] })
                });
                await cargarUsuarios();
            }
        );
        return;
    }

    const botonMail = evento.target.closest('[data-mail]');
    if (botonMail) {
        const mail = botonMail.closest('.item-admin');
        const estadoActual = mail.querySelector('p').textContent.replace('Estado: ', '');

        abrirPopup(
            'Cambiar estado del mail',
            'Elegí el nuevo estado.',
            `<select name="estado">
                <option value="Valido" ${estadoActual === 'Valido' ? 'selected' : ''}>Valido</option>
                <option value="Verificando" ${estadoActual === 'Verificando' ? 'selected' : ''}>Verificando</option>
                <option value="Baneado" ${estadoActual === 'Baneado' ? 'selected' : ''}>Baneado</option>
            </select>`,
            async (datos) => {
                await pedirApi(`/admin/mails/${botonMail.dataset.mail}/estado`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ estado: datos.estado })
                });
                await cargarMails();
            }
        );
    }
});

document.getElementById('botonCancelarPopup').addEventListener('click', cerrarPopup);

formularioAdmin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (!accionPopup) return;

    const datos = Object.fromEntries(new FormData(formularioAdmin));
    const accion = accionPopup;
    cerrarPopup();

    try {
        await accion(datos);
    } catch (error) {
        console.error('Error en acción administrativa:', error);
        alert('No se pudo completar la acción.');
    }
});

document.getElementById('botonCrearUsuarios').addEventListener('click', () => {
    abrirPopup(
        'Crear usuarios',
        'Agregá un usuario por fila.',
        `<div id="filasUsuarios">
            <input name="usuarios" placeholder="DNI, contraseña, nombre">
        </div>
        <button type="button" class="boton-admin" id="agregarUsuario">+ Agregar fila</button>`,
        async () => {
            const usuarios = [];
            for (const fila of document.querySelectorAll('#filasUsuarios input')) {
                const partes = fila.value.split(',').map((parte) => parte.trim());
                if (partes.length === 3 && partes[0]) {
                    usuarios.push({ dni: partes[0], pass: partes[1], nombre: partes[2] });
                }
            }
            if (usuarios.length === 0) throw new Error('No hay usuarios válidos.');
            await pedirApi('/admin/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(usuarios)
            });
            await cargarUsuarios();
        }
    );

    document.getElementById('agregarUsuario').addEventListener('click', () => {
        const fila = document.createElement('input');
        fila.name = 'usuarios';
        fila.placeholder = 'DNI, contraseña, nombre';
        document.getElementById('filasUsuarios').appendChild(fila);
    });
});

async function iniciarPanel() {
    if (!listaSolicitudes || !tokenAdmin) {
        return;
    }

    try {
        const perfil = await pedirApi('/perfil/yo');
        if (perfil.admin !== true) {
            return;
        }

        const panel = document.querySelector('.panel-admin-perfil');
        if (panel) panel.hidden = false;
        await Promise.all([
            cargarSolicitudes(),
            cargarComentarios(),
            cargarUsuarios(),
            cargarMails()
        ]);
    } catch (error) {
        console.error('No se pudo cargar el panel admin:', error);
        mostrarMensaje(listaSolicitudes, 'No se pudo cargar el panel.');
        mostrarMensaje(listaComentarios, 'No se pudo cargar el panel.');
        mostrarMensaje(listaUsuarios, 'No se pudo cargar el panel.');
        mostrarMensaje(listaMails, 'No se pudo cargar el panel.');
    }
}

iniciarPanel();
