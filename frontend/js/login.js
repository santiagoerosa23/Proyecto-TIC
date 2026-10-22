const form = document.getElementById("login");
// const tokenActual = localStorage.getItem(token);
// if (tokenActual.length > 10) {
//     alert("Ya estas logeado! Por test, hasta que haya logout, te sacare de memoria el token (ademas me quede sin tiempo!)")
//     localStorage.setItem('token', "");
//     window.location.href = '/';
// }

form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const loginResultado = await fetch('http://localhost:3000/login', {
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
