// ==========================================
// FROGGIN PICKUP v1.1
// ==========================================

// ---------- CONFIGURACIÓN ----------

const API_URL = CONFIG.API_URL;

// ---------- VARIABLES ----------

const reader = new Html5Qrcode("reader");

let procesando = false;

let alumnoActual = "";

let cargandoPendientes = false;

let alumnosReposicion = [];

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

    // ==========================
    // OBTENER LISTA DE HERMANOS
    // ==========================

    const hermanos =
        datos.hermanos || [datos];
        alumnosReposicion = hermanos;


    // ==========================
    // CARGAR TEACHERS
    // ==========================

    const respuesta = await fetch(
        API_URL + "?action=teachers"
    );

    const lista = await respuesta.json();


    // ==========================
    // CREAR CONTENIDO
    // ==========================

    let contenido = `
        <div class="nombreAlumno">
            📚 Reposición
        </div>

        <br>
    `;


    hermanos.forEach((alumno, index) => {

        contenido += `

            <div class="grupoAlumno"
                 style="margin-bottom:5px;">
                ${alumno.alumno}
            </div>

            <div style="
                font-size:14px;
                margin-bottom:10px;
            ">
                ${alumno.grupo}
            </div>

            <label class="labelTeacher">
                👩‍🏫 Teacher
            </label>

            <br><br>

            <select
                id="teacherSelect_${alumno.fila}"
                style="margin-bottom:25px;"
            >

                <option
                    value=""
                    disabled
                    selected
                >
                    Select a teacher
                </option>

            </select>

        `;

    });


    contenido += `

        <button id="btnEnviar">
            📨 Enviar solicitudes
        </button>

    `;


    // ==========================
    // MOSTRAR PANTALLA
    // ==========================

    mostrarMensaje(
        "",
        contenido
    );


    // ==========================
    // LLENAR CADA SELECT
    // ==========================

    hermanos.forEach(alumno => {

        const select =
            document.getElementById(
                `teacherSelect_${alumno.fila}`
            );

        if(!select) return;


        lista.forEach(teacher => {

            const option =
                document.createElement("option");

            option.value = teacher;
            option.textContent = teacher;

            select.appendChild(option);

        });

    });


    // ==========================
    // POR AHORA NO ENVIAMOS
    // ==========================
    //
    // El botón se conectará
    // en el siguiente paso.
    //
document
    .getElementById("btnEnviar")
    .addEventListener(
        "click",
        enviarSolicitudesReposicion
    );
}
// ==========================================
// ENVIAR SOLICITUDES DE REPOSICIÓN
// ==========================================

async function enviarSolicitudesReposicion(){

    const boton =
        document.getElementById("btnEnviar");

    boton.disabled = true;

    boton.textContent =
        "📨 Enviando...";

    for(const alumno of alumnosReposicion){

        const select =
            document.getElementById(
                `teacherSelect_${alumno.fila}`
            );

        if(!select || !select.value){

            mostrarMensaje(
                "⚠️ Falta seleccionar teacher",
                `Selecciona un teacher para ${alumno.alumno}.`
            );

            boton.disabled = false;

            boton.textContent =
                "📨 Enviar solicitudes";

                        return;
        }

    }


    for(const alumno of alumnosReposicion){

        const select =
            document.getElementById(
                `teacherSelect_${alumno.fila}`
            );

        const teacher =
            select.value;

        const url =
            API_URL +
            "?action=enviar" +
            "&fila=" +
            encodeURIComponent(alumno.fila) +
            "&teacher=" +
            encodeURIComponent(teacher);

        const respuesta =
            await fetch(url);

        const resultado =
            await respuesta.json();

    }
    mostrarMensaje(
        "✅ Solicitudes enviadas",
        "Las solicitudes fueron enviadas correctamente."
    );

    cargarPendientes();

    alumnoActual = "";
    procesando = false;
    modoReposicion = false;
}
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

    if(cargandoPendientes) return;

    cargandoPendientes = true;

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

    }finally{

        cargandoPendientes = false;

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

    if (btnHistorial) {
        btnHistorial.addEventListener(
            "click",
            mostrarPantallaHistorial
        );
    }

    // ==========================
    // BOTÓN CUMPLEAÑOS
    // ==========================

    const btnCumpleanos =
        document.getElementById("btnCumpleanos");

    if (btnCumpleanos) {
        btnCumpleanos.addEventListener(
            "click",
            mostrarPantallaCumpleanos
        );
    }

    // ==========================
    // VOLVER A RECEPCIÓN
    // ==========================

    const btnVolverCumpleanos =
        document.getElementById("btnVolverCumpleanos");

    if (btnVolverCumpleanos) {
        btnVolverCumpleanos.addEventListener(
            "click",
            cerrarPantallaCumpleanos
        );
    }

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

// ==========================================
// PANTALLA HISTORIAL
// ==========================================

// ==========================================
// VOLVER AL INICIO
// ==========================================

function volver(){

    // Permitir escanear nuevamente
    procesando = false;

    // Limpiar alumno actual
    alumnoActual = "";

    // Regresar mensaje inicial
    mostrarMensaje(
        "🟢 Listo para escanear",
        ""
    );

}

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

        <button id="btnCerrarHistorial">

    ✕ Close

</button>

    `;


    // CARGAR LAS LISTAS
    cargarAlumnosHistorial();
    cargarGruposHistorial();


    // BOTÓN SEARCH
    document
        .getElementById("btnBuscarHistorial")
        .addEventListener(
            "click",
            buscarHistorial
        );


    // BOTÓN CLOSE
    document
    .getElementById("btnCerrarHistorial")
    .addEventListener(
        "click",
        cerrarHistorial
    );

}
// ==========================================
// CARGAR ALUMNOS PARA HISTORIAL
// ==========================================

async function cargarAlumnosHistorial(){

    try{

        const respuesta =
            await fetch(
                API_URL + "?action=alumnos"
            );

        const alumnos =
            await respuesta.json();

        const select =
            document.getElementById(
                "filtroAlumno"
            );

        alumnos.forEach(alumno => {

            const option =
                document.createElement("option");

            option.value = alumno;
            option.textContent = alumno;

            select.appendChild(option);

        });

    }catch(error){

        console.error(
            "Error cargando alumnos:",
            error
        );

    }

}


// ==========================================
// CARGAR GRUPOS PARA HISTORIAL
// ==========================================

async function cargarGruposHistorial(){

    try{

        const respuesta =
            await fetch(
                API_URL + "?action=grupos"
            );

        const grupos =
            await respuesta.json();

        const select =
            document.getElementById(
                "filtroGrupo"
            );

        grupos.forEach(grupo => {

            const option =
                document.createElement("option");

            option.value = grupo;
            option.textContent = grupo;

            select.appendChild(option);

        });

    }catch(error){

        console.error(
            "Error cargando grupos:",
            error
        );

    }

}

// ==========================================
// BUSCAR HISTORIAL
// ==========================================

async function buscarHistorial(){

    // ==========================
    // OBTENER FILTROS
    // ==========================

    const alumno =
        document.getElementById("filtroAlumno").value;

    const grupo =
        document.getElementById("filtroGrupo").value;

    const mes =
        document.getElementById("filtroMes").value;

    const fecha =
        document.getElementById("filtroFecha").value;


    // ==========================
    // MOSTRAR CARGANDO
    // ==========================

    const boton =
        document.getElementById(
            "btnBuscarHistorial"
        );

    boton.textContent = "⏳ Searching...";

    boton.disabled = true;


    try{

        // ==========================
        // CONSTRUIR URL
        // ==========================

        let url =
            API_URL +
            "?action=historial";


        if(alumno){

            url +=
                "&alumno=" +
                encodeURIComponent(alumno);

        }


        if(grupo){

            url +=
                "&grupo=" +
                encodeURIComponent(grupo);

        }


        if(mes){

            url +=
                "&mes=" +
                encodeURIComponent(mes);

        }


        if(fecha){

            url +=
                "&fecha=" +
                encodeURIComponent(fecha);

        }


        // ==========================
        // CONSULTAR BACKEND
        // ==========================

        const respuesta =
            await fetch(url);

        const datos =
            await respuesta.json();


        console.log(
            "HISTORIAL:",
            datos
        );


        // ==========================
        // MOSTRAR RESULTADOS
        // ==========================

        mostrarResultadosHistorial(
            datos
        );


    }catch(error){

        console.error(error);

        alert(
            "Error searching attendance history."
        );

        boton.textContent =
            "🔍 Search";

        boton.disabled = false;

    }

}
// ==========================================
// MOSTRAR RESULTADOS HISTORIAL
// ==========================================

function mostrarResultadosHistorial(datos){

    const resultado =
        document.getElementById("resultado");


    // ==========================
    // VALIDAR RESULTADOS
    // ==========================

    if(
        !datos.exito ||
        !datos.resultados ||
        datos.resultados.length === 0
    ){

        resultado.innerHTML = `

            <h2>
                📊 Attendance History
            </h2>

            <p>
                No attendance records found.
            </p>

            <br>

            <button
                onclick="mostrarPantallaHistorial()">

                ← Back to filters

            </button>

        `;

        return;

    }


    // ==========================
    // CREAR LISTA
    // ==========================

    // ==========================
    // MOSTRAR RESUMEN POR GRUPO Y MES
    // ==========================
    if (datos.modoResumen) {

        let html = `
            <h2>📊 Resumen de faltas</h2>
            <p>Alumnos del grupo: ${datos.total}</p>
            <hr>
        `;

        datos.resultados.forEach(registro => {

            html += `
                <div class="registroHistorial">
                    <strong>${registro.alumno}</strong>
                    <br>
                    👥 ${registro.grupo}
                    <br>
                    ❌ Faltas: ${registro.faltas}
                </div>
                <hr>
            `;

        });

        html += `
            <button onclick="mostrarPantallaHistorial()">
                ← Back to filters
            </button>
        `;

        resultado.innerHTML = html;
        return;

    }

    let html = `

        <h2>
            📊 Results
        </h2>

        <p>
            Records found: ${datos.total}
        </p>

        <hr>

    `;


    
    // ==========================
    // SEPARAR FALTAS Y ASISTENCIAS
    // ==========================

    const faltas = datos.resultados.filter(registro =>
        registro.estado === "Absent"
    );

    const asistencias = datos.resultados.filter(registro =>
        registro.estado === "Present"
    );

    // ==========================
    // MOSTRAR FALTAS PRIMERO
    // ==========================

    html += `<h3>❌ Faltas (${faltas.length})</h3>`;

    faltas.forEach(registro => {

        html += `
            <div class="registroHistorial">
                <strong>
                    ❌ ${registro.alumno}
                </strong>

                <br>

                👥 ${registro.grupo}

                <br>

                📅 ${registro.fecha}

                <br>

                Absent
            </div>

            <hr>
        `;
    });

    // ==========================
    // MOSTRAR ASISTENCIAS DESPUÉS
    // ==========================

    html += `<h3>✔ Asistencias (${asistencias.length})</h3>`;

    asistencias.forEach(registro => {

        html += `
            <div class="registroHistorial">
                <strong>
                    ✔ ${registro.alumno}
                </strong>

                <br>

                👥 ${registro.grupo}

                <br>

                📅 ${registro.fecha}

                <br>

                Present
            </div>

            <hr>
        `;
    });

    // ==========================
    // BOTÓN VOLVER
    // ==========================

    html += `

        <button
            onclick="mostrarPantallaHistorial()">

            ← Back to filters

        </button>

    `;


    resultado.innerHTML = html;

}
// ==========================================
// CERRAR HISTORIAL
// ==========================================

function cerrarHistorial(){

    mostrarMensaje(
        "🟢 Listo para escanear",
        ""
    );

    procesando = false;

}

/* ==========================================
   PANTALLA TODAY'S BIRTHDAYS
========================================== */

async function mostrarPantallaCumpleanos() {

    // Detener el escáner mientras vemos cumpleaños
    try {
        await reader.stop();
    } catch (error) {
        console.log("La cámara ya estaba detenida.");
    }

    // Ocultar elementos de recepción
    document.getElementById("reader").style.display = "none";
    document.getElementById("btnReposicion").style.display = "none";
    document.getElementById("btnCumpleanos").style.display = "none";
    document.getElementById("resultado").style.display = "none";
    document.getElementById("listaPendientes").style.display = "none";

    const lista = document.getElementById("listaPendientes");
    if (lista.previousElementSibling) {
        lista.previousElementSibling.style.display = "none";
    }

    const pantalla = document.getElementById("pantallaCumpleanos");
    pantalla.style.display = "block";

    await cargarCumpleanosHoy();
}


/* ==========================================
   CARGAR CUMPLEAÑOS DE HOY
========================================== */

async function cargarCumpleanosHoy() {

    const lista = document.getElementById("listaCumpleanos");

    lista.innerHTML = "<p>⏳ Cargando cumpleaños...</p>";

    try {

        const respuesta = await fetch(
            API_URL + "?action=cumpleanosHoy"
        );

        const datos = await respuesta.json();

        if (!datos.exito) {
            lista.innerHTML =
                "<p>❌ No se pudieron cargar los cumpleaños.</p>";
            return;
        }

        if (!datos.resultados || datos.resultados.length === 0) {
            lista.innerHTML = `
                <p>🎉 No hay cumpleaños pendientes de entrega para hoy.</p>
            `;
            return;
        }

        lista.innerHTML = "";

        datos.resultados.forEach(alumno => {

            const tarjeta = document.createElement("div");

            tarjeta.style.cssText = `
                border: 1px solid #d8d8d8;
                border-radius: 10px;
                padding: 15px;
                margin: 12px 0;
                background: #ffffff;
                text-align: left;
                box-shadow: 0 2px 5px rgba(0,0,0,0.08);
            `;

            const cumpleanos = formatearFechaCumpleanos(
                alumno.cumpleanos
            );

            const fechaIdeal = formatearFechaCumpleanos(
                alumno.fechaIdeal
            );

            tarjeta.innerHTML = `
                <h3 style="margin-top:0;">
                    🎂 ${alumno.alumno || "Sin nombre"}
                </h3>

                <p><strong>ID:</strong> ${alumno.id ?? ""}</p>
                <p><strong>Cumpleaños:</strong> ${cumpleanos}</p>
                <p><strong>Fecha ideal de entrega:</strong> ${fechaIdeal}</p>
                <p><strong>Estatus:</strong> 🟡 Pendiente</p>

                <button
                    type="button"
                    class="btnEntregarCumpleanos"
                    data-fila="${alumno.fila}">
                    🎁 Entregado
                </button>
            `;

            lista.appendChild(tarjeta);

        });

        lista.querySelectorAll(".btnEntregarCumpleanos")
            .forEach(boton => {
                boton.addEventListener("click", marcarCumpleanosEntregado);
            });

    } catch (error) {

        console.error("Error cargando cumpleaños:", error);

        lista.innerHTML = `
            <p>❌ Error de conexión al cargar los cumpleaños.</p>
            <button type="button" onclick="cargarCumpleanosHoy()">
                🔄 Intentar de nuevo
            </button>
        `;
    }
}


/* ==========================================
   MARCAR CUMPLEAÑOS COMO ENTREGADO
========================================== */

async function marcarCumpleanosEntregado(evento) {

    const boton = evento.currentTarget;
    const fila = boton.dataset.fila;

    boton.disabled = true;
    boton.textContent = "⏳ Guardando...";

    try {

        const respuesta = await fetch(
            API_URL +
            "?action=entregarCumpleanos&fila=" +
            encodeURIComponent(fila)
        );

        const resultado = await respuesta.json();

        if (!resultado.exito) {

            alert(resultado.mensaje || "No se pudo registrar la entrega.");

            boton.disabled = false;
            boton.textContent = "🎁 Entregado";
            return;
        }

        // Actualizar la lista para retirar la tarjeta entregada
        await cargarCumpleanosHoy();

    } catch (error) {

        console.error("Error registrando entrega:", error);

        alert("Ocurrió un error al guardar la entrega.");

        boton.disabled = false;
        boton.textContent = "🎁 Entregado";
    }
}


/* ==========================================
   FORMATEAR FECHAS
========================================== */

function formatearFechaCumpleanos(valor) {

    if (!valor) return "Sin fecha";

    // Fechas tipo yyyy-MM-dd
    const texto = String(valor);

    const fechaSimple = texto.match(
        /^(\d{4})-(\d{2})-(\d{2})$/
    );

    if (fechaSimple) {
        return `${fechaSimple[3]}/${fechaSimple[2]}/${fechaSimple[1]}`;
    }

    // Fechas ISO recibidas desde Google Apps Script
    const fecha = new Date(valor);

    if (isNaN(fecha.getTime())) {
        return texto;
    }

    return fecha.toLocaleDateString("es-MX", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        timeZone: "UTC"
    });
}


/* ==========================================
   VOLVER A RECEPCIÓN
========================================== */

async function cerrarPantallaCumpleanos() {

    document.getElementById("pantallaCumpleanos").style.display = "none";

    document.getElementById("reader").style.display = "";
    document.getElementById("btnReposicion").style.display = "";
    document.getElementById("btnCumpleanos").style.display = "";
    document.getElementById("resultado").style.display = "";
    document.getElementById("listaPendientes").style.display = "";

    const lista = document.getElementById("listaPendientes");

    if (lista.previousElementSibling) {
        lista.previousElementSibling.style.display = "";
    }

    mostrarMensaje("🟢 Listo para escanear", "");

    cargarPendientes();
    iniciarCamara();
}
