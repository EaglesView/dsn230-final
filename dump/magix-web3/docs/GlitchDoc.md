# Documentation - Système d'Effets Glitch

## Vue d'ensemble

Le système d'effets glitch est un moteur de rendu WebGL conçu pour créer des effets visuels cyberpunk en temps réel. Il fournit une couche d'effets fullscreen qui s'affiche par-dessus l'interface utilisateur, permettant des transitions visuelles percutantes et du feedback visuel immersif.

### Caractéristiques principales

- **Rendu WebGL haute performance** - Utilise des shaders GLSL pour des effets fluides
- **Quatre types d'effets** - Aberration chromatique, bruit statique, glitch par blocs, et déplacement
- **Configuration flexible** - Contrôle fin de la durée, l'intensité, la couleur et le ciblage
- **Intégration React** - API simple via Context et hooks
- **Gestion de queue** - Supporte plusieurs effets simultanés
- **Ciblage d'éléments** - Peut affecter l'écran entier ou des composants spécifiques

### Cas d'usage

- Transitions entre les écrans (login → lobby → jeu)
- Feedback visuel lors d'actions importantes
- États d'erreur avec esthétique cyberpunk
- Indicateurs de chargement stylisés
- Effets de hover sur des éléments UI
- Simulations de corruption de données

---

## Démarrage rapide

### 1. Configuration de base

Votre application doit déjà être enveloppée dans le `GlitchProvider` :

```jsx
import { GlitchProvider } from './contexts/GlitchContext';

function App() {
  return (
    <GlitchProvider>
      <YourApp />
    </GlitchProvider>
  );
}
```

### 2. Utilisation dans un composant

```jsx
import { useContext } from 'react';
import { GlitchContext } from '../contexts/GlitchContext';

function MonComposant() {
  const { triggerGlitch, isReady } = useContext(GlitchContext);

  const handleClick = () => {
    triggerGlitch({
      type: 'chromatic',
      duration: 1000,
      strength: 0.8,
      color: '#F75049'
    });
  };

  return (
    <button onClick={handleClick}>
      Déclencher effet glitch
    </button>
  );
}
```

### 3. Exemple simple - Transition de connexion

```jsx
const handleLoginSuccess = (userData) => {
  // Déclencher effet glitch
  triggerGlitch({
    type: ['noise', 'displacement', 'block'],
    duration: 1500,
    strength: 0.85,
    color: '#FFFFFF'
  });

  // Changer de scène après l'animation
  setTimeout(() => {
    navigateToLobby();
  }, 1500);
};
```

---

## Architecture

```
App
└── GlitchProvider (Context Provider)
    ├── Canvas WebGL (position: fixed, z-index: 9999)
    └── Children (votre application)
        └── Composants utilisant GlitchContext
            └── triggerGlitch() → GlitchRenderer
                                  └── EffectQueue
                                      └── Effects (Chromatic, Noise, Block, Displacement)
```

### Flux de rendu

1. **Initialisation** : `GlitchProvider` crée un `GlitchRenderer` avec un canvas WebGL
2. **Déclenchement** : Appel de `triggerGlitch()` depuis n'importe quel composant
3. **Création d'effet** : Le renderer instancie les classes d'effet appropriées
4. **Queue** : Les effets sont ajoutés à l'`EffectQueue`
5. **Boucle de rendu** : `requestAnimationFrame` met à jour et affiche chaque effet actif
6. **Completion** : Les effets terminés sont automatiquement supprimés de la queue

### Pipeline WebGL

```
Vertex Shader → Fragment Shader (GLSL) → Framebuffer → Canvas
     ↑                    ↑
   Geometry          Uniforms (temps, force, couleur, bounds)
```

---

## Types d'effets

### 1. Aberration chromatique (`chromatic`)

#### Description visuelle
Simule une séparation des canaux RGB avec un effet de scanline horizontal. Les couleurs se séparent radialement depuis le centre de l'écran, créant un effet de dysfonctionnement d'affichage vintage.

#### Comportement du shader
- Séparation RGB basée sur la distance depuis le centre
- Oscillation temporelle pour un effet dynamique
- Scanlines horizontales animées
- Intensité pulsante synchronisée avec le temps

#### Meilleur pour
- Transitions colorées et percutantes
- États d'erreur avec esthétique rétro-futuriste
- Effets de corruption visuelle
- Feedback lors d'actions critiques

#### Exemple
```jsx
triggerGlitch({
  type: 'chromatic',
  duration: 800,
  strength: 0.9,
  color: '#FF0066',  // Rose cyberpunk
  easing: 'easeInOut'
});
```

---

### 2. Bruit statique (`noise`)

#### Description visuelle
Imite le bruit d'une télévision analogique avec plusieurs couches de bruit procédural. Inclut des blocs digitaux pixelisés et un effet de scintillement rapide à 30 FPS.

#### Comportement du shader
- Bruit procédural multi-échelle (3 couches)
- Bruit par blocs pour l'effet digital
- Scintillement aléatoire (seed temporel)
- Pics d'intensité aléatoires (5% de chance)
- Scanlines d'interférence

#### Meilleur pour
- États de chargement avec style
- Effets d'interférence de signal
- Transitions "signal perdu"
- Ambiance de corruption de données

#### Exemple
```jsx
triggerGlitch({
  type: 'noise',
  duration: 1200,
  strength: 0.7,
  color: '#00FFFF',  // Cyan
  easing: 'linear'   // Bruit constant
});
```

#### Caractéristiques spéciales
- Le scintillement est automatiquement intégré (randomisation sur chaque frame)
- Fade-in rapide (15% de la durée) et fade-out rapide (15% de la durée)

---

### 3. Glitch par blocs (`block`)

#### Description visuelle
Divise l'écran en bandes horizontales qui se déplacent aléatoirement. Certaines bandes affichent des barres de couleur, d'autres se décalent horizontalement ou verticalement, créant un effet de corruption de mémoire vidéo.

#### Comportement du shader
- Division en 15 blocs horizontaux
- Sélection aléatoire des blocs affectés (basé sur la force)
- Décalage horizontal aléatoire (-0.3 à +0.3)
- Décalage vertical léger
- Barres de couleur RGB dans les blocs glitchés
- Lignes horizontales internes pour plus de détail
- Changements de couleur aléatoires

#### Meilleur pour
- Transitions de scène avec impact
- Esthétique de corruption de données
- Effets de "loading corrompu"
- Simulations de RAM défectueuse

#### Exemple
```jsx
triggerGlitch({
  type: 'block',
  duration: 600,
  strength: 0.85,
  color: '#F75049',  // Rouge Arasaka
  easing: 'easeOut'  // Démarrage brutal, fin douce
});
```

#### Notes techniques
- Fade-in très rapide (10% de la durée) pour un démarrage brutal
- Pics d'intensité aléatoires (30% de chance de multiplication par 1.2)
- Taux de rafraîchissement : 20 FPS pour effet saccadé

---

### 4. Déplacement (`displacement`)

#### Description visuelle
Crée des ondulations et des distorsions en forme de vague sur l'écran. Inclut des "déchirures" horizontales aléatoires qui simulent des lignes d'écran déplacées, comme une cassette VHS endommagée.

#### Comportement du shader
- Trois ondes sinusoïdales combinées (horizontales et verticales)
- Déplacements à différentes fréquences et vitesses
- Jitter aléatoire sur les lignes horizontales
- Effet de "déchirure" sur 15 tranches horizontales (15% de chance par tranche)
- Bords lumineux sur les zones déchirées
- Séparation RGB légère sur les zones fortement déplacées
- Pulsation temporelle pour effet vivant

#### Meilleur pour
- Effets de "screen shake" élégants
- Distorsion de la réalité
- Transitions liquides/fluides
- Effets de hover subtils (basse intensité)

#### Exemple
```jsx
// Effet subtil au hover
triggerGlitch({
  type: 'displacement',
  duration: 400,
  strength: 0.3,      // Force réduite pour subtilité
  color: '#FFFFFF',
  easing: 'easeOut'
});

// Effet intense pour transition
triggerGlitch({
  type: 'displacement',
  duration: 1000,
  strength: 0.9,
  color: '#00FF00',   // Vert Matrix
  easing: 'elastic'   // Rebond pour effet dramatique
});
```

#### Caractéristiques spéciales
- Les déchirures sont recalculées toutes les ~33ms (30 FPS)
- Les bords déchirés sont illuminés pour un effet visuel accru
- Fade-in/out à 20% de la durée pour transitions douces

---

## Options de configuration

### Référence complète

| Paramètre | Type | Valeur par défaut | Description |
|-----------|------|-------------------|-------------|
| `type` | `string` ou `string[]` | Requis | Type d'effet : `'chromatic'`, `'noise'`, `'block'`, ou `'displacement'`. Peut être un tableau pour effets multiples. |
| `duration` | `number` | `500` | Durée de l'effet en millisecondes (ms). Recommandé : 300-2000ms. |
| `strength` | `number` ou `object` | `0.8` | Intensité de l'effet (0.0 à 1.0). Peut être un objet pour force par effet : `{ chromatic: 0.9, noise: 0.5 }` |
| `color` | `string` | `'#F75049'` | Couleur hexadécimale pour la teinte de l'effet. Affecte la dominante de couleur. |
| `target` | `React.RefObject` | `null` | Référence React vers un élément DOM. Si `null`, affecte l'écran entier. |
| `easing` | `string` | `'easeInOut'` | Courbe d'animation : `'linear'`, `'easeIn'`, `'easeOut'`, `'easeInOut'`, `'elastic'` |

### Détails sur `strength` (force)

- **0.0 - 0.3** : Effet très subtil, idéal pour hover ou feedback léger
- **0.4 - 0.6** : Effet modéré, bon équilibre visibilité/discrétion
- **0.7 - 0.9** : Effet intense, pour transitions majeures
- **0.9 - 1.0** : Effet extrême, utiliser avec parcimonie

### Détails sur `easing`

```javascript
// Exemples de courbes d'animation

'linear'      // Vitesse constante du début à la fin
'easeIn'      // Démarrage lent, accélération progressive
'easeOut'     // Démarrage rapide, ralentissement progressif
'easeInOut'   // Lent au début et à la fin, rapide au milieu (défaut)
'elastic'     // Effet de rebond élastique (dramatique)
```

### Détails sur `target` (ciblage)

```jsx
// Cibler un élément spécifique
function MonComposant() {
  const loginFormRef = useRef(null);
  const { triggerGlitch } = useContext(GlitchContext);

  const handleError = () => {
    triggerGlitch({
      type: 'chromatic',
      target: loginFormRef,  // Affecte seulement le formulaire
      strength: 0.6,
      duration: 500
    });
  };

  return (
    <div ref={loginFormRef}>
      <LoginForm onError={handleError} />
    </div>
  );
}
```

---

## Exemples d'utilisation

### Exemple 1 : Effet simple

```jsx
// Déclencher un seul effet de bruit statique
triggerGlitch({
  type: 'noise',
  duration: 800
});
```

### Exemple 2 : Effets multiples simultanés

```jsx
// Combiner plusieurs effets pour impact maximal
triggerGlitch({
  type: ['chromatic', 'noise', 'block'],
  duration: 1500,
  strength: 0.85,
  color: '#FF00FF'
});
```

### Exemple 3 : Force par effet

```jsx
// Différentes intensités pour chaque effet
triggerGlitch({
  type: ['chromatic', 'displacement'],
  duration: 1000,
  strength: {
    chromatic: 0.9,    // Aberration chromatique intense
    displacement: 0.4   // Déplacement subtil
  },
  color: '#00FFFF'
});
```

### Exemple 4 : Ciblage d'élément spécifique

```jsx
function GameCard() {
  const cardRef = useRef(null);
  const { triggerGlitch } = useContext(GlitchContext);

  const handleHover = () => {
    triggerGlitch({
      type: 'displacement',
      target: cardRef,      // Affecte seulement cette carte
      duration: 300,
      strength: 0.25,       // Effet subtil
      easing: 'easeOut'
    });
  };

  return (
    <div ref={cardRef} onMouseEnter={handleHover}>
      <h3>Partie #001</h3>
    </div>
  );
}
```

### Exemple 5 : Glitch monochrome (sans couleur)

```jsx
// Pour un effet noir et blanc élégant
triggerGlitch({
  type: ['noise', 'block', 'displacement'],
  duration: 1500,
  strength: 0.8,
  color: '#FFFFFF',    // Blanc pur pour effet monochrome
  // NE PAS utiliser 'chromatic' qui sépare les couleurs
  easing: 'easeInOut'
});
```

### Exemple 6 : Transition de connexion complète

```jsx
const LoginForm = () => {
  const { triggerGlitch } = useContext(GlitchContext);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleLoginSuccess = async (credentials) => {
    const response = await login(credentials);

    if (response.status === 'success') {
      // Marquer comme en transition
      setIsTransitioning(true);

      // Déclencher effet glitch
      triggerGlitch({
        type: ['noise', 'displacement', 'block'],
        duration: 1500,
        strength: 0.85,
        color: '#FFFFFF',
        easing: 'easeInOut'
      });

      // Attendre la fin de l'animation, puis changer de scène
      setTimeout(() => {
        navigateToScene('lobby');
      }, 1500);
    }
  };

  return (
    <div className={isTransitioning ? 'fade-out' : ''}>
      <form onSubmit={handleLoginSuccess}>
        {/* Formulaire */}
      </form>
    </div>
  );
};
```

### Exemple 7 : État d'erreur avec feedback visuel

```jsx
const handleError = (errorType) => {
  // Effet différent selon le type d'erreur
  switch (errorType) {
    case 'auth_failed':
      triggerGlitch({
        type: 'chromatic',
        duration: 600,
        strength: 0.7,
        color: '#FF0000',  // Rouge pour erreur
        easing: 'elastic'  // Rebond pour attirer l'attention
      });
      break;

    case 'connection_lost':
      triggerGlitch({
        type: 'noise',
        duration: 2000,
        strength: 0.9,
        color: '#888888',  // Gris pour signal perdu
        easing: 'linear'
      });
      break;

    case 'data_corrupted':
      triggerGlitch({
        type: ['block', 'displacement'],
        duration: 1000,
        strength: 0.95,
        color: '#FFFF00',  // Jaune pour avertissement
        easing: 'easeOut'
      });
      break;
  }
};
```

---

## Utilisation avancée

### Vérifier si le renderer est prêt

```jsx
const { isReady, triggerGlitch } = useContext(GlitchContext);

useEffect(() => {
  if (isReady) {
    console.log('Renderer WebGL initialisé et prêt');
    // Déclencher effet de bienvenue
    triggerGlitch({ type: 'noise', duration: 500, strength: 0.3 });
  }
}, [isReady]);
```

### Accéder au renderer directement

```jsx
const { renderer } = useContext(GlitchContext);

// Accès à des méthodes avancées (rare, pour cas spéciaux)
if (renderer) {
  const effectCount = renderer.effectQueue.getCount();
  console.log(`${effectCount} effets actifs`);

  // Annuler tous les effets en cours
  renderer.effectQueue.clear();
}
```

### Gestion de la queue d'effets

```jsx
// Les effets sont automatiquement gérés, mais vous pouvez
// déclencher plusieurs effets avec des délais

const sequenceGlitch = () => {
  // Effet 1 : Démarrage immédiat
  triggerGlitch({
    type: 'chromatic',
    duration: 500,
    strength: 0.8
  });

  // Effet 2 : Après 300ms
  setTimeout(() => {
    triggerGlitch({
      type: 'block',
      duration: 400,
      strength: 0.7
    });
  }, 300);

  // Effet 3 : Après 600ms
  setTimeout(() => {
    triggerGlitch({
      type: 'noise',
      duration: 800,
      strength: 0.6
    });
  }, 600);
};
```

### Calcul des bounds pour ciblage précis

Le système calcule automatiquement les bounds normalisées (0-1) pour les éléments ciblés. L'origine WebGL est en bas à gauche, contrairement au DOM (haut à gauche).

```javascript
// Conversion interne effectuée par GlitchRenderer
calculateTargetBounds(target) {
  if (!target || !target.current) {
    return { x: 0, y: 0, width: 1, height: 1 }; // Fullscreen
  }

  const rect = element.getBoundingClientRect();
  return {
    x: rect.left / canvasWidth,
    y: 1 - (rect.bottom / canvasHeight),  // Flip Y axis
    width: rect.width / canvasWidth,
    height: rect.height / canvasHeight
  };
}
```

---

## Bonnes pratiques

### Choix de l'effet selon le contexte

| Contexte | Effet recommandé | Raison |
|----------|------------------|--------|
| Transition login → lobby | `noise` + `block` + `displacement` | Impact visuel fort, sentiment de "connexion" |
| Erreur d'authentification | `chromatic` avec rouge | Couleur rouge = erreur, aberration = dysfonctionnement |
| État de chargement | `noise` seul | Simule "chargement des données" |
| Hover sur UI | `displacement` faible force | Subtil et élégant, ne distrait pas |
| Changement de scène | Tous les effets | Maximum d'impact pour transition majeure |
| Notification importante | `chromatic` ou `block` | Attire l'attention sans être trop agressif |

### Durées recommandées

- **Effets subtils (hover, feedback léger)** : 200-400ms
- **Effets modérés (notifications, états)** : 500-800ms
- **Transitions majeures (changement de scène)** : 1000-1500ms
- **Effets continus (chargement)** : 2000-3000ms

**Attention** : Évitez les durées > 3000ms, cela peut frustrer l'utilisateur.

### Valeurs de force selon l'usage

```javascript
// Hover subtil
{ strength: 0.2 - 0.4 }

// Feedback d'action
{ strength: 0.5 - 0.7 }

// Transition de scène
{ strength: 0.7 - 0.9 }

// Effet dramatique (rare)
{ strength: 0.9 - 1.0 }
```

### Considérations d'accessibilité

1. **Photosensibilité** : Les effets glitch rapides peuvent affecter les utilisateurs photosensibles
   - Évitez les durées < 200ms avec force > 0.8
   - Limitez la fréquence des déclenchements (max 1 par seconde)

2. **Option de désactivation** : Envisagez un paramètre utilisateur
   ```jsx
   const triggerAccessibleGlitch = (options) => {
     if (userSettings.reduceMotion) {
       return; // Ne pas déclencher si réduction de mouvement activée
     }
     triggerGlitch(options);
   };
   ```

3. **Contraste** : Utilisez des couleurs avec bon contraste si l'effet contient du texte

### Performance

1. **Évitez les déclenchements répétitifs** :
   ```javascript
   // Mauvais : Déclenche à chaque pixel de scroll
   window.addEventListener('scroll', () => {
     triggerGlitch({ type: 'noise' }); // ❌
   });

   // Bon : Débounce ou limite de temps
   let lastGlitch = 0;
   window.addEventListener('scroll', () => {
     const now = Date.now();
     if (now - lastGlitch > 1000) {  // Max 1 par seconde
       triggerGlitch({ type: 'noise' });
       lastGlitch = now;
     }
   });
   ```

2. **Ciblage vs Fullscreen** : Les effets ciblés sont légèrement plus coûteux (calcul de bounds)
   - Pour transitions fullscreen, omettez `target`
   - Pour effets localisés, utilisez `target` pour meilleure précision

3. **Effets multiples** : Chaque effet dans le tableau ajoute un draw call
   - `type: ['chromatic', 'noise', 'block']` = 3 draw calls par frame
   - Limitez à 3-4 effets simultanés maximum

4. **WebGL Context** : Un seul contexte WebGL est créé et réutilisé
   - Pas de souci de performance pour création/destruction répétée

---

## Implémentation technique

### Architecture WebGL

#### 1. Initialisation du contexte

```javascript
// WebGLContext.js
const gl = canvas.getContext('webgl2', {
  alpha: true,              // Canal alpha pour transparence
  premultipliedAlpha: false,
  antialias: false,         // Pas d'antialiasing pour effet pixelisé
  preserveDrawingBuffer: false
});

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
```

#### 2. Pipeline de shaders

Tous les effets utilisent le même vertex shader et des fragment shaders spécialisés :

**Vertex Shader (commun)**
```glsl
#version 300 es
in vec2 a_position;     // Position du vertex (-1 à 1)
in vec2 a_texCoord;     // Coordonnées de texture (0 à 1)
out vec2 v_texCoord;

void main() {
  v_texCoord = a_texCoord;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

**Fragment Shader (spécifique à chaque effet)**
- `chromaticShader` : Séparation RGB radiale + scanlines
- `noiseShader` : Bruit procédural multi-couche
- `blockShader` : Découpage en blocs + déplacement horizontal
- `displacementShader` : Ondes sinusoïdales + déchirures

#### 3. Géométrie (Fullscreen Quad)

Un quad simple couvrant tout l'écran :

```javascript
// Positions en clip space (-1 à 1)
const positions = [
  -1.0, -1.0,  // Bas-gauche
   1.0, -1.0,  // Bas-droit
  -1.0,  1.0,  // Haut-gauche
   1.0,  1.0   // Haut-droit
];

// Coordonnées de texture (0 à 1)
const texCoords = [
  0.0, 0.0,
  1.0, 0.0,
  0.0, 1.0,
  1.0, 1.0
];

gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
```

### Cycle de vie d'un effet

```javascript
// 1. Création
const effect = new ChromaticAberration({
  duration: 1000,
  strength: 0.8,
  color: '#F75049',
  targetBounds: { x: 0, y: 0, width: 1, height: 1 },
  easing: 'easeInOut'
});

// 2. Ajout à la queue
effectQueue.add(effect);

// 3. Boucle de mise à jour (chaque frame)
effect.update(deltaTime, currentTime);
// - Met à jour elapsed
// - Calcule progress (0-1)
// - Applique easing
// - Applique fade in/out
// - Met à jour currentStrength

// 4. Rendu (si actif)
const uniforms = effect.getUniforms(time);
shader.setUniform1f('u_time', uniforms.u_time);
shader.setUniform1f('u_strength', uniforms.u_strength);
shader.setUniform3f('u_color', ...uniforms.u_color);
shader.setUniform4f('u_targetBounds', ...uniforms.u_targetBounds);
gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

// 5. Vérification de completion
if (effect.isComplete()) {
  effectQueue.remove(effectId);
  effect.dispose();
}
```

### EffectQueue - Gestion des effets

```javascript
class EffectQueue {
  constructor() {
    this.effects = new Map();  // Map<id, effect>
    this.nextId = 0;
  }

  add(effect) {
    const id = this.nextId++;
    this.effects.set(id, effect);
    return id;
  }

  update(deltaTime, time) {
    const completedEffects = [];

    this.effects.forEach((effect, id) => {
      effect.update(deltaTime, time);

      if (effect.isComplete()) {
        completedEffects.push(id);
      }
    });

    // Nettoyer les effets terminés
    completedEffects.forEach(id => this.remove(id));
  }

  getActiveEffects() {
    return Array.from(this.effects.values());
  }
}
```

### Optimisations

1. **Clear seulement si nécessaire** : Le canvas n'est effacé que s'il y a des effets actifs
2. **Instanciation unique** : Les shaders sont compilés une seule fois à l'initialisation
3. **Réutilisation des buffers** : Le quad geometry est créé une fois et réutilisé
4. **Gestion automatique** : Les effets terminés sont automatiquement supprimés

---

## Référence API

### `triggerGlitch(options)`

Déclenche un ou plusieurs effets glitch.

#### Paramètres

**`options`** : `Object` - Configuration de l'effet

##### Propriétés de `options`

**`type`** : `string | string[]` - Requis
- Type d'effet à déclencher
- Valeurs possibles : `'chromatic'`, `'noise'`, `'block'`, `'displacement'`
- Peut être un tableau pour déclencher plusieurs effets simultanément
- Exemple : `'chromatic'` ou `['chromatic', 'noise']`

**`duration`** : `number` - Optionnel (défaut : `500`)
- Durée totale de l'effet en millisecondes
- Min recommandé : 200ms
- Max recommandé : 3000ms
- Exemple : `1500`

**`strength`** : `number | object` - Optionnel (défaut : `0.8`)
- Intensité de l'effet (0.0 à 1.0)
- Peut être un nombre pour tous les effets : `0.8`
- Ou un objet pour force individuelle : `{ chromatic: 0.9, noise: 0.5 }`
- Exemple : `0.85` ou `{ chromatic: 1.0, displacement: 0.4 }`

**`color`** : `string` - Optionnel (défaut : `'#F75049'`)
- Couleur hexadécimale pour la teinte de l'effet
- Format : `'#RRGGBB'`
- Affecte la dominante de couleur de l'effet
- Exemple : `'#00FFFF'`, `'#FF0066'`, `'#FFFFFF'`

**`target`** : `React.RefObject | null` - Optionnel (défaut : `null`)
- Référence React vers un élément DOM à cibler
- Si `null`, l'effet affecte l'écran entier
- L'élément doit être monté dans le DOM
- Exemple : `myElementRef` (créé avec `useRef()`)

**`easing`** : `string` - Optionnel (défaut : `'easeInOut'`)
- Courbe d'animation pour le fade in/out
- Valeurs possibles :
  - `'linear'` : Vitesse constante
  - `'easeIn'` : Accélération progressive
  - `'easeOut'` : Décélération progressive
  - `'easeInOut'` : Lent au début/fin, rapide au milieu
  - `'elastic'` : Effet de rebond élastique
- Exemple : `'easeOut'`

#### Retour

`void` - La fonction ne retourne rien

#### Exceptions

Aucune exception n'est levée. Si le renderer n'est pas initialisé, un warning est affiché dans la console.

#### Exemples d'utilisation

```javascript
// Exemple minimal
triggerGlitch({ type: 'chromatic' });

// Exemple complet
triggerGlitch({
  type: ['chromatic', 'noise'],
  duration: 1500,
  strength: {
    chromatic: 0.9,
    noise: 0.6
  },
  color: '#FF00FF',
  target: myRef,
  easing: 'easeInOut'
});

// Effet fullscreen simple
triggerGlitch({
  type: 'block',
  duration: 800,
  strength: 0.85
});
```

---

### Propriétés du `GlitchContext`

Le contexte expose trois propriétés accessibles via `useContext(GlitchContext)` :

#### `triggerGlitch`

**Type** : `function(options: Object): void`

Fonction pour déclencher des effets glitch. Voir section précédente pour documentation complète.

#### `isReady`

**Type** : `boolean`

Indique si le renderer WebGL est initialisé et prêt à afficher des effets.

```jsx
const { isReady } = useContext(GlitchContext);

if (isReady) {
  console.log('Prêt à glitch!');
}
```

#### `renderer`

**Type** : `GlitchRenderer | null`

Référence directe au renderer WebGL. Utile pour accès avancé.

**Méthodes avancées du renderer** :

```javascript
const { renderer } = useContext(GlitchContext);

// Obtenir le nombre d'effets actifs
const count = renderer.effectQueue.getCount();

// Obtenir tous les effets actifs
const effects = renderer.effectQueue.getActiveEffects();

// Obtenir les effets par type
const chromaticEffects = renderer.effectQueue.getEffectsByType('chromatic');

// Annuler tous les effets en cours
renderer.effectQueue.clear();

// Vérifier s'il y a des effets actifs
const hasEffects = renderer.effectQueue.hasActiveEffects();
```

---

## Galerie d'exemples

### Pattern 1 : Transition de connexion (login → lobby)

```jsx
import { useContext, useState } from 'react';
import { GlitchContext } from '../contexts/GlitchContext';

const LoginForm = ({ onLoginSuccess }) => {
  const { triggerGlitch } = useContext(GlitchContext);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const response = await authenticate(username, password);

    if (response.status === 'success') {
      // Marquer en transition (pour fade CSS)
      setIsTransitioning(true);

      // Glitch monochrome sans couleur
      triggerGlitch({
        type: ['noise', 'displacement', 'block'],
        duration: 1500,
        strength: 0.85,
        color: '#FFFFFF',  // Blanc pour effet monochrome
        easing: 'easeInOut'
      });

      // Callback après animation
      setTimeout(() => {
        onLoginSuccess(response.data);
      }, 1500);
    }
  };

  return (
    <div className={`login-form ${isTransitioning ? 'fade-out' : ''}`}>
      <form onSubmit={handleSubmit}>
        {/* Formulaire */}
      </form>
    </div>
  );
};
```

**CSS associé** :
```css
.login-form {
  opacity: 1;
  transition: opacity 500ms ease-out;
}

.login-form.fade-out {
  opacity: 0;
}
```

---

### Pattern 2 : Feedback d'erreur avec type spécifique

```jsx
const ErrorHandler = () => {
  const { triggerGlitch } = useContext(GlitchContext);

  const showError = (errorType, message) => {
    // Configuration par type d'erreur
    const errorConfigs = {
      authentication: {
        type: 'chromatic',
        duration: 600,
        strength: 0.7,
        color: '#FF0000',  // Rouge
        easing: 'elastic'
      },
      network: {
        type: 'noise',
        duration: 2000,
        strength: 0.9,
        color: '#888888',  // Gris
        easing: 'linear'
      },
      corruption: {
        type: ['block', 'displacement'],
        duration: 1000,
        strength: 0.95,
        color: '#FFFF00',  // Jaune
        easing: 'easeOut'
      }
    };

    const config = errorConfigs[errorType] || errorConfigs.corruption;
    triggerGlitch(config);

    // Afficher le message d'erreur
    showToast(message);
  };

  return { showError };
};
```

---

### Pattern 3 : Hover interactif sur carte

```jsx
const GameCard = ({ gameId, title }) => {
  const cardRef = useRef(null);
  const { triggerGlitch } = useContext(GlitchContext);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);

    // Effet subtil de déplacement
    triggerGlitch({
      type: 'displacement',
      target: cardRef,
      duration: 300,
      strength: 0.25,
      color: '#00FFFF',
      easing: 'easeOut'
    });
  };

  const handleClick = () => {
    // Effet plus intense au clic
    triggerGlitch({
      type: ['chromatic', 'block'],
      target: cardRef,
      duration: 600,
      strength: 0.8,
      color: '#FF00FF',
      easing: 'easeInOut'
    });

    setTimeout(() => {
      navigateToGame(gameId);
    }, 600);
  };

  return (
    <div
      ref={cardRef}
      className={`game-card ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleClick}
    >
      <h3>{title}</h3>
    </div>
  );
};
```

---

### Pattern 4 : Indicateur de chargement stylisé

```jsx
const LoadingIndicator = ({ isLoading }) => {
  const { triggerGlitch, isReady } = useContext(GlitchContext);
  const glitchInterval = useRef(null);

  useEffect(() => {
    if (isLoading && isReady) {
      // Déclencher glitch initial
      triggerGlitch({
        type: 'noise',
        duration: 1000,
        strength: 0.6,
        color: '#00FFFF',
        easing: 'linear'
      });

      // Répéter toutes les 1.5 secondes
      glitchInterval.current = setInterval(() => {
        triggerGlitch({
          type: 'noise',
          duration: 1000,
          strength: 0.6,
          color: '#00FFFF',
          easing: 'linear'
        });
      }, 1500);
    }

    // Cleanup
    return () => {
      if (glitchInterval.current) {
        clearInterval(glitchInterval.current);
      }
    };
  }, [isLoading, isReady, triggerGlitch]);

  if (!isLoading) return null;

  return (
    <div className="loading-indicator">
      <p>CHARGEMENT DES DONNÉES...</p>
    </div>
  );
};
```

---

### Pattern 5 : Séquence d'effets en cascade

```jsx
const GlitchSequence = () => {
  const { triggerGlitch } = useContext(GlitchContext);

  const playSequence = () => {
    // Étape 1 : Aberration chromatique
    triggerGlitch({
      type: 'chromatic',
      duration: 500,
      strength: 0.8,
      color: '#F75049'
    });

    // Étape 2 : Blocs après 300ms
    setTimeout(() => {
      triggerGlitch({
        type: 'block',
        duration: 400,
        strength: 0.7,
        color: '#00FFFF'
      });
    }, 300);

    // Étape 3 : Bruit après 600ms
    setTimeout(() => {
      triggerGlitch({
        type: 'noise',
        duration: 800,
        strength: 0.6,
        color: '#FF00FF'
      });
    }, 600);

    // Étape 4 : Déplacement final après 1000ms
    setTimeout(() => {
      triggerGlitch({
        type: 'displacement',
        duration: 1000,
        strength: 0.9,
        color: '#FFFFFF',
        easing: 'elastic'
      });
    }, 1000);
  };

  return (
    <button onClick={playSequence}>
      Lancer séquence
    </button>
  );
};
```

---

### Pattern 6 : Notification importante

```jsx
const NotificationSystem = () => {
  const { triggerGlitch } = useContext(GlitchContext);
  const notifRef = useRef(null);

  const showNotification = (message, severity = 'info') => {
    // Configuration par sévérité
    const severityConfigs = {
      info: {
        type: 'displacement',
        strength: 0.3,
        color: '#0099FF'
      },
      warning: {
        type: 'block',
        strength: 0.6,
        color: '#FFAA00'
      },
      error: {
        type: ['chromatic', 'block'],
        strength: 0.9,
        color: '#FF0000'
      },
      success: {
        type: 'chromatic',
        strength: 0.5,
        color: '#00FF00'
      }
    };

    const config = severityConfigs[severity];

    triggerGlitch({
      ...config,
      target: notifRef,
      duration: 600,
      easing: 'easeOut'
    });

    // Afficher la notification
    // ...
  };

  return (
    <div ref={notifRef} className="notification-container">
      {/* Notifications */}
    </div>
  );
};
```

---

### Pattern 7 : Réduction de mouvement (accessibilité)

```jsx
const AccessibleGlitch = () => {
  const { triggerGlitch } = useContext(GlitchContext);
  const [reduceMotion, setReduceMotion] = useState(false);

  // Détecter la préférence système
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    const handleChange = (e) => setReduceMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);

    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const triggerAccessibleGlitch = (options) => {
    if (reduceMotion) {
      console.log('Glitch ignoré : réduction de mouvement activée');
      return;
    }

    // Limiter la force si mouvement réduit préféré par utilisateur
    const accessibleOptions = {
      ...options,
      duration: Math.min(options.duration || 500, 1000),  // Max 1 sec
      strength: Math.min(options.strength || 0.8, 0.6)    // Max 0.6
    };

    triggerGlitch(accessibleOptions);
  };

  return (
    <button onClick={() => triggerAccessibleGlitch({ type: 'chromatic' })}>
      Effet accessible
    </button>
  );
};
```

---

## Conclusion

Le système d'effets glitch fournit une base solide pour créer une expérience visuelle cyberpunk immersive. En combinant les quatre types d'effets avec les options de configuration, vous pouvez créer une variété infinie de feedbacks visuels.

### Points clés à retenir

1. **Simplicité** : API simple avec `triggerGlitch(options)`
2. **Flexibilité** : 4 types d'effets, combinables et configurables
3. **Performance** : Rendu WebGL optimisé, gestion automatique de la queue
4. **Accessibilité** : Considérer les utilisateurs sensibles au mouvement
5. **Esthétique** : Respecter la charte graphique cyberpunk du projet

### Ressources

- Code source : `/cyberdeck/src/opengl/`
- Effets : `/cyberdeck/src/opengl/effects/`
- Shaders : `/cyberdeck/src/opengl/shaders/index.js`
- Context : `/cyberdeck/src/contexts/GlitchContext.jsx`

### Support

Pour toute question ou problème, consultez le code source ou référez-vous à cette documentation.

**Bon glitching! 🎮⚡**
