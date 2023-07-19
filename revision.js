// SECTION 1 importing and instantiating express server
const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const app = express();

//using the built in parser middleware to read JSON payloads
app.use(express.json());

//creating the admins, users, courses array to store info
let ADMINS = [];
let USERS = [];
let COURSES = [];

// Read data from file, or initialize to empty array if file does not exist
try {
  ADMINS = JSON.parse(fs.readFileSync('admins.json', 'utf8'));
  USERS = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  COURSES = JSON.parse(fs.readFileSync('courses.json', 'utf8'));
} catch {
  ADMINS = [];
  USERS = [];
  COURSES = [];
}
console.log(ADMINS);

// SECTION 2 authentication using jwt
const secret = "1212";

//one common authenticator for both user and admin
//it became possibel due to the role attribute i added
const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if(authHeader) {
        const token = authHeader.split(' ')[1];
        jwt.verify(token, secret, (err,user) => {
            if(err) {
                return res.sendStatus(403);
            } else {
                req.user = user;
                next();
            }
        });
    } else {
        res.sendStatus(401);
    }
}

//SECTION 3 defining routes
//admin routes admin signup
app.post('/admin/signup', (req,res) => {
    const {username, password} = req.body;
    const existingAdmin = ADMINS.find(a => a.username === username);
    if (existingAdmin) {
        res.status(403).json({ message: 'Admin already exists'});
    } else {
        const newAdmin = { username, password };
        ADMINS.push(newAdmin);
        fs.writeFileSync('admin.json', JSON.stringify(ADMINS));
        const token = jwt.sign({ username, role: 'admin' }, secret, { expiresIn: '1h' });
        res.json({ message: 'Admin created successfully', token });
    }
});

//admin login
app.post('/admin/login', (req, res) => {
    const {username, password} = req.headers;
    const admin = ADMINS.find(a => a.username === username && a.password === password);
    if(admin) {
        const token = jwt.sign({username, role: 'admin'}, secret, { expiresIn: '1h' });
        res.json({ message: 'Logged in successfully', token });
    } else {
        res.status(403).json({ message: 'Invalid username or password' });
    }    
});

//admin adds new courses
app.post('/admin/courses', authenticateJwt, (req, res) => {
    const course = req.body;
    course.id = COURSES.length+1;
    COURSES.push(course);
    fs.readFileSync('courses.json', JSON.stringify(COURSES));
    res.json({ message: 'Course created successfully', courseId: course.id });
});

//admin modify a course with a given id
app.put('/admin/courses/:courseId', authenticateJwt, (req, res) => {
    const course = COURSES.find(c => c.id === parseInt(req.params.courseId));
    if(course) {
        Object.assign(course, req.body); //Object.assign(target, ...sources)
        fs.writeFileSync('courses.json', JSON.stringify(COURSES));
        res.json({ message: 'Course updated successfully' });
    } else {
        res.status(404).json({ message: 'Course not found '});
    }
});

//display all courses to admin
app.get('/admin/courses', authenticateJwt, (req, res) => {
    res.json({ courses: COURSES });
});

//user routes user signup
app.post('/users/signup', (req, res) => {
    const { username, password } = req.body;
    const user = USERS.find(u => u.username === username);
    if (user) {
      res.status(403).json({ message: 'User already exists' });
    } else {
      const newUser = { username, password };
      USERS.push(newUser);
      fs.writeFileSync('users.json', JSON.stringify(USERS));
      const token = jwt.sign({ username, role: 'user' }, secret, { expiresIn: '1h' });
      res.json({ message: 'User created successfully', token });
    }
  });

  //user login
  app.post('/users/login', (req, res) => {
    const { username, password } = req.headers;
    const user = USERS.find(u => u.username === username && u.password === password);
    if (user) {
      const token = jwt.sign({ username, role: 'user' }, SECRET, { expiresIn: '1h' });
      res.json({ message: 'Logged in successfully', token });
    } else {
      res.status(403).json({ message: 'Invalid username or password' });
    }
  });

//
app.get('/users/courses', authenticateJwt, (req, res) => {
    const filteredCourses = COURSES.filter(c => c.published);
    res.json({ courses: filteredCourses });
});

//display the particular course
app.post('/users/courses/:courseId', authenticateJwt, (req, res) => {
    const course = COURSES.find(c => c.id === parseInt(req.params.courseId));
    if (course) {
      const user = USERS.find(u => u.username === req.user.username);
      if (user) {
        if (!user.purchasedCourses) {
          user.purchasedCourses = [];
        }
        user.purchasedCourses.push(course);
        fs.writeFileSync('users.json', JSON.stringify(USERS));
        res.json({ message: 'Course purchased successfully' });
      } else {
        res.status(403).json({ message: 'User not found' });
      }
    } else {
      res.status(404).json({ message: 'Course not found' });
    }
  });
/////////////////////////////////////////////////////////
//////////////////////////////// WE ARE HERE ////////////
/////////////////////////////////////////////////////////
//show the list of purchased courses
app.get('/users/purchasedCourses', authenticateJwt, (req, res) => {
    const user = USERS.find(u => u.username === req.user.username);
    if (user) {
      res.json({ purchasedCourses: user.purchasedCourses || [] });
    } else {
      res.status(403).json({ message: 'User not found' });
    }
  });

app.listen(3000, () => console.log('Server is listening on port 3000'));