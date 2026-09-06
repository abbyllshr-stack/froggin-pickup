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
// CACHE DE TEACHERS
// ==========================================

let teachersCache = null;


// ==========================================
// CARGAR TEACHERS
// ==========================================

async function cargarTeachers(){

    // Si ya están cargados,
    // devolver la lista guardada
    if(teachersCache){

        return teachersCache;

    }

    const respuesta = await fetch(
        API_URL + "?action=teachers"
    );

    teachersCache = await respuesta.json();

    return teachersCache;

}

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
        "🔍 Buscando...",
        ""
    );

    const url =
        API_URL +
        "?action=buscar&id=" +
        encodeURIComponent(texto);

    try{

        const respuesta = await fetch(url);

        const datos = await respuesta.json();

        // ==========================
        // NO ENCONTRADO
        // ==========================

        if(!datos.encontrado){

            mostrarMensaje(
                "❌ Código no encontrado",
                ""
            );

            procesando = false;

            return;

        }


        // ==========================
        // ES TEACHER
        // ==========================

        if(datos.tipo == "teacher"){

            mostrarPantallaTeacher(datos);

            procesando = false;

            return;

        }

// ==========================
// ES ALUMNO
// ==========================

console.log("DATOS DEL ALUMNO:", datos);
console.log("DATOS DEL ALUMNO:", datos);

console.log(
    "CLASE HOY:",
    datos.claseHoy,
    typeof datos.claseHoy
);

console.log(
    "FRECUENCIA:",
    datos.frecuencia
);

if(datos.claseHoy === true){

    // 🟢 Hoy le corresponde su clase normal
    await enviarSolicitudAutomatica(datos);

}else if(datos.claseHoy === false){

    // 📚 Hoy no le corresponde clase:
    // se detecta automáticamente como reposición
    await mostrarPantallaReposicion(datos);

}else{

    mostrarMensaje(
        "❌ Error de frecuencia",
        "No se pudo determinar si el alumno tiene clase hoy."
    );

    console.log("Valor recibido:", datos.claseHoy);
    console.log("Datos completos:", datos);

    procesando = false;

}

}catch(error){

    console.error("ERROR COMPLETO:", error);

    mostrarMensaje(
        "❌ Error",
        error.message || String(error)
    );

    procesando = false;

}

}
// ============================
// MOSTRAR PANTALLA TEACHER
// ============================

function mostrarPantallaTeacher(datos){

    const resultado =
        document.getElementById("resultado");

    resultado.innerHTML = `

        <h2>👩‍🏫 ${datos.nombre}</h2>

        <p>
            Select working hours
        </p>

        <select id="horasTeacher">

            <option value="">
                Select hours
            </option>

            <option value="1">1 hour</option>

            <option value="2">2 hours</option>

            <option value="4">4 hours</option>


        </select>

        <br><br>

        <button
            id="btnRegistrarTeacher"
            onclick="registrarTeacher('${datos.id}')">

            ✅ Register teacher

        </button>

    `;

}
// ============================
// REGISTRAR TEACHER
// ============================

async function registrarTeacher(id){

    const selectHoras =
        document.getElementById("horasTeacher");

    const horas =
        selectHoras.value;

    // ==========================
    // VALIDAR HORAS
    // ==========================

    if(!horas){

        alert(
            "Please select working hours."
        );

        return;

    }

    try{

        mostrarMensaje(
            "⏳ Registering teacher...",
            ""
        );

        const url =
            API_URL +
            "?action=registrarTeacher" +
            "&id=" +
            encodeURIComponent(id) +
            "&horas=" +
            encodeURIComponent(horas);

        const respuesta =
            await fetch(url);

        const resultado =
            await respuesta.json();

        console.log(resultado);

        // ==========================
        // REGISTRO EXITOSO
        // ==========================

        if(resultado.exito){

            mostrarMensaje(
                resultado.mensaje,
                ""
            );

        }else{

            mostrarMensaje(
                "❌ Could not register teacher",
                resultado.mensaje || ""
            );

        }

    }catch(error){

        console.error(error);

        mostrarMensaje(
            "❌ Error registering teacher",
            ""
        );

    }

    // Permitir volver a escanear
    procesando = false;

}
// ==========================================
// PANTALLA REPOSICIÓN
// ==========================================

async function mostrarPantallaReposicion(datos){

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
        </select>

        <br><br>

        <button id="btnEnviar">
            📨 Enviar solicitud
        </button>
        `
    );

    // ==========================
    // OBTENER TEACHERS DEL CACHE
    // ==========================

    const lista = await cargarTeachers();

    const select =
        document.getElementById("teacherSelect");

    // Limpiar opciones anteriores
    select.innerHTML = "";

    // Opción inicial
    const opcionInicial =
        document.createElement("option");

    opcionInicial.value = "";
    opcionInicial.textContent = "Select a teacher";
    opcionInicial.disabled = true;
    opcionInicial.selected = true;

    select.appendChild(opcionInicial);

    // Agregar teachers
    lista.forEach(teacher => {

        const option =
            document.createElement("option");

        option.value = teacher;
        option.textContent = teacher;

        select.appendChild(option);

    });

    // Evento del botón
    document
        .getElementById("btnEnviar")
        .addEventListener(
            "click",
            enviarSolicitud
        );

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

        const lista =
        document.getElementById("listaPendientes");

        if(!lista) return;

        lista.innerHTML = "";

        const pendientes =
        alumnos.filter(a => a.estado == "Pendiente");

        const entregados =
        alumnos.filter(a => a.estado == "Entregado");

        if(
            pendientes.length == 0 &&
            entregados.length == 0
        ){

            lista.innerHTML =
                "<p>🐸 No hay alumnos.</p>";

            return;

        }

        // ==========================
        // PENDIENTES
        // ==========================

        lista.innerHTML += `

            <h3>
                🟡 Pendientes (${pendientes.length})
            </h3>

        `;

        if(pendientes.length){

            pendientes.forEach(alumno => {

                lista.innerHTML += `

                    <div class="alumnoPendiente">

                        <strong>

                            ${alumno.alumno}

                        </strong>

                        <br>

                        ${alumno.grupo}

                        <br>

                        👩‍🏫 ${alumno.teacher}

                    </div>

                `;

            });

        }else{

            lista.innerHTML += `
                <p>No hay pendientes.</p>
            `;

        }

        // ==========================
        // ENTREGADOS
        // ==========================

        lista.innerHTML += `

            <hr>

            <h3>
                ✅ Entregados (${entregados.length})
            </h3>

        `;

        if(entregados.length){

            entregados.forEach(alumno => {

                lista.innerHTML += `

                    <div
                        class="alumnoPendiente"
                        style="opacity:.55;">

                        <strong>

                            ${alumno.alumno}

                        </strong>

                        <br>

                        ${alumno.grupo}

                        <br>

                        👩‍🏫 ${alumno.teacher}

                    </div>

                `;

            });

        }else{

            lista.innerHTML += `
                <p>No hay entregados.</p>
            `;

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

    // ==========================
    // BOTÓN HISTORIAL
    // ==========================

    const btnHistorial =
        document.getElementById("btnHistorial");

    btnHistorial.addEventListener(
        "click",
        mostrarPantallaHistorial
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
// ==========================================
// PRECARGAR TEACHERS
// ==========================================

cargarTeachers()
    .then(() => {

        console.log(
            "✅ Teachers cargados correctamente"
        );

    })
    .catch(error => {

        console.error(
            "❌ Error cargando teachers:",
            error
        );

    });
// ==========================================
// PANTALLA HISTORIAL
// ==========================================

function mostrarPantallaHistorial(){

    const resultado =
        document.getElementById("resultado");

    resultado.innerHTML = `

        <h2>📊 Attendance History</h2>

        <label>
            👤 Student
        </label>

        <br><br>

        <select id="filtroAlumno">

            <option value="">
                All students
            </option>

        </select>

        <br><br>


        <label>
            👥 Group
        </label>

        <br><br>

        <select id="filtroGrupo">

            <option value="">
                All groups
            </option>

        </select>

        <br><br>


        <label>
            📅 Month
        </label>

        <br><br>

        <select id="filtroMes">

            <option value="">
                All months
            </option>

            <option value="ENERO">January</option>
            <option value="FEBRERO">February</option>
            <option value="MARZO">March</option>
            <option value="ABRIL">April</option>
            <option value="MAYO">May</option>
            <option value="JUNIO">June</option>
            <option value="JULIO">July</option>
            <option value="AGOSTO">August</option>
            <option value="SEPTIEMBRE">September</option>
            <option value="OCTUBRE">October</option>
            <option value="NOVIEMBRE">November</option>
            <option value="DICIEMBRE">December</option>

        </select>

        <br><br>


        <label>
            🗓️ Specific date
        </label>

        <br><br>

        <input
            type="date"
            id="filtroFecha"
        >

        <br><br>


        <button id="btnBuscarHistorial">

            🔍 Search

        </button>

        <br><br>

        <button id="btnVolver">

            ← Back

        </button>

    `;


    document
        .getElementById("btnBuscarHistorial")
        .addEventListener(
            "click",
            buscarHistorial
        );


    document
        .getElementById("btnVolver")
        .addEventListener(
            "click",
            volverInicio
        );

}
