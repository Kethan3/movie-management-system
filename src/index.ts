import { Hono } from 'hono';
import { serve } from '@hono/node-server';

const app = new Hono();

interface Movie {
  id: string;
  title: string;
  director: string;
  releaseYear: number;
  genre: string;
  ratings: number[];
}

const movies: Movie[] = [];

app.get('/', (c) => 
  c.json({ message: 'Welcome to the movie API' }));


app.post('/movies', async (c) => {
  const movie: Movie = await c.req.json();
  if (!movie.id || !movie.title || !movie.director || !movie.releaseYear || !movie.genre) {
             return c.json({ error: 'Missing required fields' }, 400);
  }
  movie.ratings = [];
  movies.push(movie);
  return c.json({message: 'successfully added'}, 201);
});

app.get('/movies', (c) => {
  return c.json(movies);
});

app.patch('/movies/:id', async (c) => {
  const id = c.req.param('id');
  const updates = await c.req.json();
  const movie = movies.find((m) => m.id === id);
  if (!movie)
     {
      return c.json({ error: 'Movie not found' }, 404);
    }
  Object.assign(movie, updates);
  return c.json(movie);
});


app.get('/movies/:id', (c) => {
  const id = c.req.param('id');
  const movie = movies.find((m) => m.id === id);
  return movie ? c.json(movie) : c.json({ error: 'Movie not found' }, 404);
});


app.delete('/movies/:id', (c) => {
  const id = c.req.param('id');
  const index = movies.findIndex((m) => m.id === id);
  if (index === -1) return c.json({ error: 'Movie not found' }, 404);
  movies.splice(index, 1);
  return c.json({ message: 'Movie deleted successfully' });
});


app.post('/movies/:id/rating', async (c) => {
  const id = c.req.param('id');
  const { rating } = await c.req.json();
  if (rating < 1 || rating > 5) return c.json({ error: 'Rating must be between 1 and 5' }, 400);
  const movie = movies.find((m) => m.id === id);
  if (!movie) return c.json({ error: 'Movie not found' }, 404);
  movie.ratings.push(rating);
  return c.json({ message: 'Rating added successfully' });
});


app.get('/movies/:id/rating', (c) => {
  const id = c.req.param('id');
  const movie = movies.find((m) => m.id === id);
  if (!movie) return c.json({ error: 'Movie not found' }, 404);
  if (movie.ratings.length === 0) return c.body(null, 204);
  const avgRating = movie.ratings.reduce((a, b) => a + b, 0) / movie.ratings.length;
  return c.json({ averageRating: avgRating.toFixed(2) });
});


app.get('/movies/top-rated', (c) => {
  const sortedMovies = movies.filter(m => m.ratings.length > 0)
    .sort((a, b) => (b.ratings.reduce((x, y) => x + y, 0) / b.ratings.length) -
                    (a.ratings.reduce((x, y) => x + y, 0) / a.ratings.length));
  return sortedMovies.length ? c.json(sortedMovies) : c.json({ error: 'No movies found' }, 404);
});


app.get('/movies/genre/:genre', (c) => {
  const genre = c.req.param('genre');
  const filtered = movies.filter((m) => m.genre.toLowerCase() === genre.toLowerCase());
  return filtered.length ? c.json(filtered) : c.json({ error: 'No movies found' }, 404);
});


app.get('/movies/director/:director', (c) => {
  const director = c.req.param('director');
  const filtered = movies.filter((m) => m.director.toLowerCase() === director.toLowerCase());
  return filtered.length ? c.json(filtered) : c.json({ error: 'No movies found' }, 404);
});


app.get('/movies/search', (c) => {
  const keyword = c.req.query('keyword');
  if (!keyword) return c.json({ error: 'Keyword is required' }, 400);
  const filtered = movies.filter((m) => m.title.toLowerCase().includes(keyword.toLowerCase()));
  return filtered.length ? c.json(filtered) : c.json({ error: 'No movies match the search' }, 404);
});


serve(app);

console.log('Server running on http://localhost:3000');