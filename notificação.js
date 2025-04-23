// js/utils/notificacoes.js  <-- ALTERADO: Nome do arquivo sugerido (sem acento)
'use strict'; // Adiciona modo estrito

/**
 * Referência para o timeout da notificação atual, para poder cancelá-lo.
 * @type {number|null}
 * @private
 */
let notificationTimeout = null;

/**
 * Exibe uma mensagem de notificação na área designada da UI.
 * Remove qualquer notificação anterior antes de exibir a nova.
 * @param {string} message - A mensagem a ser exibida.
 * @param {'info'|'success'|'warning'|'error'} [type='info'] - O tipo de notificação (controla a cor/estilo CSS).
 * @param {number} [duration=4000] - Duração em milissegundos que a notificação ficará visível.
 * @param {object} uiElements - Objeto contendo referências aos elementos da UI (notificationArea, notificationMessage).
 * @param {HTMLElement} uiElements.notificationArea - O elemento container da notificação.
 * @param {HTMLElement} uiElements.notificationMessage - O elemento onde o texto da mensagem será inserido.
 * @returns {void} Esta função não retorna valor.
 * @public
 */
function showNotification(message, type = 'info', duration = 4000, uiElements) {
    if (!uiElements?.notificationArea || !uiElements?.notificationMessage) {
        console.warn("showNotification: Elementos da UI de notificação não encontrados ou não fornecidos.", uiElements);
        alert(`Notificação (${type}): ${message}`);
        return;
    }

    clearTimeout(notificationTimeout);

    uiElements.notificationMessage.textContent = message;
    uiElements.notificationArea.className = 'notification';
    // Força reflow para reiniciar a animação, se necessário (pode não ser sempre preciso)
    void uiElements.notificationArea.offsetWidth;
    uiElements.notificationArea.classList.add(type, 'show');
    uiElements.notificationArea.style.display = 'flex';

    notificationTimeout = setTimeout(() => hideNotification(uiElements), duration);
}

/**
 * Esconde a área de notificação da UI.
 * @param {object} uiElements - Objeto contendo referência à área de notificação.
 * @param {HTMLElement} uiElements.notificationArea - O elemento container da notificação.
 * @returns {void} Esta função não retorna valor.
 * @public
 */
function hideNotification(uiElements) {
    if (!uiElements?.notificationArea) {
        return;
    }

    uiElements.notificationArea.classList.remove('show');

    const transitionDuration = 400; // <-- ALTERADO: Ajustado para corresponder ao CSS (0.4s)
    setTimeout(() => {
         if (!uiElements.notificationArea.classList.contains('show')) {
             uiElements.notificationArea.style.display = 'none';
             uiElements.notificationArea.className = 'notification';
         }
    }, transitionDuration);

    clearTimeout(notificationTimeout);
    notificationTimeout = null;
}

// Exporta as funções para serem usadas em outros módulos
export { showNotification, hideNotification };