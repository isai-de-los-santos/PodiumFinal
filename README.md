# 🏆 Podium — Plataforma de Evaluación de Proyectos Universitarios

Podium es una aplicación móvil desarrollada con **React Native + Expo** que centraliza la exhibición y evaluación académica de proyectos universitarios. Permite a estudiantes subir sus proyectos con evidencias multimedia, a docentes evaluarlos mediante una rúbrica estructurada, y a administradores moderar el contenido de la plataforma.

---

## 👥 Roles de la Plataforma

| Rol | Descripción |
|---|---|
| 🎓 **Estudiante** | Sube proyectos con videos, imágenes, documentos y repositorio. Puede ver el feed general de proyectos de otros compañeros. |
| 👨‍🏫 **Docente** | Evalúa proyectos mediante una rúbrica de 5 criterios (100 pts en total) y emite retroalimentación. |
| 🛡️ **Administrador** | Aprueba, rechaza y modera proyectos. Gestiona usuarios de la plataforma. |

---

## 🚀 Probar la App sin Instalación (Expo Go)

Para evitarse la molestia de configurar el entorno de desarrollo local, puedes probar la app directamente con **Expo Go**.

### Pasos:
1. Descarga **Expo Go** desde la [App Store](https://apps.apple.com/app/expo-go/id982107779) o [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent).
2. Clona el repositorio, entra a `podium-app` y ejecuta `npx expo start --clear`.
3. Escanea el QR que aparece en la terminal con Expo Go.
4. Inicia sesión con alguna de las cuentas de demostración:

| Rol | Email | Contraseña |
|---|---|---|
| Estudiante | `isaidelos@gmail.com` | `yusepe` |
| Docente | `storip9@gmail.com` | `yusepe` |

## 📦 Stack Tecnológico
| Tecnología | Para qué se usa |
|---|---|
| **React Native** | Framework principal para construir la app con JavaScript/TypeScript que corre de forma nativa en iOS y Android. |
| **Expo** | Capa sobre React Native que simplifica el desarrollo, el build y la distribución de la app sin necesidad de Android Studio o Xcode. |
| **Expo Router** | Sistema de navegación basado en archivos (similar a Next.js), organizado por grupos de roles para separar las rutas de cada tipo de usuario. |
| **Supabase** | Backend as a Service usado como base de datos PostgreSQL y como almacenamiento en la nube para los videos, imágenes y documentos que suben los estudiantes. |
| **expo-av** | Librería nativa de Expo para reproducir video directamente con el decodificador de hardware del dispositivo (soporte para MP4, Google Drive y YouTube). |
| **NativeWind / TailwindCSS** | Sistema de utilidades de estilo que permite usar clases de Tailwind dentro de componentes de React Native para mantener un diseño consistente y rápido. |
| **Lucide React Native** | Librería de íconos SVG optimizados y listos para usar en React Native, usados en toda la interfaz. |
| **AsyncStorage** | Almacenamiento local persistente en el dispositivo para guardar la sesión del usuario sin necesidad de volver a iniciar sesión. |


