-- Script SQL pour initialiser les bases de données requises
-- Ce script sera exécuté automatiquement par Docker lors du tout premier démarrage du conteneur PostgreSQL
-- Cela nous évite de devoir créer les bases de données manuellement

CREATE DATABASE auth_db;
CREATE DATABASE workflow_db;
