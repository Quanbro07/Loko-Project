# Chỉ dùng 1 stage duy nhất là Node
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --legacy-peer-deps

COPY . .

# Mở cổng 3000
EXPOSE 3000

# Chạy lệnh npm start thay vì build và dùng nginx
CMD ["npm", "start"]