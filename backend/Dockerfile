# Build stage
FROM golang:1.26-bookworm AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags "-s -w" -o server .

# Run stage
FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y \
    git \
    sqlite3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/server /app/server
COPY --from=builder /app/dane_codes.csv /app/dane_codes.csv

# Create folders for database and Hugging Face local repo backup
RUN mkdir -p /app/pb_data /app/db_repo /app/pb_public

# Expose Hugging Face default port
EXPOSE 7860

# Run Pocketbase
CMD ["./server", "serve", "--http", "0.0.0.0:7860"]
