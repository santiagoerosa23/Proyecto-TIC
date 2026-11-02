const formularioProyecto = document.getElementById('formularioProyecto');
const listaIntegrantes = document.getElementById('listaIntegrantes');
const mensajeFormulario = document.getElementById('mensajeFormulario');
let creandoProyecto = false;

function crearFilaIntegrante(numero) {
    if (listaIntegrantes.querySelectorAll('.integrante').length >= 4) {
        return;
    }

    const esCreador = numero === 1;
    const integrante = document.createElement('div');
    integrante.className = 'integrante';
    integrante.dataset.numero = numero;
    integrante.innerHTML = `
        <h3>${esCreador ? '' : `Integrante ${numero}`}</h3>
        ${esCreador ? '<p class="recordatorio-integrantes">Recordá incluirte primero en la lista con tu DNI y alias. Máximo 4 integrantes en total.</p>' : ''}
        <div class="campos-integrante">
            <input data-campo="alias" name="alias${numero}" type="text" placeholder="${esCreador ? 'Tu alias' : 'Alias'}">
            <select data-campo="rol" name="rol${numero}" aria-label="Rol del integrante ${numero}">
                <option value="" selected disabled>Rol</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Hardware">Hardware</option>
                <option value="TIMI">TIMI</option>
                <option value="Fullstack">Fullstack</option>
            </select>
            <input data-campo="dni" name="dni${numero}" type="text" placeholder="${esCreador ? 'Tu DNI' : 'DNI'}" ${esCreador ? 'readonly title="El DNI corresponde a la cuenta creadora"' : ''}>
            ${esCreador ? '' : '<button class="eliminar-integrante" type="button" aria-label="Eliminar integrante">X</button>'}
        </div>
    `;
    listaIntegrantes.appendChild(integrante);
}

function agregarSiguienteIntegrante() {
    const filas = listaIntegrantes.querySelectorAll('.integrante');
    if (filas.length >= 4) {
        return;
    }

    const ultimaFila = filas[filas.length - 1];
    const campos = ultimaFila.querySelectorAll('input, select');
    let tieneContenido = false;

    for (const campo of campos) {
        if (campo.value.trim()) {
            tieneContenido = true;
            break;
        }
    }

    if (tieneContenido) {
        crearFilaIntegrante(filas.length + 1);
    }
}

function renumerarIntegrantes() {
    const filas = listaIntegrantes.querySelectorAll('.integrante');

    filas.forEach((fila, indice) => {
        const numero = indice + 1;
        const esCreador = numero === 1;
        fila.dataset.numero = numero;
        fila.querySelector('h3').textContent = esCreador ? '' : `Integrante ${numero}`;

        fila.querySelectorAll('[data-campo]').forEach((campo) => {
            campo.name = `${campo.dataset.campo}${numero}`;
            if (campo.tagName === 'SELECT') {
                campo.setAttribute('aria-label', `Rol del integrante ${numero}`);
            }
        });
    });
}

function obtenerIntegrantes() {
    const integrantes = [];
    const filas = listaIntegrantes.querySelectorAll('.integrante');

    for (const fila of filas) {
        const numero = fila.dataset.numero;
        const alias = fila.querySelector(`[name="alias${numero}"]`).value.trim();
        const rol = fila.querySelector(`[name="rol${numero}"]`).value.trim();
        const dni = fila.querySelector(`[name="dni${numero}"]`).value.trim();

        if (alias || rol || dni) {
            integrantes.push({ alias, rol, dni });
        }
    }

    return integrantes;
}

async function autocompletarDniCreador() {
    const campoDni = listaIntegrantes.querySelector('.integrante [data-campo="dni"]');
    const dniEnSesion = sessionStorage.getItem('dniCuenta');
    if (dniEnSesion && campoDni) {
        campoDni.value = dniEnSesion;
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        mensajeFormulario.textContent = 'Iniciá sesión para cargar el DNI de la cuenta creadora.';
        return;
    }

    try {
        const respuesta = await fetch(`${API_BASE_URL}/perfil/yo`, {
            cache: 'no-store',
            headers: { Authorization: token }
        });
        if (!respuesta.ok) {
            throw new Error(`No se pudo consultar el perfil (${respuesta.status}).`);
        }

        const perfil = await respuesta.json();
        const dni = perfil.DNI ?? perfil.dni;
        if (typeof dni !== 'string' || !dni.trim()) {
            throw new Error('El perfil no devolvió el DNI de la cuenta.');
        }

        campoDni.value = dni.trim();
        sessionStorage.setItem('dniCuenta', dni.trim());
    } catch (error) {
        console.error('No se pudo cargar el DNI de la cuenta creadora:', error);
        mensajeFormulario.textContent = 'No se pudo cargar el DNI de la cuenta. Cerrá sesión y volvé a iniciar sesión.';
    }
}

crearFilaIntegrante(1);
autocompletarDniCreador();

listaIntegrantes.addEventListener('input', agregarSiguienteIntegrante);
listaIntegrantes.addEventListener('change', agregarSiguienteIntegrante);
listaIntegrantes.addEventListener('click', (evento) => {
    const botonEliminar = evento.target.closest('.eliminar-integrante');
    if (!botonEliminar) {
        return;
    }

    botonEliminar.closest('.integrante').remove();
    renumerarIntegrantes();
});

formularioProyecto.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    if (creandoProyecto) {
        return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
        mensajeFormulario.textContent = 'Iniciá sesión para crear un proyecto.';
        return;
    }

    const filas = listaIntegrantes.querySelectorAll('.integrante');
    const creador = filas[0];
    const dniCreador = creador.querySelector('[name="dni1"]').value.trim();
    const aliasCreador = creador.querySelector('[name="alias1"]').value.trim();

    if (!dniCreador || !aliasCreador) {
        mensajeFormulario.textContent = 'Completá primero tu DNI y alias en la primera fila.';
        return;
    }

    creandoProyecto = true;
    const botonEnviar = formularioProyecto.querySelector('[type="submit"]');
    botonEnviar.disabled = true;
    mensajeFormulario.textContent = 'Creando proyecto...';
    let proyectoCreado = false;

    try {
        let idsProyectosAnteriores = new Set();
        try {
            const respuestaProyectos = await fetch(`${API_BASE_URL}/proyectos/mios`, {
                cache: 'no-store',
                headers: { Authorization: token }
            });
            if (!respuestaProyectos.ok) {
                throw new Error(`No se pudieron consultar los proyectos (${respuestaProyectos.status}).`);
            }

            const proyectosAnteriores = await respuestaProyectos.json();
            idsProyectosAnteriores = new Set(proyectosAnteriores.map((proyecto) => String(proyecto.id)));
        } catch (error) {
            console.warn('No se pudieron consultar los proyectos existentes antes de crear:', error);
        }

        const respuesta = await fetch(`${API_BASE_URL}/proyectos/crear`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token
            },
            body: JSON.stringify({
                titulo: formularioProyecto.titulo.value.trim(),
                descripcion: '',
                colaboradoresDNI: obtenerIntegrantes()
            })
        });

        if (!respuesta.ok) {
            const detalle = await respuesta.text();
            throw new Error(detalle || `No se pudo crear el proyecto (${respuesta.status}).`);
        }
        proyectoCreado = true;

        const textoRespuesta = await respuesta.text();
        let resultado = {};
        if (textoRespuesta) {
            try {
                const datos = JSON.parse(textoRespuesta);
                resultado = datos && typeof datos === 'object' ? datos : {};
            } catch {
                // The create endpoint may return a successful non-JSON response.
            }
        }

        let id = resultado.id ?? resultado.proyecto?.id;
        if (id === undefined || id === null || String(id).trim() === '') {
            const respuestaProyectos = await fetch(`${API_BASE_URL}/proyectos/mios`, {
                cache: 'no-store',
                headers: { Authorization: token }
            });
            if (!respuestaProyectos.ok) {
                throw new Error(`El proyecto se creó, pero no se pudo localizar para abrir el editor (${respuestaProyectos.status}).`);
            }

            const proyectos = await respuestaProyectos.json();
            const titulo = formularioProyecto.titulo.value.trim();
            const nuevosProyectos = proyectos.filter((proyecto) =>
                proyecto.titulo === titulo && !idsProyectosAnteriores.has(String(proyecto.id))
            );
            const proyectosConTitulo = nuevosProyectos.length
                ? nuevosProyectos
                : proyectos.filter((proyecto) => proyecto.titulo === titulo);

            if (proyectosConTitulo.length === 1) {
                id = proyectosConTitulo[0].id;
            } else {
                throw new Error('El proyecto se creó, pero no se pudo identificar para abrir el editor.');
            }
        }

        if (id === undefined || id === null || String(id).trim() === '') {
            throw new Error('El proyecto se creó, pero no se pudo identificar para abrir el editor.');
        }

        window.location.href = `/editor.html?id=${encodeURIComponent(id)}`;
    } catch (error) {
        console.error('Error al crear el proyecto:', error);
        mensajeFormulario.textContent = proyectoCreado
            ? 'El proyecto se creó, pero no se pudo abrir el editor. No lo vuelvas a enviar; actualizá tu perfil para encontrarlo.'
            : error instanceof Error
                ? error.message
                : 'No se pudo crear el proyecto. Revisá los datos e intentá de nuevo.';
    } finally {
        if (!proyectoCreado) {
            creandoProyecto = false;
            botonEnviar.disabled = false;
        }
    }
});
