const barraBusqueda = document.querySelector('.search-input');

barraBusqueda.addEventListener('keydown', (event) => {
  if (event.key !== 'Enter') {
    return;
  }

const estamosEnIndex = document.body.dataset.pagina === 'index';

  if (!estamosEnIndex) {
    const texto = barraBusqueda.value.trim();
    window.location.href = 'Index.html?busqueda=' + encodeURIComponent(texto);
  }
});