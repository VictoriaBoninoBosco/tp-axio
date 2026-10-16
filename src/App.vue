
<template>
  <!-- Contenedor principal de toda la página -->
  <main class="pagina">

    <!-- ENCABEZADO: nombre de la aplicación y botón para actualizar -->
    <header class="encabezado">
      <div class="marca">
        <div class="logo">$</div>
        <div>
          <h1>Dólar<span>Verde</span></h1>
          <p>Cotizaciones de Argentina</p>
        </div>
      </div>

      <!-- Vuelve a consultar la API cuando hacemos clic -->
      <button class="boton-actualizar" @click="obtenerDolares">
        Actualizar cotizaciones
      </button>
    </header>

    <!-- PRESENTACIÓN DE LA PÁGINA -->
    <section class="bienvenida">
      <p class="etiqueta">MERCADO CAMBIARIO</p>
      <h2>Tu dinero, en otra moneda.</h2>
      <p>Consultá las cotizaciones y calculá tus operaciones.</p>
    </section>

    <!-- SECCIÓN QUE MUESTRA LOS DISTINTOS TIPOS DE DÓLAR -->
    <section class="seccion-cotizaciones">
      <div class="titulo-seccion">
        <div>
          <h2>Cotizaciones del dólar</h2>
          <p>Valores expresados en pesos argentinos.</p>
        </div>

        <!-- Se muestra cuando se cargaron las cotizaciones -->
        <span class="estado" v-if="!cargando && dolares.length">
          Cotizaciones cargadas
        </span>
      </div>

      <!-- Mensaje que aparece mientras se consultan los datos -->
      <p v-if="cargando" class="mensaje">
        Cargando cotizaciones...
      </p>

      <!-- Muestra un mensaje si ocurre un error -->
      <p v-else-if="error" class="error">
        {{ error }}
      </p>

      <!-- v-for crea una tarjeta por cada dólar recibido desde la API -->
      <div v-else class="tarjetas">
        <article
          v-for="dolar in dolares"
          :key="dolar.casa"
          class="tarjeta"
          :class="{ seleccionada: dolarSeleccionado === dolar.casa }"
          @click="dolarSeleccionado = dolar.casa"
        >
          <div class="tarjeta-superior">
            <span class="punto-verde"></span>

            <!-- Nombre del tipo de dólar -->
            <span class="nombre">{{ dolar.nombre }}</span>
          </div>

          <!-- Precio de venta destacado -->
          <p class="precio">
            {{ formatoPesos(dolar.venta) }}
          </p>
          <p class="subtitulo">Precio de venta</p>

          <!-- Muestra los precios de compra y venta -->
          <div class="detalle-precios">
            <div>
              <span>Compra</span>
              <strong>{{ formatoPesos(dolar.compra) }}</strong>
            </div>

            <div>
              <span>Venta</span>
              <strong>{{ formatoPesos(dolar.venta) }}</strong>
            </div>
          </div>

          <!-- Selecciona esta cotización para usarla en el formulario -->
          <button
            class="boton-elegir"
            @click.stop="dolarSeleccionado = dolar.casa"
          >
            {{ dolarSeleccionado === dolar.casa
              ? 'Dólar seleccionado'
              : 'Seleccionar dólar' }}
          </button>
        </article>
      </div>

      <!-- Fecha de actualización proporcionada por la API -->
      <p v-if="fechaActualizacion" class="fecha">
        Última actualización: {{ fechaActualizacion }}
      </p>

      <p class="fuente">Fuente de datos: DolarApi.com</p>
    </section>

    <!-- SECCIÓN DEL FORMULARIO PARA COMPRAR O VENDER -->
    <section class="seccion-conversor">

      <!-- Resumen de la cotización seleccionada -->
      <div class="texto-conversor">
        <p class="etiqueta">CALCULADORA</p>
        <h2>Compra y venta</h2>
        <p>
          Calculá cuánto dinero necesitás o cuánto vas a recibir
          según la cotización elegida.
        </p>

        <div class="resumen" v-if="dolarActual">
          <span>Cotización seleccionada</span>
          <strong>{{ dolarActual.nombre }}</strong>

          <div class="resumen-fila">
            <span>Compra</span>
            <strong>{{ formatoPesos(dolarActual.compra) }}</strong>
          </div>

          <div class="resumen-fila">
            <span>Venta</span>
            <strong>{{ formatoPesos(dolarActual.venta) }}</strong>
          </div>
        </div>
      </div>

      <!-- @submit.prevent evita que el formulario recargue la página -->
      <form class="formulario" @submit.prevent="calcular">
        <h3>Simular operación</h3>

        <!-- El usuario elige si quiere comprar o vender dólares -->
        <label for="operacion">Tipo de operación</label>
        <select id="operacion" v-model="operacion">
          <option value="comprar">Comprar dólares con pesos</option>
          <option value="vender">Vender dólares por pesos</option>
        </select>

        <!-- Selector de los tipos de dólar disponibles -->
        <label for="tipoDolar">Tipo de dólar</label>
        <select id="tipoDolar" v-model="dolarSeleccionado">
          <option
            v-for="dolar in dolares"
            :key="dolar.casa"
            :value="dolar.casa"
          >
            {{ dolar.nombre }}
          </option>
        </select>

        <!-- El texto cambia según la operación elegida -->
        <label for="monto">
          {{ operacion === 'comprar'
            ? 'Cantidad de pesos a utilizar'
            : 'Cantidad de dólares a vender' }}
        </label>

        <!-- Campo para ingresar el monto -->
        <input
          id="monto"
          v-model.number="monto"
          type="number"
          min="0"
          step="any"
          placeholder="Ingresá un monto"
          required
        />

        <!-- Ejecuta la función que realiza el cálculo -->
        <button
          class="boton-calcular"
          type="submit"
          :disabled="!dolarActual || cargando"
        >
          Calcular operación
        </button>

        <!-- Muestra el resultado cuando se calcula una operación -->
        <div
          v-if="resultado !== null"
          class="resultado"
          aria-live="polite"
        >
          <p>
            {{ operacion === 'comprar'
              ? 'Dólares que recibirías'
              : 'Pesos que recibirías' }}
          </p>

          <strong>{{ formatoResultado(resultado) }}</strong>

          <span>
            Cotización aplicada:
            {{ formatoPesos(
              operacion === 'comprar'
                ? dolarActual.venta
                : dolarActual.compra
            ) }}
          </span>
        </div>

        <!-- Informa si el monto ingresado no es válido -->
        <p v-if="mensajeError" class="error">
          {{ mensajeError }}
        </p>

        <!-- Aclara que se trata de una simulación -->
        <p class="aclaracion">
          Cálculo estimativo, sin incluir comisiones, impuestos
          ni otros cargos. No realiza operaciones reales.
        </p>
      </form>
    </section>

    <!-- PIE DE PÁGINA -->
    <footer>
      <p>DólarVerde · Proyecto educativo realizado con Vue y Axios.</p>
      <p>Datos: DolarApi.com</p>
    </footer>

  </main>
</template>

<script setup>
// Importamos las herramientas de Vue que vamos a utilizar.
import { ref, computed, onMounted } from 'vue'

// Importamos Axios para realizar peticiones HTTP a la API.
import axios from 'axios'

// VARIABLES REACTIVAS

// Guarda la lista de tipos de dólar que devuelve la API.
const dolares = ref([])

// Indica si se están cargando las cotizaciones.
const cargando = ref(false)

// Guarda el mensaje que se muestra si ocurre un error.
const error = ref('')

// Guarda la fecha de actualización de las cotizaciones.
const fechaActualizacion = ref('')

// Guarda la operación elegida: comprar o vender.
const operacion = ref('comprar')

// Guarda el identificador del dólar seleccionado.
const dolarSeleccionado = ref('')

// Guarda el monto ingresado en el formulario.
const monto = ref(null)

// Guarda el resultado del cálculo.
const resultado = ref(null)

// Guarda los errores relacionados con el formulario.
const mensajeError = ref('')

// PROPIEDAD COMPUTADA

// Busca en la lista el dólar que seleccionó el usuario.
// Se actualiza automáticamente cuando cambia la selección.
const dolarActual = computed(() =>
  dolares.value.find(
    dolar => dolar.casa === dolarSeleccionado.value
  )
)

// FUNCIÓN PARA MOSTRAR PRECIOS EN PESOS ARGENTINOS

function formatoPesos(valor) {
  // Si el precio no es válido, mostramos un mensaje.
  if (valor == null || !Number.isFinite(Number(valor))) {
    return 'Sin cotización'
  }

  // Intl.NumberFormat convierte el número a formato de moneda argentina.
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 2
  }).format(valor)
}

// FUNCIÓN PARA MOSTRAR EL RESULTADO DE LA OPERACIÓN

function formatoResultado(valor) {
  // Al comprar recibimos dólares; al vender recibimos pesos.
  const moneda = operacion.value === 'comprar' ? 'USD' : 'ARS'

  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 2
  }).format(valor)
}

// FUNCIÓN ASÍNCRONA PARA CONSULTAR LA API

async function obtenerDolares() {
  // Activamos el indicador de carga y limpiamos errores anteriores.
  cargando.value = true
  error.value = ''

  try {
    // Axios realiza una petición GET a la API de cotizaciones.
    const respuesta = await axios.get(
      'https://dolarapi.com/v1/dolares'
    )

    // Comprobamos que la respuesta sea una lista.
    if (!Array.isArray(respuesta.data)) {
      throw new Error('La API no devolvió una lista de cotizaciones.')
    }

    // Guardamos solamente los registros con datos necesarios.
    dolares.value = respuesta.data.filter(
      dolar =>
        dolar.casa &&
        dolar.nombre &&
        Number.isFinite(Number(dolar.compra)) &&
        Number.isFinite(Number(dolar.venta))
    )

    // Comprobamos que existan cotizaciones disponibles.
    if (dolares.value.length === 0) {
      throw new Error('No se encontraron cotizaciones disponibles.')
    }

    // Si el dólar seleccionado ya no está en la lista,
    // seleccionamos el primero que esté disponible.
    if (!dolares.value.some(
      dolar => dolar.casa === dolarSeleccionado.value
    )) {
      dolarSeleccionado.value = dolares.value[0].casa
    }

    // Obtenemos las fechas de actualización recibidas de la API.
    const fechas = dolares.value
      .map(dolar => dolar.fechaActualizacion)
      .filter(Boolean)
      .sort()

    // Mostramos la fecha más reciente que devuelve la lista.
    if (fechas.length) {
      fechaActualizacion.value = new Date(
        fechas[fechas.length - 1]
      ).toLocaleString('es-AR')
    }

  } catch (e) {
    // Mostramos el error en la consola para poder revisarlo.
    console.error('Error al consultar la API:', e)

    // Informamos al usuario que no se pudieron cargar los datos.
    error.value =
      'No se pudieron cargar las cotizaciones. Revisá tu conexión e intentá actualizar.'

  } finally {
    // Siempre desactivamos el indicador de carga.
    cargando.value = false
  }
}

// FUNCIÓN PARA CALCULAR LA COMPRA O LA VENTA

function calcular() {
  // Limpiamos los resultados y errores de la operación anterior.
  resultado.value = null
  mensajeError.value = ''

  // Comprobamos que haya un dólar seleccionado.
  if (!dolarActual.value) {
    mensajeError.value = 'Seleccioná una cotización disponible.'
    return
  }

  // Comprobamos que el monto sea un número mayor que cero.
  if (
    monto.value === null ||
    monto.value === '' ||
    !Number.isFinite(Number(monto.value)) ||
    Number(monto.value) <= 0
  ) {
    mensajeError.value = 'Ingresá un monto mayor que cero.'
    return
  }

  // Convertimos el valor ingresado a número.
  const cantidad = Number(monto.value)

  // OPERACIÓN DE COMPRA:
  // Dividimos los pesos por el precio de venta del dólar.
  if (operacion.value === 'comprar') {
    if (Number(dolarActual.value.venta) <= 0) {
      mensajeError.value = 'La cotización de venta no es válida.'
      return
    }

    resultado.value =
      cantidad / Number(dolarActual.value.venta)

  } else {
    // OPERACIÓN DE VENTA:
    // Multiplicamos los dólares por el precio de compra.
    if (Number(dolarActual.value.compra) <= 0) {
      mensajeError.value = 'La cotización de compra no es válida.'
      return
    }

    resultado.value =
      cantidad * Number(dolarActual.value.compra)
  }
}

// CICLO DE VIDA DE VUE

// onMounted ejecuta la función cuando el componente aparece
// por primera vez en pantalla.
onMounted(obtenerDolares)
</script>

<style>
/* ESTILOS GENERALES DE LA PÁGINA */

:root {
  font-family: Arial, Helvetica, sans-serif;
  color: #18382b;
  background: #f4f8f5;
  font-synthesis: none;
}

/* Aplicamos box-sizing a todos los elementos. */
* {
  box-sizing: border-box;
}

/* Quitamos el margen predeterminado del navegador. */
body {
  margin: 0;
  min-width: 320px;
}

/* Los campos y botones utilizan la misma tipografía. */
button,
input,
select {
  font: inherit;
}

button {
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* CONTENEDOR PRINCIPAL */

.pagina {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 24px;
}

/* ENCABEZADO Y ELEMENTOS FLEXIBLES */

.encabezado,
.marca,
.titulo-seccion,
.tarjeta-superior,
.resumen-fila {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.encabezado {
  gap: 20px;
  margin-bottom: 52px;
}

.marca {
  justify-content: flex-start;
  gap: 12px;
}

/* LOGO DE LA APLICACIÓN */

.logo {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: 14px;
  background: #16844f;
  color: white;
  font-size: 28px;
  font-weight: bold;
}

.marca h1 {
  margin: 0;
  font-size: 25px;
}

.marca h1 span {
  color: #16844f;
}

.marca p,
.titulo-seccion p {
  margin: 5px 0 0;
  color: #708078;
  font-size: 13px;
}

/* BOTÓN PARA ACTUALIZAR LAS COTIZACIONES */

.boton-actualizar,
.boton-elegir {
  background: white;
  color: #167446;
  border: 1px solid #cfe4d6;
  border-radius: 10px;
  padding: 11px 15px;
  font-weight: bold;
}

/* PRESENTACIÓN */

.bienvenida {
  padding: 36px;
  margin-bottom: 44px;
  border-radius: 22px;
  background: #e3f3e8;
  border: 1px solid #d1ead9;
}

.etiqueta {
  color: #16844f;
  font-size: 11px;
  letter-spacing: 1.5px;
  font-weight: bold;
}

.bienvenida h2 {
  margin: 12px 0;
  font-size: clamp(28px, 4vw, 42px);
}

.bienvenida > p:last-child,
.texto-conversor > p:not(.etiqueta) {
  color: #60766a;
  line-height: 1.6;
}

/* SECCIÓN DE COTIZACIONES */

.seccion-cotizaciones {
  margin-bottom: 48px;
}

.titulo-seccion {
  gap: 16px;
  margin-bottom: 22px;
}

.titulo-seccion h2,
.texto-conversor h2 {
  margin: 0;
  font-size: 24px;
}

.estado {
  color: #167446;
  background: #e0f3e7;
  border-radius: 30px;
  padding: 8px 12px;
  font-size: 12px;
}

/* DISTRIBUCIÓN DE LAS TARJETAS */

.tarjetas {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

/* DISEÑO DE CADA TARJETA */

.tarjeta {
  min-width: 0;
  padding: 21px;
  border: 1px solid #e1e9e3;
  border-radius: 17px;
  background: white;
  transition: border-color 0.2s, transform 0.2s;
}

.tarjeta:hover {
  transform: translateY(-2px);
  border-color: #8bc9a1;
}

/* Borde especial para el dólar seleccionado */

.tarjeta.seleccionada {
  border: 2px solid #27965d;
  padding: 20px;
}

.tarjeta-superior {
  justify-content: flex-start;
  gap: 9px;
}

.punto-verde {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: #2ba464;
}

.nombre {
  font-weight: bold;
}

.precio {
  margin: 22px 0 4px;
  font-size: 27px;
  font-weight: bold;
  overflow-wrap: anywhere;
}

.subtitulo {
  margin: 0;
  color: #738279;
  font-size: 12px;
}

/* INFORMACIÓN DE COMPRA Y VENTA EN CADA TARJETA */

.detalle-precios {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 17px 0;
  margin-top: 16px;
  border-top: 1px solid #e8eee9;
}

.detalle-precios div {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.detalle-precios span,
.resumen-fila span,
.resumen > span {
  color: #738279;
  font-size: 12px;
}

.detalle-precios strong {
  font-size: 14px;
}

.boton-elegir {
  width: 100%;
}

.seleccionada .boton-elegir {
  background: #e6f5eb;
}

/* FECHA Y FUENTE DE LOS DATOS */

.fecha,
.fuente {
  margin: 15px 0 0;
  color: #738279;
  font-size: 12px;
}

.fuente {
  margin-top: 6px;
}

/* SECCIÓN DEL CONVERSOR Y EL FORMULARIO */

.seccion-conversor {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  align-items: start;
  padding: 32px;
  border-radius: 22px;
  background: white;
  border: 1px solid #e1e9e3;
}

.texto-conversor h2 {
  margin: 10px 0;
  font-size: 30px;
}

/* RESUMEN DEL DÓLAR SELECCIONADO */

.resumen {
  margin-top: 28px;
  padding: 20px;
  background: #f1f8f3;
  border-radius: 14px;
}

.resumen > strong {
  display: block;
  margin: 8px 0 18px;
  color: #16844f;
  font-size: 20px;
}

.resumen-fila {
  gap: 12px;
  padding-top: 12px;
  margin-top: 12px;
  border-top: 1px solid #dcebe0;
}

/* FORMULARIO */

.formulario {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border-radius: 16px;
  background: #f8faf8;
  border: 1px solid #e8eee9;
}

.formulario h3 {
  margin: 0 0 8px;
  font-size: 20px;
}

.formulario label {
  font-size: 13px;
  font-weight: bold;
}

/* CAMPOS DE TEXTO Y SELECTORES */

.formulario input,
.formulario select {
  width: 100%;
  min-height: 45px;
  padding: 11px 12px;
  border: 1px solid #d8e3da;
  border-radius: 9px;
  background: white;
  color: #18382b;
}

/* Resaltamos el campo que está seleccionado. */

.formulario input:focus,
.formulario select:focus {
  outline: 2px solid #9dd8b1;
  border-color: #27965d;
}

/* BOTÓN QUE EJECUTA EL CÁLCULO */

.boton-calcular {
  margin-top: 8px;
  padding: 14px;
  border: 0;
  border-radius: 10px;
  background: #16844f;
  color: white;
  font-weight: bold;
}

.boton-calcular:hover {
  background: #10683e;
}

/* RESULTADO DE LA OPERACIÓN */

.resultado {
  padding: 18px;
  margin-top: 8px;
  border: 1px solid #cce8d5;
  border-radius: 12px;
  background: #e8f7ed;
  overflow-wrap: anywhere;
}

.resultado p {
  margin: 0 0 8px;
  color: #41664e;
  font-size: 13px;
}

.resultado strong {
  display: block;
  color: #147b46;
  font-size: 28px;
}

.resultado span {
  display: block;
  margin-top: 10px;
  color: #41664e;
  font-size: 12px;
}

/* ACLARACIÓN LEGAL Y MENSAJES */

.aclaracion {
  margin: 2px 0 0;
  color: #738279;
  font-size: 11px;
  line-height: 1.5;
}

.mensaje {
  padding: 24px;
  text-align: center;
  color: #60766a;
}

.error {
  padding: 12px;
  border-radius: 8px;
  background: #fff0f0;
  color: #b42318;
  font-size: 13px;
  line-height: 1.5;
}

/* PIE DE PÁGINA */

footer {
  padding: 28px 0 8px;
  text-align: center;
  color: #738279;
  font-size: 12px;
}

/* ADAPTACIÓN A TABLETS */

@media (max-width: 850px) {
  .tarjetas {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .seccion-conversor {
    grid-template-columns: 1fr;
  }
}

/* ADAPTACIÓN A CELULARES */

@media (max-width: 560px) {
  .pagina {
    padding: 18px 14px;
  }

  .encabezado {
    align-items: flex-start;
    flex-direction: column;
    margin-bottom: 30px;
  }

  .bienvenida {
    padding: 24px;
  }

  .tarjetas {
    grid-template-columns: 1fr;
  }

  .titulo-seccion {
    align-items: flex-start;
    flex-direction: column;
  }

  .seccion-conversor {
    padding: 18px;
    gap: 24px;
  }

  .formulario {
    padding: 16px;
  }
}
</style>
