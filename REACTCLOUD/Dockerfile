# ==============================================================================
# Unified Multi-Stage Dockerfile for the Complete REACT System (Google Cloud Run)
# ==============================================================================
# Packages ALL three projects of the REACT stack into a single Cloud Run image:
#   1. REACTCLOUD     - C chemistry engine (chemdb) + Node.js Orchestrator API (/api/*)
#   2. REACTInterface - Angular 18 production web application (/)
#   3. ketcher        - Ketcher Standalone 2D chemical structure editor (/ketcher/*)
#
# IMPORTANT: Build from the WorkFlowProject workspace root so all three projects
#            are inside the Docker build context:
#
#   Cloud Build (NO local Docker required):
#     cd /Users/edwardblurock/git/WorkFlowProject
#     gcloud builds submit --config=cloudbuild.yaml .
#
#   Local Docker (optional):
#     cd /Users/edwardblurock/git/WorkFlowProject
#     docker build -f REACTCLOUD/Dockerfile -t reactcloud:latest .
# ==============================================================================

# ------------------------------------------------------------------------------
# Stage 1: Build REACTCLOUD C Backend (chemdb, libraries, http-server)
# ------------------------------------------------------------------------------
FROM ubuntu:22.04 AS c-builder

ENV DEBIAN_FRONTEND=noninteractive
ENV REACTROOT=/opt/react
ENV CCROOT=/opt/react

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    make \
    tcsh \
    libc6-dev \
    libnsl-dev \
    libtirpc-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/react
COPY REACTCLOUD/ /opt/react/

# Build REACT C binaries & libraries with `make all`, run non-interactive setup,
# and compile the legacy http-server fallback binary.
RUN REACTROOT=/opt/react CCROOT=/opt/react BINDIR=/opt/react/bin make all \
    && REACTROOT=/opt/react CCROOT=/opt/react BINDIR=/opt/react/bin make runsetup \
    && gcc -O2 -Wall -Wextra -o /opt/react/bin/http-server /opt/react/src/http-server.c

# ------------------------------------------------------------------------------
# Stage 2: Build REACTInterface Angular 18 Frontend (Production Same-Origin Mode)
# ------------------------------------------------------------------------------
FROM node:20-slim AS frontend-builder

WORKDIR /src/frontend

# Install dependencies first for Docker layer caching
COPY REACTInterface/package*.json ./
RUN npm ci || npm install

# Copy Angular source and build production bundle (uses environment.prod.ts:
# apiBaseUrl = '' and ketcherUrl = '/ketcher/index.html')
COPY REACTInterface/ ./
RUN npm run build -- --configuration production

# ------------------------------------------------------------------------------
# Stage 3: Unified Runtime Image (Ubuntu 22.04 + Node 20 + C Engine + Frontend + Ketcher)
# ------------------------------------------------------------------------------
FROM ubuntu:22.04 AS runtime

ENV DEBIAN_FRONTEND=noninteractive
ENV REACTROOT=/opt/react
ENV CCROOT=/opt/react
ENV PORT=8080
ENV REACT_PUBLIC_DIR=/opt/react/public
ENV GCP_PROJECT=blurock-database
ENV GCS_BUCKET=blurock-database.appspot.com

LABEL org.opencontainers.image.title="REACT Complete Cloud Run Stack"
LABEL org.opencontainers.image.description="Unified REACTCLOUD C engine, Node.js Orchestrator, REACTInterface Angular SPA, and Ketcher Standalone editor for Google Cloud Run"
LABEL org.opencontainers.image.source="https://github.com/blurock/REACT"

# Install runtime dependencies + Node.js 20.x for the Orchestrator
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libc6 \
    libnsl2 \
    libtirpc3 \
    tcsh \
    curl \
    zip \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

# Create non-root runtime user for Cloud Run security best practices
RUN groupadd --system --gid 10001 react \
    && useradd --system --uid 10001 --gid react --home-dir /opt/react --shell /bin/bash react \
    && mkdir -p /opt/react/public/frontend /opt/react/public/ketcher /tmp/reactcloud \
    && chown -R react:react /opt/react /tmp/reactcloud

WORKDIR /opt/react

# 1. Copy REACTCLOUD C binaries, libraries, runtime data, scripts, and Orchestrator
COPY --from=c-builder --chown=react:react /opt/react/bin /opt/react/bin
COPY --from=c-builder --chown=react:react /opt/react/lib /opt/react/lib
COPY --from=c-builder --chown=react:react /opt/react/data /opt/react/data
COPY --from=c-builder --chown=react:react /opt/react/programs /opt/react/programs
COPY --from=c-builder --chown=react:react /opt/react/command /opt/react/command
COPY --from=c-builder --chown=react:react /opt/react/tmp /opt/react/tmp
COPY --from=c-builder --chown=react:react /opt/react/orchestrator /opt/react/orchestrator
COPY --from=c-builder --chown=react:react /opt/react/elements.xml /opt/react/elements.xml

# Install Orchestrator production Node.js dependencies
WORKDIR /opt/react/orchestrator
RUN (npm ci --omit=dev || npm install --omit=dev) \
    && chown -R react:react /opt/react/orchestrator

# 2. Copy built REACTInterface Angular 18 SPA -> served at /
COPY --from=frontend-builder --chown=react:react /src/frontend/dist/reactinterface/browser /opt/react/public/frontend

# 3. Copy Ketcher Standalone 2D chemical editor -> served at /ketcher/
COPY --chown=react:react ketcher/example/dist/standalone /opt/react/public/ketcher

# Copy container entrypoint script
WORKDIR /opt/react
COPY --chown=react:react REACTCLOUD/src/entrypoint.sh /opt/react/entrypoint.sh
RUN chmod +x /opt/react/entrypoint.sh

USER react:react

EXPOSE 8080

ENTRYPOINT ["/opt/react/entrypoint.sh"]
