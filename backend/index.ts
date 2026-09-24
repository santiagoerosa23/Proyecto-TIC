// Importamos la librería express
import express from "express";
import path from "path";
import { Request, Response } from "express";
import fs from "node:fs";
import * as Tipos from "./tipos.ts";
import sanitizeHtml from "sanitize-html";

// const fs = require('node:fs');
const app = express();
app.use(express.json());

app.set("views", path.join(import.meta.dirname, "../views"));
app.set("view engine", "ejs");

// Cargar la "base de datos"
const proyectos: Tipos.PlantillaProyecto[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "db", "proyectos.json"), "utf-8")
);

// API Simple
app.get("/api/health", (req: Request, res: Response) => {
  res.json({ message: "Ok" });
});

app.get("/proyectos/:id", (req: Request, res: Response) => {
  try {
    const infoProyecto: Tipos.PlantillaProyecto | undefined = proyectos.find(
      (proyecto) => proyecto.id === Number(req.params.id)
    );
    if (typeof infoProyecto === "undefined") {
      res.status(404);
      res.render("errorSitio", {
        error: {
          codigo: 404,
          explicacion: "El proyecto no existe, fue borrado, o no es publico.",
        },
      });
    } else {
      infoProyecto as Tipos.PlantillaProyecto;
      function validarUrlAsset(valor: string): boolean {
        if (!valor.includes("url(")) {
          return true;
        }
        const rutasPermitidas: string[] = ["/api/uploads/"];

        if (infoProyecto && infoProyecto.assets) {
          rutasPermitidas.push(...(infoProyecto.assets as string[]));
        }

        return rutasPermitidas.some((ruta) => valor.includes(ruta));
      }
      res.render("pestaña-proyecto", {
        proyecto: {
          titulo: infoProyecto.titulo,
          descripcion: infoProyecto.descripcion,
          colaboradores: infoProyecto.colaboradores,
          contenidoHtml: infoProyecto.diseñoPrerenderizadoHTML // Desechar sistema complejo de sanitización: al fin y al cabo es revisado por profes Y el diseño compilado estara en un iframe con sandbox.
        },
      });
    }
  } catch (error) {
    console.log(error.message);
    res.status(500);
    res.render("errorSitio", {
      error: {
        codigo: 500,
        explicacion: "Hubo un error en nuestra parte.",
      },
    });
  }
});

// Buscar archivos del front
app.use(
  express.static(path.join(__dirname, "..", "frontend"), {
    extensions: ["html"],
  })
);

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
