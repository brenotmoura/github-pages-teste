// Script de exemplo para GitHub Pages

document.addEventListener('DOMContentLoaded', function() {
    // Botão de ação
    const btnAcao = document.getElementById('btn-acao');

    btnAcao.addEventListener('click', function() {
        alert('Parabéns! Seu site está funcionando! 🎉');
    });

    // Scroll suave para links de navegação
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    console.log('Site carregado com sucesso!');
});
