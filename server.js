const mongoose = require('mongoose');
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');

    if (!token) return res.status(401).json({ message: 'Access Denied' });

    try {
        const verified = jwt.verify(token, 'your-secret-key');
        req.user = verified;
        next();
    } catch (error) {
        res.status(403).json({ message: 'Invalid Token' });
    }
};



const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

const coinSchema = new mongoose.Schema({
    material: String,
    year: Number,
    country: String,
    value: Number,
    auction_price: Number
});
const Coin = mongoose.model('Coin', coinSchema);

const app = express();
app.use(express.json());

mongoose.connect('mongodb+srv://admin:admin@cluster0.5ivypqw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
.catch(err => console.error(err));



app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) return res.status(401).json({ error: 'Authentication failed' });

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).json({ error: 'Authentication failed' });
        
        const token = jwt.sign(
            { userId: user._id },
            'your-secret-key',
            { expiresIn: '1h' }
        );
        res.status(200).json({ token });
    }
    catch (error) {
        res.status(500).send(err.message);
    }
});

app.post('/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username) res.status(400).send('Username is required');
        if (!password) res.status(400).send('Password is required');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ username, password: hashedPassword });

        await user.save();
        res.status(201).send('Sign up successful!');
    }
    catch (err) {
        res.status(500).send(err.message);
    }
});



app.get('/coins', async (req, res) => {
    try {
        const coins = await Coin.find();
        res.json(coins);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/coins/:id', async (req, res) => {
    try {
        const coin = await Coin.findById(req.params.id);
        if (!coin) return res.status(404).send('Coin not found');
        res.json(coin);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/coins', authenticateToken, async (req, res) => {
    try {
        const { material, year, country, value, auction_price } = req.body;
        const coin = new Coin({ material, year, country, value, auction_price });
        await coin.save();
        res.status(201).json(coin);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
});

app.put('/coins/:id', authenticateToken, async (req, res) => {
    try {
        const { material, year, country, value, auction_price } = req.body;
        const updateData = {};

        if (material) updateData.material = material;
        if (year) updateData.year = year;
        if (country) updateData.country = country;
        if (value) updateData.value = value;
        if (auction_price) updateData.auction_price = auction_price;

        const coin = await Coin.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );
        if (!coin) return res.status(404).send('Coin not found');
        res.json(coin);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
});

app.delete('/coins/:id', authenticateToken, async (req, res) => {
    try {
        const coin = await Coin.findByIdAndDelete(req.params.id);
        if (!coin) return res.status(404).send('Coin not found');
        res.json(coin);
    }
    catch (err) {
        res.status(500).send(err.message);
    }
});



const PORT = 12345;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// http://127.0.0.1:12345/
