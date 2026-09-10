// Importamos la librería express
import express from "express";
import path from "path";
import { Request, Response } from "express";
import fs from 'node:fs';
import * as Tipos from './tipos.ts';

// const fs = require('node:fs');
const app = express();
app.use(express.json()); 

app.set('views', path.join(import.meta.dirname, '../frontend/Rutas Dinamicas'));
app.set('view engine', 'ejs');

// Cargar la "base de datos"
const proyectos: Tipos.PlantillaProyecto[] = JSON.parse(fs.readFileSync(path.join(__dirname, "db", "proyectos.json"), 'utf-8'));

// API Simple
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ message: "Ok" });
});

app.get("/proyectos/:id", (req:Request, res:Response) => {
    if (!(typeof Number(req.params.id) === "number")) {
        res.status(400)
        res.render('errorSitio', {error:{
            codigo: 400,
            explicacion: "El id de proyecto en " + req.url + " al final debe ser un numero."
        }})
    } else {
        res.render('proyectos/pestaña-proyecto.ejs', { proyecto: {
            titulo: "Hola Mundo",
            descripcion: "Incompleto, despues termino"
        }})
    }
});

// Buscar archivos del front
app.use(express.static(path.join(__dirname, "..", "frontend"), { extensions: ["html"] }));

app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

// 404
app.use((req: Request, res: Response) => {
  res.status(404);
  res.sendFile(path.join(__dirname, "..", "frontend", "404.html"));
});

// Iniciamos el servidor en el puerto 3000
app.listen(3000, () => {
  console.log("Aplicación en localhost:3000");
});
