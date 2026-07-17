# Bitácora de Desarrollo — Evaluación Final Transversal

**Estudiante:** Lucía Villalobos Ospina  
**Asignatura:** AUY1104 — Ciclo de Vida del Software II  
**Proyecto:** Operación Resiliencia en TechMarket  
**Estrategia seleccionada:** Blue-Green  
**Plataforma Kubernetes:** K3s sobre AWS EC2  
**Registro de imágenes:** Docker Hub  

---

## 1. Revisión inicial de la solución EA3

### Objetivo

Revisar la solución implementada durante la Evaluación Parcial 3 para identificar los componentes reutilizables y los cambios necesarios para cumplir con la Evaluación Final Transversal.

### Repositorios utilizados

- `AUY1104-Client`: aplicación, Dockerfile, manifiestos Kubernetes y workflow cliente.
- `AUY1104-SharedWorkflows`: workflows reutilizables de GitHub Actions.

### Componentes existentes

La solución de la EA3 ya contaba con:

- aplicación Node.js;
- pruebas unitarias;
- construcción de imagen Docker;
- publicación en Docker Hub;
- despliegue automatizado en K3s;
- validación mediante `kubectl rollout status`;
- rollback automático mediante `kubectl rollout undo`;
- pruebas controladas de fallos en Tests, Docker y Kubernetes.

### Hallazgo principal

El despliegue existente utiliza un único Deployment llamado `demo-api` y un único Service llamado `demo-api-service`. Esta estructura permite realizar Rolling Update, pero todavía no implementa dos ambientes simultáneos para una estrategia Blue-Green.

### Decisión técnica

Se seleccionó la estrategia Blue-Green porque permite mantener una versión estable atendiendo a los usuarios mientras una nueva versión es desplegada y validada de manera independiente.

---

## 2. Preparación de la API para Blue-Green

### Objetivo

Modificar la aplicación para permitir que el pipeline valide la salud de una versión candidata antes de cambiar el tráfico.

### Archivo modificado

- `index.js`

### Cambios realizados

Se incorporaron las siguientes capacidades:

- endpoint dedicado `/health`;
- respuesta en formato JSON;
- variable dinámica `PORT`;
- variable dinámica `APP_VERSION`;
- variable `FORCE_ERROR` para simular fallos controlados;
- identificación de la versión que está respondiendo;
- respuesta HTTP 500 cuando se activa una condición de error.

### Justificación técnica

La estrategia Blue-Green requiere validar la versión candidata antes de redirigir el tráfico de producción. El endpoint `/health` permitirá que Kubernetes y GitHub Actions comprueben si la aplicación está operativa.

La variable `APP_VERSION` permitirá identificar visualmente si la respuesta proviene del ambiente Blue o Green.

La variable `FORCE_ERROR` permitirá realizar la prueba de fuego y comprobar que el pipeline detecta un fallo y mantiene o recupera automáticamente la versión estable.

### Resultado esperado

Con `FORCE_ERROR=false`, el endpoint `/health` debe responder:

```json
{
  "status": "ok",
  "version": "v1"
}

## 3. Actualización de la identidad del proyecto

### Objetivo

Homogeneizar la nomenclatura del proyecto para adecuarla al caso de negocio de la Evaluación Final Transversal.

### Archivos modificados

- index.js
- test.js

### Cambios realizados

Se reemplazaron las referencias a "Prueba 3" por "TechMarket Orders" y "EFT", manteniendo una nomenclatura consistente en la aplicación y en las pruebas unitarias.

### Justificación técnica

La solución deja de representar un laboratorio de la EA3 y pasa a corresponder al microservicio TechMarket Orders solicitado en el caso de negocio de la Evaluación Final Transversal.

### Estado

Validación local completada correctamente.

El comando `npm.cmd test` ejecutó las pruebas de los endpoints `/`, `/health` y una ruta inexistente. Todos los resultados coincidieron con el comportamiento esperado.

### Incidencia de entorno local

Durante la primera ejecución, PowerShell bloqueó el script `npm.ps1` debido a la política de ejecución configurada en Windows.

Para continuar sin modificar la política de seguridad del sistema, se utilizó el ejecutable `npm.cmd`, obteniendo correctamente la versión de npm y ejecutando las pruebas automatizadas.

Comandos utilizados:

```powershell
npm.cmd --version
npm.cmd test

### Evidencias

- EFT-01-Validacion-local-npm-test-y-start.png
- EFT-02-Prueba-endpoints-api-health-404.png

## 4. Análisis del workflow reutilizable existente

### Objetivo

Revisar la automatización implementada en la EA3 para identificar los componentes reutilizables y las modificaciones necesarias para implementar una estrategia Blue-Green.

### Repositorio revisado

- `AUY1104-SharedWorkflows`

### Archivo revisado

- `.github/workflows/deploy-api.yaml`

### Flujo actual identificado

El workflow reutilizable implementa las siguientes etapas:

1. descarga del código del repositorio Cliente;
2. instalación de dependencias;
3. ejecución de pruebas automatizadas;
4. construcción de la imagen Docker;
5. publicación de las etiquetas de imagen en Docker Hub;
6. conexión SSH con la instancia EC2;
7. copia de los manifiestos Kubernetes;
8. aplicación de los manifiestos en K3s;
9. validación mediante `kubectl rollout status`;
10. rollback automático mediante `kubectl rollout undo` cuando el despliegue falla.

### Hallazgo principal

La automatización actual está diseñada para actualizar un único Deployment llamado `demo-api`. Esta lógica corresponde a una estrategia Rolling Update y restaura una revisión anterior del mismo Deployment cuando ocurre un fallo.

Para cumplir con la EFT será necesario adaptar el flujo para trabajar con dos Deployments simultáneos, Blue y Green, validar la versión candidata antes del cambio de tráfico y realizar el rollback modificando el selector del Service.

### Cambios pendientes identificados

- crear Deployment Blue;
- crear Deployment Green;
- crear un Service principal para el tráfico de producción;
- crear un Service de preview para validar la versión candidata;
- configurar probes de salud;
- incorporar variables dinámicas de ambiente y versión;
- actualizar el workflow para detectar el ambiente activo;
- desplegar sobre el ambiente inactivo;
- validar el endpoint `/health`;
- cambiar el selector del Service;
- revertir el selector si la validación final falla.

### Estado

Análisis técnico completado. No se realizaron modificaciones al workflow durante esta etapa.

## 7. Retiro del Deployment Rolling Update anterior

### Objetivo

Evitar que el pipeline despliegue simultáneamente el Deployment antiguo de la EA3 junto con los nuevos ambientes Blue y Green.

### Problema identificado

El workflow aplica todos los manifiestos presentes en la carpeta `k8s/`. Mantener el archivo `deployment.yaml` en esa ubicación habría creado un tercer Deployment llamado `demo-api`, además de `demo-api-blue` y `demo-api-green`.

Aunque el Service Blue-Green no seleccionaría sus Pods, el Deployment antiguo seguiría consumiendo recursos y podría generar confusión durante la presentación.

### Cambio realizado

El archivo original:

- `k8s/deployment.yaml`

fue movido a:

- `k8s/legacy/deployment-rolling-update.yaml`

### Justificación técnica

Se conservó el manifiesto anterior como evidencia de la evolución desde Rolling Update hacia Blue-Green, pero se retiró de la carpeta activa para evitar que fuera aplicado automáticamente por el pipeline.

### Estado

Deployment anterior archivado correctamente.

## 8. Creación del Service de Preview

### Objetivo

Crear un punto de acceso independiente para validar el ambiente Green antes de cambiar el tráfico de producción.

### Problema resuelto

El Service principal apunta inicialmente al ambiente Blue. Sin un segundo Service no era posible consultar Green de forma independiente sin modificar el tráfico de los usuarios.

### Archivo creado

- `k8s/service-preview.yaml`

### Configuración implementada

Se creó el Service `demo-api-preview` con:

- selector `app: demo-api`;
- selector `slot: green`;
- tipo `NodePort`;
- puerto interno 80;
- puerto de aplicación 3000;
- NodePort 30091.

### Justificación técnica

El Service de Preview permitirá que GitHub Actions consulte el endpoint `/health` del ambiente Green antes de cambiar el selector del Service principal.

Si Green no responde correctamente, el tráfico permanecerá en Blue.

### Estado

Service de Preview creado. Pendiente de validación en K3s.

## 10. Validación local de la arquitectura inicial

### Pruebas realizadas

Se ejecutaron pruebas automatizadas y manuales sobre el microservicio antes de continuar con la automatización del despliegue.

Comando ejecutado:

```powershell
npm.cmd test

## 11. Detección automática del ambiente activo

### Objetivo

Permitir que el workflow reutilizable determine si el tráfico de producción está siendo enviado al ambiente Blue o Green.

### Archivo modificado

- `AUY1104-SharedWorkflows/.github/workflows/deploy-api.yaml`

### Implementación

Se agregó una etapa que consulta el selector `slot` del Service `demo-api-service`.

El workflow guarda dos valores:

- `active-slot`: ambiente que actualmente recibe tráfico;
- `target-slot`: ambiente inactivo donde se desplegará la nueva versión.

### Lógica aplicada

- Si el Service apunta a Blue, el ambiente candidato será Green.
- Si el Service apunta a Green, el ambiente candidato será Blue.
- Si el Service todavía no existe, se asume Blue como ambiente inicial.

### Estado

Lógica agregada. Pendiente de validación en GitHub Actions.

### Evidencia

- EFT-09-Workflow-deteccion-ambiente-activo.png

## 13. Configuración dinámica del Service Preview

### Objetivo

Permitir que el Service de Preview apunte automáticamente al ambiente seleccionado como candidato.

### Problema identificado

El manifiesto inicial de Preview utilizaba de forma fija el selector `slot: green`. Esta configuración no serviría cuando Blue se convirtiera en el siguiente ambiente candidato.

### Archivo modificado

- `AUY1104-SharedWorkflows/.github/workflows/deploy-api.yaml`

### Implementación

Después de desplegar el ambiente candidato, el workflow:

1. aplica el manifiesto `service-preview.yaml`;
2. modifica su selector mediante `kubectl patch`;
3. asigna dinámicamente el valor de `target-slot`;
4. consulta el selector final para confirmar la configuración.

### Ejemplos

- candidato Green → Preview utiliza `slot: green`;
- candidato Blue → Preview utiliza `slot: blue`.

### Justificación técnica

El Service Preview debe dirigir sus solicitudes exclusivamente al ambiente candidato para que la validación de salud se realice sobre la nueva versión y no sobre el ambiente que ya atiende producción.

### Estado

Selector dinámico de Preview implementado. Pendiente de ejecutar el Health Check.

## 15. Refactorización completa del workflow Blue-Green

### Objetivo

Reestructurar el workflow reutilizable para implementar de manera clara el ciclo completo de despliegue Blue-Green y su mecanismo de remediación automática.

### Repositorio modificado

- `AUY1104-SharedWorkflows`

### Archivo modificado

- `.github/workflows/deploy-api.yaml`

### Flujo implementado

1. ejecución de pruebas automatizadas;
2. construcción de la imagen Docker;
3. publicación de la imagen en Docker Hub;
4. conexión SSH con la instancia EC2;
5. detección del ambiente activo;
6. selección del ambiente candidato;
7. despliegue de la imagen en el candidato;
8. configuración dinámica del Service Preview;
9. validación del endpoint `/health`;
10. promoción del candidato mediante el selector del Service;
11. validación final de producción;
12. rollback automático del tráfico si ocurre un fallo.

### Remediación automática

La recuperación ya no utiliza `kubectl rollout undo`, porque Blue y Green son Deployments independientes.

Si una validación falla después de la promoción, el workflow modifica nuevamente el selector de `demo-api-service` para devolver el tráfico al ambiente estable anterior.

### Variables dinámicas

El workflow inyecta:

- `APP_ENV`, según el slot candidato;
- `APP_VERSION`, utilizando la etiqueta de la imagen;
- `FORCE_ERROR=false` durante el despliegue normal.

### Estado

Workflow Blue-Green refactorizado. Pendiente de validación en GitHub Actions.

## 14. Validación del Pipeline Blue-Green

### Objetivo
Validar el funcionamiento completo del pipeline Blue-Green ejecutando el workflow desde GitHub Actions y verificando el despliegue automatizado de la aplicación en Kubernetes.

### Repositorios involucrados
- `AUY1104-Client`
- `AUY1104-SharedWorkflows`

### Validaciones realizadas
Se ejecutó el pipeline completo desde GitHub Actions comprobando el correcto funcionamiento de todas sus etapas:

1. Ejecución de pruebas automatizadas.
2. Construcción de la imagen Docker.
3. Publicación de la imagen en Docker Hub.
4. Conexión SSH con la instancia EC2.
5. Detección del ambiente activo.
6. Despliegue del ambiente candidato.
7. Configuración del Service Preview.
8. Validación del endpoint `/health`.
9. Promoción del candidato a producción.
10. Validación del servicio de producción.
11. Visualización del estado final del clúster.

### Resultados obtenidos
Durante la primera ejecución el pipeline realizó correctamente el despliegue inicial, promoviendo el ambiente Blue como versión de producción.

Posteriormente se ejecutó nuevamente el workflow, comprobando la correcta transición desde Blue hacia Green, validando que la estrategia Blue-Green funciona correctamente y permite realizar despliegues sucesivos sin interrupción del servicio.

### Estado
Pipeline completamente validado y operativo.

### Evidencias
- `EFT-12-Pipeline-primer-despliegue-exitoso.png`
- `EFT-13-Pipeline-segundo-despliegue-Blue-a-Green.png`
- `EFT-14-Detalle-pipeline-Blue-Green-exitoso.png`

---

## 15. Refactorización completa del workflow Blue-Green

### Estado
Workflow reutilizable completamente implementado y validado mediante múltiples ejecuciones exitosas del pipeline.

### Evidencias
- `EFT-11-Workflow-Blue-Green-completo.png`
- `EFT-12-Pipeline-primer-despliegue-exitoso.png`
- `EFT-13-Pipeline-segundo-despliegue-Blue-a-Green.png`

---

## 16. Verificación del clúster Kubernetes

### Objetivo
Comprobar el estado final del clúster Kubernetes después de completar el despliegue Blue-Green.

### Validaciones realizadas
Se verificó el estado de los recursos desplegados mediante comandos `kubectl`. Las comprobaciones incluyeron:

- Estado de los Pods.
- Estado de los Services.
- Asociación correcta entre Services y Deployments.
- Disponibilidad del endpoint de producción.

### Resultados obtenidos
Los Pods quedaron en estado `Running`, confirmando que la aplicación fue desplegada correctamente.

Los Services `demo-api-service` y `demo-api-preview` quedaron creados y configurados correctamente para dirigir el tráfico hacia el ambiente correspondiente.

Finalmente se comprobó el endpoint `/health`, obteniendo respuesta HTTP 200 OK, confirmando que la aplicación quedó disponible en producción.

### Estado
Infraestructura Kubernetes validada correctamente.

### Evidencias
- `EFT-15-Pods-Kubernetes-Running.png`
- `EFT-16-Services-Kubernetes.png`
- `EFT-17-HealthCheck-Produccion-HTTP200.png`

---

## 17. Validación del mecanismo de rollback automático

### Objetivo
Verificar que el workflow incorpore un mecanismo de recuperación automática para restaurar el ambiente estable en caso de que una validación falle.

### Implementación
El workflow fue configurado para ejecutar el paso **Rollback automático** del tráfico únicamente cuando alguna etapa crítica del despliegue genera un error.

En caso de fallo, el selector del Service de producción vuelve a apuntar automáticamente al ambiente previamente estable, restableciendo el servicio sin intervención manual.

Durante las ejecuciones realizadas no fue necesario activar este mecanismo debido a que todas las validaciones finalizaron exitosamente.

### Estado
Rollback automático implementado y preparado para responder ante fallos durante el despliegue.

### Evidencias
- `EFT-18-Workflow-Rollback-Automatico-Skipped.png`

# Conclusión

Durante el desarrollo de esta Evaluación Final Transversal se logró transformar un proceso de despliegue tradicional en una estrategia de entrega continua mucho más robusta, automatizada y resiliente, integrando los conocimientos adquiridos durante el semestre en torno a GitHub Actions, Docker, Kubernetes y prácticas DevOps.

Se implementó un pipeline reutilizable mediante **GitHub Actions**, capaz de ejecutar pruebas automatizadas, construir y publicar imágenes Docker, desplegar la aplicación en un clúster **K3s sobre Amazon EC2**, aplicar una estrategia **Blue-Green** y validar automáticamente el estado de la nueva versión antes de promoverla a producción.

Como parte de la estrategia de despliegue, se incorporó un **Service Preview** para validar el ambiente candidato mediante el endpoint `/health`, evitando afectar la versión que se encuentra atendiendo tráfico de producción. Además, se implementó un mecanismo de **rollback automático**, preparado para restaurar el ambiente estable si alguna validación crítica falla durante el proceso de despliegue.

Las múltiples ejecuciones exitosas del pipeline permitieron comprobar tanto el despliegue inicial como la transición entre los ambientes **Blue** y **Green**, verificando el correcto funcionamiento de la automatización, la disponibilidad del servicio y la capacidad del sistema para soportar despliegues repetibles sin interrupciones.

Finalmente, el proyecto permitió consolidar competencias relacionadas con la automatización de procesos CI/CD, la administración de aplicaciones sobre Kubernetes, la implementación de estrategias modernas de despliegue y la incorporación de mecanismos de resiliencia orientados a reducir el riesgo durante la publicación de nuevas versiones en producción.