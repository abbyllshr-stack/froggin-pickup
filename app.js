// ==========================================
// FROGGIN PICKUP v1.1
// ==========================================

// ---------- CONFIGURACIÓN ----------

const API_URL = CONFIG.API_URL;

// ---------- VARIABLES ----------

const reader = new Html5Qrcode("reader");

let procesando = false;

let alumnoActual = "";

// ==========================================
// CÁMARA
// ==========================================

function iniciarCamara() {

    Html5Qrcode.getCameras()

    .then(cameras => {

        if (cameras.length === 0) {
            throw "No se encontró ninguna cámara.";
        }

        return reader.start(

            { facingMode: CONFIG.CAMERA.facingMode },

            {
                fps: CONFIG.CAMERA.fps,
                qrbox: CONFIG.CAMERA.qrbox,
                disableFlip: true
            },

            codigoDetectado

        );

    })

    .catch(error => {

        mostrarMensaje(
            "❌ Error",
            error
        );

        console.error(error);

    });

}

// ==========================================
// ESCANEO
// ==========================================

async function codigoDetectado(texto){

    if(procesando) return;

    procesando = true;
    alumnoActual = texto;

    mostrarMensaje(
        "🔍 Buscando alumno...",
        ""
    );

    const url =
        API_URL +
        "?action=buscar&id=" +
        encodeURIComponent(texto);

    try{

        const respuesta = await fetch(url);

        const datos = await respuesta.json();

        if(datos.encontrado){

            mostrarMensaje(

    "✅ Alumno encontrado",

    `
    <strong>${datos.alumno}</strong><br>
    ${datos.grupo}<br><br>

    <label><strong>Teacher:</strong></label><br>

    <select id="teacherSelect">

        <option ${datos.teacher=="Angel"?"selected":""}>Angel</option>

        <option ${datos.teacher=="Chantal"?"selected":""}>Chantal</option>

        <option ${datos.teacher=="Mariana"?"selected":""}>Mariana</option>

    </select>

    <br><br>

    <button id="btnEnviar">
        📨 Enviar solicitud
    </button>

    `

);
           document.getElementById("btnEnviar").addEventListener("click", function(){

    enviarSolicitud();

});

            cargarPendientes();

        }else{

            mostrarMensaje(
                "❌ Alumno no encontrado",
                ""
            );

        }

    }catch(error){

        mostrarMensaje(
            "❌ Error",
            error
        );

        console.error(error);

    }

}
// ==========================================
// PENDIENTES
// ==========================================

async function cargarPendientes(){

    try{

        const respuesta = await fetch(
            API_URL + "?action=pendientes"
        );

        const alumnos = await respuesta.json();

        const lista = document.getElementById("listaPendientes");

        if(!lista) return;

        lista.innerHTML = "";

        if(alumnos.length === 0){

            lista.innerHTML =
                "<p>🐸 No hay alumnos pendientes.</p>";

            return;

        }

        alumnos.forEach(alumno=>{

            lista.innerHTML += `
                <div class="alumnoPendiente">
                    <strong>${alumno.alumno}</strong><br>
                    ${alumno.grupo}
                </div>
            `;

        });

    }catch(error){

        console.error(error);

    }

}

// ==========================================
// INTERFAZ
// ==========================================

function mostrarMensaje(titulo, contenido){

    document.getElementById("resultado").innerHTML = `
        <h2>${titulo}</h2>
        ${contenido}
    `;

}
// ==========================================
// INICIO
// ==========================================

window.onload = () => {

    iniciarCamara();

    cargarPendientes();

    setInterval(
        cargarPendientes,
        CONFIG.REFRESH_TIME
    );

};

// ==========================================
// ENVIAR SOLICITUD
// ==========================================
async function enviarSolicitud(){

    const teacher =
        document.getElementById("teacherSelect").value;

    const url =
        API_URL +
        "?action=enviar" +
        "&id=" + encodeURIComponent(alumnoActual) +
        "&teacher=" + encodeURIComponent(teacher);

    try{

        const respuesta = await fetch(url);

        const resultado = await respuesta.json();

        if(resultado){

            mostrarMensaje(
                "✅ Solicitud enviada",
                `
                Se notificó a:<br>
                <strong>${teacher}</strong>
                `
            );

            cargarPendientes();

            alumnoActual = "";

            procesando = false;

        }else{

            mostrarMensaje(
                "❌ Error",
                "No fue posible enviar la solicitud."
            );

            procesando = false;

        }

    }catch(error){

        console.error(error);

        mostrarMensaje(
            "❌ Error",
            error
        );

        procesando = false;

    }

}
