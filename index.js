/**
 * Created by Rach on 24/2/2018.
 */

const express = require('express')

const app = express()

// Body parser middleware
var bodyParser = require('body-parser')
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

//Database 
const CLEARDB_DATABASE_URL = " mysql://bc8fa4a1ac8b00:72078aca@us-cdbr-iron-east-05.cleardb.net/heroku_f611bcfeabc90f8?reconnect=true"

const Sequelize = require('sequelize');
//local MySQL DB
//const sequelize = new Sequelize('mysql://root@localhost:3306/teacher-admin-apis');
//Deployed on Heroku
const sequelize = new Sequelize(CLEARDB_DATABASE_URL);


sequelize
    .authenticate()
    .then(() => {
        console.log('Connection has been established successfully.');
    })
    .catch(err => {
        console.error('Unable to connect to the database:', err);
    });

const Student = sequelize.define('student', {
    email: {
        type: Sequelize.STRING
    },
    status: {
        type: Sequelize.BOOLEAN
    }
});

const Teacher = sequelize.define('teacher', {
    email: {
        type: Sequelize.STRING
    },
});

const StudentTeacher = sequelize.define('studentTeacher', {
    status: Sequelize.BOOLEAN
})

Teacher.hasMany(Student);
Student.belongsTo(Teacher); // ForeignKey(teacherId to student)

Teacher.sync()
Student.sync()

const PORT = process.env.PORT || 3000

app.get('/', (req, res) => res.send('Teacher Admin End-Points'))

// API Implementation:

app.post('/api/register', (req, res) => {
    console.log("Request: ", req.body)
    const students = req.body.students;
    const teacher = req.body.teacher;

    if (!students || !teacher) {
        res.status(500)
            .send({
                status: "failure",
                error: "Error in sending input!"
            })
    }

    if (students && students.length == 0) {
        res.status(500)
            .send({
                status: "failure",
                error: "No students provided for register. please provide atleast one."
            })
    }

    Teacher
        .findOrCreate({ where: { email: teacher }, })
        .spread((teacher, created) => {
            console.log(teacher.get({
                plain: true
            }))
            console.log("Created Teacher: ", created)

            students.forEach(student_email => {
                Student.findOrCreate({ where: { email: student_email, status: true, teacherId: teacher.id } })
                    .spread((student, created) => {
                        console.log(student.get({
                            plain: true
                        }))
                        console.log("Created Student: ", created)
                        student.setTeacher(teacher)
                    })
            });

            res.status(204)
                .send({
                    status: "success",
                    data: "Student successfully registered."
                })
        })
})

app.post('/api/commonstudents', (req, res) => {
    console.log("Req ", req.body)
    const teacher = req.body.teacher;
    if (!teacher) {
        res.status(500)
            .send({
                status: "failure",
                error: "Error in sending input."
            })
    }
    if (teacher && teacher.length == 0) {
        res.status(500)
            .send({
                status: "failure",
                error: "Empty input! No teachers provided. Please input atleast one!"
            })
    }

    var list_emails = []
    var all_emails = []

    async = require("async");

    async.each(teacher,
        function (teacher_email, callback) {
            Teacher.findOne(
                {
                    where: { email: teacher_email }
                }).then((teacher) => {
                    if (!teacher) {
                        res.status(500)
                            .send({
                                status: "failure",
                                error: "Unable to get teacher. Please provide correct email address."
                            })
                    }
                    else {
                        Student.findAll({
                            where: {
                                teacherId: teacher.id
                            }
                        }).then((data) => {
                            var dummy = []
                            data.forEach(student => {
                                console.log(student.email)
                                dummy.push(student.email)
                                all_emails.push(student.email)
                            })
                            list_emails.push(new Set(dummy))
                            callback()
                        })
                    }

                })
        },

        function (err) {
            console.log(list_emails)

            list_emails.forEach(element => {
                console.log(element, " >>>Common Students")
            });

            var common = list_emails.reduce((set1, set2) => [...set1].filter(num => set2.has(num)))
            console.log(common, "//Removing Duplicates")

            res.status(200)
                .send({
                    status: "success",
                    data: {
                        "students": common
                    }
                })
        }
    );
})


app.post('/api/suspend', (req, res) => {

    console.log("Req ", req.body)
    const student = req.body.student;
    if (!student) {
        res.status(500)
            .send({
                status: "failure",
                error: "Error in sending input."
            })
    }

    else {
        Student.findAll({
            where: { email: student }
        })
            .then((data) => {
                var student_email = []
                data.forEach(student => {
                    console.log(student.email)
                    student_email.push(student.email)
                })
                if (student_email.length == 0) {
                    res.status(500)
                        .send({
                            status: "failure",
                            error: "Student is not registered!"
                        })
                } else {
                    Student
                        .update({ status: 0, }, {
                            where: {
                                email: student,
                                status: 1,
                            }
                        })
                        .then(() => {
                            res.status(204)
                                .send({
                                    status: "success",
                                    data: "Student successfully suspended."
                                })
                        })
                }
            })
    }
})

app.post('/api/retrievefornotifications', (req, res) => {
    console.log("Req ", req.body)
    const teacher = req.body.teacher;
    const notification = req.body.notification;

    if (!teacher || !notification) {
        res.status(500)
            .send({
                status: "failure",
                error: "Error in input request!"
            })
    }

    var listofwords = notification.split(' ')
    var mentioned_emails = []
    Teacher.findOne(
        {
            where: { email: teacher }
        }).then((teacher) => {

            if (!teacher) {
                res.status(500)
                    .send({
                        status: "failure",
                        error: "Unable to get teacher. Please provide correct email address."
                    })
            }
            else {

                Student.findAll({
                    where: {
                        teacherId: teacher.id,
                        status: 1
                    }
                }).then((data) => {
                    var student_emails = []
                    data.forEach(student => {
                        console.log(student.email)
                        student_emails.push(student.email)

                    })

                    console.log(">>> Student emails for this teacher:", student_emails);
                    console.log(">>>> need to merge with mentioned ones..")

                    for (const word of listofwords) {
                        if (word[0] == "@") {
                            mentioned_emails.push(word.substr(1))
                        }
                    }

                    console.log(">>>> Mentioned emails... ", mentioned_emails)

                    var dummy = student_emails.concat(mentioned_emails);

                    res.status(200)
                        .send({
                            status: "success",
                            data: {
                                "recipients": dummy.filter(onlyUnique)
                            }
                        })
                })
            }

        })
})

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

app.listen(PORT, () => console.log(`Example app listening on port`, PORT))