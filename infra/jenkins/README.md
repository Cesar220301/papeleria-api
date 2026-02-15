# Jenkins local

Este stack levanta Jenkins local con herramientas para correr el pipeline de este repo:

- docker cli
- docker compose plugin
- node.js 22
- npm

## Levantar

```bash
docker compose -f infra/jenkins/docker-compose.jenkins.yml up -d --build
```

## Validar acceso Docker desde Jenkins container

```bash
docker exec local_jenkins docker version
docker exec local_jenkins docker ps
```
