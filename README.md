# Sean Paul vs Pitbull 🎵

Un blindtest musical : un extrait de 30 secondes démarre, à toi de deviner si
c'est **Sean Paul** ou **Pitbull**. Fie-toi à ton oreille.

## Jouer

```bash
npm install
npm run dev
```

Puis ouvre http://localhost:5173.

## Le principe

- 10 titres par manche, un extrait de 30 s à chaque fois (aperçus iTunes).
- Devine l'artiste avant la fin du chrono.
- Score, série et meilleur score sont conservés d'une partie à l'autre.

## Stack

Vite · React · TypeScript — interface mobile-first, en français.

## Scripts

| Commande                 | Rôle                                     |
| ------------------------ | ---------------------------------------- |
| `npm run dev`            | Serveur de développement                 |
| `npm run build`          | Build de production                      |
| `npm run fetch:previews` | Récupère les extraits audio (API iTunes) |
