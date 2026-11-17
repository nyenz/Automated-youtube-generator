/* The video styles. Each has a simple name, a demo and its own asset library (kept per style, never mixed).
   Gilded Kasumi is the main style: the app is built around its project file (styles/gilded-kasumi/project.html),
   which is used exactly as it was given. The others are kept aside, unfinished, so they can be improved later. */
window.STYLES = [
  { id: 'gilded', name: 'Gilded', full: 'Gilded Kasumi', main: true, art: 'gilded',
    line: 'Japanese woodblock print rebuilt as an Art Deco paper diorama.',
    facts: [['Look', 'Flat paper cut-outs with thin gold edges, five depth layers'], ['Camera', 'Fast and alive: whips, motion blur, small shake'], ['People', 'Jointed paper people with 16 feelings, side, front and back'], ['Formats', 'Short 9:16 and long 16:9']],
    demo: 'styles/gilded-kasumi/project.html', file: 'styles/gilded-kasumi/project.html', ready: true },
  { id: 'facet', name: 'Paper Figures', full: 'Facet', art: 'facet',
    line: 'Low-poly paper figurines filmed like a movie.', demo: 'facet/films/under-the-ice-20/film.html', ready: false },
  { id: 'lowpoly', name: 'Low Poly', full: 'Low-Poly Paper', art: 'lowpoly',
    line: 'Flat faceted cut-outs in a 2.5D world.', demo: '', oldApp: true, ready: false },
  { id: 'paper', name: 'Dark Paper', full: 'Dark Paper Cinema', art: 'paper',
    line: 'Dark 3D paper cut-outs with a stop-motion feel.', demo: 'examples/the-missing-milk.html', ready: false }
];
window.styleById = function (id) { return window.STYLES.filter(function (s) { return s.id === id })[0] || window.STYLES[0] };
