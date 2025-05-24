const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const app = express();

app.use(express.json());

router.post('/login', authController.login);
router.post('/register', authController.register);

module.exports = router;
