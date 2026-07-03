const API_URL = "https://script.google.com/macros/s/AKfycbxnfKzj1Fdd31lNaRgEveoz_Fk0z28tB61LhTRry6pFdZTfSZb3HXtzV0YF6opYdjoC/exec";

const reader = new Html5Qrcode("reader");
let procesando = false;
function iniciarCamara(){

    Html5Qrcode.getCameras()

    .then(cameras => {

        if(cameras.length === 0){
            throw "No se encontró ninguna cámara.";
        }

        return reader.start(

            { facingMode: "environment" },

            {
                fps:10,
                qrbox:250
            },

            codigoDetectado

        );

    })

    .catch(error=>{

        document.getElementById("resultado").innerHTML = `
            <h2>❌ Error</h2>
            <p>${error}</p>
        `;

    });

}

async function codigoDetectado(texto){

    if(procesando) return;

procesando = true;
    
    document.getElementById("resultado").innerHTML = `
        <h2>🔍 Buscando alumno...</h2>
    `;

    const url = API_URL + "?action=buscar&id=" + encodeURIComponent(texto);

    try{

        const respuesta = await fetch(url);

        const datos = await respuesta.json();

        if(datos.encontrado){

            document.getElementById("resultado").innerHTML = `
                <h2>✅ Solicitud enviada</h2>
                <p><strong>${datos.alumno}</strong></p>
                <p>${datos.grupo}</p>
                <p>👩‍🏫 ${datos.teacher}</p>
            `;

        }else{

            document.getElementById("resultado").innerHTML = `
                <h2>❌ Alumno no encontrado</h2>
            `;

        }
setTimeout(() => {

    procesando = false;

    document.getElementById("resultado").innerHTML = `
        <h2>🟢 Listo para escanear</h2>
    `;

},2000);
    }catch(error){
        procesando = false;
        document.getElementById("resultado").innerHTML = `
            <h2>❌ Error</h2>
            <p>${error}</p>
        `;

    }

}

window.onload = iniciarCamara;
