var express = require('express');
var request = require('supertest');
const app = express()

describe('To Test endpoint /api/register', function () {
    it('should send back a status code 204', function () {
        request(app)
            .post('/api/register')
            .set('Content-Type', 'application/json')
            .send({
                teacher: "teacherken@example.com",
                students:
                    [
                        "studentjon@example.com"
                    ]
            })
            .expect('Content-Type', /json/)
            .expect(204);
    });
});

describe('To Test endpoint /api/commonstudents', function () {
    it('should send back a JSON object as response', function () {
        request(app)
            .post('/api/commonstudents')
            .set('Content-Type', 'application/json')
            .send({
                teacher: [
                    "teacherken@example.com", "teacherjoe@example.com"
                ]
            })
            .expect('Content-Type', /json/)
            .expect(200);
    });
});

describe('To Test endpoint /api/suspend', function () {
    it('should send back a status code 204', function () {
        request(app)
            .post('/api/suspend')
            .set('Content-Type', 'application/json')
            .send({
                student: "studentmary@gmail.com"
            })
            .expect('Content-Type', /json/)
            .expect(204);
    });
});

describe('To Test endpoint /api/retrievefornotifications', function () {
    it('should send back a JSON object as response', function () {
        request(app)
            .post('/api/retrievefornotifications')
            .set('Content-Type', 'application/json')
            .send({
                teacher: "teacherken@example.com",
                notification: "Hello students! @studentagnes@example.com @studentmiche@example.com"

            })
            .expect('Content-Type', /json/)
            .expect(200);
    });
});

describe('Negative Scenario /api/register', function () {
    it('should send back a status code 204', function () {
        request(app)
            .post('/api/register')
            .set('Content-Type', 'application/json')
            .send({
                teacher: "teacherken@example.com",
            })
            .expect('Content-Type', /json/)
            .expect(500);
    });
});