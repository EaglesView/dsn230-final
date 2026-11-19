# Cyberdeck

Jeu MAGIX - Thématique Cyberpunk2077 & Mike Pondsmith's Cyberpunk pour le projet final de Web 3, full stack PHP +  Vite&React.

aucun texte dans ce document n'a été généré par IA (je trouves ca insultant lire du texte IA).

## Table des matières

- [Cyberdeck](#cyberdeck)
  - [Table des matières](#table-des-matières)
  - [Démarrage rapide](#démarrage-rapide)
  - [Structure du projet](#structure-du-projet)
    - [Layouts](#layouts)
    - [Components](#components)
    - [Hooks/Contexts](#hookscontexts)
    - [Styles CSS](#styles-css)
    - [PHP - GameAction](#php---gameaction)
  - [Features supplémentaires bonus](#features-supplémentaires-bonus)
    - [Personnalisation CSS - Transform3D](#personnalisation-css---transform3d)
    - [Sons - SFX et Musique](#sons---sfx-et-musique)
    - [Paramètres personnalisables avec LocalStorage](#paramètres-personnalisables-avec-localstorage)
    - [Mode de jeu plus interactif sans cartes sur le `board`.](#mode-de-jeu-plus-interactif-sans-cartes-sur-le-board)
  - [Processus](#processus)
  - [Ajouts a l'ia:](#ajouts-a-lia)
    - [Clip-Path Maker - Outil Additionnel](#clip-path-maker---outil-additionnel)
    - [Shaders OpenGL](#shaders-opengl)
  - [Remerciements](#remerciements)

## Démarrage rapide

Avant de démarrer en développement ou production, s'assurer que le serveur backend est fonctionnel. se rendre a `backend` et exécuter `php -S`. voici un exemple à partir de `cyberdeck`:

```bash
cd ../backend && php -S localhost:8000
```

Pour démarrer le serveur de développement de *Cyberdeck*, exécuter dans `cyberdeck`:

```bash
npm i && npm run dev
```

## Structure du projet

### Layouts

Pour la structure du projet, j'ai choisi de faire un layoutManager. Ce layout manager présente les différentes pages du projet selon un contexte de navigation. Lorsque l'utilisateur demande un changement de page, il change un `useState` et par conséquent, reload la page.

Je justifie cette décision avec certains aspects:

- Considérant que c'est un jeu, je voulais que les pages différentes soient dynamiques et ne changent pas l'url en haut de page.
- Pour prouver mes connaissances du routing, je vais rendre le jeu dans `jeu.com/game`. la page de login en soi sera dans la page principale.

### Components

Pour les components, ils sont catégorisés par utilisation:

- `ui` : Pour les components mères de l'interface
- `layouts` : Les pages qui seront affichés dans le layoutManager
- `dialogs` : Les différents dialogs du jeu. Les dialogs plus simples avec seulement une ligne de texte ne sont pas tous dans ce fichier car ils utilisent le hook de Dialog

### Hooks/Contexts

Pour les Hooks et Contexts, j'ai utilisé plusieurs de ces contextes lorsqu'applicable. Cela me permettait de faire des fonctions avec beaucoup d'imports,sans avoir a tout le temps les importer, car un **provider** au dessus des layouts donne tout le context à la page. Voici les cas:

- `SoundContext/useSound` : Pour jouer les sons dans le jeu.
- `NavigationContext/transitionTo` : Pour changer de pages dans le layout dynamique
- `GlitchContext/triggerGlitch` : Pour Avoir des effets de Glitch sur des **ref** différentes. *Notez que ce Contexte a été initialement généré par IA. Voir [Utilisation de l'IA](#ajouts-a-lia).*
- `SettingsContext/useSettings` : Pour  voir les paramètres personnels du joueur dans tout les autres components si nécéssaire.

### Styles CSS

### PHP - GameAction




## Features supplémentaires bonus

### Personnalisation CSS - Transform3D

dans le cadre de ce projet, j'ai décidé de me donner le défi d'utiliser seulement des transformations CSS pour tout ce qui est 3D dans le projet. Cela veux dire que j'ai du apprendre comment utiliser et maitriser les transformations 3D
> [!NOTE]
> J'utilises three.js car la complexité était trop avec juste css. mais des transformations CSS 3D existent encore dans le jeu!

### Sons - SFX et Musique

J'ai décidé d'ajouter des sons pour le jeu, car sérieusement, ca rends ca 1000x plus badass.

### Paramètres personnalisables avec LocalStorage

J'ai décidé de faire des paramètres qui se sauvegardent dans le *LocalStorage* et qui donc persistent avec son context et provider.

### Mode de jeu plus interactif sans cartes sur le `board`.

J'ai décidé de créer un mode de jeu interactif sur la carte en 3D. Le mode de jeu se déroule ainsi:

- Plusieurs sections sur la minicarte sont désignés comme *zones de jeu*.
- Ces Zones de jeu contiennent plusieurs positions de caméra (vue d'oiseau, vue moyenne, vue proche team a, vue proche team b).
- Ces vus alternent selon le jeu:
  - Si tout les joueurs initiaux d'un joueur depuis le début de la guerre dans cett

## Processus

Étant donné qu'on était au courant du projet d'avance, j'avais déja codé [mon clip path maker](#clip-path-maker---outil-additionnel) alors j'ai créé plusieurs shapes et fait des cartes, dans un projet nextjs blank en js, avec tailwindcss. Mon but était de maitriser les animations css et les clip-path pour être capable de prendre plus de temps en développement pour écrire ces beaux paragraphes la et faire fonctionner le jeu. Lorsque j'ai appris que le projet se déroulais sur Vite, tout mes components initiaux étaient encore fonctionnels. J'ai également créé mes classes CSS, hautement inspiré de mon expérience avec [shadcn](https://ui.shadcn.com/?ref=shadcn.com).

> [!TODO]
> Ajouter un screenshot du early test

Quand le projet à vraiment commencé (**YEAAAH**), j'ai donc importé toute mes fichiers css et ma structure de style, et j'ai recréé les components de base.
Par après j'ai simultanément commencé la structure du php et finalisé mon thème UI (ou je pensais). La partie PHP sera toujours plus un défi pour moi mais je suis les exemples qu'on a fais, et de plus, je commences a vraiment m'habituer lorsque j'ai une structure fixe a suivre. Lorsque le Login fonctionne, c'est alors que j'embarque sur la prochaine étape.

Ma prochaine étape était de faire fonctionner le jeu. c'est plus complexe que je pensais au touuut début, et après un petit bout, je me suis dit:
> c'est pas si pire que ca c'est vraiment simple

et j'ai donc continuer un par un à intégrer des features avec l'API. J'ai du refactoriser beaucoup le code pour les requêtes, pour pas overload le serveur ni avoir des requêtes qui passent pas.

J'ai exploré temporairement sur une autre branche, en intégrant three.js dans le projet, et en important un fichier de la minicarte 3D de *Cyberpunk2077*, avec des orbit controls. Par après, J'ai utilisé l'ia pour me faire un outil pour voir les matériaux et tester les couleurs en temps réels, et voir les positions de caméra. J'ai pris ces positions et ces données en note et j'ai laissé la branche de coté pour continuer le jeu. (foreshadowing: il va avoir une carte 3D bientot).

J'ai aussi fait une autre dérive pour inclure les sons et les paramètres. j'ai immédiatement fait les paramètres car plusieurs étudiants m'ont dit: t'as pas le droit au son dans le jeu! et j'ai honnêtement eu peur, mais je me suis dit qu'avec des paramètres de son, la je suis correct! et tant qu'a faire des paramètres de son, autant bien faire les autres....

## Ajouts a l'ia:

### Clip-Path Maker - Outil Additionnel

### Shaders OpenGL
J'ai demandé a Claude Code de me générer une structure WebGL avec un hook pour utiliser des effects variés de glitch dans mon projet. Je lui ai demandé avec ce prompt:

> could you build effects that could be drawn over components in opengl that i could use for my project? i am making a cyberpunk themed card game and i would like glitch effects i could use and handle with my own classes later (customize lenght of animation, strenght, etc.). i want the opengl files to be in src/opengl/ and i would have a hook in src/hooks/useOpenGl.js that would handle animations, so that i could create an example in my login screen, if the password is wrong, it creates a glitch over the login-form for 0.5 seconds.

in the glitch effects, i would like one that takes my primary color in my theme as the main glitch color. you can ask me questions before coming up with your final plan if it helps you

c'est alors que j'ai recu , après un petit échange, cette structure:

```
src/
  opengl/
    shaders/
      vertex.vert                 // Vertex shader (shared)
      chromatic-aberration.frag   // RGB color split effect
      noise-static.frag           // Digital noise/static
      block-glitch.frag           // Rectangular chunk shifting
      displacement.frag           // Wavy distortion
      composite.frag              // Combines multiple effects
    core/
      WebGLContext.js            // WebGL setup and management
      ShaderProgram.js           // Shader compilation/linking
      GlitchRenderer.js          // Main rendering engine
      EffectQueue.js             // Manages active effects/animations
    effects/
      ChromaticAberration.js     // Chromatic effect controller
      NoiseStatic.js             // Noise effect controller
      BlockGlitch.js             // Block glitch controller
      Displacement.js            // Displacement controller
    index.js                     // Exports main API
  
  hooks/
    useOpenGl.js                 // Hook exposing triggerGlitch()
  
  contexts/
    GlitchContext.jsx            // React context for glitch system
  
  components/
    providers/
      GlitchProvider.jsx         // Provider component with canvas
```

> [!NOTE]
> Depuis, j'ai redemandé à l'IA de corriger certains effets, rendre la structure plus claire au cas ou je voudrais vraiment toucher au code frag, ainsi que pour me créer des markdown de documentation pendant le développement, pour voir tout les effets possibles.

## Remerciements

Remerciements pour:

- [Wiki de Cyberpunk/Cyberpunk2077](https://cyberpunk.fandom.com/wiki/Cyberpunk_Wiki) pour les images, les informations sur le jeu (je pouvais pas juste jouer au jeu à chaque fois j'avais une question sur le lore!)
- [Artistes du Jeu](https://www.behance.net/gallery/118663901/Cyberpunk-2077User-Interface-(Part-1)) qui ont donné publiquement les informations sur la bible de UI du jeu. Cela m'a grandement aidé pour avoir les bonnes polices, couleurs, et avoir une idée des styles de ui de l'univers *Cyberpunk*.
- [Yuta](https://github.com/yutaiida28)  qui m'appelle souvent au téléphone et qui est vraiment un bon supporteur moral, arigato Yuta!
- [Gemini](https://gemini.google.com/app) Pour le travail de recherche initial avant le départ de projet (exploration de possibilités & R&D).
- [Claude Code](https://claude.ai/) Pour la création du Glitch context et des effets *openGl*.
- [Samuel](https://github.com/bergerons) pour m'avoir donné le *coup de pied dans le cul* il y a deux ans et qui m'a poussé à me rendre ou je suis aujourd'hui.
  