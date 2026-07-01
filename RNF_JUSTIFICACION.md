# Justificación de Requerimientos No Funcionales — Sweet Medical

## 1. Interfaz Intuitiva

La aplicación está organizada alrededor de una barra de navegación persistente que agrupa las funcionalidades por rol. Dependiendo de si el usuario es paciente, médico o administrador, el sistema expone solo las secciones que le corresponden, reduciendo la carga cognitiva y evitando que el usuario se enfrente a opciones irrelevantes.

Las acciones disponibles en cada pantalla se muestran en función del contexto. En el panel de turnos del médico, por ejemplo, los controles de gestión aparecen únicamente cuando el estado del turno los habilita. Esta lógica condicional evita que el usuario tenga que interpretar por qué una acción no funciona: simplemente no aparece si no aplica.

---

## 2. Aprendizaje Rápido

Se adoptaron convenciones visuales ampliamente establecidas en aplicaciones de gestión y reservas: tarjetas para agrupar información relacionada, badges de color para indicar estados, y modales de confirmación antes de ejecutar acciones con consecuencias. Estos patrones reducen la curva de aprendizaje porque el usuario ya los reconoce de otras herramientas.

Cada sección incluye un encabezado descriptivo que comunica su propósito en una línea. Los formularios y modales también incorporan textos de ayuda que explican qué va a ocurrir antes de que el usuario confirme, especialmente en flujos como la cancelación de un turno o la propuesta de cambio de fecha.

---

## 3. Feedback Visual y Notificaciones

Durante la carga inicial de cada pantalla se muestran skeleton cards que preservan la estructura visual de los datos mientras estos se obtienen del backend. Los botones que disparan operaciones asincrónicas muestran un indicador de carga y se bloquean hasta recibir respuesta, previniendo envíos duplicados.

El resultado de cada operación se comunica mediante un sistema de toasts que aparece en un área fija de la pantalla. Los errores de validación en formularios se muestran junto al campo correspondiente, con mensajes específicos que indican qué corregir.

---

## 4. Diseño Responsivo

El layout utiliza un sistema de grilla fluida basado en utilidades de Tailwind CSS, con breakpoints que reorganizan el contenido según el ancho disponible. En pantallas pequeñas, las columnas múltiples colapsan a una sola y los elementos secundarios se apilan verticalmente para mantener la legibilidad.

Los elementos interactivos están dimensionados para ser cómodos tanto en entornos de escritorio como en dispositivos táctiles. El comportamiento en distintos tamaños de pantalla fue verificado durante el desarrollo utilizando las herramientas de simulación del navegador.

---

## 5. Accesibilidad

La implementación sigue las pautas WCAG 2.1 nivel AA. Los elementos interactivos incluyen atributos ARIA que describen su propósito y estado: los botones de acción tienen etiquetas contextuales, los campos de formulario están asociados a sus labels, y los mensajes de error están vinculados al campo que los origina mediante `aria-describedby`.

Las secciones que actualizan su contenido de forma dinámica utilizan regiones `aria-live` para que los lectores de pantalla puedan anunciar los cambios. Todos los elementos focusables tienen un indicador visual de foco compatible con navegación por teclado.

En cuanto a contraste, la paleta de colores fue seleccionada para que las combinaciones de texto y fondo superen el ratio mínimo de 4.5:1 requerido por el estándar, tanto en los textos principales como en los componentes de estado como botones y badges.

---

## 6. Consistencia en la UI

Los estilos globales y tokens de diseño están centralizados, lo que garantiza que cualquier ajuste en la paleta o tipografía se propague de forma uniforme a toda la aplicación. No se usan estilos ad-hoc por pantalla.

Todas las interfaces están construidas a partir del mismo conjunto de componentes reutilizables: botones, tarjetas, inputs, selects, badges, modales y skeletons. Cada componente define sus propias variantes de forma interna, de modo que su apariencia y comportamiento son predecibles en cualquier contexto donde aparezcan. El resultado es una experiencia visual coherente a lo largo de todas las secciones de la aplicación.
