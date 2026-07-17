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

