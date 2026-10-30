const form = document.getElementById("login");

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const loginResultado = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ dni: form.usuario.value, pass: form.password.value })
    });

    const respuesta = await loginResultado.json();
    if (loginResultado.ok) {
    localStorage.setItem('token', respuesta.token);
    window.location.href = '/';
    } else {
        alert(respuesta.error);
    }
})
