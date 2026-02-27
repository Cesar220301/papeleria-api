pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    skipDefaultCheckout(true)
    timeout(time: 45, unit: 'MINUTES')
  }

  triggers {
    // Revisa cambios en el repo cada 2 minutos y dispara build automatico.
    pollSCM('H/2 * * * *')
  }

  environment {
    CI_COMPOSE_FILE = 'docker-compose.ci.yml'
    DATABASE_URL = 'mysql://papeleria:papeleria123@host.docker.internal:3307/papeleria_db'
    PORT = '3000'
    IVA_RATE = '0.16'
    NODE_ENV = 'test'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Install') {
      options {
        timeout(time: 12, unit: 'MINUTES')
      }
      steps {
        retry(2) {
          sh 'npm ci --no-audit --no-fund'
        }
      }
    }

    stage('Test') {
      options {
        timeout(time: 20, unit: 'MINUTES')
      }
      steps {
        sh 'docker compose -f "$CI_COMPOSE_FILE" up -d mysql'
        sh '''
          set -e
          CONTAINER_ID=$(docker compose -f "$CI_COMPOSE_FILE" ps -q mysql)
          if [ -z "$CONTAINER_ID" ]; then
            echo "No se pudo iniciar el contenedor mysql de CI"
            exit 1
          fi

          for i in $(seq 1 30); do
            STATUS=$(docker inspect -f '{{.State.Health.Status}}' "$CONTAINER_ID")
            if [ "$STATUS" = "healthy" ]; then
              echo "MySQL listo para pruebas"
              break
            fi

            if [ "$i" -eq 30 ]; then
              echo "MySQL no llego a estado healthy"
              docker compose -f "$CI_COMPOSE_FILE" logs mysql || true
              exit 1
            fi

            sleep 3
          done
        '''
        sh 'npx prisma migrate deploy'
        sh 'npm run test:ci'
      }
    }

    stage('Build Local Image') {
      options {
        timeout(time: 15, unit: 'MINUTES')
      }
      steps {
        sh '''
          set -e
          GIT_SHA_SHORT=$(git rev-parse --short HEAD || echo "nogit")

          docker build \
            -t papeleria-api:latest \
            -t papeleria-api:build-${BUILD_NUMBER} \
            -t papeleria-api:${GIT_SHA_SHORT} \
            .
        '''
      }
    }

    stage('Deploy Local Container') {
      options {
        timeout(time: 12, unit: 'MINUTES')
      }
      steps {
        sh '''
          set -e
          if [ ! -f .env ]; then
            cp .env.example .env
          fi

          # Completa .env con variables nuevas agregadas en .env.example sin sobreescribir las existentes.
          while IFS= read -r line || [ -n "$line" ]; do
            case "$line" in
              ''|#*) continue ;;
            esac

            key="${line%%=*}"
            if ! grep -q "^${key}=" .env; then
              echo "$line" >> .env
            fi
          done < .env.example

          docker compose -p backend up -d --build --no-deps --force-recreate api
          docker compose -p backend ps api
        '''
      }
    }
  }

  post {
    always {
      sh 'docker compose -f "$CI_COMPOSE_FILE" logs mysql > mysql-ci.log || true'
      junit testResults: 'reports/junit/junit.xml', allowEmptyResults: true
      archiveArtifacts artifacts: 'reports/junit/junit.xml,mysql-ci.log', allowEmptyArchive: true
      sh 'docker compose -f "$CI_COMPOSE_FILE" down -v || true'
    }
  }
}
