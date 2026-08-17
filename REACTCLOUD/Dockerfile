# Multi-stage Docker build for the REACT chemistry system.

# Stage 1: Builder
FROM ubuntu:22.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive
ENV REACTROOT=/opt/react
ENV CCROOT=/opt/react

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    ca-certificates \
    make \
    tcsh \
    libc6-dev \
    libgdbm-dev \
    libnsl-dev \
    libtirpc-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# Copy source code
WORKDIR /opt/react
COPY . .

# Build REACT binaries with `make all`, then run non-interactive setup
RUN REACTROOT=/opt/react CCROOT=/opt/react BINDIR=/opt/react/bin make all \
    && REACTROOT=/opt/react CCROOT=/opt/react BINDIR=/opt/react/bin make runsetup \
    && gcc -O2 -Wall -Wextra -o /opt/react/bin/http-server /opt/react/src/http-server.c

# Re-copy populated seed databases to ensure data/DB is populated in runtime container
COPY data/DB /opt/react/data/DB

# Stage 2: Runtime
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV REACTROOT=/opt/react
ENV CCROOT=/opt/react
ENV PORT=8080

LABEL org.opencontainers.image.title="REACT Cloud Run"
LABEL org.opencontainers.image.description="Containerized REACT chemistry system for Google Cloud Run"
LABEL org.opencontainers.image.source="https://github.com/blurock/REACT"

# Install runtime dependencies including Node.js for Orchestrator
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libc6 \
    libgdbm6 \
    libnsl2 \
    libtirpc3 \
    tcsh \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# Use a non-root runtime user for Cloud Run.
RUN groupadd --system --gid 10001 react \
    && useradd --system --uid 10001 --gid react --home-dir /opt/react --shell /bin/bash react

# Create app directory
WORKDIR /opt/react

# Copy runtime binaries, libraries, and runtime assets from builder.
COPY --from=builder --chown=react:react /opt/react/bin /opt/react/bin
COPY --from=builder --chown=react:react /opt/react/lib /opt/react/lib
COPY --from=builder --chown=react:react /opt/react/data /opt/react/data
COPY --from=builder --chown=react:react /opt/react/programs /opt/react/programs
COPY --from=builder --chown=react:react /opt/react/command /opt/react/command
COPY --from=builder --chown=react:react /opt/react/tmp /opt/react/tmp
COPY --from=builder --chown=react:react /opt/react/orchestrator /opt/react/orchestrator
COPY --from=builder --chown=react:react /opt/react/elements.xml /opt/react/elements.xml

WORKDIR /opt/react/orchestrator
RUN npm install --omit=dev

WORKDIR /opt/react
COPY src/entrypoint.sh /opt/react/entrypoint.sh
RUN chmod +x /opt/react/entrypoint.sh

USER react:react

EXPOSE 8080

ENTRYPOINT ["/opt/react/entrypoint.sh"]
