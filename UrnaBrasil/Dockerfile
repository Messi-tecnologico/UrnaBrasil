# =====================================================
# ESTÁGIO 1: BUILD — compila o projeto Java com Ant
# =====================================================
FROM tomcat:9.0-jdk11 AS build

# Instala o Ant
RUN apt-get update && apt-get install -y ant && rm -rf /var/lib/apt/lists/*

WORKDIR /project

# Copia todo o projeto
COPY . .

# Compila usando o build standalone (não depende do NetBeans)
# Aproveita as libs do Tomcat que já estão na imagem base
RUN ant -f build-docker.xml war

# =====================================================
# ESTÁGIO 2: RUN — serve com Tomcat 9 no Railway
# =====================================================
FROM tomcat:9.0-jdk11

# Remove app padrão e expõe na raiz do servidor (sem /UrnaBrasil na URL)
RUN rm -rf /usr/local/tomcat/webapps/*

# Copia o WAR gerado e instala como aplicação raiz "/"
COPY --from=build /project/dist/UrnaBrasil.war /usr/local/tomcat/webapps/ROOT.war

# Copia o script de inicialização
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Persistência dos votos
VOLUME ["/root"]

# Railway define a porta via variável $PORT — NÃO fixe a porta aqui
EXPOSE 8080

# Usa o script de inicialização para configurar a porta dinamicamente
CMD ["/docker-entrypoint.sh"]
