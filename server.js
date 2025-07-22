const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000; // Usando a porta 3000

// Serve os arquivos estáticos do diretório raiz do projeto
app.use(express.static(__dirname));

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
