# Book Management API

A backend REST API built with Node.js, Express and SQLite for managing a collection of books.

## Features

- View all books
- View a specific book by ID
- Filter books by reading status
- Add new books
- Update existing books
- Delete books
- Store book information using SQLite
- Basic error handling for invalid requests

## Technologies Used

- Node.js
- Express
- SQLite
- JavaScript

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| GET | /books | View all books |
| GET | /books/:id | View a specific book |
| GET | /books?status=reading | Filter books by reading status |
| POST | /books | Add a new book |
| PUT | /books/:id | Update a book |
| DELETE | /books/:id | Delete a book |

## How It Works

The application uses Node.js and Express to create the backend server and handle API requests.

SQLite is used to store book information. Different API routes allow users to create, retrieve, update and delete book records.

The API also includes basic validation and error handling for invalid requests or books that cannot be found.

## Running the Project

Make sure Node.js is installed.

Install the required dependencies:

npm install

Start the server:

npm start

The server will run at:

http://localhost:3000

## Screenshots

Screenshots demonstrating the API are available in the `screenshots` folder.

## Project Purpose

This project was created to practise backend development, REST API design, database operations and working with Node.js, Express and SQLite.
