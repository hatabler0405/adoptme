# AdoptMe

A full-stack pet adoption platform designed to connect animal lovers with local shelters and rescue organizations. AdoptMe features real-time geospatial search, interactive map exploration, robust filtering, and a personalized user favoriting system.

---

## Key Features

* **Interactive Geospatial Pet Map:** Dynamic Leaflet-based mapping that plots partner shelters and available pets using geographic coordinates.
* **Geospatial Radius & Attribute Search:** Query pets by species, breed, age, size, temperament, and proximity using PostGIS spatial indexes and Spring Data JPA.
* **User Authentication & Profiles:** Secure user account management powered by JWT (JSON Web Tokens) and Spring Security with role-based access control.
* **Favorites System:** Synchronized animal favoriting and bookmarks persisting directly across sessions and user accounts.
* **Shelter & Feedback Hub:** Detailed shelter profiles with user feedback submission, star ratings, and contact info.

---

## Tech Stack

**Backend**
* **Framework:** Spring Boot 3, Spring Security, Spring Data JPA
* **Database:** PostgreSQL with PostGIS extension (Spatial Queries)
* **Authentication:** JWT (jjwt)
* **Build Tool:** Maven

**Frontend**
* **Library:** React 18, Vite
* **Routing:** React Router v6
* **Mapping:** Leaflet & React-Leaflet
* **Styling & UI:** Tailwind CSS, Lucide React Icons
* **HTTP Client:** Axios

---

## Project Structure

```text
adoptme/
├── src/main/java/com/htabler0405/adoptme/
│   ├── configuration/       # Spring Security & JWT Filters
│   ├── controllers/         # REST Controllers (Animals, Shelters, Users)
│   ├── dto/                 # Request & Response Data Transfer Objects
│   ├── entities/            # JPA & Hibernate Entities
│   ├── repositories/        # JPA & PostGIS Spatial Repositories
│   └── services/            # Core business logic & services
├── adoptme-frontend/        # React + Vite frontend application
│   ├── src/
│   │   ├── components/      # UI components (Navbar, PetMap, Filters)
│   │   ├── context/         # Auth & Favorites React Context providers
│   │   ├── pages/           # Explore, Shelter, Details, and Auth views
│   │   └── services/        # Axios API service integrations
└── pom.xml
