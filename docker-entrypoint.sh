#!/bin/bash
# Configura o Tomcat para usar a porta definida pelo Railway ($PORT)
# Se $PORT não estiver definido, usa 8080 como padrão (para testes locais)
PORT=${PORT:-8080}

echo "==> Iniciando Tomcat na porta $PORT"

# Substitui a porta padrão 8080 no server.xml do Tomcat
sed -i "s/port=\"8080\"/port=\"$PORT\"/g" /usr/local/tomcat/conf/server.xml

# Inicia o Tomcat
exec catalina.sh run
