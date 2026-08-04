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

# Build REACT binaries with `make all`, then run the installation step
# that performs runtime setup and database initialization.
RUN REACTROOT=/opt/react CCROOT=/opt/react BINDIR=/opt/react/bin make all \
    && REACTROOT=/opt/react CCROOT=/opt/react BINDIR=/opt/react/bin make install \
    && gcc -O2 -Wall -Wextra -o /opt/react/bin/http-server /opt/react/src/http-server.c

# Stage 2: Runtime
FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV REACTROOT=/opt/react
ENV CCROOT=/opt/react
ENV PORT=8080

LABEL org.opencontainers.image.title="REACT Cloud Run"
LABEL org.opencontainers.image.description="Containerized REACT chemistry system for Google Cloud Run"
LABEL org.opencontainers.image.source="https://github.com/blurock/REACT"

# Install runtime dependencies only
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    libc6 \
    libgdbm6 \
    libnsl2 \
    libtirpc3 \
    tcsh \
    && rm -rf /var/lib/apt/lists/*

# Use a non-root runtime user for Cloud Run.
RUN groupadd --system --gid 10001 react \
    && useradd --system --uid 10001 --gid react --home-dir /opt/react --shell /usr/sbin/nologin react

# Create app directory
WORKDIR /opt/react

# Copy runtime binaries, libraries, and runtime assets from builder.
COPY --from=builder --chown=react:react /opt/react/bin /opt/react/bin
COPY --from=builder --chown=react:react /opt/react/lib /opt/react/lib
COPY --from=builder --chown=react:react /opt/react/data /opt/react/data
COPY --from=builder --chown=react:react /opt/react/programs /opt/react/programs
COPY --from=builder --chown=react:react /opt/react/command /opt/react/command
COPY --from=builder --chown=react:react /opt/react/tmp /opt/react/tmp
COPY --from=builder --chown=react:react /opt/react/elements.xml /opt/react/elements.xml

COPY src/entrypoint.sh /opt/react/entrypoint.sh
RUN chmod +x /opt/react/entrypoint.sh

USER react:react

EXPOSE 8080

ENTRYPOINT ["/opt/react/entrypoint.sh"]
