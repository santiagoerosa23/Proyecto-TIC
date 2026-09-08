// Importamos la librería express
import express from "express";
import path from 'path';
import { Request, Response } from 'express';
// const fs = require('node:fs');
const app = express();

// API Simple
app.get('/api/health', (req: Request, res: Response) => {
    res.json({ message: "Ok" });
});

// Buscar archivos del front
app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// 404
app.use((req: Request,res: Response) => {
    res.status(404);
    res.sendFile(path.join(__dirname, '..', 'frontend', '404.html'));
});

// Iniciamos el servidor en el puerto 3000
app.listen(3000, () => {
    console.log("Aplicación en localhost:3000");
});
