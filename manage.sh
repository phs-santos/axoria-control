#!/bin/bash

# ==============================================================================
# Axoria Control - Frontend Panel - Management CLI
# CLI centralizada para gerenciamento do Frontend (Nuxt)
# Desenvolvido por: henrilgrim (Enterprise)
# ==============================================================================

# Impedir que o script morra em caso de erro de comando
set +e

# --- Configurações de Cores ---
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

signature() {
    echo -e "${BLUE}${BOLD}------------------------------------------------${NC}"
    echo -e "${BLUE}${BOLD}    AXORIA CONTROL | Frontend Management CLI    ${NC}"
    echo -e "${BLUE}${BOLD}------------------------------------------------${NC}"
}

# --- Verificação de Dependências ---
check_deps() {
    echo -e "${YELLOW}Verificando ambiente...${NC}"
    
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}Erro: pnpm não instalado.${NC}"
        return 1
    fi

    if ! command -v node &> /dev/null; then
        echo -e "${RED}Erro: Node.js não instalado.${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Ambiente base validado.${NC}"
    return 0
}

# --- Instalação e Configuração ---
do_install() {
    check_deps || return
    
    signature
    
    # Gerenciamento de .env
    if [ ! -f ".env" ]; then
        echo -e "${YELLOW}Criando .env a partir do exemplo...${NC}"
        if [ -f ".env.example" ]; then
            cp .env.example .env
        else
            echo "NUXT_PUBLIC_API_URL=http://localhost:7000/api" > .env
        fi
    fi

    echo -e "${YELLOW}Instalando dependências (pnpm)...${NC}"
    pnpm install

    echo -e "\n${GREEN}Instalação concluída com sucesso!${NC}"
}

# --- Interface Visual Principal ---
show_menu() {
    clear
    signature
    
    # Checa se o .env existe
    if [ ! -f ".env" ]; then
        echo -e "  ${RED}AVISO: Arquivo .env não encontrado! Use 'i' para instalar.${NC}"
    fi

    echo -e "  ${BLUE}${BOLD}[DESENVOLVIMENTO]${NC}"
    echo -e "  ${CYAN}[i]${NC} Install  - Configuração e Dependências"
    echo -e "  ${YELLOW}[d]${NC}${BOLD} Dev Mode - Iniciar Painel (Watcher)${NC}"
    echo -e "  ${CYAN}[b]${NC} Build    - Gerar Bundle Estático (Nuxt)"
    echo -e ""
    echo -e "  ${BLUE}${BOLD}[DOCKER (PRODUÇÃO)]${NC}"
    echo -e "  ${CYAN}[cb]${NC} Build    - Gerar Imagem Docker Otimizada"
    echo -e "  ${CYAN}[cu]${NC} Up       - Subir Container Axoria Control"
    echo -e "  ${CYAN}[cl]${NC} Logs     - Ver Logs do Container"
    echo -e "  ${CYAN}[ct]${NC} Stats    - Uso de Memória e CPU"
    echo -e "  ${CYAN}[cs]${NC} Stop     - Parar Container"
    echo -e "  ${CYAN}[cc]${NC} Clean    - Hard Reset (Remove Imagem/Container)"
    echo -e ""
    echo -e "  ${BLUE}${BOLD}[UTILITÁRIOS]${NC}"
    echo -e "  ${CYAN}[e]${NC} Envs     - Ver as Variáveis Atuais"
    echo -e ""
    echo -e "  ${RED}[x] Sair${NC}"
    echo -e "------------------------------------------------"
}

# --- Gerenciamento Docker ---
docker_manager() {
    case $1 in
        build)
            echo -e "${YELLOW}Gerando imagem Docker ultra-leve (axoria-control)...${NC}"
            docker build -t axoria-control .
            ;;
        up)
            APP_PORT=3000
            
            echo -e "${YELLOW}Preparando ambiente Docker...${NC}"
            if docker ps -a --format '{{.Names}}' | grep -Eq "^axoria-control$"; then
                echo -e "${YELLOW}Container axoria-control já existe. Substituindo...${NC}"
                docker rm -f axoria-control &>/dev/null
            fi

            echo -e "${YELLOW}Subindo container Axoria Control na porta ${APP_PORT}...${NC}"
            docker run -d \
                --name axoria-control \
                -p ${APP_PORT}:${APP_PORT} \
                --env-file .env \
                axoria-control
            
            echo -e "${GREEN}Container axoria-control rodando em http://localhost:${APP_PORT}${NC}"
            ;;
        logs)
            echo -e "${CYAN}Exibindo logs do container (Ctrl+C para sair)...${NC}"
            docker logs -f axoria-control
            ;;
        stats)
            echo -e "${CYAN}Monitorando uso de recursos (Ctrl+C para sair)...${NC}"
            docker stats axoria-control
            ;;
        stop)
            echo -e "${YELLOW}Parando e removendo container axoria-control...${NC}"
            docker stop axoria-control && docker rm axoria-control
            echo -e "${GREEN}Ambiente Docker parado.${NC}"
            ;;
        clean)
            echo -e "${RED}⚠️  ATENÇÃO: Isso vai remover o container E a imagem 'axoria-control'.${NC}"
            read -p "Tem certeza? Digite 'sim' para confirmar: " confirm
            if [ "${confirm,,}" = "sim" ]; then
                echo -e "${RED}Limpando ambiente Docker Axoria Control (Container + Imagem)...${NC}"
                docker stop axoria-control &>/dev/null || true
                docker rm axoria-control &>/dev/null || true
                docker rmi axoria-control &>/dev/null || true
                echo -e "${GREEN}Tudo limpo!${NC}"
            else
                echo -e "${YELLOW}Operação cancelada.${NC}"
            fi
            ;;
    esac
}

# --- Loop Principal ---
while true; do
    show_menu
    read -p "Selecione uma opção: " choice
    case ${choice,,} in
        i) do_install ;;
        d) pnpm dev ;;
        b) pnpm build ;;
        cb) docker_manager build ;;
        cu) docker_manager up ;;
        cl) docker_manager logs ;;
        ct) docker_manager stats ;;
        cs) docker_manager stop ;;
        cc) docker_manager clean ;;
        e) cat .env ;;
        x) echo -e "${GREEN}Até logo!${NC}"; exit 0 ;;
        *) echo -e "${RED}Opção inválida!${NC}" ;;
    esac
    echo ""
    read -p "Pressione [Enter] para continuar..."
done
