# Description detaillee du projet Workflow Automation Pipeline

## 1. Presentation generale

Le projet **Workflow Automation Pipeline** est une plateforme web d'automatisation de processus metier destinee aux organisations. L'objectif principal est de permettre a des utilisateurs d'une meme entreprise de creer, gerer, executer et superviser des workflows automatises, tout en respectant des regles de securite, de controle d'acces et de tracabilite.

La solution est construite autour d'une architecture microservices. Chaque domaine fonctionnel important est separe dans un service dedie: authentification, gestion des organisations, gestion des workflows, journalisation d'audit et routage API. Cette separation permet d'obtenir une application plus modulaire, plus maintenable et plus proche des architectures utilisees dans les environnements professionnels.

Le frontend est une application React qui fournit une interface utilisateur moderne permettant aux membres d'une organisation de se connecter, d'accepter une invitation, de consulter leurs workflows, de gerer les permissions, d'executer des automatisations et, pour les administrateurs, de consulter les journaux d'audit.

## 2. Contexte et problematique

Dans les entreprises, de nombreuses taches repetitives sont realisees manuellement: envoi d'emails, synchronisation de donnees, notifications, verification de conditions, integrations avec des outils externes, etc. Ces operations manuelles peuvent entrainer:

- une perte de temps importante;
- des erreurs humaines;
- une faible tracabilite des actions;
- une difficulte a controler les droits d'acces;
- une complexite croissante lorsque plusieurs equipes collaborent.

Le projet repond a cette problematique en proposant une plateforme centralisee ou les utilisateurs peuvent modeliser des workflows sous forme de noeuds connectes, executer ces workflows et suivre les actions importantes effectuees dans le systeme.

Une attention particuliere est donnee a la securite et a la gouvernance. Le systeme integre un mecanisme de roles, des permissions par workflow et des audit logs permettant de savoir qui a effectue une action, quand, sur quelle ressource et avec quel resultat.

## 3. Objectifs du projet

Les objectifs principaux du projet sont les suivants:

- proposer une application web permettant la creation et la gestion de workflows;
- permettre l'execution manuelle de workflows;
- gerer les utilisateurs d'une organisation avec des roles distincts;
- permettre aux administrateurs d'inviter de nouveaux membres;
- proteger les routes sensibles selon le role de l'utilisateur;
- gerer des permissions fines sur les workflows;
- conserver une trace des actions importantes grace aux journaux d'audit;
- fournir une architecture scalable basee sur des microservices;
- conteneuriser l'application avec Docker pour faciliter le deploiement.

## 4. Architecture generale

L'application est composee de plusieurs services independants communiquant entre eux par HTTP. Tous les services backend sont developpes avec Spring Boot, tandis que le frontend est developpe avec React.

Architecture logique:

```text
Utilisateur
   |
   v
Frontend React
   |
   v
API Gateway
   |
   +--> Auth Service
   +--> Organization Service
   +--> Workflow Service
   +--> Audit Service
   |
   v
PostgreSQL
```

Le frontend ne communique pas directement avec chaque microservice. Il passe principalement par l'API Gateway, qui sert de point d'entree unique vers le backend. Cette approche simplifie les appels API, centralise le routage et facilite l'application de filtres transverses comme la securite, les headers ou la configuration CORS.

## 5. Technologies utilisees

### Frontend

- **React**: construction de l'interface utilisateur.
- **React Router**: gestion des routes frontend.
- **Zustand**: gestion de l'etat d'authentification.
- **Axios et Fetch API**: appels HTTP vers le backend.
- **Tailwind CSS**: stylisation de l'interface.
- **Lucide React**: icones utilisees dans les composants.

### Backend

- **Java 17**: langage principal du backend.
- **Spring Boot**: framework de creation des microservices.
- **Spring Web**: exposition des APIs REST.
- **Spring Security**: securisation des routes.
- **Spring Data JPA**: interaction avec la base de donnees.
- **Hibernate**: ORM utilise par JPA.
- **JWT**: authentification stateless par token.
- **Lombok**: reduction du code repetitif dans les DTOs et entites.

### Base de donnees et infrastructure

- **PostgreSQL**: base de donnees relationnelle principale.
- **Docker**: conteneurisation des services.
- **Docker Compose**: orchestration locale des conteneurs.
- **Maven**: gestion des dependances et compilation des services Java.
- **Node.js / npm**: gestion du frontend React.

## 6. Description des microservices

### 6.1 Auth Service

Le service d'authentification gere tout ce qui concerne les comptes utilisateurs et les sessions.

Ses responsabilites principales sont:

- inscription des utilisateurs;
- verification d'email;
- connexion des utilisateurs;
- generation de tokens JWT;
- invitation de membres par un administrateur;
- acceptation d'une invitation via un lien email;
- changement de role d'un utilisateur;
- suppression d'un membre;
- synchronisation des membres avec le service organisation;
- creation d'audit logs pour les actions sensibles.

Lorsqu'un administrateur invite un utilisateur, le backend cree un compte inactif avec un token d'invitation. L'utilisateur recoit un lien par email. En cliquant sur ce lien, il arrive sur la page d'acceptation d'invitation, choisit son mot de passe, puis son compte est active. Il peut ensuite se connecter avec son email et le mot de passe choisi.

Le service enregistre aussi les evenements importants tels que:

- connexion reussie;
- echec de connexion;
- invitation d'un membre;
- suppression d'un membre;
- changement de role.

### 6.2 Organization Service

Le service organisation gere les informations liees aux entreprises et a leurs membres.

Ses responsabilites principales sont:

- creation ou resolution d'une organisation;
- recuperation des informations d'une organisation;
- synchronisation des membres depuis le service d'authentification;
- consultation des membres d'une organisation;
- mise a jour du role d'un membre;
- suppression d'un membre d'une organisation.

Ce service permet de garantir qu'un utilisateur appartient bien a une organisation donnee. Il sert aussi de source pour valider certaines operations, par exemple lorsqu'un utilisateur veut partager un workflow avec un autre membre.

### 6.3 Workflow Service

Le service workflow est le coeur fonctionnel de la plateforme. Il permet de creer, modifier, consulter, supprimer et executer des workflows.

Un workflow est compose de plusieurs elements:

- un nom;
- une description;
- un statut;
- une organisation;
- un proprietaire;
- une liste de noeuds;
- une liste de connexions entre les noeuds;
- un historique d'executions;
- des permissions associees.

Les noeuds representent les etapes du workflow. Ils peuvent par exemple correspondre a:

- un declencheur;
- une condition;
- une action;
- un appel webhook;
- une action Gmail;
- un traitement de donnees.

Le service gere egalement les executions. Lorsqu'un utilisateur lance un workflow manuellement, le service cree une execution, parcourt les noeuds, enregistre les etapes executees et indique si l'execution s'est terminee avec succes ou en erreur.

Les actions importantes du service workflow sont journalisees dans l'audit:

- creation d'un workflow;
- modification d'un workflow;
- activation d'un workflow;
- desactivation d'un workflow;
- suppression d'un workflow;
- declenchement manuel d'un workflow;
- attribution de permissions;
- modification de permissions;
- revocation de permissions.

### 6.4 Audit Service

Le service audit est responsable de la conservation des journaux d'audit.

Un audit log permet de repondre aux questions suivantes:

- qui a effectue l'action;
- quelle action a ete effectuee;
- quand l'action a eu lieu;
- sur quelle ressource;
- depuis quelle adresse IP ou quel appareil;
- si l'action a reussi ou echoue;
- quelles informations complementaires sont associees a l'evenement.

Les champs principaux d'un audit log sont:

- `userId`: identifiant de l'utilisateur;
- `actorEmail`: email de l'acteur lorsque disponible;
- `organizationId`: organisation concernee;
- `action`: action realisee;
- `entityType`: type de ressource concernee;
- `entityId`: identifiant de la ressource;
- `outcome`: resultat de l'action, par exemple `SUCCESS` ou `FAILURE`;
- `ipAddress`: adresse IP de l'utilisateur;
- `userAgent`: navigateur ou client utilise;
- `timestamp`: date et heure de l'action;
- `metadata`: informations complementaires au format texte JSON.

Ce service est essentiel pour la securite, la conformite et l'analyse des incidents. Il permet par exemple de savoir quel administrateur a change un role, quel utilisateur a supprime un workflow ou quelles tentatives de connexion ont echoue.

### 6.5 API Gateway

L'API Gateway joue le role de point d'entree unique vers les microservices.

Elle route les requetes selon leur chemin:

- `/api/auth/**` vers Auth Service;
- `/api/workflows/**` vers Workflow Service;
- `/api/executions/**` vers Workflow Service;
- `/api/integrations/**` vers Workflow Service;
- `/api/organizations/**` vers Organization Service;
- `/api/audit/**` vers Audit Service.

Elle simplifie la communication entre le frontend et le backend, car le frontend n'a pas besoin de connaitre l'adresse de chaque microservice.

## 7. Frontend React

Le frontend offre une interface utilisateur permettant d'interagir avec la plateforme.

Les principales pages sont:

- **Login**: connexion d'un utilisateur;
- **Register**: inscription;
- **Verify Email**: verification de l'adresse email;
- **Accept Invitation**: acceptation d'une invitation et creation du mot de passe;
- **Dashboard**: vue generale apres connexion;
- **Workflows**: liste des workflows accessibles;
- **Create Workflow**: creation d'un workflow;
- **Workflow Detail**: visualisation et modification d'un workflow;
- **Admin Console**: gestion des membres et des roles;
- **Audit Logs**: consultation des journaux d'audit;
- **Settings**: parametres reserves aux administrateurs;
- **Profile**: profil utilisateur;
- **Permission Denied**: page affichee lorsqu'un utilisateur n'a pas les droits necessaires.

L'interface applique des protections cote frontend avec des routes publiques, des routes protegees et des gardes de roles. Cela ameliore l'experience utilisateur en masquant ou bloquant les pages reservees aux administrateurs. La securite principale reste cependant appliquee cote backend.

## 8. Gestion de l'authentification

L'authentification repose sur des tokens JWT.

Le fonctionnement general est le suivant:

1. L'utilisateur saisit son email et son mot de passe.
2. Le service d'authentification verifie les informations.
3. Si les identifiants sont valides, le backend genere un token JWT.
4. Le frontend stocke ce token localement.
5. Les appels API suivants incluent le token dans le header `Authorization`.
6. Les services backend peuvent identifier l'utilisateur et appliquer les regles d'acces.

Le projet gere aussi la verification d'email. Un utilisateur nouvellement inscrit doit verifier son adresse avant de pouvoir se connecter. Cette logique renforce la securite et evite l'utilisation de comptes non confirmes.

## 9. Gestion des invitations

La plateforme permet a un administrateur d'inviter de nouveaux membres dans son organisation.

Le cycle d'invitation est le suivant:

1. L'administrateur saisit les informations du membre a inviter.
2. Le backend cree un utilisateur inactif avec un token d'invitation.
3. Un email contenant un lien d'invitation est envoye.
4. Le membre clique sur le lien.
5. Le frontend ouvre la page `/accept-invitation?token=...`.
6. Le membre choisit son mot de passe.
7. Le backend active le compte.
8. Le membre est redirige vers la page de connexion.
9. Il se connecte avec son email et le mot de passe choisi.

Cette approche evite d'envoyer un mot de passe par email. Le mot de passe est choisi directement par l'utilisateur et stocke sous forme chiffree dans la base.

## 10. Role-Based Access Control

Le projet integre une logique RBAC, c'est-a-dire un controle d'acces base sur les roles.

Les roles principaux sont:

- **ADMIN**: acces complet a l'organisation, gestion des membres, roles, workflows et audit logs;
- **USER**: creation et gestion de ses workflows, execution des workflows autorises;
- **VIEWER**: acces limite, principalement lecture seule.

Les administrateurs disposent de permissions plus larges, notamment:

- inviter un membre;
- supprimer un membre;
- modifier le role d'un utilisateur;
- consulter les audit logs;
- acceder a la console d'administration;
- gerer les workflows de l'organisation.

Le controle d'acces est applique a deux niveaux:

- cote frontend, pour proteger l'interface et ameliorer l'experience utilisateur;
- cote backend, pour garantir la securite effective des APIs.

## 11. Permissions par workflow

En plus des roles globaux, le projet gere des permissions specifiques sur les workflows.

Les permissions disponibles sont:

- `VIEW`: consulter un workflow;
- `EDIT`: modifier un workflow;
- `EXECUTE`: executer un workflow.

Cette logique permet une gestion fine des droits. Par exemple, un utilisateur peut etre membre simple de l'organisation mais avoir le droit d'executer ou de modifier un workflow specifique.

Le proprietaire d'un workflow dispose automatiquement des permissions principales sur son workflow. Un administrateur peut aussi gerer les permissions des workflows de l'organisation.

## 12. Audit logs et tracabilite

Les audit logs jouent un role central dans le projet.

Ils permettent de conserver une trace fiable des actions importantes:

- creation d'un workflow;
- modification d'un workflow;
- suppression d'un workflow;
- activation ou desactivation d'un workflow;
- lancement manuel d'un workflow;
- invitation d'un membre;
- suppression d'un membre;
- changement de role;
- connexion reussie;
- echec de connexion;
- changement de permissions.

Ces journaux sont utiles pour:

- la securite;
- la detection d'activites suspectes;
- la tracabilite;
- l'analyse d'incidents;
- la conformite avec des normes comme ISO 27001, SOC 2 ou GDPR;
- la reconstruction de l'historique d'un evenement.

Exemple d'evenement journalise:

```json
{
  "userId": 12,
  "actorEmail": "admin@company.com",
  "organizationId": 3,
  "action": "WORKFLOW_DELETED",
  "entityType": "WORKFLOW",
  "entityId": 45,
  "outcome": "SUCCESS",
  "ipAddress": "127.0.0.1",
  "userAgent": "Mozilla/5.0",
  "timestamp": "2026-06-18T10:15:00",
  "metadata": {
    "name": "Customer onboarding",
    "status": "ACTIVE"
  }
}
```

L'interface d'administration permet de consulter les logs de l'organisation dans une table contenant les informations essentielles: date, acteur, action, ressource, resultat, adresse IP et appareil.

## 13. Gestion des workflows

Un workflow represente un processus automatise. Il peut etre cree par un utilisateur autorise et modifie selon les droits disponibles.

Un workflow contient:

- des noeuds;
- des connexions entre les noeuds;
- un statut;
- un proprietaire;
- une organisation;
- un historique d'execution.

Les noeuds permettent de modeliser les etapes du processus. Une connexion indique l'ordre dans lequel les noeuds doivent etre parcourus.

Le workflow peut etre execute manuellement. Lors de l'execution, le systeme:

1. verifie que l'utilisateur a le droit d'executer le workflow;
2. cree une execution avec le statut `RUNNING`;
3. identifie le noeud declencheur;
4. execute les noeuds connectes;
5. enregistre chaque etape;
6. termine l'execution avec le statut `COMPLETED` ou `FAILED`;
7. cree un audit log indiquant que le workflow a ete declenche manuellement.

## 14. Integrations applicatives

Le workflow service contient une architecture permettant de gerer des actions applicatives.

Les exemples d'actions ou de fonctions disponibles incluent:

- Gmail;
- Google Sheets;
- Notion;
- Slack;
- Webhook;
- Email;
- Condition;
- Delay;
- Data Mapper;
- Error Handler.

Cette structure rend le systeme extensible. Il est possible d'ajouter de nouveaux handlers pour supporter d'autres applications ou services externes.

## 15. Base de donnees

Le projet utilise PostgreSQL avec plusieurs bases logiques:

- `auth_db`: donnees d'authentification et utilisateurs;
- `organization_db`: organisations et membres;
- `workflow_db`: workflows, executions, permissions et audit logs dans la configuration actuelle.

Chaque microservice possede ses propres entites JPA. Cette separation logique permet de mieux organiser les donnees et de respecter les frontieres fonctionnelles de chaque service.

Les principales donnees manipulees sont:

- utilisateurs;
- organisations;
- membres;
- workflows;
- noeuds;
- connexions;
- executions;
- etapes d'execution;
- permissions;
- audit logs.

## 16. Securite

Plusieurs mecanismes de securite sont presents dans le projet:

- authentification par JWT;
- verification d'email;
- mots de passe chiffres avec BCrypt;
- roles utilisateurs;
- permissions par workflow;
- routes protegees cote frontend;
- verification des droits cote backend;
- interdiction d'acces inter-organisation;
- audit logs pour tracer les actions sensibles.

La logique multi-organisation est importante. Un utilisateur ne doit pas pouvoir acceder aux donnees d'une autre organisation. Les services verifient donc l'identifiant d'organisation transmis dans le contexte d'acces.

## 17. Deploiement avec Docker

Le projet est conteneurise avec Docker Compose.

Les conteneurs principaux sont:

- `pfa-postgres`: base PostgreSQL;
- `pfa-auth-service`: service d'authentification;
- `pfa-organization-service`: service organisation;
- `pfa-workflow-service`: service workflows;
- `pfa-audit-service`: service audit;
- `pfa-api-gateway`: passerelle API;
- `pfa-frontend`: application React.

Docker Compose facilite le lancement de l'environnement complet avec une seule commande. Chaque service possede son propre Dockerfile et ses variables d'environnement.

## 18. Tests et validation

Plusieurs validations peuvent etre effectuees:

- compilation Maven des microservices;
- build React du frontend;
- test de connexion utilisateur;
- test d'invitation et acceptation d'un membre;
- test de creation de workflow;
- test d'execution de workflow;
- test des permissions;
- test de creation et lecture des audit logs;
- verification du routage via l'API Gateway.

Un test important consiste a verifier que lorsqu'une action sensible est effectuee, un audit log est cree immediatement. Par exemple, la creation d'un workflow doit produire un evenement `WORKFLOW_CREATED` consultable dans la page Audit Logs.

## 19. Points forts du projet

Les principaux points forts sont:

- architecture microservices claire;
- separation des responsabilites;
- interface moderne et utilisable;
- gestion des utilisateurs et organisations;
- controle d'acces par roles;
- permissions fines par workflow;
- audit logs detailles;
- support Docker;
- base technique extensible pour ajouter de nouvelles integrations;
- logique adaptee a un contexte entreprise.

## 20. Limites actuelles et ameliorations possibles

Le projet peut encore etre ameliore sur plusieurs aspects:

- ajouter des tests unitaires et d'integration plus complets;
- separer les audit logs dans une base dediee;
- ajouter une pagination et des filtres avances pour les audit logs;
- ajouter une recherche plus avancee par date, utilisateur ou action;
- renforcer la validation des donnees entrantes;
- ajouter un systeme de notifications;
- ajouter des executions planifiees;
- ameliorer la visualisation graphique des workflows;
- ajouter plus d'integrations externes;
- mettre en place un systeme de monitoring;
- ajouter une documentation API avec Swagger/OpenAPI.

## 21. Conclusion

Workflow Automation Pipeline est une plateforme d'automatisation orientee entreprise. Elle permet de creer et d'executer des workflows, de gerer les membres d'une organisation, d'appliquer des controles d'acces et de conserver une trace detaillee des actions sensibles.

Le projet combine plusieurs notions importantes du developpement logiciel moderne: microservices, securite, RBAC, API Gateway, frontend React, conteneurisation Docker, base PostgreSQL et audit logging.

Grace a cette architecture, la solution est modulaire, evolutive et adaptee a un environnement professionnel ou la collaboration, la securite et la tracabilite sont essentielles.

