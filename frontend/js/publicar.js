const formularioProyecto = document.getElementById('formularioProyecto');
const listaIntegrantes = document.getElementById('listaIntegrantes');
const mensajeFormulario = document.getElementById('mensajeFormulario');

function crearFilaIntegrante(numero) {
    const esCreador = numero === 1;
    const integrante = document.createElement('div');
    integrante.className = 'integrante';
    integrante.dataset.numero = numero;
    integrante.innerHTML = `
        <h3>${esCreador ? 'Vos (creador)' : `Integrante ${numero}`}</h3>
        ${esCreador ? '<p class="recordatorio-integrantes">Recordá incluirte primero en la lista con tu DNI y alias.</p>' : ''}
        <div class="campos-integrante">
            <input name="alias${numero}" type="text" placeholder="${esCreador ? 'Tu alias' : 'Alias'}">
            <select name="rol${numero}" aria-label="Rol del integrante ${numero}">
                <option value="" selected disabled>Rol</option>
                <option value="Frontend">Frontend</option>
                <option value="Backend">Backend</option>
                <option value="Hardware">Hardware</option>
                <option value="TIMI">TIMI</option>
                <option value="Fullstack">Fullstack</option>
            </select>
            ${esCreador ? '<input name="dni1" type="text" placeholder="Tu DNI">' : ''}
            ${esCreador ? '' : `<input name="dni${numero}" type="text" placeholder="DNI">`}
        </div>
    `;

    const campos = integrante.querySelectorAll('input, select');
    for (const campo of campos) {
        campo.addEventListener('input', agregarSiguienteIntegrante);
    }

    listaIntegrantes.appendChild(integrante);
}

function agregarSiguienteIntegrante() {
    const filas = listaIntegrantes.querySelectorAll('.integrante');
    const ultimaFila = filas[filas.length - 1];
    const campos = ultimaFila.querySelectorAll('input');
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

crearFilaIntegrante(1);

formularioProyecto.addEventListener('submit', async (evento) => {
    evento.preventDefault();

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

    mensajeFormulario.textContent = 'Creando proyecto...';

    try {
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
            throw new Error('No se pudo crear el proyecto.');
        }

        const resultado = await respuesta.json().catch(() => ({}));
        const id = resultado.id || resultado.proyecto?.id;
        window.location.href = id ? `/editor.html?id=${id}` : '/perfil.html';
    } catch (error) {
        console.error('Error al crear el proyecto:', error);
        mensajeFormulario.textContent = 'No se pudo crear el proyecto. Revisá los datos e intentá de nuevo.';
    }
});
