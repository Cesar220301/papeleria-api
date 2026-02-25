pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
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
      steps {
        sh 'npm ci'
      }
    }

    stage('Test') {
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
      steps {
        sh '''
          set -e
          if [ ! -f .env ]; then
            cp .env.example .env
          fi
          docker rm -f papeleria_api || true
          docker compose -p backend up -d --build --no-deps api
          docker compose -p backend ps
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
