export const showCustomAlert = (message, isError = false) => {
    const alert = document.createElement('div');
    alert.className = `custom-alert ${isError ? 'error' : 'success'}`;
    alert.innerHTML = `
        <span class="alert-icon">${isError ? '⚠️' : '✅'}</span>
        ${message}
    `;
    document.body.appendChild(alert);
    setTimeout(() => alert.remove(), 3000);
};