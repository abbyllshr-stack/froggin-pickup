const reader = new Html5Qrcode("reader");

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

        document.getElementById("resultado").innerHTML=`
            <h2>❌ Error</h2>
            <p>${error}</p>
        `;

    });

}

function codigoDetectado(texto){

    reader.stop();

    document.getElementById("resultado").innerHTML=`
        <h2>✅ QR leído</h2>
        <p>${texto}</p>
    `;

}

window.onload=iniciarCamara;
