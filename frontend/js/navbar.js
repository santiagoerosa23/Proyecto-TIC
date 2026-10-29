async function cargarNavbar() {
    const token = localStorage.getItem('token');
    const botonIniciarSesion = document.querySelector('.navbar-guest');
    const botonesMisProyectos = document.querySelectorAll('.mis-proyectos');
    const botonesPanelAdmin = document.querySelectorAll('.panel-admin');
    const menusPerfil = document.querySelectorAll('.navbar-profile');

    if (!token) {
        if (botonIniciarSesion) botonIniciarSesion.hidden = false;

        for (const boton of botonesMisProyectos) {
            boton.hidden = true;
        }
        for (const boton of botonesPanelAdmin) {
            boton.hidden = true;
        }

        for (const menu of menusPerfil) {
            menu.hidden = true;
        }

        return;
    }
    if (botonIniciarSesion) botonIniciarSesion.hidden = true;
    for (const boton of botonesMisProyectos) {
        boton.hidden = false;
    }
    for (const boton of botonesPanelAdmin) {
        boton.hidden = true;
    }
    for (const menu of menusPerfil) {
        menu.hidden = false;
    }
    // El try/catch no es vibecodeado conozco mi javascript.
    try {
        const respuesta = await fetch(`${API_BASE_URL}/perfil/yo`, {
            cache: 'no-store',
            cache: 'no-store',
            headers: {
                Authorization: token
            }
        });

        if (!respuesta.ok) {
            throw new Error('No se pudo cargar el perfil');
        }

        const perfil = await respuesta.json();
        const nombres = document.querySelectorAll('.nombre-usuario');
        const usuarios = document.querySelectorAll('.uduario-\\@');
        const imagenes = document.querySelectorAll('.login-img');
        const imagenesDelMenu = document.querySelectorAll('.usuario-icono-drpdw');

        for (const nombre of nombres) {
            nombre.textContent = perfil.nombre;
        }

        for (const usuario of usuarios) {
            usuario.textContent = `@${perfil.nombre}`;
        }

        for (const boton of botonesPanelAdmin) {
            boton.hidden = perfil.admin !== true;
        }

        const urlFoto = convertirFotoEnUrl(perfil.foto);
        if (urlFoto) {
            const urlFotoConVersion = agregarVersionCache(urlFoto);

            for (const imagen of imagenes) {
                imagen.src = urlFotoConVersion;
            }

            for (const imagen of imagenesDelMenu) {
                imagen.style.backgroundImage = `url("${urlFotoConVersion}")`;
                imagen.style.backgroundSize = 'cover';
                imagen.style.backgroundPosition = 'center';
            }
        }
    } catch (error) {
        console.error('Error al cargar los datos del perfil:', error);
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

const enlacesCerrarSesion = document.querySelectorAll('.cerrar-sesion-dropdown');

for (const enlace of enlacesCerrarSesion) {
    enlace.addEventListener('click', async (event) => {
        event.preventDefault();

        const token = localStorage.getItem('token');

        try {
            if (token) {
                await fetch(`${API_BASE_URL}/logout`, {
                    method: 'POST',
                    headers: {
                        Authorization: token
                    }
                });
            }
        } catch (error) {
            console.error('No se pudo cerrar la sesión:', error);
        }

        localStorage.removeItem('token');
        window.location.href = '/login.html';
    });
}

cargarNavbar();

window.addEventListener('pageshow', cargarNavbar);
