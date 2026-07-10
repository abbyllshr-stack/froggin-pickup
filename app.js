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

            if(modoReposicion){

                mostrarPantallaReposicion(datos);

            }else{

                enviarSolicitudAutomatica(datos);

            }

        }else{

            mostrarMensaje(
                "❌ Alumno no encontrado",
                ""
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
// ==========================================
// PANTALLA REPOSICIÓN
// ==========================================

function mostrarPantallaReposicion(datos){

    mostrarMensaje(

        "📚 Reposición",

        `
        <div class="nombreAlumno">

            ${datos.alumno}

        </div>

        <div class="grupoAlumno">

            ${datos.grupo}

        </div>

        <br>

        <label class="labelTeacher">

            👩‍🏫 Teacher

        </label>

        <br><br>

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

    document
        .getElementById("btnEnviar")
        .addEventListener("click", enviarSolicitud);

}
// ==========================================
// ENVÍO AUTOMÁTICO
// ==========================================

async function enviarSolicitudAutomatica(datos){

const url =
    API_URL +
    "?action=enviar" +
    "&id=" + encodeURIComponent(alumnoActual);

    try{

        const respuesta = await fetch(url);

        const enviado = await respuesta.json();

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

            alumnoActual = "";

            procesando = false;

            setTimeout(function(){

                mostrarMensaje(
                    "🟢 Listo para escanear",
                    ""
                );

            },2000);

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

        const pendientes = alumnos.filter(
            alumno => alumno.estado == "Pendiente"
        );

        const entregados = alumnos.filter(
            alumno => alumno.estado == "Entregado"
        );

        lista.innerHTML = "";

        // ==========================
        // PENDIENTES
        // ==========================

        lista.innerHTML += `
            <h3>⚠️ Pendientes (${pendientes.length})</h3>
        `;

        if(pendientes.length == 0){

            lista.innerHTML += `
                <p>Sin alumnos pendientes.</p>
            `;

        }else{

            pendientes.forEach(alumno=>{

                lista.innerHTML += `
                    <div class="alumnoPendiente">

                        <strong>${alumno.alumno}</strong><br>

                        ${alumno.grupo}

                    </div>
                `;

            });

        }

        // ==========================
        // ENTREGADOS
        // ==========================

        lista.innerHTML += `
            <hr>

            <h3>✅ Entregados (${entregados.length})</h3>
        `;

        if(entregados.length == 0){

            lista.innerHTML += `
                <p>Aún no hay alumnos entregados.</p>
            `;

        }else{

            entregados.forEach(alumno=>{

                lista.innerHTML += `
                    <div class="alumnoPendiente">

                        <strong>${alumno.alumno}</strong><br>

                        ${alumno.grupo}

                    </div>
                `;

            });

        }

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

    const btnReposicion =
        document.getElementById("btnReposicion");

    btnReposicion.addEventListener("click", function(){

        modoReposicion = !modoReposicion;

        if(modoReposicion){

            btnReposicion.innerHTML =
                "❌ Cancelar reposición";

            btnReposicion.style.background =
                "#E53935";

            mostrarMensaje(
                "📚 Modo reposición",
                "Escanea el alumno que tomará una clase de reposición."
            );

        }else{

            btnReposicion.innerHTML =
                "📚 Reposición";

            btnReposicion.style.background =
                "#FF9800";

            mostrarMensaje(
                "🟢 Listo para escanear",
                ""
            );

        }

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
                <div class="nombreAlumno">
                    Solicitud enviada a
                </div>

                <div class="grupoAlumno">
                    ${teacher}
                </div>
                `
            );

            cargarPendientes();

            alumnoActual = "";

            procesando = false;

            modoReposicion = false;

            setTimeout(() => {

                mostrarMensaje(
                    "🟢 Listo para escanear",
                    ""
                );

            },2000);

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
