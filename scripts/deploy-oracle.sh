#!/bin/bash
# ============================================================
# H MED DISTRIBUIDORA — Script de Deploy Automático
# Oracle Cloud Ubuntu + Docker
# Execute: chmod +x deploy-oracle.sh && sudo bash deploy-oracle.sh
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

print_step() { echo -e "\n${BLUE}${BOLD}▶ $1${NC}"; }
print_ok()   { echo -e "${GREEN}✅ $1${NC}"; }
print_warn() { echo -e "${YELLOW}⚠️  $1${NC}"; }
print_info() { echo -e "${CYAN}ℹ️  $1${NC}"; }

clear
echo -e "${BOLD}"
cat << 'BANNER'
╔══════════════════════════════════════════════════════╗
║       H MED DISTRIBUIDORA — Deploy Automático        ║
║              Oracle Cloud Always Free                ║
╚══════════════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

# ============================================================
# 1. Atualizar sistema
# ============================================================
print_step "1/8 — Atualizando sistema Ubuntu..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl wget git unzip nano ufw fail2ban
print_ok "Sistema atualizado"

# ============================================================
# 2. Instalar Docker
# ============================================================
print_step "2/8 — Instalando Docker..."

if command -v docker &> /dev/null; then
    print_warn "Docker já instalado: $(docker --version)"
else
    curl -fsSL https://get.docker.com | sh
    usermod -aG docker ubuntu 2>/dev/null || true
    systemctl enable docker
    systemctl start docker
    print_ok "Docker instalado: $(docker --version)"
fi

# ============================================================
# 3. Instalar Docker Compose
# ============================================================
print_step "3/8 — Instalando Docker Compose..."

if command -v docker compose &> /dev/null; then
    print_warn "Docker Compose já disponível"
else
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep '"tag_name":' | sed -E 's/.*"([^"]+)".*/\1/')
    curl -SL "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-aarch64" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    print_ok "Docker Compose instalado"
fi

# ============================================================
# 4. Configurar Firewall
# ============================================================
print_step "4/8 — Configurando Firewall (UFW)..."

ufw --force reset > /dev/null 2>&1
ufw default deny incoming > /dev/null 2>&1
ufw default allow outgoing > /dev/null 2>&1
ufw allow ssh > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw --force enable > /dev/null 2>&1

# Regras específicas Oracle Cloud iptables
iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true

print_ok "Firewall configurado (portas 80, 443, 22)"

# ============================================================
# 5. Clonar projeto do GitHub
# ============================================================
print_step "5/8 — Configurando projeto..."

APP_DIR="/opt/hmed-saas"

if [ -d "$APP_DIR" ]; then
    print_warn "Pasta já existe. Atualizando..."
    cd "$APP_DIR"
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || print_warn "Não foi possível atualizar via git"
else
    echo ""
    echo -e "${YELLOW}${BOLD}📌 Digite a URL do seu repositório GitHub:${NC}"
    echo -e "   Exemplo: https://github.com/seu-usuario/hmed-saas"
    read -p "   GitHub URL: " GITHUB_URL

    if [ -z "$GITHUB_URL" ]; then
        print_warn "URL não fornecida. Criando pasta manualmente..."
        mkdir -p "$APP_DIR"
    else
        git clone "$GITHUB_URL" "$APP_DIR"
        print_ok "Projeto clonado!"
    fi
fi

cd "$APP_DIR"

# ============================================================
# 6. Configurar variáveis de ambiente
# ============================================================
print_step "6/8 — Configurando variáveis de ambiente..."

if [ ! -f ".env" ]; then
    # Gerar senhas seguras
    DB_PASS=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-20)
    JWT_SECRET=$(openssl rand -base64 48 | tr -d "=+/")
    REDIS_PASS=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

    # IP público da VM
    PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "SEU_IP")

    cat > .env << EOF
# H MED DISTRIBUIDORA — Gerado automaticamente em $(date)
DB_PASSWORD=${DB_PASS}
JWT_SECRET=${JWT_SECRET}
REDIS_PASSWORD=${REDIS_PASS}
FRONTEND_URL=http://${PUBLIC_IP}
VITE_API_URL=/api
EOF

    print_ok "Arquivo .env criado com senhas seguras"
    echo ""
    echo -e "${CYAN}📋 Suas credenciais geradas:${NC}"
    echo -e "   DB_PASSWORD:  ${DB_PASS}"
    echo -e "   REDIS_PASS:   ${REDIS_PASS}"
    echo -e "   IP público:   ${PUBLIC_IP}"
    echo ""
    echo -e "${YELLOW}⚠️  SALVE ESSAS INFORMAÇÕES EM LOCAL SEGURO!${NC}"
    echo ""
    read -p "Pressione ENTER para continuar..."
else
    print_warn ".env já existe, mantendo configurações atuais"
fi

# ============================================================
# 7. Build e iniciar containers
# ============================================================
print_step "7/8 — Iniciando sistema H MED (isso pode levar 3-5 minutos)..."

# Parar containers existentes se houver
docker compose down 2>/dev/null || true

# Build e start
docker compose up -d --build

print_ok "Containers iniciados!"

# ============================================================
# 8. Verificar e mostrar status
# ============================================================
print_step "8/8 — Verificando saúde do sistema..."

echo ""
echo -e "${YELLOW}Aguardando sistema inicializar (30 segundos)...${NC}"
sleep 30

# Verificar containers
echo ""
echo -e "${CYAN}Status dos containers:${NC}"
docker compose ps

# Testar API
echo ""
if curl -sf http://localhost/health > /dev/null 2>&1; then
    print_ok "API respondendo corretamente!"
elif curl -sf http://localhost:3001/health > /dev/null 2>&1; then
    print_ok "Backend respondendo!"
else
    print_warn "Sistema ainda inicializando... aguarde 1-2 minutos"
fi

# ============================================================
# Resumo final
# ============================================================
PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null || echo "SEU_IP")

echo ""
echo -e "${GREEN}${BOLD}"
cat << 'SUCCESS'
╔══════════════════════════════════════════════════════╗
║              🎉 DEPLOY CONCLUÍDO!                    ║
╚══════════════════════════════════════════════════════╝
SUCCESS
echo -e "${NC}"

echo -e "${BOLD}🌐 Acesse seu sistema:${NC}"
echo -e "   → http://${PUBLIC_IP}"
echo ""
echo -e "${BOLD}🔐 Login padrão:${NC}"
echo -e "   Email: admin@hmed.com"
echo -e "   Senha: Admin@2024"
echo ""
echo -e "${BOLD}📊 Comandos úteis:${NC}"
echo -e "   Ver logs:        ${CYAN}cd /opt/hmed-saas && docker compose logs -f${NC}"
echo -e "   Reiniciar:       ${CYAN}docker compose restart${NC}"
echo -e "   Parar:           ${CYAN}docker compose down${NC}"
echo -e "   Atualizar:       ${CYAN}git pull && docker compose up -d --build${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE: Altere a senha do admin após o primeiro acesso!${NC}"
echo ""
