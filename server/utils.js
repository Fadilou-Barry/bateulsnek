module.exports = {
  keygen,
}

function keygen(nb) {
   let clef           = '';
   let caracteres       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
   let lengthCaracteres = caracteres.length;
   for ( let i = 0; i < nb; i++ ) {
      clef += caracteres.charAt(Math.floor(Math.random() * lengthCaracteres));
   }
   return clef;
} //loop un certain nombre de fois dans caracteres et nous retourne un string qui servira de codePartie