const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
        SELECT
            movie_name
        FROM
            movie;`;
  const moviesArray = await db.all(getMoviesQuery);
  response.send(
    moviesArray.map((eachMovie) => ({ movieName: eachMovie.movie_name }))
  );
});

//API 2

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
        INSERT INTO movie (director_id, movie_name, lead_actor)
        VALUES
        (
            ${directorId},
            '${movieName}',
            '${leadActor}'
        );`;
  await db.run(addMovieQuery);
  response.send("Movie Successfully Added");
});

const convertDbObjectToResponseObject = (dbO) => {
  return {
    movieId: dbO.movie_id,
    directorId: dbO.director_id,
    movieName: dbO.movie_name,
    leadActor: dbO.lead_actor,
  };
};
//API 3

app.get("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const getMovieQuery = `
        SELECT
            *
        FROM
            movie
        WHERE
            movie_id = ${movieId};`;
  const movie = await db.get(getMovieQuery);
  response.send(convertDbObjectToResponseObject(movie));
});

//API 4

app.put("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
        UPDATE
            movie
        SET
            director_id = ${directorId}, 
            movie_name = '${movieName}', 
            lead_actor = '${leadActor}'
        WHERE
            movie_id = ${movieId};`;
  await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//API 5

app.delete("/movies/:movieId/", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `
        DELETE FROM
            movie
        WHERE
            movie_id = ${movieId};`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

const convertDirectorDetails = (dbObject) => {
  return {
    directorId: dbObject.director_id,
    directorName: dbObject.director_name,
  };
};

// API 6

app.get("/directors/", async (request, response) => {
  const getDirectorsQuery = `
        SELECT
            *
        FROM
            director;`;
  const directorsArray = await db.all(getDirectorsQuery);
  response.send(
    directorsArray.map((director) => convertDirectorDetails(director))
  );
});

const convertMovieName = (dbObject) => {
  return {
    movieName: dbObject.movie_name,
  };
};

//API 7

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getDirectorMovieQuery = `
        SELECT
            movie_name
        FROM
            director INNER JOIN movie ON director.director_id = movie.director_id
        WHERE
            director.director_id = ${directorId};`;
  const directorMoviesArray = await db.all(getDirectorMovieQuery);
  response.send(
    directorMoviesArray.map((moviesNames) => convertMovieName(moviesNames))
  );
});

module.exports = app;
