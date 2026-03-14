## Página web del Lector Swaruu v06:

Si ves esta página después de haber pulsado el enlace en Telegram, probablemente estás viendo esta página dentro de Telegram aún. Lo sabrás porque el menú arriba a la derecha es distinto en opciones al que tiene Chrome. Si aún estás en Telegram elige en el menú la primera opción para abrir esta página en el navegador Chrome. Es necesario para que funcionen cosas como la instalación de la App de la que hablo abajo.

La página web del Lector es:
https://jmbbao.github.io/Lector/program/lector.html

Recomiendo hacer un bookmark en el navegador para fácil acceso. 

Lector es una página web que permite leer textos de Swaruu, Artari'El, Semjase y otros y buscar palabras en ellos. La web mira un fichero "indice.json" que contiene las urls a cada fichero, y los baja al ordenador quedando almacenados en la caché del navegador. Cada vez que corre la página mira si hay una nueva versión de algún fichero.

En este texto que lees el título tiene el número de versión actual, en la página web podéis mirar si coincide el número de versión en el botón Ajustes: el título de ese panel tiene la versión.

Si la versión que ves en Ajustes no es la que ves en este texto es porque necesitas decirle a Chrome que no use nada viejo de la caché y se actualice:

💻️ En el ordenador se hace pulsando: Ctr + Shft + R  eso recarga la página completamente y funciona, pero la próxima vez que entres volverá a estar igual (me ha ocurrido). Se soluciona en Chrome así: En la barra donde está la dirección de la página hay un pequeño icono justo antes del comienzo de la dirección, lo pulsas y eliges la última opción "Site settings" y mostrará el uso en megas y un botón "Delete data" y al pulsarlo ya borra todo lo que tenía el navegador de esta página así que al navegar a ella la cargará íntegramente. 

📱️ En el móvil hay dos formas:

1) Si has instalado la página como una app se actualiza sola. 
La app se instala así: abres en el navegador el lector ( https://jmbbao.github.io/Lector/program/lector.html ) y en el menú de Chrome eliges la última opción "Añadir a pantalla de inicio". Te pregunta si quieres Instalar o si quieres crear un acceso directo, elige "Instalar".
    
2) Si no tienes instalada la app y solo usas el navegador: En el Menú de Chrome elige Configuración / Privacidad y seguridad / Borrar datos navegación, y marcas "Archivos e imágenes en caché" solamente (desmarca el resto para que no borre contraseñas, etc), y arriba a la derecha cambia "Ultima hora" para que ponga "Desde siempre", y ya abajo pulsa "Eliminar datos".


## Página web con las Imágenes:
Las imágenes están en esta carpeta de Drive:
https://drive.google.com/drive/u/0/folders/1V9WCwuwJCXT9fuzLQ4NyU2xO8Wre1JxV

Recomiendo hacer un bookmark en el navegador para fácil acceso.

Y también están en un fichero .zip descargable en el canal público "Swaruu" en Telegram: https://t.me/SwaruuTelegram


## La primera vez que accedes a la página web:
Te dirá que aún no ha bajado los textos y te pide que pulses el botón para hacerlo.
Entonces bajará los textos, que se almacenarán en la caché del navegador. Si vacías la caché del navegador (opción en Ajustes) volverá a decirte que no los tienes y te pedirá de nuevo permiso para bajarlos a la caché.

Cada vez que se ejecuta comprueba que el tamaño de los ficheros de texto en este repositorio es el mismo que el tamaño que tiene en la caché, si fuera distinto te avisa con un botón amarillo que hay nuevas versiones y debes pulsar el botón y luego pulsar para bajar las nuevas versiones.

Almacena la posición en la que estás leyendo cada texto, lo almacena también en la caché del navegador.

Permite realizar búsquedas de texto o palabras, en el fichero que estás leyendo o en todos ellos si marcas la casilla "En todos"


## Bajar los ficheros de texto a tu ordenador:
Si además de leer los textos deseas bajarlos a tu ordenador: Arriba ves un botón verde que pone "Code" te permitirá bajar un zip que contiene todo lo que hay en este repositorio, incluyendo los ficheros de texto. También bajas la página web y puedes hacer doble clic en el fichero html y ejecutar la web de esa forma en tu ordenador. También puedes mirar cómo está hecha. 
Hay disponibles versión en pdf de todos estos ficheros de los contactos Swaruu, Artari'El, Semjase, en el canal de Telegram "Swaruu" https://t.me/SwaruuTelegram

Para construir esta página web usé la ayuda de Copilot https://copilot.microsoft.com/ en modo gratuito. Le pedía lo que quería cambiar y a veces lo hacía mal así que tenía que revisar lo que escribía o simplemente probar y si fallaba le decía que algo hizo mal. A veces me decía que había que hacer un cambio pero se olvidaba de darme el código. A veces me decía que solo había que hacer tal cambio y yo le decía que además había que cambiar otras cosas y me decía que tenía yo razón. O sea que no está muy tuneado para hacer código (hay versiones IA muy tuneadas para únicamente hacer código pero ya son de pago).


## Correcciones pendientes, fallos conocidos:
- Bajar/actualizar solo los textos que falten, no todos cada vez

- Cuando aparecen los botones de Versión Nueva de ficheros de texto todos los botones crecen. Será mejor moverlo a su propio panel.

- Mejorar la apariencia para que sea más bonita, quizá añadiendo imágenes y diversos tamaños de texto quizá en la letra. 

- Colores en el texto como está en el pdf (en amarillo mis comentarios al texto por ejemplo). Aunque esto de los colores puede ser lioso al permitir elegir colores de texto pues entonces necesito elegir un color para el resto de cosas (quizá lo mejor sería no dejar elegir al usuario un color que sea cercano a uno que ya se usa en el texto).


## Arreglado ya:
✅️ Botón en la barra de Estado para mostrar / ocultar los paneles y el menú.

✅️ Hacer que la página sea fácil de usar también en el móvil en modo horizontal.

✅️ Arreglar que el menú superior se mueve al buscar o ir a ajustes y hay que andar bajándolo, en el móvil

✅️ Al buscar si no encuentra coincidencias poner un mensaje en la barra de estado

✅️ Ya se puede configurar el tamaño del interface. Y ya funciona en Móvil en modo vertical. En modo horizontal de momento no está bien.

✅️ ¿Qué hacer con las fotos? Pues puse un botón que abre otra página del navegador con las fotos y santas pascuas

✅️ En la búsqueda, poder buscar con coincidencia de mayúsculas y minúsculas

✅️ Arreglar el espacio inferior que aparece vacío

✅️ Al arrancar debe aparecer en el texto que estaba cuando salimos 

✅️ Arreglado por fin la Búsqueda, había muchas cosas mal. Terminé cambiando la forma de mostrar los resultados: una listbox mostrará los ficheros donde ha encontrado el texto a buscar (si has marcado el checkbox de buscar en todos los archivos, sino solo buscará en el fichero actual y no mostrará esta listbox)

✅️ Arreglar la selección de colores de texto y fondo para la lectura, pues a veces no funciona

✅️ Arreglar colores en paneles y barra superior

✅️ Arreglar la selección de Tema de colores: Claro/Oscuro/Usuario

❎️ Descartado, no es necesario: Botón X en la cajita de texto a buscar, para resetearlo fácilmente

✅️ ¿Qué hacer con las fotos? : Las he subido a la web: https://drive.google.com/drive/u/0/folders/1V9WCwuwJCXT9fuzLQ4NyU2xO8Wre1JxV
    Y también están en el canal de Telegram: https://t.me/SwaruuTelegram

