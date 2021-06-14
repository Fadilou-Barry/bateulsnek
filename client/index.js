const couleurFond = '#D0F5A9';
const couleurSnake = '#F7BE81';
const couleurSnack = '#A9A9F5';
//

const socket = io('https://bateulsnek.herokuapp.com/');
// Les clients/joueurs enverront des instructions au serveur et ci-dessous nous sommes à l'écoute ses réponses
socket.on('lancement', gererLancement);
socket.on('statePartie', gererStatePartie);
socket.on('finDeJeu', gererFinDeJeu);
socket.on('codePartie', gererCodePartie);
socket.on('CodeInconnu', gererCodeInconnu);
socket.on('limiteDeJoueurs', gererLimiteDeJoueurs);

const airDeJeu = document.getElementById('airDeJeu');
const fenetreAcceuil = document.getElementById('fenetreAcceuil');
const btnNouvellePartie = document.getElementById('btnNouvellePartie');
const btnRejoindreUnePartie = document.getElementById('btnRejoindreUnePartie');
const sasieCodePartie = document.getElementById('sasieCodePartie');
const codePartieEst = document.getElementById('codePartieEst');

btnNouvellePartie.addEventListener('click', nouvellePartie);
btnRejoindreUnePartie.addEventListener('click', rejoindreUnePartie);


function nouvellePartie() {
  socket.emit('nouvellePartie');
  lancement();
}

function rejoindreUnePartie() {
  const code = sasieCodePartie.value;
  socket.emit('rejoindreUnePartie', code);
  lancement();
}

let canvas, ctx;
let numeroDeJoueur;
let partieEncours = false; // On s'assure que certaines fonctions ne nous retourne pas des chose alors qu'il n'y a pas de partie en cours.

function lancement() {
  fenetreAcceuil.style.display = "none";
  airDeJeu.style.display = "block";

  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');

  canvas.width = canvas.height = 600;

  ctx.fillStyle = couleurFond;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  document.addEventListener('keydown', keydown);
  partieEncours = true;
}

function keydown(e) {
  socket.emit('keydown', e.keyCode);
}
// pour projeter la partie en prend en argument state (état de la partie)
function projeterPartie(state) {
  ctx.fillStyle = couleurFond;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const snack = state.snack;
  const gridsize = state.gridsize;
  const size = canvas.width / gridsize;

  ctx.fillStyle = couleurSnack;
  ctx.fillRect(snack.x * size, snack.y * size, size, size);

  projeterJoueur(state.joueurs[0], size, couleurSnake);
  projeterJoueur(state.joueurs[1], size, 'grey');
}

function projeterJoueur(stateJoueur, size, couleur) {
  const serpent = stateJoueur.serpent;

  ctx.fillStyle = couleur;
  for (let segment of serpent) {
    ctx.fillRect(segment.x * size, segment.y * size, size, size);
  }
}

function gererLancement(numero) {
  numeroDeJoueur = numero;
}

function gererStatePartie(statePartie) {
  if (!partieEncours) { // si pas de partie, pas besoin de state.
    return;
  }
  statePartie = JSON.parse(statePartie);
  requestAnimationFrame(() => projeterPartie(statePartie));
}

function gererFinDeJeu(data) {
  if (!partieEncours) { //si pas de partie, pas besoin de vainqueur.
    return;
  }
  data = JSON.parse(data);

  partieEncours = false; // maintenant qu'on a un vainqueur, pas besoin de partie.

  if (data.vainqueur === numeroDeJoueur) { //Si le nombre que nous renvoit la fonction raffraichir jeu correspond à celui du client/joueur on l'informe qu'il a gagné 
    alert('Vous avez gagné !');
  } else {
    alert('Vous avez perdu !');
  }
}

function gererCodePartie(codePartie) {
  codePartieEst.innerText = codePartie;
}

function gererCodeInconnu() {
  reset();
  alert('Code inconnu !')
}

function gererLimiteDeJoueurs() {
  reset();
  alert('limite de joueurs atteint !');
}

function reset() { // Renvoit à la fenêtre d'accueil si les conditions pour lancer une partie ne sont pas remplies
  numeroDeJoueur = null;
  sasieCodePartie.value = '';
  fenetreAcceuil.style.display = "block";
  airDeJeu.style.display = "none";
}
