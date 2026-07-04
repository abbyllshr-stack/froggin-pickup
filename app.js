// ==========================================
// FROGGIN PICKUP v1.1
// ==========================================

// ---------- CONFIGURACIÓN ----------

const API_URL = CONFIG.API_URL;

// ---------- VARIABLES ----------

const reader = new Html5Qrcode("reader");

let procesando = false;

let alumnoActual = "";

let modoReposicion = false;

// ==========================================
// CÁMARA
// ==========================================

function iniciarCamara() {

    Html5Qrcode.getCameras()

    .then(cameras => {

        if(cameras.length === 0){

            throw "No se encontró ninguna cámara.";

        }

        return reader.start(

            {
                facingMode: "environment"
            },

            {

                fps: 5,

                qrbox: {
                    width: 240,
                    height: 240
                },

                aspectRatio: 1,

                disableFlip: true

            },

            codigoDetectado

        );

    })

    .catch(error => {

        console.error(error);

        mostrarMensaje(
            "❌ Error",
            error
        );

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

            const urlEnviar =
                API_URL +
                "?action=enviar" +
                "&id=" + encodeURIComponent(alumnoActual) +
                "&teacher=" + encodeURIComponent(datos.teacher);

            const respuestaEnviar = await fetch(urlEnviar);

            const enviado = await respuestaEnviar.json();

            if(enviado){

                mostrarMensaje(
                    "✅ Solicitud enviada",
                    `
                    <div class="nombreAlumno">
                        ${datos.alumno}
                    </div>

                    <div class="grupoAlumno">
                        ${datos.grupo}
                    </div>

                    <p>
                        👩‍🏫 ${datos.teacher}
                    </p>
                    `
                );

                cargarPendientes();

            }else{

                mostrarMensaje(
                    "❌ Error",
                    "No fue posible enviar la solicitud."
                );

            }

        }else{

            mostrarMensaje(
                "❌ Alumno no encontrado",
                ""
            );

        }

    }catch(error){

        console.error(error);

        mostrarMensaje(
            "❌ Error",
            error
        );

    }

    setTimeout(()=>{

        procesando = false;

        alumnoActual = "";

        mostrarMensaje(
            "🟢 Listo para escanear",
            ""
        );

    },2000);

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

        alumnos.forEach(alumno => {

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

    document.getElementById("btnReposicion").addEventListener("click", function(){

        modoReposicion = true;

        mostrarMensaje(
            "📚 Modo reposición",
            "Escanea el alumno."
        );

    });

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
