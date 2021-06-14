const { GRILLE } = require('./constants');

module.exports = {
  lancerJeu,
  raffraichirJeu,
  directions,
}

function lancerJeu() { // Plusieurs parties peuvent avoir lieu en même temps et on va 
  const state = creerStateDuJeu()
  genererSnack(state);
  return state;
}

//
function creerStateDuJeu() { 
  return {
    joueurs: [{ // Joueurs qui commenceront la partie à des positions différentes
      position: {
        x: 3,
        y: 10,
      },
      vitesse: {
        x: 1,
        y: 0,
      },
      serpent: [
        {x: 1, y: 10},
        {x: 2, y: 10},
        {x: 3, y: 10},
      ],
    }, {
      position: {
        x: 18,
        y: 10,
      },
      vitesse: {
        x: 0,
        y: 0,
      },
      serpent: [
        {x: 20, y: 10},
        {x: 19, y: 10},
        {x: 18, y: 10},
      ],
    }],
    snack: {},// comme les snack sont placés aléatoirement on peut laissé l'objet vide. 
    gridsize: GRILLE,
  };
}

function raffraichirJeu(state) {
  if (!state) { // our être safe si nous n'avos pas de state, le serveur ne renvoit rien.
    return;
  }
// Les serpents avances automatiquement, et pour mettre à jour la position des joueurs on rajoute la vitesse.
  const joueurUn = state.joueurs[0];
  const joueurDeux = state.joueurs[1];

  joueurUn.position.x += joueurUn.vitesse.x;
  joueurUn.position.y += joueurUn.vitesse.y;

  joueurDeux.position.x += joueurDeux.vitesse.x;
  joueurDeux.position.y += joueurDeux.vitesse.y;

// on s'assure que les serpents ne sortent pas l'air de jeu s'ils touche la paroie, ils meurent et fin de jeu 
  if (joueurUn.position.x < 0 || joueurUn.position.x > GRILLE || joueurUn.position.y < 0 || joueurUn.position.y > GRILLE) {
    return 2; 
  }

  if (joueurDeux.position.x < 0 || joueurDeux.position.x > GRILLE || joueurDeux.position.y < 0 || joueurDeux.position.y > GRILLE) {
    return 1;
  }

// Si la tête du serpent est sur la même position qu'un snack, c'est qu'il l'a mangé et on ralonge donc le serpent d'un segment
  if (state.snack.x === joueurUn.position.x && state.snack.y === joueurUn.position.y) {
    joueurUn.serpent.push({ ...joueurUn.position }); // la position actuelle devient le nouveau segment (objet dans l'array) il faut donc remettre à jour la position comme suit
    joueurUn.position.x += joueurUn.vitesse.x;
    joueurUn.position.y += joueurUn.vitesse.y;
    genererSnack(state); // comme le snack d'avant a été consommé on créer un autre
  }

  if (state.snack.x === joueurDeux.position.x && state.snack.y === joueurDeux.position.y) {
    joueurDeux.serpent.push({ ...joueurDeux.position }); 
    joueurDeux.position.x += joueurDeux.vitesse.x;
    joueurDeux.position.y += joueurDeux.vitesse.y;
    genererSnack(state); 
  }

  // On va aussi s'assurer que le serpent ne se mort pas la queue et que les segments avance (MaJ position)
  if (joueurUn.vitesse.x || joueurUn.vitesse.y) {
    for (let segment of joueurUn.serpent) {
      if (segment.x === joueurUn.position.x && segment.y === joueurUn.position.y) {
        return 2; //joueurDeux gagne
      }
    }
//  On va rajouter un segment devant en tête et en retirer un à l'arrière (à moins qu'il ne mange un snack) pour donner l'illusion du mouvement
    joueurUn.serpent.push({ ...joueurUn.position });
    joueurUn.serpent.shift();
  }

  if (joueurDeux.vitesse.x || joueurDeux.vitesse.y) {
    for (let segment of joueurDeux.serpent) {
      if (segment.x === joueurDeux.position.x && segment.y === joueurDeux.position.y) {
        return 1; //joueurUn gagne
      }
    }

    joueurDeux.serpent.push({ ...joueurDeux.position });
    joueurDeux.serpent.shift();
  }

  return false;
}

function genererSnack(state) {
  // On positionne le snack de manière aléatoire sur l'air de jeu
  snack = {
    x: Math.floor(Math.random() * GRILLE),
    y: Math.floor(Math.random() * GRILLE),
  }
// Et on s'assure aussi de ne qu'il n'y pas déjà un serpent à cette position (on rappelle la fonction jusqu'à obtenir le resultat escompté )
  for (let segment of state.joueurs[0].serpent) {
    if (segment.x === snack.x && segment.y === snack.y) {
      return genererSnack(state);
    }
  }

  for (let segment of state.joueurs[1].serpent) {
    if (segment.x === snack.x && segment.y === snack.y) {
      return genererSnack(state);
    }
  }

  state.snack = snack;
}
// La fonction direction va mettre à jours l'objet vitesse dans l'array joueurs
function directions(keyCode) {
  switch (keyCode) {
    case 37: { // gauche
      return { x: -1, y: 0 };
    }
    case 38: { // bas
      return { x: 0, y: -1 };
    }
    case 39: { // droite
      return { x: 1, y: 0 };
    }
    case 40: { // haut
      return { x: 0, y: 1 };
    }
  }
}
