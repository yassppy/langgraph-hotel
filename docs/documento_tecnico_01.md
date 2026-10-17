# Documento técnico --- Aplicación de reservas hoteleras

**Versión:** 1.0\
**Tipo:** MVP de demostración\
**Objetivo:** permitir que los huéspedes consulten habitaciones,
reserven, paguen mediante Yape y consulten el estado de su reserva. Los
asesores verifican los pagos desde un panel y el sistema genera un PDF
de prueba cuando la reserva está completamente pagada.

## 1. Resumen de la aplicación

La aplicación será una web instalable en celulares (PWA), con una
experiencia principal similar a un chat. El huésped avanzará
principalmente mediante botones, tarjetas y formularios.

La solución tiene tres componentes:

1.  **Aplicación del huésped:** habitaciones, disponibilidad, reservas,
    pagos y comprobantes.
2.  **Panel administrativo:** revisión de pagos, contacto manual por
    WhatsApp, consulta de reservas y auditoría.
3.  **Backend:** reglas de negocio, autenticación, persistencia,
    permisos y coordinación de procesos.

## 2. Tecnologías

-   Frontend: Next.js, App Router y TypeScript.
-   PWA: manifest, service worker y página básica sin conexión.
-   Backend: FastAPI con Python 3.13.12 o superior.
-   Base de datos: PostgreSQL en Neon.
-   Pruebas: pytest.
-   Asistente: LangGraph y un modelo de lenguaje económico, solo para
    preguntas abiertas.
-   Archivos: almacenamiento privado para evidencias de pago y PDFs.
-   Pago: Yape mediante QR del hotel, verificado manualmente por un
    asesor.
-   Contacto: enlace `wa.me`, sin WhatsApp Business API.

## 3. Funciones del huésped

-   Ver opciones rápidas: Reservar, Ver habitaciones, Mi reserva, Cómo
    pagar, Ubicación y Soporte.
-   Explorar habitaciones sin iniciar sesión.
-   Registrarse con correo y contraseña o iniciar sesión con Google.
-   Consultar tarifas, capacidad y disponibilidad.
-   Seleccionar fechas y cantidad de huéspedes.
-   Recibir una cotización y confirmar una reserva tras autenticarse.
-   Registrar su número de WhatsApp y aceptar el contacto.
-   Recibir un código único de reserva, por ejemplo `HTL-XXXX-YYYY`.
-   Ver las instrucciones y el QR de Yape.
-   Subir la captura de pago y el número de operación.
-   Consultar el estado de la reserva y descargar un PDF de prueba
    cuando no exista saldo pendiente.

## 4. Panel de asesores y administradores

Los asesores podrán ver pagos pendientes, consultar la reserva y su
evidencia, contactar al huésped mediante WhatsApp, y aprobar o rechazar
el pago. El rechazo requiere un motivo. También podrán consultar
reservas, comprobantes de prueba y auditoría. El panel no incluye un
chat interno.

Los administradores podrán, además, gestionar habitaciones, tipos de
habitación, tarifas y cuentas de asesores.

### Roles

-   `customer`: consulta y gestiona sus propias reservas.
-   `staff`: verifica pagos y consulta información autorizada.
-   `admin`: tiene los permisos de asesor y permisos adicionales de
    administración.

## 5. Flujo de reserva

1.  El huésped elige **Reservar**.
2.  Selecciona llegada, salida y cantidad de huéspedes.
3.  El backend valida las fechas, la capacidad y la disponibilidad.
4.  El huésped selecciona una habitación y recibe una cotización.
5.  Si no inició sesión, se le solicita autenticarse y luego continúa el
    flujo.
6.  Registra su WhatsApp y acepta el contacto.
7.  El backend crea la reserva en estado `pending_payment` y genera un
    código.
8.  La habitación se retiene durante 30 minutos.
9.  El huésped paga por Yape y envía la evidencia.
10. El pago pasa a revisión.
11. El asesor verifica el dinero en la aplicación oficial de Yape y
    aprueba o rechaza.
12. Si el pago cumple el importe requerido, la reserva se confirma.
13. Cuando el pago cubre el total, se genera el PDF de prueba.

Una reserva sin evidencia expira después de 30 minutos y libera la
habitación. Una reserva con evidencia en revisión no expira
automáticamente.

## 6. Reglas de negocio

### Fechas y disponibilidad

-   La salida debe ser posterior a la llegada y no se permiten fechas
    pasadas.
-   La estancia debe respetar el mínimo y máximo configurados.
-   La cantidad de huéspedes no puede superar la capacidad.
-   La disponibilidad se calcula a partir de las habitaciones y reservas
    activas.
-   El día de salida no cuenta como una noche ocupada.
-   El backend vuelve a comprobar disponibilidad al crear la reserva
    para evitar sobreventa.
-   La zona horaria es `America/Lima`.
-   Inicialmente se propone permitir reservas hasta 30 días antes; este
    límite será configurable.
-   Si una fecha es ambigua, se pide confirmación.

### Pagos y reservas

-   Solo un usuario `staff` o `admin` puede aprobar o rechazar un pago.
-   El sistema nunca confirma un pago basándose únicamente en la captura
    o en una respuesta de IA; el asesor verifica la operación en Yape.
-   Un pago resuelto no puede aprobarse o rechazarse nuevamente.
-   Los números de operación duplicados deben detectarse y revisarse.
-   El porcentaje mínimo de pago es configurable; inicialmente se
    propone exigir el 100 % del total para confirmar.
-   El PDF se habilita únicamente cuando el importe pagado cubre el
    total.
-   El rechazo debe registrar un motivo y permitir al huésped corregir
    el pago.
-   La cancelación libera la habitación; los reembolsos se gestionan
    manualmente y quedan fuera del MVP.

## 7. Estados principales

### Reservas

  Estado                   Significado
  ------------------------ --------------------------------------------
  `pending_payment`        Esperando el pago o nueva evidencia.
  `pending_confirmation`   Evidencia enviada y pendiente de revisión.
  `confirmed`              Pago verificado y reserva confirmada.
  `checked_in`             Huésped ingresó al hotel.
  `checked_out`            Estadía terminada.
  `cancelled`              Reserva cancelada.
  `expired`                Venció el plazo sin evidencia.

### Pagos

  Estado             Significado
  ------------------ -----------------------------------
  `pending_review`   Evidencia esperando al asesor.
  `approved`         Pago verificado.
  `rejected`         Pago rechazado.
  `refunded`         Reembolso registrado manualmente.

### Comprobantes

  Estado                 Significado
  ---------------------- -------------------------------------------
  `pending_generation`   PDF pendiente de generar.
  `generated`            PDF de prueba disponible.
  `failed`               Falló la generación; se puede reintentar.
  `voided`               PDF de prueba anulado.

## 8. Chat e inteligencia artificial

El sistema prioriza las acciones guiadas para ahorrar tokens:

-   Los botones y formularios se resuelven con reglas del backend, sin
    llamar al modelo.
-   La información frecuente, como ubicación, políticas y métodos de
    pago, se obtiene de contenido configurado.
-   Las tarifas, disponibilidad, reservas y pagos siempre se validan en
    el backend.
-   El modelo de lenguaje se usa solo cuando el usuario escribe una
    pregunta abierta que el enrutador no puede resolver.
-   Se envían al modelo pocos mensajes recientes y un resumen breve de
    la sesión.
-   Se limitan la longitud y frecuencia de los mensajes.
-   La IA no puede aprobar pagos, alterar saldos ni saltarse permisos.

### Grafo A: asistente del huésped

Responde preguntas abiertas y puede consultar habitaciones,
disponibilidad, cotizaciones y datos del hotel mediante herramientas
validadas por el backend.

### Grafo B: PDF de prueba

Se activa desde el backend cuando el pago aprobado cubre el total. Carga
la reserva, valida el saldo, prepara los datos, genera el PDF, lo guarda
de forma privada y registra el resultado. Debe evitar generar
duplicados.

## 9. API del backend

Prefijo general: `/api/v1`.

### Autenticación

-   `POST /auth/register`: registrar cuenta.
-   `POST /auth/login`: iniciar sesión.
-   `POST /auth/google`: autenticarse con Google.
-   `POST /auth/refresh`: renovar sesión.
-   `POST /auth/logout`: cerrar sesión.
-   `GET /auth/me`: consultar usuario actual.

### Habitaciones y reservas

-   `GET /health`: estado del servicio.
-   `GET /room-types`: tipos de habitación.
-   `GET /availability`: disponibilidad por fechas y huéspedes.
-   `POST /quotes`: cotización.
-   `POST /reservations`: crear reserva.
-   `GET /reservations/{code}`: detalle de una reserva autorizada.
-   `GET /me/reservations`: reservas del huésped.

### Pagos y comprobantes

-   `POST /payments/evidence`: enviar evidencia de pago.
-   `GET /invoices/{reservation_code}/download`: descargar PDF de
    prueba.

### Chat

-   `POST /chat/message`: procesar una acción guiada o mensaje libre.
-   `GET /chat/history/{session_key}`: consultar historial autorizado.

### Administración

-   `GET /admin/payments/pending`: pagos pendientes.
-   `GET /admin/payments/{id}`: detalle de pago.
-   `POST /admin/payments/{id}/contact`: registrar contacto por
    WhatsApp.
-   `POST /admin/payments/{id}/verify`: aprobar pago.
-   `POST /admin/payments/{id}/reject`: rechazar pago.
-   `GET /admin/reservations`: consultar reservas.
-   `GET /admin/invoices`: consultar PDFs de prueba.
-   `POST /admin/invoices/{reservation_code}/regenerate`: reintentar
    PDF.
-   `GET /admin/audit-logs`: consultar auditoría.

Las rutas administrativas requieren permisos. Solo `admin` puede
gestionar habitaciones, tarifas y usuarios asesores.

## 10. Base de datos

PostgreSQL en Neon tendrá estas entidades principales:

-   `users`: cuentas, credenciales y roles.
-   `guests`: datos del huésped, WhatsApp y consentimiento.
-   `room_types`: categoría, descripción, tarifa y capacidad.
-   `rooms`: habitaciones físicas y estado.
-   `reservations`: fechas, habitación, importes, estado y vencimiento.
-   `payments`: importe declarado, operación, evidencia y revisión.
-   `payment_events`: eventos, duplicados e idempotencia.
-   `invoices`: estado y ubicación del PDF de prueba.
-   `conversation_sessions`: estado del chat.
-   `chat_messages`: mensajes del chat.
-   `audit_logs`: acciones importantes de usuarios y asesores.

Se utilizarán claves foráneas, restricciones, índices y transacciones
para proteger la integridad de los datos. Las consultas SQL deben ser
parametrizadas.

## 11. Seguridad y privacidad

-   Cookies de sesión `HttpOnly`, `Secure` en HTTPS y `SameSite=Lax`;
    protección CSRF donde corresponda.
-   Verificar identidad, rol y propiedad de cada recurso en el backend.
-   El huésped solo puede consultar sus propias reservas, pagos y
    documentos.
-   Guardar evidencias y PDFs en almacenamiento privado, con enlaces
    temporales.
-   Validar formato y tamaño de archivos; límite inicial sugerido de 5
    MB para evidencia.
-   No guardar contraseñas en texto plano ni exponer secretos en logs.
-   Solicitar consentimiento para el contacto por WhatsApp.
-   Registrar aprobaciones, rechazos, contactos y regeneraciones en
    auditoría.
-   Aplicar límites de frecuencia en login, chat y subida de archivos.
-   Probar permisos y errores con pytest.

## 12. PWA

-   Incluir `manifest.webmanifest` e iconos.
-   Usar HTTPS al desplegar.
-   Cachear solo archivos estáticos y una página offline.
-   No cachear autenticación ni respuestas de la API.
-   Mostrar instalación cuando el navegador lo permita.
-   En iOS, explicar cómo añadir la aplicación a la pantalla de inicio.

Las notificaciones push no forman parte del MVP.

## 13. Plan de desarrollo por fases

Cada fase se prueba antes de iniciar la siguiente.

1.  **Base:** configuración, PostgreSQL, migraciones y autenticación.
2.  **Habitaciones:** catálogo, tipos, habitaciones y tarifas.
3.  **Disponibilidad y cotizaciones:** fechas, capacidad, precios y
    concurrencia.
4.  **Reservas:** creación, código, retención y expiración.
5.  **Chat guiado y PWA:** botones, formularios y experiencia
    instalable, sin IA inicialmente.
6.  **Pagos:** evidencia, almacenamiento privado, estados y duplicados.
7.  **Panel administrativo:** cola, revisión, WhatsApp, aprobación,
    rechazo y auditoría.
8.  **LangGraph:** preguntas abiertas y herramientas seguras.
9.  **PDF de prueba:** generación cuando el pago total esté aprobado.
10. **Pruebas finales:** permisos, errores, duplicados, concurrencia y
    flujo completo.

**Criterio para avanzar:** las pruebas de la fase actual deben pasar
antes de continuar. Usar pytest para pruebas unitarias y de API, y una
base de datos aislada para pruebas de integración.

## 14. Fuera del alcance

Esta es una aplicación de demostración, no una solución lista para
producción. No incluye:

-   Facturación electrónica real ni integración con SUNAT/OSE.
-   Comprobantes con validez tributaria.
-   WhatsApp Business API ni mensajes automáticos.
-   Pasarela de tarjetas.
-   Integración con channel managers externos.
-   Fidelización multipropiedad.
-   Notificaciones push.

Todos los PDFs deben mostrar claramente: **"DOCUMENTO DE PRUEBA --- SIN
VALOR TRIBUTARIO".**
