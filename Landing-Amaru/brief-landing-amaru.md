# Brief: landing page de "Amaru: la Fruta del Origen"

Este documento describe la página de inicio del juego para construirla con Claude Code. Pégalo completo o guárdalo en la raíz del repositorio como `BRIEF.md` y pídele a Claude Code que lo siga.

---

## 1. Qué es esta página

Es la landing page de un juego web hecho en Phaser 3. Funciona como el "menú de inicio" antes de jugar: tiene que dar ganas de jugar en los primeros 5 segundos y llevar al jugador a un botón grande de JUGAR.

También es una entrega de la materia Desarrollo de Juegos Interactivos, así que debe incluir obligatoriamente:

- El logline del juego.
- Las características principales.
- Una sección legal: clasificación por edad (estilo ESRB/PEGI, con tono creativo) y un "Muro de Honor" con créditos y licencias.
- Un botón gigante de JUGAR que lleve a la subcarpeta donde está el canvas de Phaser.
- Despliegue en GitHub Pages.

## 2. Restricciones técnicas

- Un solo archivo `index.html` en la raíz del repositorio, con el CSS y el JS dentro del mismo archivo. Sin frameworks ni build.
- Debe funcionar en GitHub Pages: todas las rutas relativas (`./juego/`, nunca `/juego/`), porque el sitio se sirve desde `usuario.github.io/nombre-repo/`.
- El botón JUGAR apunta a `./juego/index.html`. **Ajustar a la carpeta real del juego** si es otra.
- Fuentes solo de Google Fonts. Nada de imágenes descargadas de internet sin licencia: lo visual se hace con CSS, SVG en línea o canvas. Esto también mantiene coherencia con el juego, que dibuja todo con código.
- Responsive: debe verse bien en celular (el juego se puede jugar deslizando el dedo).
- Accesible: contraste suficiente, textos alternativos en los SVG decorativos (`aria-hidden="true"`) y en los que informan, foco visible en botones, y respetar `prefers-reduced-motion` desactivando las animaciones.
- Liviana: que cargue rápido sin dependencias externas pesadas.

## 3. Dirección visual

**Idea central:** una aventura andina, nocturna y un poco mística. Piensa en una selva de montaña de noche, con luciérnagas, escamas que brillan y piedra tallada. Nada de estética genérica de "juego retro" ni degradados morados de plantilla.

**Paleta base (noche andina):**
- Fondo: verde muy oscuro casi negro, tipo `#0b1410`.
- Texto principal: hueso cálido, tipo `#efe6d2`.
- Acento principal: dorado de la Fruta del Origen, tipo `#f2b33d`.
- Acento secundario: verde escama, tipo `#3fae6a`.

**Colores de los cinco escenarios** (para la sección de mundos y detalles):
- Bosque: verde `#3fae6a`
- Desierto: arena `#e0b469`
- Nieve: blanco azulado `#cfe6f2`
- Volcán: rojo brasa `#e2512f`
- Noche: azul profundo `#3d5bd9`

**Tipografía:**
- Títulos: una display con carácter que recuerde a piedra tallada o a algo artesanal. Por ejemplo "Cinzel Decorative", "Grenze Gotisch" o "Rubik Dirt". Elegir una y usarla con moderación.
- Texto: una sans legible, por ejemplo "Outfit" o "Nunito Sans".

**Motivos gráficos:**
- Patrón de escamas o de chakana (cruz andina) muy sutil en el fondo, hecho con SVG o CSS.
- Bloques con el mismo "relieve 3D" del juego: cada bloque tiene una sombra negra semitransparente abajo a la derecha, un lado más oscuro, la cara superior del color base y una franja clara arriba que simula luz. Usarlo en botones y en la serpiente decorativa.
- Partículas de ambiente según la sección: luciérnagas en el hero, hojas, arena, nieve o brasas en las tarjetas de los mundos.

## 4. Estructura de la página y textos

Los textos están listos para usar. Se pueden ajustar, pero **no revelar el giro final de la historia** (por qué Inti entró al bosque): es lo que el jugador descubre al final.

### 4.1 Hero (pantalla completa)

Fondo nocturno con luciérnagas animadas y una serpiente hecha de bloques con relieve que se mueve sola por la pantalla en un canvas, como en el juego, y persigue una fruta dorada que brilla. Si el usuario tiene `prefers-reduced-motion`, la serpiente queda quieta.

- Título: **AMARU**
- Subtítulo: *La Fruta del Origen*
- Etiqueta pequeña sobre o bajo el título: "Un snake de aventura andina"
- Logline: "Un explorador convertido en serpiente por robar una fruta sagrada debe cruzar cinco tierras andinas, reunir los pedazos de su memoria y vencer a su propia forma de serpiente para volver a ser humano."
- Botón principal gigante: **JUGAR** (lleva a `./juego/index.html`). Que se sienta como una fruta dorada que late suavemente. Hover y focus muy visibles.
- Debajo, un texto chico: "Gratis en tu navegador · PC y celular"
- Indicador para hacer scroll.

### 4.2 La historia

Título: **"Para volver a ser humano, primero tendrás que ser más serpiente"**

Texto:
> Inti mordió la fruta equivocada. La guardiana del bosque lo convirtió en serpiente y rompió su forma humana en cinco fragmentos, escondidos en cinco tierras. En cada una crece una Fruta del Origen, pero solo brota si le ofreces lo que esa tierra guarda. Cada fruta te devuelve un pedazo de tu cuerpo y un recuerdo de tu vida. Los recuerdos llegan desordenados. Y la serpiente que llevas dentro no piensa dejarte ir.

Elemento visual: un "espejo" ovalado donde se ve la silueta de la serpiente y, cada pocos segundos, un glitch de un instante muestra la silueta de un humano. Es una mecánica real del juego, así que sirve para mostrarlo.

### 4.3 Cómo se juega

Título: **"Come. Crece. Muda."**

Tres o cuatro pasos en fila (en columna en celular), cada uno con un ícono SVG simple:

1. **Come manzanas.** Cada una suma puntos, te alarga y te hace más rápido.
2. **Reúne los materiales.** Cada tierra esconde tres. Júntalos y la Fruta del Origen aparecerá, pero solo por 8 segundos.
3. **Muda la piel.** Al comer la fruta vuelves a tu tamaño inicial, cambias de aspecto y recuperas un recuerdo.
4. **Ordena tu memoria.** Al final, los recuerdos son la llave de la puerta de regreso.

### 4.4 Los cinco mundos

Título: **"Cinco tierras, cinco fragmentos"**

Cinco tarjetas, cada una con el color de su escenario y su partícula animada. En escritorio en fila o carrusel horizontal; en celular, deslizables.

| Mundo | Partícula | Texto corto |
| --- | --- | --- |
| Bosque | hojas que caen | Donde empezó todo. Musgo, una serpiente verde, necesita tu ayuda. |
| Desierto | arena con viento | Escorpiones que cruzan en línea recta y un oasis que guarda agua sagrada. |
| Nieve | copos de nieve | Bloques de hielo que se deslizan y la flor de chuquiragua bajo la escarcha. |
| Volcán | brasas que suben | El suelo escupe culebras de lava. Una de ellas podría cambiar de bando. |
| Noche | luciérnagas | La última tierra. Murciélagos en zigzag y una luz que guía hacia la puerta. |

### 4.5 Características

Título: **"Lo que te espera"**

Grilla de tarjetas cortas con un ícono cada una:

- **Cinco mundos** con su propio clima, enemigos y materiales.
- **Amigos que te siguen:** rescata a cinco miniserpientes y viajarán contigo como parte de tu cola.
- **Poderes:** escudo, cámara lenta, puntos dobles y tijeras que cortan tu propia cola.
- **La cámara del recuerdo:** gira los anillos hasta que la imagen encaje y recupera quién eras.
- **Una batalla final épica:** monta una super serpiente formada por tus amigos contra la mega serpiente que fuiste.
- **Dos finales:** lo que decidas al final cambia cómo termina la historia.
- **Juega donde quieras:** teclado (flechas o WASD) en PC y deslizando el dedo en celular.

### 4.6 Banda de llamada a la acción

Una franja de ancho completo, con el dorado de la fruta, antes de la sección legal:

- Texto: **"La Fruta del Origen solo aparece por 8 segundos. ¿Vas a dejarla escapar?"**
- Segundo botón **JUGAR** (mismo destino).
- Enlace secundario: "Síguenos en itch.io" → **reemplazar con el enlace real de la página del juego en itch.io**.

### 4.7 Clasificación (sección legal 1)

Una "etiqueta" que imite el formato de las clasificaciones de videojuegos, con una letra grande en un recuadro, pero con diseño propio (no copiar logos de ESRB ni PEGI).

- Letra: **E10+**
- Texto: "Apto para cualquier humano que no le tenga miedo a las serpientes. Contiene violencia fantástica entre reptiles gigantes y una cantidad irresponsable de manzanas."
- Nota pequeña: "Clasificación creativa hecha por el equipo, inspirada en los sistemas ESRB y PEGI. No es una clasificación oficial."

### 4.8 Muro de Honor (sección legal 2)

Título: **"Muro de Honor"**

Texto introductorio: "Este juego existe gracias a herramientas libres y a gente que comparte su trabajo."

Créditos, en tarjetas tipo placa grabada en piedra:

- **Phaser 3** (motor del juego), por Phaser Studio. Licencia MIT. Enlace: https://phaser.io
- **Las fuentes usadas** (poner los nombres exactos que se elijan), vía Google Fonts. Licencia SIL Open Font License.
- **Gráficos:** dibujados con código por el equipo. Sin imágenes de terceros.
- **Sonidos:** generados con osciladores de WebAudio por el equipo. Sin archivos de audio de terceros.
- Si después se agregan ilustraciones, música o sonidos externos, cada uno va aquí con autor, enlace y licencia (CC0, CC BY, etc.).

**Privacidad** (un párrafo corto): "Amaru solo guarda tu récord de puntos en tu propio navegador (localStorage). No recoge datos personales, no usa cookies de seguimiento y no envía nada a ningún servidor."

### 4.9 Footer

- Nombre del estudio indie del equipo (**poner el nombre real**) y los integrantes.
- "Proyecto de Desarrollo de Juegos Interactivos · 2026"
- Enlaces: Repositorio en GitHub, página en itch.io (**reemplazar con los reales**).
- Una serpiente pequeña de bloques que se enrolla junto al texto.

## 5. Detalles que lo hacen "vendible"

- El hero tiene que verse vivo desde el primer segundo: la serpiente moviéndose y las luciérnagas son lo primero que se ve.
- Animaciones al hacer scroll: las secciones aparecen con un fundido suave hacia arriba (usar IntersectionObserver, sin librerías).
- El cursor sobre el botón JUGAR podría generar unas cuantas partículas doradas.
- Sonido opcional y apagado por defecto: un botón pequeño de "activar sonido" que reproduzca un tono suave generado con WebAudio al pasar sobre los botones. Nunca reproducir audio sin que el usuario lo active.
- Meta tags para que el enlace se vea bien al compartirlo en Teams o WhatsApp: `title`, `description` y `og:title`/`og:description`. Si el equipo tiene una captura del juego, usarla como `og:image` (ruta relativa dentro del repositorio).
- Favicon: una fruta dorada o la cabeza de la serpiente, en SVG en línea.

## 6. Checklist antes de entregar

- [ ] El botón JUGAR abre el juego correctamente en GitHub Pages (probarlo ya desplegado, no solo en local).
- [ ] Se ven el logline, las características, la clasificación y el Muro de Honor.
- [ ] Los enlaces de itch.io y GitHub son los reales.
- [ ] Los nombres de las fuentes en el Muro de Honor coinciden con las que se usaron.
- [ ] Se ve bien en un celular y sin scroll horizontal.
- [ ] Con "reducir movimiento" activado en el sistema, las animaciones se detienen.

## 7. Cómo publicarla en GitHub Pages

1. Subir `index.html` a la raíz de la rama `main`.
2. En GitHub: Settings → Pages → "Deploy from a branch" → rama `main`, carpeta `/ (root)`.
3. Esperar uno o dos minutos y abrir `https://USUARIO.github.io/NOMBRE-REPO/`.
