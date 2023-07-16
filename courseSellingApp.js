//importing and instantiating express server
const express = require('express');
const app = express();

//using the built in parser middleware to read JSON payloads
app.use(express.json());

//creating the admins, users, courses array to store info
let ADMINS = [];
let USERS = [];
let COURSES = [];

//custom authentication middleware function
const adminAuthentication = (req,res, next) => {
    const {username, password} = req.headers;
    const admin = ADMINS.find(a => a.username === username && a.password === password);
    if(admin){
        next();
    } else {
        res.status(403).json({message: 'Admin authentication failed'});
    }
}

const userAuthentication = (req, res, next) => {
    const { username, password } = req.headers;
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
        req.user = user; //adding user object to the payload
        next();
    } else {
        res.status(403).json({ message: 'User authentication failed'});
    }
}

//defining routes
app.post('/admin/signup', (req,res) => {
    const admin = req.body;
    const existingAdmin = ADMINS.find(a => a.username === admin.username);
    if (existingAdmin) {
        res.status(403).json({ message: 'Admin already exists'});
    } else {
        ADMINS.push(admin);
        res.json({ message: 'Admin created successfully' });
    }
});

app.post('/admin/login', adminAuthentication, (req, res) => {
    res.json({ message: 'Logged in successfully'});
});

app.post('/admin/courses', adminAuthentication, (req, res) => {
    const course = req.body;
    course.id = Date.now(); //using timestamp as course ID
    COURSES.push(course);
    res.json({ message: 'Course created successfully', courseID: course.id });
});

app.put('/admin/courses/:courseId', adminAuthentication, (req, res) => {
    const courseId = parseInt(req.params.courseId);
    const course = COURSES.find(c => c.id === courseId);
    if(course) {
        Object.assign(course, req.body); //Object.assign(target, ...sources)
        res.json({ message: 'Course updated successfully' });
    } else {
        res.status(404).json({ message: 'Course not found '});
    }
});

app.get('/admin/courses', adminAuthentication, (req, res) => {
    res.json({ courses: COURSES });
});

app.post('/user/signup', (req, res) => {
    const user = {...req.body, purchasedCourses: []};
    USERS.push(user);
    res.json({ message: 'User created successfully' }); 
});

app.get('/users/courses', userAuthentication, (req, res) => {
    const filteredCourses = COURSES.filter(c => c.published);
    res.json({ courses: filteredCourses });
});

app.post('/users/courses/:courseId', userAuthentication, (req, res) => {
    const courseId = Number(req.params.courseId);
    const course = COURSES.find(c => c.id === courseId && c.published);
    if(course) {
        req.user.purchasedCourse.push(courseId);
        res.json({ message: 'Course purchased successfully' });
    } else {
        res.status(404).json({ message: 'Course not found or not available' });
    }
});

app.get('/user/purchasedCourse', userAuthentication, (req, res) => {
    var purchasedCourses = COURSES.filter(c => req.user.purchasedCourses.includes(c.id));
    res.json({ purchasedCourses });
});

app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});