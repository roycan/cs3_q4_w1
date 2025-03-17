// Import required modules
const express = require('express');
const path = require('path');
const fs = require('fs');

// Create Express application
const app = express();

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from 'public' directory

// Set up handlebars as the template engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views')); // Updated path for views

// Initialize users.json if it doesn't exist
const usersFilePath = path.join(__dirname, 'data', 'users.json');
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  console.log('Creating data directory...');
  fs.mkdirSync(path.join(__dirname, 'data'));
}
if (!fs.existsSync(usersFilePath)) {
  console.log('Creating users.json file...');
  fs.writeFileSync(usersFilePath, '{}');
}

// Load zodiac data
let zodiacData;
try {
  console.log('Loading zodiac data...');
  zodiacData = require('./data/zodiac.json');
  console.log('Zodiac data loaded successfully');
} catch (error) {
  console.error('Error loading zodiac data:', error);
  process.exit(1);
}

// Routes
app.get('/', (req, res) => {
  res.render('home');
});

app.get('/info', (req, res) => {
  console.log('Loading info page...');
  try {
    const users = JSON.parse(fs.readFileSync(usersFilePath));
    const userList = Object.values(users); // Convert to array for easier template handling
    console.log('Users loaded:', userList.length);
    res.render('info', { users: userList, zodiacData });
  } catch (error) {
    console.error('Error reading users file:', error);
    res.status(500).send('Error loading user data');
  }
});

// Debug endpoint to check stored users
app.get('/debug/users', (req, res) => {
  try {
    const users = JSON.parse(fs.readFileSync(usersFilePath));
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/submit-user', (req, res) => {
  const { name, birthdate } = req.body;
  console.log(`Processing submission for ${name} with birthdate ${birthdate}`);

  if (!name || !birthdate) {
    console.error('Missing required fields:', { name, birthdate });
    return res.status(400).send('Name and birthdate are required');
  }

  // Calculate zodiac sign based on birthdate
  const date = new Date(birthdate);
  const zodiacSign = getZodiacSign(date);
  console.log(`Calculated zodiac sign: ${zodiacSign}`);

  try {
    // Read existing users
    console.log('Reading existing user data...');
    const users = JSON.parse(fs.readFileSync(usersFilePath));

    // Add new user
    const key = `${name}_${birthdate}`;
    users[key] = { name, birthdate, zodiacSign };

    // Save back to file
    console.log('Saving updated user data...');
    fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
    console.log('User data saved successfully');

    // Redirect to info page
    console.log('Redirecting to info page...');
    res.redirect('/info');
  } catch (error) {
    console.error('Error processing user submission:', error);
    res.status(500).send('Error saving user data');
  }
});

// Helper function to determine zodiac sign
function getZodiacSign(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();

  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "Capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  return "Pisces";
}

const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});