# 🚀 AUY1104 - Evaluación Final Transversal

# Pipeline CI/CD con Estrategia Blue-Green sobre Kubernetes (K3s)

> Evaluación desarrollada para la asignatura **Ciclo de Vida del Software II**, implementando un pipeline CI/CD reutilizable mediante **GitHub Actions**, una estrategia de despliegue **Blue-Green**, validaciones automáticas de salud y mecanismos de remediación sobre un clúster **Kubernetes K3s** ejecutándose sobre Amazon EC2.

---

# 👨‍🎓 Información General

| Campo | Información |
|-------|-------------|
| **Estudiante** | Lucía Villalobos |
| **Asignatura** | CICLO DE VIDA DEL SOFTWARE II_002V |
| **Evaluación** | Evaluación Final Transversal |
| **Docente** | Andrés Patricio Sánchez Ossandón |
| **Tecnologías** | GitHub Actions, Docker, Docker Hub, Kubernetes (K3s), Amazon EC2, Node.js, Git, Visual Studio Code |
| **Proveedor Cloud** | Amazon Web Services (AWS) |

---

# 📑 Contenido

- 🎯 [Objetivo](#-objetivo)
- 🏗️ [Arquitectura implementada](#️-arquitectura-implementada)
- 🛠️ [Tecnologías utilizadas](#️-tecnologías-utilizadas)
- 📁 [Estructura del proyecto](#-estructura-del-proyecto)
- ⚙️ [Workflow reutilizable](#️-workflow-reutilizable)
- 🔵🟢 [Estrategia Blue-Green](#-estrategia-blue-green)
- 🩺 [Validaciones de salud](#-validaciones-de-salud)
- 🔄 [Rollback automático](#-rollback-automático)
- 📸 [Evidencias de implementación](#-evidencias-de-implementación)
- 📚 [Referencias](#-referencias)
- 🤖 [Declaración de uso de IA](#-declaración-de-uso-de-ia)
- ✅ [Conclusiones](#-conclusiones)

---

# 🎯 Objetivo

Desarrollar una solución de Integración y Entrega Continua (CI/CD) para el microservicio **TechMarket Orders**, utilizando **GitHub Actions** y un clúster **Kubernetes K3s**, implementando una estrategia de despliegue **Blue-Green** que permita publicar nuevas versiones de la aplicación con alta disponibilidad, validaciones automáticas de salud y un mecanismo de recuperación automática (Rollback) frente a posibles fallos durante el proceso de despliegue.

El proyecto reutiliza las plantillas desarrolladas durante el semestre, automatizando las etapas de construcción, publicación, despliegue y validación de la aplicación, reduciendo el riesgo asociado a las actualizaciones en producción y garantizando la continuidad del servicio.