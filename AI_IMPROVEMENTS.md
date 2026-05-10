# Propuesta de Mejoras: IA con Groq en NutriMax

Este documento detalla cómo integrar Inteligencia Artificial avanzada utilizando **Groq** para potenciar el portal nutricional NutriMax.

## 🚀 ¿Por qué Groq?
Groq ofrece una velocidad de inferencia inigualable (LPUs), lo que permite respuestas casi instantáneas en aplicaciones interactivas como asistentes de nutrición y generadores de dietas en tiempo real.

---

## 🛠 Configuración Inicial

### 1. Variables de Entorno
Añade tu API Key de Groq en `apps/web/.env.local`:
```bash
GROQ_API_KEY=gsk_your_api_key_here
```

### 2. Instalación de Dependencias
```bash
pnpm add groq-sdk --filter @nutrimax/web
```

---

## 💡 Mejoras Propuestas

### 1. Generador Automatizado de Dietas (JSON)
Utilizar los datos biométricos del cliente (`weight_kg`, `height_cm`, `body_fat_pct`) para generar una estructura inicial del plan alimenticio.
- **Acción**: Crear un endpoint `api/ai/generate-diet`.
- **Prompt sugerido**: *"Eres un nutricionista clínico experto. Basado en estos datos [DATOS], genera un objeto JSON que siga el esquema de la tabla `public.diets`."*

### 2. Analista de Perfil Clínico y Bioimpedancia
Interpretar el campo `clinical_profile` y los reportes de bioimpedancia para alertar al nutricionista sobre posibles riesgos o áreas de atención.
- **Beneficio**: Ahorra tiempo en la lectura de datos técnicos y ofrece un resumen ejecutivo automático en el timeline del cliente.

### 3. Asistente Nutricional 24/7 (Chatbot)
Un chat interactivo para los clientes donde puedan consultar dudas sobre su dieta asignada.
- **Contexto**: El chatbot debe tener acceso al `plan` de la dieta activa del cliente (`client_diet_assignments`) para dar respuestas personalizadas.

### 4. Automatización de Resúmenes en el Timeline
Generar automáticamente eventos en `client_timeline_events` resumiendo el progreso entre revisiones de perfil clínico.

---

## 🔒 Seguridad y Privacidad
- **API Keys**: Nunca subas el archivo `.env.local` al repositorio.
- **Datos Sensibles**: Asegúrate de anonimizar o manejar con cuidado los datos de salud de los clientes antes de enviarlos a la API de Groq, cumpliendo con las regulaciones locales de salud.

## 📂 Estructura de Ejemplo para el Backend
```typescript
// apps/web/src/app/api/ai/analyze-profile/route.ts
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  const { profile } = await req.json();
  
  const completion = await groq.chat.completions.create({
    messages: [
      { role: "system", content: "Analiza perfiles clínicos de nutrición." },
      { role: "user", content: JSON.stringify(profile) }
    ],
    model: "llama-3.1-70b-versatile",
  });

  return Response.json({ analysis: completion.choices[0].message.content });
}
```
