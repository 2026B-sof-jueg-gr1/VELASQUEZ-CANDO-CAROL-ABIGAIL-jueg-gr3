# Brief: evolución del juego "Amaru: la Fruta del Origen"

Este documento describe cómo convertir el Snake actual en el juego con historia. Está pensado para Claude Code: guárdalo en el repositorio como `BRIEF-JUEGO.md` y pídele que lo siga **una fase a la vez**, probando el juego al terminar cada una.

---

## 0. Punto de partida (lo que ya existe)

El juego actual está hecho en Phaser 3.80.1 cargado desde CDN, con JavaScript en clases ES6, sin imágenes ni frameworks.

- `index.html` del juego: carga Phaser y ajusta el lienzo a la pantalla.
- `MenuScene`: título, instrucciones y récord.
- `SnakeScene`: bucle de tiempo fijo, comida, poderes, niveles, pausa y Game Over.
- `SCENARIOS`: los cinco escenarios (bosque, desierto, nieve, volcán, noche) con sus partículas de ambiente.
- Funciones `draw*()`: dibujan con relieve 3D la serpiente y los objetos (sombra, lado oscuro, cara superior y brillo).
- Tablero de 800 × 600 px en celdas de 20 px (40 × 30).
- Velocidad: empieza en 120 ms por paso, baja 3 ms por manzana, mínimo 60 ms.
- Poderes: Lento (1.6 veces más lento por 6 s), Puntos dobles (10 s), Escudo (salva de un choque) y Tijeras (cortan el 40 % de la cola desde 8 segmentos). Aparecen cada 6 a 10 s y duran 7 s en el tablero.
- Sonidos con osciladores de WebAudio. Récord guardado en `localStorage`.
- Controles: flechas, WASD o deslizar; cola de hasta 2 giros; pausa con P o Esc.
- Hoy el nivel cambia cada 100 puntos.

**Antes de empezar:** lee todo el código actual y respeta su estilo. No reescribas desde cero lo que ya funciona.

## 1. Reglas generales para Claude Code

- Mantener todo sin imágenes ni archivos de audio: gráficos con `Phaser.Graphics` y `generateTexture()`, sonidos con WebAudio, igual que ahora. Así el Muro de Honor de la página sigue siendo correcto.
- Se puede dividir el código en varios archivos `.js` cargados con `<script>` en orden (por ejemplo `js/state.js`, `js/data.js`, `js/scenes/*.js`), pero sin bundler ni npm. Debe seguir funcionando abierto desde GitHub Pages con rutas relativas.
- Toda la historia (textos, materiales, amigos, recuerdos) va en un archivo de datos aparte (`js/data.js`) para que el equipo pueda cambiar textos sin tocar la lógica.
- Cada escena nueva debe funcionar con teclado y con toque en celular.
- Agregar un **modo debug** activable con `?debug=1` en la URL: tecla N salta al siguiente nivel, M da los 3 materiales, B va directo a la batalla final, R abre el puzzle de recuerdos. Sirve para probar y para la presentación.
- Al terminar cada fase, el juego tiene que poder jugarse completo sin errores en la consola.

## 2. La historia (resumen para tener contexto)

Inti, un explorador, entra a un bosque prohibido y muerde la fruta de un árbol sagrado. La guardiana del bosque lo convierte en serpiente y rompe su forma humana en cinco fragmentos escondidos en cinco tierras. En cada tierra crece una Fruta del Origen que solo brota si se le ofrecen los 3 materiales de ese lugar. Cada fruta le devuelve un pedazo de su cuerpo y un recuerdo. En el camino puede hacerse amigo de cinco miniserpientes.

Al comer la quinta fruta, ordena sus recuerdos para abrir la puerta de regreso. Al cruzarla es humano, pero su forma de serpiente lo sigue convertida en una mega serpiente. Inti pelea montado en una super serpiente formada por sus amigos. Si gana, la guardiana le pregunta si quiere volver a casa o quedarse como guardián.

Giro final (solo se revela en el puzzle de recuerdos): Inti entró al bosque a robar la fruta para curar a su hermana enferma.

## 3. Datos del juego (`js/data.js`)

### Escenarios

| Nivel | Escenario | Materiales | Amigo | Enemigo | Recuerdo de la fruta |
| --- | --- | --- | --- | --- | --- |
| 1 | Bosque | semilla, rocío, hoja dorada | Musgo (verde) | hormigas que cruzan en fila | El rostro de la guardiana al descubrirlo mordiendo la fruta |
| 2 | Desierto | cristal de arena, agua de oasis, pluma de cóndor | Duna (dorada) | escorpiones que cruzan en línea recta | Inti de niño jugando con su hermana |
| 3 | Nieve | hielo de glaciar, flor de chuquiragua, lana de vicuña | Escarcha (blanca) | bloques de hielo que se deslizan | La hermana enferma en cama |
| 4 | Volcán | piedra pómez, azufre, obsidiana | Brasa (roja) | culebras de lava que salen del suelo | Una anciana cuenta la leyenda del árbol que cura |
| 5 | Noche | luz de luciérnaga, rocío lunar, flor nocturna | Luna (azul) | murciélagos que vuelan en zigzag | Inti caminando de noche hacia el bosque |

### Recuerdos de los amigos

| Amigo | Recuerdo que regala |
| --- | --- |
| Musgo | Inti le enseña a su hermana a trepar árboles |
| Escarcha | El curandero dice que no hay cura |
| Duna | Inti prepara su mochila y se despide |
| Luna | Inti cruza la entrada del bosque prohibido |
| Brasa | Inti frente al árbol sagrado |

### Orden correcto de los recuerdos (para el puzzle final)

1. Inti de niño jugando con su hermana
2. Inti le enseña a su hermana a trepar árboles
3. La hermana enferma en cama
4. El curandero dice que no hay cura
5. Una anciana cuenta la leyenda del árbol que cura
6. Inti prepara su mochila y se despide
7. Inti caminando de noche hacia el bosque
8. Inti cruza la entrada del bosque prohibido
9. Inti frente al árbol sagrado
10. El rostro de la guardiana al descubrirlo mordiendo la fruta

Cada recuerdo necesita: `id`, `titulo` (la frase), `orden` (1 a 10) y una función que lo dibuje como ilustración simple con formas (siluetas, árbol, cama, luna, etc.) dentro de un círculo de unos 240 px.

### Poderes de los amigos en la batalla final

| Amigo | Poder | Se basa en |
| --- | --- | --- |
| Musgo | Escudo: aguanta un golpe | Escudo |
| Duna | Golpe doble: el siguiente daño cuenta por dos | Puntos dobles |
| Escarcha | Congela: la mega serpiente va 1.6 veces más lenta por 5 s | Lento |
| Brasa | Corte: le quita el 30 % de la cola a la mega serpiente | Tijeras |
| Luna | Visión: marca por 3 s las próximas celdas hacia donde se mueve | nuevo |

## 4. Fases de implementación

Hacer las fases en orden. Cada una deja el juego jugable.

### Fase 1: estado de la partida

- Crear un objeto `GameState` compartido entre escenas: nivel actual (1 a 5), materiales del nivel (0 a 3), amigos conseguidos, recuerdos conseguidos, final elegido.
- Guardarlo en `localStorage` al terminar cada nivel, para poder continuar.
- En `MenuScene`: botones "Nueva partida" y "Continuar" (solo si hay partida guardada). El récord se mantiene.

### Fase 2: el nuevo ciclo de nivel

- **Quitar** el cambio de nivel cada 100 puntos.
- Manzanas: igual que ahora (10 puntos, alargan, aceleran).
- **Materiales:** cada 5 manzanas aparece uno de los 3 materiales del escenario en una celda libre. Dibujar cada material con forma y color propios. Mostrar los 3 espacios en la esquina superior derecha (vacíos o llenos). Si Inti choca o muere, conserva los materiales del nivel.
- **Fruta del Origen:** al tener 3 materiales, aparece en una celda a 1 o 2 celdas de una pared, dorada, latiendo y con partículas. Desaparece a los 8 s con un contador visible. Si se marchita, se pierde 1 material y hay que juntarlo de nuevo.
- **Muda:** al comer la fruta, animación de la piel desprendiéndose, la serpiente vuelve a 3 segmentos y la velocidad vuelve a 120 ms.
- **Transformación visual por nivel:** el aspecto de la cabeza y el cuerpo cambia en cada nivel. Nivel 1: serpiente verde normal. Nivel 2: escamas más pálidas. Nivel 3: aparecen dos "manos" pequeñas en los costados de la cabeza. Nivel 4: la cabeza toma forma de cara con ojos humanos. Nivel 5: cuerpo color piel con pocas escamas.
- **El espejo:** durante el fundido entre niveles (el de 1 s que ya existe), mostrar un óvalo tipo espejo con el reflejo de la serpiente y un efecto glitch (desplazamiento horizontal y parpadeo) que por un instante muestra una silueta humana. Duración del reflejo humano: 0.1 s en el nivel 1, subiendo hasta 0.6 s en el nivel 5, cada vez más nítido.
- Después de la muda, ir a la cámara del recuerdo (Fase 3) y luego al siguiente escenario. Mientras la Fase 3 no exista, pasar directo al siguiente nivel.

### Fase 3: la cámara del recuerdo (`MemoryRingScene`)

- Se abre al comer la Fruta del Origen y al hacer un amigo.
- Fondo oscuro. En el centro, la ilustración del recuerdo dividida en anillos concéntricos, cada uno girado un ángulo al azar (múltiplos de 45°, nunca el correcto).
- Controles: arriba y abajo eligen el anillo (el seleccionado brilla), izquierda y derecha lo giran 45°. En celular: tocar un anillo lo selecciona y deslizar lo gira.
- Cantidad de anillos: 2 en el nivel 1, 3 en los niveles 2 y 3, 4 en los niveles 4 y 5. Los recuerdos de amigos usan 2 o 3.
- Al encajar todos: la imagen se une, suena un tono, aparece la frase del recuerdo y se guarda en `GameState`. Botón o tecla para continuar.
- No se puede perder ni saltar: la escena solo termina con la imagen completa.

### Fase 4: enemigos

- Un tipo de enemigo por escenario, con el patrón de la tabla. Aparecen desde el nivel correspondiente, entre 1 y 3 a la vez, nunca encima de la serpiente ni bloqueando la Fruta del Origen.
- Chocar con un enemigo cuenta como chocar con una pared (Game Over salvo que tenga Escudo).
- Patrones: hormigas en fila que cruzan horizontal; escorpiones en línea recta que rebotan en las paredes; bloques de hielo que se deslizan hasta chocar; culebras de lava que salen del suelo 2 s, se esconden y avisan 1 s antes con un brillo; murciélagos en zigzag diagonal.
- Dibujados con el mismo estilo de relieve.

### Fase 5: amigos

- En cada nivel, la miniserpiente amiga aparece después de la manzana 3 con un problema y un reto opcional:
  - Musgo (bosque): está atrapada entre hojas; llegar a ella antes de 10 s.
  - Duna (desierto): tiene sed; llevarle el agua de oasis (pasar por ella con ese material ya recogido).
  - Escarcha (nieve): está congelada; pasar 3 veces a su lado para romper el hielo.
  - Brasa (volcán): empieza como una culebra de lava enemiga; si Inti la esquiva 3 veces sin chocar, cambia de bando.
  - Luna (noche): está perdida en la oscuridad; seguir el rastro de 5 luciérnagas hasta ella.
- Si se cumple: el amigo se une como un segmento de su color al final de la cola (este segmento no se corta con las Tijeras) y se abre la cámara del recuerdo con su recuerdo.
- Si no se cumple, el nivel sigue normal. El amigo se pierde para esa partida.

### Fase 6: historia (`StoryScene`)

- Escena de texto con letras que aparecen de a poco y avanzan con Espacio o toque.
- Intro al empezar una partida nueva (5 o 6 pantallas cortas): Inti entra al bosque, muerde la fruta, aparece la guardiana, lo transforma, explica las cinco tierras y la Fruta del Origen. No revelar por qué entró al bosque.
- Antes de cada nivel, 1 o 2 líneas de la guardiana presentando la tierra.
- Ilustraciones simples con formas, con el estilo del juego.

### Fase 7: el puzzle de la puerta (`MemoryPuzzleScene`)

- Después del nivel 5 (y su cámara del recuerdo).
- Una puerta de piedra cerrada arriba y una fila de casillas numeradas. Abajo, las tarjetas de los recuerdos conseguidos mezcladas (entre 5 y 10, según los amigos).
- Arrastrar tarjetas a las casillas con mouse o dedo. Con teclado: elegir tarjeta con flechas y colocarla con Espacio.
- Botón "Abrir la puerta". Se valida el orden relativo según el campo `orden` (si faltan recuerdos de amigos, solo importa que los que hay estén ordenados entre sí).
- Orden incorrecto: las tarjetas tiemblan, se ven borrosas un momento y la puerta sigue cerrada. Sin Game Over.
- Orden correcto: los recuerdos pasan uno tras otro en pantalla completa como una película corta (2 s cada uno), la puerta se abre, Inti cruza y termina de transformarse en humano.

### Fase 8: la batalla final (`BossScene`)

- Escena de entrada: la serpiente se separa de Inti, cruza la puerta detrás de él y crece hasta ocupar media pantalla. Los amigos aparecen, se juntan en la super serpiente e Inti se sube encima (dibujado sobre la cabeza).
- El jugador controla la super serpiente con los mismos controles del snake. Tablero del mismo tamaño.
- La mega serpiente la controla la computadora: cada paso elige la dirección que más la acerca a la cabeza del jugador, con 20 % de probabilidad de elegir otra dirección válida. Nunca hace media vuelta. Empieza con 20 segmentos.
- Chocar de frente con la mega serpiente, con su cuerpo o con una pared = derrota (salvo Escudo).
- Si la mega serpiente choca con el cuerpo de la super serpiente, con su propia cola o con una pared, recibe un golpe: parpadea, pierde el 25 % de sus segmentos y se aleja 2 s. Con 4 golpes se deshace.
- Hay manzanas en el tablero y ambas pueden comerlas para crecer.
- Poderes: los de los amigos conseguidos, mostrados como íconos abajo. Se activan con las teclas 1 a 5 (o tocando el ícono) y cada uno se recarga en 15 s.
- Barra de vida de la mega serpiente arriba (4 segmentos).
- Derrota: la serpiente envuelve a Inti y empieza a volverlo serpiente; botón para reintentar desde el inicio de la batalla, sin repetir el puzzle.

### Fase 9: finales (`EndingScene`)

- Al ganar, la mega serpiente se deshace y la forma humana de Inti queda fija. La guardiana pregunta: "¿Vuelves a casa o te quedas a cuidar de ellos?"
- **Volver a casa (final verdadero):** los amigos se despiden, Inti llega a su casa con la fruta para su hermana.
- **Quedarse como guardián (final alternativo):** Inti se queda con sus amigos y Luna lleva la fruta a la casa de su hermana.
- Créditos al final: nombre del estudio, integrantes, "Hecho con Phaser 3".
- Guardar en `localStorage` qué finales se han visto y mostrarlo en el menú.

### Fase 10: pulido

- Sonidos nuevos con osciladores: material recogido, fruta que aparece, fruta que se marchita, muda, anillo girado, recuerdo completo, puerta que se abre, golpe al jefe, victoria.
- Revisar dificultad: que el nivel 1 se pueda terminar en 2 o 3 minutos.
- Probar todo en celular.
- Actualizar `MenuScene` con el título "AMARU" y "La Fruta del Origen".

## 5. Checklist final

- [ ] Se puede jugar de la intro a los créditos sin errores en la consola.
- [ ] Los dos finales funcionan.
- [ ] El puzzle funciona con 5 recuerdos (sin amigos) y con 10 (todos los amigos).
- [ ] Todo se puede jugar en celular.
- [ ] "Continuar" retoma la partida en el nivel correcto.
- [ ] El modo debug solo se activa con `?debug=1`.
- [ ] No se agregaron imágenes ni audios de terceros (si se agregan, acreditarlos en el Muro de Honor de la página).
- [ ] El botón JUGAR de la landing page sigue abriendo el juego en GitHub Pages.
