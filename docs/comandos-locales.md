# Comandos Locales (Docker + Jenkins)

Guia rapida para operar tu entorno local sin perder datos.

## 1) Levantar todo

```powershell
docker compose up -d
docker compose -f infra/jenkins/docker-compose.jenkins.yml up -d
```

Que hace:
- El primer comando levanta `api` y `mysql` del proyecto.
- El segundo comando levanta `jenkins` local.
- `-d` significa modo detached (en segundo plano).

## 2) Ver estado

```powershell
docker ps
docker compose ps
docker compose -f infra/jenkins/docker-compose.jenkins.yml ps
```

Que hace:
- Muestra contenedores activos y su estado.
- Te permite confirmar que `papeleria_api`, `papeleria_mysql` y `local_jenkins` estan arriba.

## 3) Ver logs

```powershell
docker compose logs -f api
docker compose logs -f mysql
docker compose -f infra/jenkins/docker-compose.jenkins.yml logs -f jenkins
```

Que hace:
- Sigue logs en tiempo real (`-f`) de cada servicio.
- Util para debug rapido.

## 4) Parar todo (recomendado antes de apagar PC)

```powershell
docker compose stop
docker compose -f infra/jenkins/docker-compose.jenkins.yml stop
```

Que hace:
- Detiene contenedores.
- No borra datos ni volumenes.

## 5) Bajar servicios sin borrar datos

```powershell
docker compose down
docker compose -f infra/jenkins/docker-compose.jenkins.yml down
```

Que hace:
- Elimina contenedores y red del compose.
- Mantiene volumenes (datos) intactos.

## 6) Borrar todo incluyendo datos (usar con cuidado)

```powershell
docker compose down -v
docker compose -f infra/jenkins/docker-compose.jenkins.yml down -v
```

Que hace:
- Borra contenedores, redes y volumenes.
- Se pierde data persistida (MySQL/Jenkins).

## 7) Rebuild de API cuando cambias codigo

```powershell
docker compose up -d --build api
```

Que hace:
- Reconstruye la imagen de la API y recrea solo el contenedor `api`.

## 8) Validar imagenes construidas por Jenkins

```powershell
docker images | findstr papeleria-api
```

Que hace:
- Lista tags como `latest`, `build-<n>` y `<sha>`.

## 9) Flujo recomendado diario

Inicio del dia:

```powershell
docker compose up -d
docker compose -f infra/jenkins/docker-compose.jenkins.yml up -d
```

Fin del dia:

```powershell
docker compose stop
docker compose -f infra/jenkins/docker-compose.jenkins.yml stop
```
