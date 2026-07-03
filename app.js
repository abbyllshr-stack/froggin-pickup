// ==========================================
// FROGGIN PICKUP v1.1
// ==========================================

// ---------- CONFIGURACIÓN ----------

const API_URL = "https://script.google.com/macros/s/AKfycbxnfKzj1Fdd31lNaRgEveoz_Fk0z28tB61LhTRry6pFdZTfSZb3HXtzV0YF6opYdjoC/exec";

// ---------- VARIABLES ----------

const reader = new Html5Qrcode("reader");

let procesando = false;

// ---------- INICIO ----------

window.onload = () => {

    iniciarCamara();

    cargarPendientes();

    setInterval(cargarPendientes,2000);

};
