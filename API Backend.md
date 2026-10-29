# TIC EXPERIENCE SHOWCASE API

API dedicada a servir los datos y manejar assets y proyectos relacionados con el sitio. Basados en mi diagrama: [link](https://whimsical.com/workspace252187/tic-experience-showcase-VQic8vuZnCeUuwycGEJKZH) y modificado para rutas faltantes que no se consideraron originalmente.

## Endpoints

| Método | Ruta | Body / params | Respuesta |
| --- | --- | --- | --- |
| `GET` | `/health` | — | `200 OK` (texto plano) |
| `GET` | `/media/:fileName.ext` | — | `200 OK` (archivo) |
| `POST` | `/login` | `{"dni": "string", "pass": "string"}` | `{"token": "string"}` |
| `POST` | `/logout` | `token` (credencial) | `200 OK` |
| `POST` | `/perfil/foto` | `token`, `foto` (imagen multipart) | `200 OK` |
| `GET` | `/perfil/yo` | `token` (credencial) | `{"foto": "url", "nombre": "string", "userId": "string", "admin": false/true}` |
| `GET` | `/proyectos/mios` | `token` (credencial) | `[{"id": string, "miniatura": "url", "titulo": "string", "estado": "string"}]` |
| `POST` | `/proyectos/:id/miniatura` | `token`, `file` (imagen multipart) | `{"miniatura": "nombre.ext"}` |
| `GET` | `/proyectos/publicos` | — | `[{"miniatura": "url", "titulo": "string", "id": 0, "colaboradores": [{ "id": 1, "alias": "Ale G.", "rol": "Backend"}]` |
| `GET` | `/proyectos/:id` | — | `{"titulo": "string", "descripcion": "string", "colaboradores": [...], "contenidoHtml": "string", "miniatura": "url"}` o `{"error": {"codigo": 404, "explicacion": "El proyecto no existe, fue borrado, o no es publico."}}` |
| `POST` | `/proyectos/crear` | `token` (credencial) `{"titulo": "string", "descripción": "string", "colaboradoresDNI": [{"dni": "string","alias": "string","rol": "string"}]}` | `200 OK` |
| `GET` | `/proyectos/:id/archivo` | `token` (credencial) | `contenido raw del archivo` |
| `PUT` | `/proyectos/:id/archivo` | `token`, `{"contenido": "..."}` | `200 OK` |
| `GET` | `/proyectos/:id/media` | `token` (credencial) | `["asset1.png, asset2.jpg, etc"]` |
| `POST` | `/proyectos/:id/media` | `token`, `file multipart` | `200 OK` |
| `DELETE` | `/proyectos/:id/media` | `token`, `{"archivo":"nombre.ext"}` | `200 OK` |
| `POST` | `/proyectos/:id/enviar` | `token` (credencial) | `200 OK` |
| `GET` | `/proyectos/:id/estado` | `token` (credencial) | `{"estado": "string", "comentario_admin": "string"}` |
| `GET` | `/proyectos/:id/comentarios` | — | `[{"id": 0, "nombre": "string", "contenido": "string"}]` |
| `POST` | `/proyectos/:id/comentarios` | `token` (opcional) + `{"nombre"?, "mail"?, "contenido": "string"}` | `200 OK` |
| `GET` | `/admin/proyectos/pendientes` | `token` (admin) | `[{"id": "string", "nombre": "string", "miniatura": "url", "integrantes": [...], "link": "string"}]` |
| `POST` | `/admin/proyectos/:id/revision` | `token` (admin), `{"decision": "aprobar\|reprobar", "razon": "string"}` | `200 OK` |
| `POST` | `/admin/proyectos/publicar` | `token` (admin), `{"ids": [0,1,2]}` | `200 OK` |
| `DELETE` | `/admin/proyectos/publicar` | `token` (admin), `{"ids": ["string"]}` | `200 OK` |
| `GET` | `/admin/usuarios` | `token` (admin) | `[{"nombre": "string", "dni": "string", "admin": false, "userId": "string"}]` |
| `POST` | `/admin/usuarios` | `token` (admin), `[{"dni": "string", "pass": "string", "nombre": "string"}]` | `200 OK` |
| `DELETE` | `/admin/usuarios` | `token` (admin), `{"ids": ["string"]}` | `200 OK` |
| `GET` | `/admin/comentarios` | `token` (admin), `filtro?` | `[{"nombre": "string", "dni"?, "userId"?, "rol": "string", "contenido": "string", "id": "string", "mail"?}]` |
| `PUT` | `/admin/comentarios/:id/aprobar` | `token` (admin) | `200 OK` |
| `DELETE` | `/admin/comentarios/:id` | `token` (admin) | `200 OK` |
| `GET` | `/admin/mails` | `token` (admin) | `[{"mail": "string", "id": "string", "estado": "string"}]` |
| `PUT` | `/admin/mails/:id/estado` | `token` (admin), `{"estado": "Valido\|Verificando\|Baneado"}` | `200 OK` |

## Datos

`proyectos.json` JSON SCHEMA

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Schema para proyectos.json",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number"
      },
      "idCreador": {
        "type": "number"
      },
      "colaboradores": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "id": {
              "type": "number"
            },
            "alias": {
              "type": "string"
            },
            "rol": {
              "type": "string",
              "enum": ["Frontend", "Backend", "Hardware", "TIMI", "Fullstack"]
            }
          },
          "required": ["id", "alias", "rol"]
        }
      },
      "titulo": {
        "type": "string"
      },
      "descripcion": {
        "type": "string"
      },
      "revision": {
        "type": "object",
        "properties": {
          "aprobado": {
            "type": "boolean"
          },
          "revisando": {
            "type": "boolean"
          },
          "razon": {
            "type": "string"
          },
          "publico": {
            "type": "boolean"
          },
          "publicadoEn": {
            "type": "number"
          }
        },
        "required": ["aprobado", "revisando", "razon", "publico", "publicadoEn"]
      },
      "archivoDiseño": {
        "type": "string"
      },
      "diseñoPrerenderizadoHTML": {
        "type": "string"
      },
      "assets": {
        "type": "array",
        "items": {}
      },
      "miniatura": {
        "type": "string"
      }
    },
    "required": [
      "id",
      "idCreador",
      "colaboradores",
      "titulo",
      "descripcion",
      "revision",
      "archivoDiseño",
      "diseñoPrerenderizadoHTML",
      "assets",
      "miniatura"
    ]
  }
}
```

`usuarios.json` JSON SCHEMA:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Schema para usuarios.json",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "userId": {
        "type": "number"
      },
      "username": {
        "type": "string"
      },
      "linkPfp": {
        "type": "string"
      },
      "admin": {
        "type": "boolean"
      },
      "DNI": {
        "type": "string"
      },
      "token": {
        "type": ["string", "null"]
      },
      "password": {
        "type": ["string", "null"]
      }
    },
    "required": ["userId", "username", "linkPfp", "admin", "DNI", "password"]
  }
}
```

`mails.json` JSON SCHEMA:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Schema para mails.json",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number"
      },
      "mail": {
        "type": "string"
      },
      "estado": {
        "type": "string",
        "enum": ["Valido", "Baneado", "Verificando"]
      }
    },
    "required": ["id", "mail", "estado"]
  }
}
```

`comentarios.json` JSON SCHEMA

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Schema para comentarios.json",
  "type": "array",
  "items": {
    "type": "object",
    "properties": {
      "id": {
        "type": "number"
      },
      "anonimo": {
        "type": "boolean"
      },
      "usernameAnon": {
        "type": "string"
      },
      "userId": {
        "type": "number"
      },
      "contenido": {
        "type": "string"
      },
      "idProyecto": {
        "type": "number"
      },
      "aprobado": {
        "type": "boolean"
      }
    },
    "required": ["id", "anonimo", "usernameAnon", "userId", "contenido", "idProyecto", "aprobado"]
  }
}
```

Nota sobre comentarios.json: El `userId` representa al ID de un usuario logeado si es por un alumno o admin, sino representara el `id` del mail del posteador anonimo.

Los archivos JSON de proyectos se guardan en `data/diseños/` y todo upload, en `data/uploads/`
