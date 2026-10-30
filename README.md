# FitMate | AI Nutritionist, Strength Coach & GymPartners ⚡

**FitMate** es una plataforma web integral de nutrición deportiva, entrenamiento de fuerza personalizado y red social de compañeros de gimnasio (*GymPartners*) diseñada para atletas y entusiastas del fitness en **Honduras** (Tegucigalpa y San Pedro Sula). Combina visión artificial multimodal con **Google Gemini 3.8 Flash**, cálculo metabólico basado en evidencia científica y una estética **Neo-Futurista con Glassmorphism**.

---

## 🚀 Arquitectura y Tecnologías

- **Backend:** Node.js 20 ESM, Express, Firebase Genkit + `@genkit-ai/googleai`, Zod schemas con definición in-line estricta, Helmet CSP, CORS, rate limiting.
- **Frontend:** Vanilla HTML5 / CSS3 / ES Modules nativos (sin frameworks, sin CDNs, sin herramientas de compilación).
- **Seguridad DOM:** Cero `innerHTML`. Manipulación segura con `document.createElement`, `classList`, `setAttribute` y `textContent`.
- **Persistencia Local:** `localStorage` para perfil de usuario, registros de comidas diarias, rutinas, gimnasios y publicaciones comunitarias.
- **Diseño Glassmorphism + Neo-Futurismo:** Tarjetas translúcidas con `backdrop-filter: blur(18px)`, bordes de 1px con brillo sutil, acentos neón (Cyan `#00f5d4`, Violeta `#a855f7`, Lima `#10b981`, Ámbar `#f59e0b`), tipografía Space Grotesk/Orbitron para encabezados e Inter para cuerpo, y anillos animados SVG para el seguimiento de macronutrientes.
- **Responsividad:** *Desktop-first* con barra lateral (*sidebar*) y diseño multi-columna; adaptable a dispositivos móviles con barra de navegación inferior (*bottom nav*).

---

## 📦 Módulos Principales

### 1. Perfil & Onboarding Metabólico
- Parámetros: edad, sexo biológico, peso corporal, estatura, objetivo (*cut* / *bulk* / *maintain*), nivel de actividad física (Mifflin-St Jeor), experiencia en levantamiento, lesiones y restricciones dietéticas.
- Cómputo exacto de BMR, TDEE, calorías diarias y distribución de macronutrientes (proteína a 2.0-2.2 g/kg, grasas saludables a 0.9 g/kg, remanente a carbohidratos).
- **Estimación de Somatotipo:** Clasificación científica en *Ectomorfo*, *Mesomorfo* o *Endomorfo* a partir de métricas antropométricas con explicación clara de biomecánica y pautas de entrenamiento recomendadas.

### 2. Escáner de Comida con Visión IA (Gemini 3.8 Flash)
- **Cámara en vivo (Webcam)** mediante `getUserMedia` y subida de archivos (JPEG, PNG, WebP) con redimensión automática a 1024 px.
- **Conteo de piezas y estimación de porción:** Gemini identifica ingredientes y cuantifica unidades (ej. *"3 plátanos maduros", "1 baleada especial"*), calculando calorías totales, proteína, carbohidratos, grasas y fibra.
- **Formulario editable:** Permite al usuario ajustar las cantidades antes de registrar en el diario.
- **Consejos nutricionales catrachos:** Sugerencias de preparación más saludable (ej. freidora de aire en vez de fritura tradicional) y recomendaciones de qué comer en la próxima comida con ingredientes locales hondureños (pollo a la plancha, frijoles parados, cuajada fresca, tortillas de maíz).
- **Buscador rápido catracho:** Base de datos local integrada con comidas tradicionales de Honduras para registro manual instantáneo.

### 3. Asesor de Suplementación Basado en Evidencia
- Evalúa la brecha nutricional entre el consumo real del día y las metas del objetivo (déficit calórico, requerimientos proteicos).
- Emite un veredicto estructurado para cada suplemento (*Recomendado*, *Opcional* o *No necesario*), especificando dosis clínica exacta, momento óptimo de ingesta y justificación fisiológica.
- Incluye descargo de responsabilidad médica y de seguridad conforme a normativas de salud.

### 4. Entrenador Personal de IA
- Genera divisiones semanales de entrenamiento (ej. *Push / Pull / Legs*, *Torso / Pierna*) adaptadas a la experiencia, objetivo y días disponibles.
- Por cada ejercicio detalla: máquina o implemento a utilizar, carga inicial sugerida, series × repeticiones, descanso entre series, **regla de sobrecarga progresiva concreta** y **clave biomecánica de ejecución** (*form cue*).
- **Registro interactivo:** Checkboxes dinámicos por serie (S1, S2, S3, S4) para seguimiento en tiempo real durante la sesión.

### 5. Gimnasios y Equipamiento
- Selector de gimnasios populares en Honduras (*Smart Fit Las Cascadas, Max Fitness Morazán, Planet Fitness Próceres, Home Gym*).
- Listado de máquinas y accesorios disponibles en cada recinto; las rutinas generadas por la IA se adaptan estrictamente al equipamiento disponible.
- Creador de gimnasios personalizados para agregar instalaciones o gimnasios caseros.

### 6. GymPartners (Red Social Fitness)
- Perfil público con avatar, biografía, gimnasio actual, objetivo, racha de días consecutivos (*streak*) y marcas personales (PRs en Banca, Sentadilla y Peso Muerto).
- Muro de publicaciones con logros de entrenamiento y platillos registrados.
- Interacciones sociales: botones de *Like* (❤️), comentarios en tiempo real y función de seguir atletas compañeros de entrenamiento.

---

## 🛠️ Endpoints de la API

| Método | Endpoint | Descripción |
|---|---|---|
| `GET` | `/healthz` | Comprobación de estado y disponibilidad del servicio |
| `POST` | `/api/analyze` | Análisis bromatológico y conteo de comidas con Gemini 3.8 Flash |
| `POST` | `/api/routine` | Generación de rutina semanal adaptada al gimnasio |
| `POST` | `/api/supplements` | Evaluación de brechas de macronutrientes y suplementos |

---

## 🧪 Pruebas Unitarias y de Integración

El proyecto cuenta con una suite completa de pruebas nativas con Node.js Test Runner:

```bash
npm test
```

Valida:
- Generación de claves criptográficas SHA-256 para caché LRU + TTL.
- Detección estricta de tipos MIME mediante bytes mágicos.
- Validación de esquemas Zod (`FoodAnalysisSchema`, `RoutineInputSchema`, `RoutineOutputSchema`, `SupplementAdvisorInputSchema`, `SupplementAdvisorOutputSchema`).
- Respuestas y códigos HTTP de todos los endpoints del servidor Express.

---

## 🏃 Ejecución Local

1. **Instalar dependencias:**
   ```bash
   npm install
   ```
2. **Configurar variables de entorno (`.env`):**
   ```env
   PORT=8080
   GEMINI_API_KEY=tu_api_key_de_google_ai_studio
   GEMINI_MODEL=gemini-3.8-flash
   NODE_ENV=development
   CACHE_MAX_ITEMS=500
   CACHE_TTL_MS=86400000
   ```
3. **Iniciar el servidor:**
   ```bash
   npm start
   ```
4. **Abrir en el navegador:**
   `http://localhost:8080`

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo `LICENSE` para más información.
