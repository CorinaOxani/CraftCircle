# CraftCircle

**CraftCircle** este o aplicație web de tip marketplace dedicată produselor handmade, care sprijină creatorii în promovarea și vânzarea lucrărilor într-un mediu digital prietenos. Utilizatorii își pot crea un magazin virtual, publica produse, gestiona un coș de cumpărături și comunica direct prin mesagerie privată. Platforma oferă funcționalități avansate precum follow, aprecieri, comentarii, notificări în timp real și integrare cu Stripe pentru plăți online.

---

Pentru instalare și rulare locală sunt necesare:

- **Node.js** (versiunea ≥14 recomandată)
- **npm**
- **PostgreSQL** (server local sau acces la un server existent)
- **Git** (pentru clonarea repository-ului)

---

## Obținerea codului sursă

###  Clonarea repository-ului de pe GitHub

Repository-ul oficial poate fi accesat la adresa:

```
https://github.com/CorinaOxani/CraftCircle
```

Pentru a clona proiectul local:

```bash
git clone https://github.com/CorinaOxani/CraftCircle.git
cd CraftCircle
```

---

## Structura proiectului

Repository-ul este organizat în două module principale:

```
CraftCircle/
  client/     # Frontend (React)
  server/     # Backend (Node.js + Express)
```

---

## Configurare bază de date

Este necesar să existe o bază de date PostgreSQL accesibilă (locală sau remote), cu următoarele recomandări:

- **Creați manual o bază de date nouă** pe serverul PostgreSQL.
- Proiectul **nu include** un script SQL pentru crearea automată a tabelelor.
- Structura tabelelor este definită în codul sursă (interogările SQL din backend). Utilizatorul trebuie să creeze aceste tabele în PostgreSQL conform modelelor și interogărilor existente în aplicație.

---

## Fișiere de configurare `.env`

Fișierele `.env` sunt excluse din controlul versiunii (sunt adăugate în `.gitignore`). Acestea trebuie create **manual** înainte de rulare.

---

###  Backend – `server/.env`

Exemplu de structură:

```env
SESSION_SECRET=<your_session_secret>

DB_USER=<your_db_user>
DB_PASSWORD=<your_db_password>
DB_HOST=<your_db_host>
DB_PORT=<your_db_port>
DB_NAME=<your_db_name>

CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
CLOUDINARY_API_KEY=<your_cloudinary_api_key>
CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>

EMAIL_USER=<your_email_address>
EMAIL_PASS=<your_email_app_password>

GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>

FACEBOOK_CLIENT_ID=<your_facebook_client_id>
FACEBOOK_CLIENT_SECRET=<your_facebook_client_secret>

STRIPE_SECRET_KEY=<your_stripe_secret_key>
```

---

###  Frontend – `client/.env`

Exemplu de structură:

```env
REACT_APP_STRIPE_PUBLIC_KEY=<your_stripe_publishable_key>
REACT_APP_OPENROUTESERVICE_API_KEY=<your_openrouteservice_api_key>
REACT_APP_API_URL=http://localhost:4000
```

---

## Instalarea dependințelor

###  Pentru backend

```bash
cd server
npm install
```

---

###  Pentru frontend

```bash
cd client
npm install
```

---

## Rularea aplicației

> Se recomandă utilizarea a două terminale separate.

---

###  Pornirea serverului backend

```bash
cd server
npm start
```

Serverul va asculta pe adresa:

```
http://localhost:4000
```

---

###  Pornirea aplicației frontend

Într-un alt terminal separat:

```bash
cd client
npm start
```

Aplicația React va fi disponibilă la:

```
http://localhost:3000
```

---


Acest proiect a fost dezvoltat în scop educațional, ca parte a lucrării de licență. Orice utilizare externă sau redistribuire necesită aprobarea autorului.
