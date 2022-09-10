const request = require('supertest');
const app = require('../app');
const db = require('../db');
const Book = require('../models/book');

process.env.NODE_ENV = test;

let testBook;

describe('bookRoutes Test', function () {
	beforeEach(async function () {
		await db.query('DELETE FROM books');

		const newBook = {
			isbn: '0000',
			amazon_url: 'http://test.co',
			author: 'Test Author',
			language: 'english',
			pages: 100,
			publisher: 'Test Press Company',
			title: 'Test Book',
			year: 2022
		};

        const result = await Book.create(newBook);
        testBook = result;

	});

    describe("GET /books", function() {
        test("gets all books", async function() {
            const response = await request(app).get("/books");
            expect(response.statusCode).toEqual(200);
            expect(response.body.books[0]).toEqual(testBook);
        });
    });

    describe("POST /books", function() {
        test("creates new book",  async function() {
            const newTestBook = {
                isbn: '111',
                amazon_url: "http://test2.com",
                author: 'New Test Author',
                language: 'english',
                pages: 100,
                publisher: 'New Test Press',
                title: 'New Test Book',
                year: 2020
            };
            const resp = await request(app)
                .post("/books")
                .send(newTestBook);
            expect(resp.statusCode).toEqual(201);
            expect(resp.body.book).toEqual(newTestBook);

            const getBookResp = await request(app).get("/books/111");
            expect(getBookResp.statusCode).toEqual(200);
            expect(getBookResp.body.book).toEqual({
                isbn: '111',
                amazon_url: "http://test2.com",
                author: 'New Test Author',
                language: 'english',
                pages: 100,
                publisher: 'New Test Press',
                title: 'New Test Book',
                year: 2020
            });
        });

        test("throws error if invalid schema", async function() {
            const resp = await request(app)
                .post("/books")
                .send({
                    isbn: 222,
                    amazon_url: "http://test2.com",
                    author: "New Test Author",
                    language: "english",
                    pages: "100",
                    publisher: 'New Test Press',
                    title: "New Test Book",
                    year: "2020"
                });
            expect(resp.statusCode).toEqual(400);
            expect(resp.body.message).toEqual([
                'instance.isbn is not of a type(s) string',
                'instance.pages is not of a type(s) integer',
                'instance.year is not of a type(s) integer'
              ])
        });
    });

    describe("GET /books/:isbn", function() {
        test("gets book with valid isbn", async function() {
            const resp = await request(app).get(`/books/${testBook.isbn}`);
            expect(resp.statusCode).toEqual(200);
            expect(resp.body.book).toEqual(testBook);
        });

        test("throws error with invalid isbn", async function() {
            const resp = await request(app).get('/books/zzz');
            expect(resp.statusCode).toEqual(404);
            expect(resp.body.message).toEqual('There is no book with an isbn zzz');
        })
    });

    describe("PUT /books/:idbn", function() {
        test("updates existing book with valid schema", async function() {
            const resp = await request(app)
                .put(`/books/${testBook.isbn}`)
                .send({
                isbn: '0000',
			    amazon_url: 'http://test.co',
			    author: 'Test Author',
			    language: 'english',
			    pages: 200,
			    publisher: 'Test Press Company',
			    title: 'Updated Test Book',
			    year: 2022
                });
            expect(resp.statusCode).toEqual(200);
            expect(resp.body.book.title).toEqual('Updated Test Book');
            expect(resp.body.book.pages).toEqual(200);
            expect(resp.body.book.isbn).toEqual(testBook.isbn);

            const getBookResp = await request(app).get(`/books/${testBook.isbn}`);
            expect(getBookResp.statusCode).toEqual(200);
            expect(getBookResp.body.book.title).toEqual('Updated Test Book');
        });

        test("throws error if invalid schema", async function() {
            const resp = await request(app)
                .put(`/books/${testBook.isbn}`)
                .send({
                isbn: '0000',
			    amazon_url: 'http://test.co',
			    author: 'Test Author',
			    language: 'english',
			    pages: '100',
			    publisher: 'Test Press Company',
			    title: 'Test Book',
			    year: 2022
                });
            expect(resp.statusCode).toEqual(400);
            expect(resp.body.message).toContain('instance.pages is not of a type(s) integer');
        });

        test("throws error if missing schema properties", async function() {
            const resp = await request(app)
                .put(`/books/${testBook.isbn}`)
                .send({
                    isbn: '0000',
			        amazon_url: 'http://test.co',
			        author: 'Test Author',
			        language: 'english',
			        pages: 100,
			        publisher: 'Test Press Company',
			        title: 'Test Book',
                });
            expect(resp.statusCode).toEqual(400);
            expect(resp.body.message).toContain('instance requires property "year"');
        });
    });

    describe("DELETE /books/:isbn", function() {
        test("deletes existing book from db", async function() {
            const resp = await request(app).delete(`/books/${testBook.isbn}`);
            expect(resp.statusCode).toEqual(200);
            expect(resp.body.message).toEqual('Book deleted');

            const getDeletedBookResp = await request(app).get(`/bookb/${testBook.isbn}`);
            expect(getDeletedBookResp.statusCode).toEqual(404);
            expect(getDeletedBookResp.body.message).toEqual(`Not Found`);
        });

        test("throws error if isbn does not exist", async function() {
            const resp = await request(app).delete('/books/zzz');
            expect(resp.statusCode).toEqual(404);
            expect(resp.body.message).toEqual(`There is no book with an isbn 'zzz'`);
        });
    });
});

afterAll( async function() {
    await db.end();
});
