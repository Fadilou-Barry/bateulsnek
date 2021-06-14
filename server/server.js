const io = require('socket.io')();
const { lancerJeu, raffraichirJeu, directions } = require('./game');
const { FPS } = require('./constants');
const { keygen } = require('./utils');

const state = {}; // Comme on veut pouvoir gerer plusieurs partie en même temps on fait un objet state global 
const sallesClients = {}; // même chose pour les "room" ou salles de jeu

io.on('connection', client => {
// Notre serveur reçoit les instructions (input) des joueurs/clients et agit en fonction 
  client.on('keydown', gererKeydown);
  client.on('nouvellePartie', gererNouvellePartie);
  client.on('rejoindreUnePartie', gererRejoindreUnePartie);

  function gererRejoindreUnePartie(nomDeSalle) {
    // Pour rejoindre une partie il faut que la salle de jeu existe au préalable
    const salle = io.sockets.adapter.rooms[nomDeSalle]; //on verifie que le code corresponde à un une salle dans salleClients
    // Les parties se feront en 1 vs 1, il faut donc limiter le nombre de joueurs à deux par salle 
    let participants;
    if (salle) {
      participants = salle.sockets; // On obtient un objet contenant les clients 
    }

    let nombreParticipants = 0;
    if (participants) {
      nombreParticipants = Object.keys(participants).length; // Nous dira le nombre de joueurs dans la salle
    }

    if (nombreParticipants === 0) { // S'il n'y a personne dans la salle c'est qu'elle n'exist donc pas de partie (admettons une déconnection de l'initiateur de la partie, code érroné etc...)
      client.emit('CodeInconnu');
      return;
    } else if (nombreParticipants > 1) { // S'il y a plus d'une personne dans la salle c'est que le quota est déjà atteint pour la partie.
      client.emit('limiteDeJoueurs'); 
      return;
    }

    sallesClients[client.id] = nomDeSalle;

    client.join(nomDeSalle);
    client.numero = 2;
    client.emit('lancement', 2);
    
    intervalJeu(nomDeSalle);
  }

  function gererNouvellePartie() {
    // Quand on lance une nouvelle partie on va créer une nouvelle salle de jeu ou "room" avec socket.io
    let nomDeSalle = keygen(7); // Le nom de la salle sera le code à 7 caractères que nous fourni la fonction KeyGen et c'est ce code qu'il faudra transmettre au 2ème joueur pour qu'il rejoigne la partie
    sallesClients[client.id] = nomDeSalle; // On lui rajoute une propriété id et ensuite à l'object global salleClients 
    client.emit('codePartie', nomDeSalle);

    state[nomDeSalle] = lancerJeu(); // on rajoute le state la partie/salle correspondant au code au state global pour qu'il puisse être mis à jour

    client.join(nomDeSalle); // La salle est prête le joueur entre 
    client.numero = 1; // On lui rajoute une propriété numéro qui nous permettra de le distinguer et de gerer la progréssion de la partie
    client.emit('lancement', 1);
  }

  function gererKeydown(keyCode) {
    const nomDeSalle = sallesClients[client.id];
    if (!nomDeSalle) {
      return;
    }
    try {
      keyCode = parseInt(keyCode);
    } catch(e) {
      console.error(e);
      return;
    }

    const vitesse = directions(keyCode);

    if (vitesse) {
      state[nomDeSalle].joueurs[client.numero - 1].vitesse = vitesse; //Nous permet de faire correspondre les changements de direction au numéro du joueurs quand on met à jour le state (-1 pour l'index array)
    }
  }
});

function intervalJeu(nomDeSalle) {
  const intervalId = setInterval(() => {
    const vainqueur = raffraichirJeu(state[nomDeSalle]); // On accède au state de la partie via l'objet global state
    
    if (!vainqueur) { // Tant qu'il n'y pas de vainqueur, c'est à dire que la fonction raffraichirJeu nous retourne la valeur 0, la partie continue sinon elle nous fourni le numéro attribué au vainqueur
      emitStatePartie(nomDeSalle, state[nomDeSalle])
    } else {
      emitfinDeJeu(nomDeSalle, vainqueur); // s'il y a un vainqueur on arrête de mettre à jour le state
      state[nomDeSalle] = null;
      clearInterval(intervalId);
    }
  }, 1000 / FPS);
}

function emitStatePartie(salle, statePartie) {
  // Send this event to everyone in the salle.
  io.sockets.in(salle)
    .emit('statePartie', JSON.stringify(statePartie));
}

function emitfinDeJeu(salle, vainqueur) {
  io.sockets.in(salle)
    .emit('finDeJeu', JSON.stringify({ vainqueur }));
}

io.listen(process.env.PORT || 3000);
