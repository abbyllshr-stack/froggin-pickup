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
// ==========================================
// CÁMARA
// ==========================================

function iniciarCamara(){

    Html5Qrcode.getCameras()

    .then(cameras => {

        if(cameras.length === 0){
            throw "No se encontró ninguna cámara.";
        }

        return reader.start(

            { facingMode: "environment" },

            {
                fps:5,
                qrbox:250,
                disableFlip:true
            },

            codigoDetectado

        );

    })

    .catch(error => {

        mostrarError(error);

    });

}
// ==========================================
// INTERFAZ
// ==========================================

function mostrarError(error){

    document.getElementById("resultado").innerHTML = `
        <h2>❌ Error</h2>
        <p>${error}</p>
    `;

    console.error(error);

}
