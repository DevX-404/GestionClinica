# ==========================================
# ETAPA 1: Compilación (Build)
# ==========================================
FROM node:22-alpine AS build
WORKDIR /app

# Copiamos package.json y descargamos dependencias
COPY package*.json ./
RUN npm install

# Copiamos el resto del código y compilamos EN PRODUCCIÓN
COPY . .
RUN npm run build --configuration=production

# ==========================================
# ETAPA 2: Servidor Web (Nginx)
# ==========================================
FROM nginx:alpine

# Limpiamos el HTML por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos la web ya compilada
COPY --from=build /app/dist/frontend/browser /usr/share/nginx/html

# Copiamos tu archivo de configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exponemos el puerto 80
EXPOSE 80

# Arrancamos Nginx
CMD ["nginx", "-g", "daemon off;"]