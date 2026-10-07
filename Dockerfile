FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=https://api.polycliniquedesapotres.org
ENV VITE_API_URL=$VITE_API_URL
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
ARG VITE_API_URL=https://api.polycliniquedesapotres.org
COPY nginx.conf /etc/nginx/conf.d/default.conf
RUN sed -i "s|__API_ORIGIN__|${VITE_API_URL}|g" /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
