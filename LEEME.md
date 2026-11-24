# Laboratorio de optimización con derivadas

Este proyecto contiene tres simuladores interactivos hechos con HTML, CSS y JavaScript puro. No requiere instalación de paquetes ni servidor.

## Cómo abrirlo

1. Abre la carpeta `pagina web` en Visual Studio Code.
2. Abre `index.html` y ejecútalo en un navegador. También puedes abrir el archivo directamente con doble clic.
3. Elige uno de los tres simuladores y mueve los controles para cambiar los parámetros.

## Simuladores

- **Nivelación topográfica:** registra vistas atrás, intermedias y adelante para obtener cotas y consultar el perfil longitudinal. También calcula la pendiente aproximada entre puntos como Δcota / Δdistancia × 100, una aproximación de la derivada del perfil.
- **Cercado junto al río:** maximiza el área con una longitud fija de cerca para tres lados.
- **Cilindro eficiente:** minimiza el área de material de una lata cerrada con volumen fijo.

Los simuladores de cercado y cilindro muestran sus funciones objetivo, derivadas, gráficas y óptimos. La herramienta topográfica muestra cotas, pendiente porcentual aproximada y perfil del terreno.
